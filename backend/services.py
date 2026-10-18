"""
ShelfBridge Core Business Logic and Domain Services.
Handles catalogue search, inventory discovery, atomic reservations,
fulfilment coordination, and deterministic financial settlement.
"""

import os
import datetime
import random
import threading
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

_reservation_lock = threading.Lock()


class StockConflictError(ValueError):
    """
    Raised when a commercial or stock-related operation conflicts with current
    inventory availability, active reservations, or conflicting reservation states.
    Mapped to HTTP 409 Conflict at the API boundary.
    """
    pass



from backend.models import (
    Store, Product, InventoryItem, UnmetDemandRequest,
    MatchCandidate, SupplierOffer, Reservation, Fulfilment,
    TransactionOutcome, AuditEvent, generate_id
)
from backend.matcher import parse_query_specs, evaluate_product_match, BM25Retriever


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two coordinate points."""
    import math
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def seed_database(db: Session) -> Dict[str, int]:
    """
    Populate deterministic, reproducible seed data for the Nehru Place, New Delhi
    simulated pilot neighbourhood. All stores, products, and inventory are synthetic
    and labeled accordingly. Data is idempotent: re-running does not duplicate records.

    Demo scenario (canonical):
      Shop A (store_np_apex):        Requesting store — 0 stock of Anker A2663 65W.
      Shop B (store_np_metrovolt):   EXACT_MATCH — 4 units of Anker A2663 65W.
      Shop C (store_np_quickcharge): INCOMPATIBLE — Samsung 15W (below 65W target).
      Shop D (store_np_gadgetpoint): COMPATIBLE_ALTERNATIVE — Anker 30W (PD/PPS, >25W).
    """
    # 1. Stores — Nehru Place, New Delhi (canonical synthetic pilot cluster)
    stores_data = [
        {
            "id": "store_np_apex",
            "name": "Apex Mobile & Tech (Simulated)",
            "owner_name": "Rajesh Verma",
            "phone": "+91 98112 00141",
            "neighbourhood": "Nehru Place · Block B (Ground Floor)",
            "address": "Shop G-12, Block B, Nehru Place Commercial Complex, New Delhi 110019",
            "latitude": 28.5492,
            "longitude": 77.2528
        },
        {
            "id": "store_np_metrovolt",
            "name": "MetroVolt Electronics (Simulated)",
            "owner_name": "Vikram Sethi",
            "phone": "+91 98180 00292",
            "neighbourhood": "Nehru Place · Block C (180m walk)",
            "address": "Shop 104, 1st Floor, Block C, Nehru Place, New Delhi 110019",
            "latitude": 28.5501,
            "longitude": 77.2536
        },
        {
            "id": "store_np_quickcharge",
            "name": "QuickCharge Accessory Hub (Simulated)",
            "owner_name": "Amanpreet Singh",
            "phone": "+91 99104 00318",
            "neighbourhood": "Nehru Place · Arcade Lane (310m walk)",
            "address": "Shop 22, Arcade Lane, Nehru Place, New Delhi 110019",
            "latitude": 28.5484,
            "longitude": 77.2545
        },
        {
            "id": "store_np_gadgetpoint",
            "name": "GadgetPoint Care & Spares (Simulated)",
            "owner_name": "Faizan Ahmed",
            "phone": "+91 98115 00455",
            "neighbourhood": "Nehru Place · West Wing (220m walk)",
            "address": "Shop 5, Basement Wing, International Trade Tower, Nehru Place, New Delhi 110019",
            "latitude": 28.5498,
            "longitude": 77.2515
        }
    ]

    # 1. Stores — Load from data/seed/stores.csv if available
    stores_count = 0
    import csv
    import json
    from pathlib import Path

    root_dir = Path(__file__).resolve().parent.parent
    stores_csv = root_dir / "data" / "seed" / "stores.csv"
    products_csv = root_dir / "data" / "canonical" / "products.csv"
    inventory_csv = root_dir / "data" / "seed" / "inventory.csv"

    if stores_csv.exists():
        with open(stores_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                sid = row["id"].strip()
                existing = db.query(Store).filter(Store.id == sid).first()
                if not existing:
                    db.add(Store(
                        id=sid,
                        name=row["name"].strip(),
                        owner_name=row["owner_name"].strip(),
                        phone=row["phone"].strip(),
                        neighbourhood=row["neighbourhood"].strip(),
                        address=row["address"].strip(),
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        is_active=row.get("is_active", "True").lower() == "true"
                    ))
                stores_count += 1
        db.commit()
    else:
        for s in stores_data:
            existing = db.query(Store).filter(Store.id == s["id"]).first()
            if not existing:
                db.add(Store(**s))
            stores_count += 1
        db.commit()

    # 2. Canonical Electronics Product Catalogue — Load from data/canonical/products.csv
    products_count = 0
    if products_csv.exists():
        with open(products_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                pid = row["id"].strip()
                existing = db.query(Product).filter(Product.id == pid).first()
                if not existing:
                    attrs = json.loads(row["attributes_json"]) if row.get("attributes_json") else {}
                    db.add(Product(
                        id=pid,
                        sku=row["sku"].strip(),
                        barcode=row["barcode"].strip() if row.get("barcode") else None,
                        brand=row["brand"].strip(),
                        model_name=row["model_name"].strip(),
                        model_number=row["model_number"].strip() if row.get("model_number") else None,
                        category=row["category"].strip(),
                        subcategory=row["subcategory"].strip() if row.get("subcategory") else None,
                        mrp=float(row["mrp"]),
                        attributes_json=attrs,
                        is_active=row.get("is_active", "True").lower() == "true"
                    ))
                products_count += 1
        db.commit()

    # 3. Store-Specific Inventory Distributions — Load from data/seed/inventory.csv
    now = datetime.datetime.utcnow()
    inventory_count = 0
    if inventory_csv.exists():
        with open(inventory_csv, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                iid = row["id"].strip()
                existing = db.query(InventoryItem).filter(InventoryItem.id == iid).first()
                if not existing:
                    db.add(InventoryItem(
                        id=iid,
                        store_id=row["store_id"].strip(),
                        product_id=row["product_id"].strip(),
                        stock_quantity=int(row["stock_quantity"]),
                        reserved_quantity=int(row["reserved_quantity"]),
                        purchase_cost=float(row["purchase_cost"]),
                        retail_price=float(row["retail_price"]),
                        transfer_price=float(row["transfer_price"]),
                        last_confirmed_at=now,
                        status=row.get("status", "ACTIVE").strip()
                    ))
                inventory_count += 1
        db.commit()

    # 4. Canonical Demonstration Requests (Persistent Backend Identities)
    # req_demo_1042: Primary stockout request at Shop A for Anker 65W GaN Charger
    req_1042 = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == "req_demo_1042").first()
    if not req_1042:
        req_1042 = UnmetDemandRequest(
            id="req_demo_1042",
            requesting_store_id="store_np_apex",
            customer_query="Customer needs Anker 65W GaN USB-C charger (ANK-A2663-65W) for laptop & S24 Ultra fast charge",
            resolved_product_id="prod_ank_a2663_65w",
            requested_specs_json={
                "connector_type": "USB-C",
                "wattage": 65,
                "standards": ["USB-PD 3.0", "PPS"]
            },
            quantity=1,
            allow_substitutes=True,
            status="MATCHES_FOUND",
            notes="Demo Request: Anker 65W stockout at Apex Mobile",
            created_at=now - datetime.timedelta(minutes=15),
            updated_at=now - datetime.timedelta(minutes=14)
        )
        db.add(req_1042)
        db.commit()
        discover_candidates_for_request(db, req_1042.id)

    # req_demo_1041: Portronics 20000mAh 65W PD Power Bank (Reserved)
    req_1041 = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == "req_demo_1041").first()
    if not req_1041:
        req_1041 = UnmetDemandRequest(
            id="req_demo_1041",
            requesting_store_id="store_np_apex",
            customer_query="Portronics 20000mAh 65W PD Laptop Power Bank (POR-PB20K-65W)",
            resolved_product_id="prod_por_luxcell_65w",
            requested_specs_json={
                "connector_type": "Dual USB-C + USB-A",
                "wattage": 65,
                "standards": ["Bidirectional PD 3.0"]
            },
            quantity=1,
            allow_substitutes=False,
            status="RESERVED",
            notes="Demo Request: Reserved Power Bank",
            created_at=now - datetime.timedelta(minutes=25),
            updated_at=now - datetime.timedelta(minutes=20)
        )
        db.add(req_1041)
        db.commit()
        discover_candidates_for_request(db, req_1041.id)

        off_1041 = SupplierOffer(
            id="off_demo_1041",
            request_id="req_demo_1041",
            supplying_store_id="store_np_metrovolt",
            product_id="prod_por_luxcell_65w",
            offered_quantity=1,
            unit_transfer_price=2750.0,
            status="ACCEPTED",
            expires_at=now + datetime.timedelta(minutes=20),
            created_at=now - datetime.timedelta(minutes=22)
        )
        db.add(off_1041)
        db.flush()

        inv_pb = db.query(InventoryItem).filter(
            InventoryItem.store_id == "store_np_metrovolt",
            InventoryItem.product_id == "prod_por_luxcell_65w"
        ).first()
        if inv_pb:
            inv_pb.reserved_quantity = min(inv_pb.stock_quantity, inv_pb.reserved_quantity + 1)

        res_1041 = Reservation(
            id="res_demo_882",
            offer_id="off_demo_1041",
            request_id="req_demo_1041",
            inventory_id=inv_pb.id if inv_pb else "inv_mv_por_pb65w",
            quantity=1,
            reserved_at=now - datetime.timedelta(minutes=20),
            expires_at=now + datetime.timedelta(minutes=15),
            status="ACTIVE"
        )
        db.add(res_1041)
        db.flush()

        ful_1041 = Fulfilment(
            id="ful_demo_882",
            reservation_id="res_demo_882",
            request_id="req_demo_1041",
            fulfilment_type="STORE_TO_STORE_TRANSFER",
            handover_code="SB-4829",
            ready_at=now - datetime.timedelta(minutes=20),
            status="READY_FOR_PICKUP"
        )
        db.add(ful_1041)
        db.commit()

    # req_demo_1039: Belkin 100W 2m Cable (Fulfilled & Settled)
    req_1039 = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == "req_demo_1039").first()
    if not req_1039:
        req_1039 = UnmetDemandRequest(
            id="req_demo_1039",
            requesting_store_id="store_np_metrovolt",
            customer_query="Belkin 100W 2m USB-C to USB-C E-Marker braided cable",
            resolved_product_id="prod_bel_cab100w_2m",
            requested_specs_json={
                "connector_type": "USB-C to USB-C",
                "wattage": 100,
                "standards": ["E-Marker 5A"]
            },
            quantity=1,
            allow_substitutes=True,
            status="FULFILLED",
            notes="Demo Request: Fulfilled Belkin Cable",
            created_at=now - datetime.timedelta(hours=2),
            updated_at=now - datetime.timedelta(hours=1, minutes=45)
        )
        db.add(req_1039)
        db.commit()
        discover_candidates_for_request(db, req_1039.id)

        off_1039 = SupplierOffer(
            id="off_demo_1039",
            request_id="req_demo_1039",
            supplying_store_id="store_np_quickcharge",
            product_id="prod_bel_cab100w_2m",
            offered_quantity=1,
            unit_transfer_price=1120.0,
            status="ACCEPTED",
            expires_at=now - datetime.timedelta(hours=1),
            created_at=now - datetime.timedelta(hours=1, minutes=55)
        )
        db.add(off_1039)
        db.flush()

        res_1039 = Reservation(
            id="res_demo_879",
            offer_id="off_demo_1039",
            request_id="req_demo_1039",
            inventory_id="inv_qc_bel_100w",
            quantity=1,
            reserved_at=now - datetime.timedelta(hours=1, minutes=50),
            expires_at=now - datetime.timedelta(hours=1, minutes=30),
            status="FULFILLED"
        )
        db.add(res_1039)
        db.flush()

        ful_1039 = Fulfilment(
            id="ful_demo_879",
            reservation_id="res_demo_879",
            request_id="req_demo_1039",
            fulfilment_type="STORE_TO_STORE_TRANSFER",
            handover_code="SB-7310",
            ready_at=now - datetime.timedelta(hours=1, minutes=50),
            fulfilled_at=now - datetime.timedelta(hours=1, minutes=45),
            status="FULFILLED"
        )
        db.add(ful_1039)
        db.flush()

        tx_1039 = TransactionOutcome(
            id="tx_demo_1039",
            fulfilment_id="ful_demo_879",
            request_id="req_demo_1039",
            customer_sale_price=1499.0,
            transfer_price_paid=1120.0,
            logistics_cost=40.0,
            platform_fee=37.48,
            platform_variable_cost=4.0,
            requesting_store_margin=301.52,
            supplying_store_margin=240.0,
            platform_net_margin=33.48,
            total_recovered_gmv=1499.0,
            calculation_breakdown_json={
                "quantity": 1,
                "unit_retail_price": 1499.0,
                "unit_transfer_price": 1120.0,
                "logistics_cost": 40.0,
                "is_economically_viable": True
            },
            created_at=now - datetime.timedelta(hours=1, minutes=45)
        )
        db.add(tx_1039)
        db.commit()

    # req_demo_1038: Anker 65W GaN USB-C Charger for walk-in buyer (Fulfilled & Settled)
    req_1038 = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == "req_demo_1038").first()
    if not req_1038:
        req_1038 = UnmetDemandRequest(
            id="req_demo_1038",
            requesting_store_id="store_np_apex",
            customer_query="Anker 65W GaN USB-C Charger for walk-in buyer",
            resolved_product_id="prod_ank_a2663_65w",
            requested_specs_json={
                "connector_type": "USB-C",
                "wattage": 65,
                "standards": ["USB-PD 3.0", "PPS"]
            },
            quantity=1,
            allow_substitutes=False,
            status="FULFILLED",
            notes="Demo Request: Fulfilled Anker 65W Charger",
            created_at=now - datetime.timedelta(hours=3),
            updated_at=now - datetime.timedelta(hours=2, minutes=40)
        )
        db.add(req_1038)
        db.commit()
        discover_candidates_for_request(db, req_1038.id)

        off_1038 = SupplierOffer(
            id="off_demo_1038",
            request_id="req_demo_1038",
            supplying_store_id="store_np_metrovolt",
            product_id="prod_ank_a2663_65w",
            offered_quantity=1,
            unit_transfer_price=1950.0,
            status="ACCEPTED",
            expires_at=now - datetime.timedelta(hours=2),
            created_at=now - datetime.timedelta(hours=2, minutes=50)
        )
        db.add(off_1038)
        db.flush()

        res_1038 = Reservation(
            id="res_demo_874",
            offer_id="off_demo_1038",
            request_id="req_demo_1038",
            inventory_id="inv_mv_ank_65w",
            quantity=1,
            reserved_at=now - datetime.timedelta(hours=2, minutes=50),
            expires_at=now - datetime.timedelta(hours=2, minutes=30),
            status="FULFILLED"
        )
        db.add(res_1038)
        db.flush()

        ful_1038 = Fulfilment(
            id="ful_demo_874",
            reservation_id="res_demo_874",
            request_id="req_demo_1038",
            fulfilment_type="STORE_TO_STORE_TRANSFER",
            handover_code="SB-9104",
            ready_at=now - datetime.timedelta(hours=2, minutes=50),
            fulfilled_at=now - datetime.timedelta(hours=2, minutes=40),
            status="FULFILLED"
        )
        db.add(ful_1038)
        db.flush()

        tx_1038 = TransactionOutcome(
            id="tx_demo_1038",
            fulfilment_id="ful_demo_874",
            request_id="req_demo_1038",
            customer_sale_price=2499.0,
            transfer_price_paid=1950.0,
            logistics_cost=50.0,
            platform_fee=62.48,
            platform_variable_cost=4.0,
            requesting_store_margin=436.52,
            supplying_store_margin=400.0,
            platform_net_margin=58.48,
            total_recovered_gmv=2499.0,
            calculation_breakdown_json={
                "quantity": 1,
                "unit_retail_price": 2499.0,
                "unit_transfer_price": 1950.0,
                "logistics_cost": 50.0,
                "is_economically_viable": True
            },
            created_at=now - datetime.timedelta(hours=2, minutes=40)
        )
        db.add(tx_1038)
        db.commit()

    return {
        "stores": stores_count,
        "products": products_count,
        "inventory_records": inventory_count,
        "seeded_requests": 4
    }


def create_unmet_demand_request(
    db: Session,
    requesting_store_id: str,
    customer_query: str,
    quantity: int = 1,
    allow_substitutes: bool = True,
    notes: Optional[str] = None
) -> UnmetDemandRequest:
    """
    Step 1: Capture unmet customer demand.
    Step 2: Parse and normalize query attributes.
    """
    req_store = db.query(Store).filter(Store.id == requesting_store_id).first()
    if not req_store:
        raise ValueError(f"Requesting store '{requesting_store_id}' does not exist.")

    specs = parse_query_specs(customer_query)

    # Attempt exact catalogue resolution
    resolved_product = None
    all_products = db.query(Product).filter(Product.is_active == True).all()

    # Check barcode / SKU / exact model matches across query and merchant notes
    search_text = f"{customer_query} {notes or ''}".lower()
    for p in all_products:
        if (p.barcode and p.barcode.lower() in search_text) or (p.sku and p.sku.lower() in search_text):
            resolved_product = p
            break
        if p.model_number and p.model_number.lower() in search_text:
            resolved_product = p
            break

    req = UnmetDemandRequest(
        requesting_store_id=requesting_store_id,
        customer_query=customer_query,
        resolved_product_id=resolved_product.id if resolved_product else None,
        requested_specs_json=specs,
        quantity=quantity,
        allow_substitutes=allow_substitutes,
        status="OPEN",
        notes=notes
    )
    db.add(req)
    db.flush()

    # Record Audit Event
    audit = AuditEvent(
        id=generate_id("evt"),
        event_type="UNMET_DEMAND_CAPTURED",
        entity_type="UnmetDemandRequest",
        entity_id=req.id,
        actor_store_id=req.requesting_store_id,
        payload_json={"query": customer_query, "quantity": quantity, "resolved_product": req.resolved_product_id}
    )
    db.add(audit)
    db.commit()
    db.refresh(req)

    # Automatically trigger discovery
    discover_candidates_for_request(db, req.id)
    return req


def discover_candidates_for_request(db: Session, request_id: str) -> List[MatchCandidate]:
    """
    Step 3: Discover matching stock across participating neighbourhood stores.
    Filters out the requesting store, evaluates electrical compatibility,
    checks available stock (stock_quantity - reserved_quantity), and ranks candidates.
    """
    req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == request_id).first()
    if not req:
        raise ValueError(f"Request {request_id} not found.")

    req_store = db.query(Store).filter(Store.id == req.requesting_store_id).first()
    if not req_store:
        raise ValueError("Requesting store not found.")

    # Remove any existing candidates for clean re-discovery
    db.query(MatchCandidate).filter(MatchCandidate.request_id == request_id).delete()

    # Query all active inventory from PEER stores (exclude requesting store)
    peer_inventories = (
        db.query(InventoryItem)
        .join(Store)
        .join(Product)
        .filter(
            InventoryItem.store_id != req.requesting_store_id,
            Store.is_active == True,
            Product.is_active == True,
            InventoryItem.stock_quantity > InventoryItem.reserved_quantity  # Must have positive available stock
        )
        .all()
    )

    candidates: List[MatchCandidate] = []

    for inv in peer_inventories:
        prod = inv.product
        dist_km = calculate_haversine_distance(
            req_store.latitude, req_store.longitude,
            inv.store.latitude, inv.store.longitude
        )

        match_type, conf, reasons, incomp_reasons = evaluate_product_match(
            requested_specs=req.requested_specs_json,
            product_obj=prod,
            exact_product_id=req.resolved_product_id
        )

        # Freshness determination
        age_hours = (datetime.datetime.utcnow() - inv.last_confirmed_at).total_seconds() / 3600.0
        freshness = "FRESH" if age_hours < 24 else ("AGED" if age_hours < 72 else "STALE")

        candidate = MatchCandidate(
            request_id=req.id,
            supplying_store_id=inv.store_id,
            product_id=prod.id,
            match_type=match_type,
            confidence_score=round(conf, 3),
            reasons_json=reasons,
            incompatible_reasons_json=incomp_reasons,
            available_units=inv.available_quantity,
            distance_km=dist_km,
            transfer_price=inv.transfer_price,
            freshness_status=freshness
        )
        candidates.append(candidate)
        db.add(candidate)

    # Update request status
    if candidates:
        req.status = "MATCHES_FOUND"
    db.commit()

    # Re-query sorted:
    # 1. Compatibility priority: EXACT_MATCH > COMPATIBLE_ALTERNATIVE > POTENTIAL_REQUIRES_CONFIRMATION > INCOMPATIBLE
    # 2. Confidence descending
    # 3. Distance ascending
    priority_order = {
        "EXACT_MATCH": 1,
        "COMPATIBLE_ALTERNATIVE": 2,
        "POTENTIAL_REQUIRES_CONFIRMATION": 3,
        "INCOMPATIBLE": 4
    }

    sorted_candidates = sorted(
        candidates,
        key=lambda c: (
            priority_order.get(c.match_type, 9),
            -c.confidence_score,
            c.distance_km,
            c.transfer_price
        )
    )
    return sorted_candidates


def create_supplier_offer(
    db: Session,
    request_id: str,
    supplying_store_id: str,
    product_id: str,
    offered_quantity: int = 1,
    unit_transfer_price: Optional[float] = None,
    validity_minutes: int = 15
) -> SupplierOffer:
    """
    Step 4: Supplying store confirms stock availability and transfer price.
    """
    req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == request_id).first()
    if not req:
        raise ValueError("Request not found.")

    inv = db.query(InventoryItem).filter(
        InventoryItem.store_id == supplying_store_id,
        InventoryItem.product_id == product_id
    ).first()

    if not inv:
        raise ValueError("Product not stocked by supplying store.")

    if inv.available_quantity < offered_quantity:
        raise StockConflictError(
            f"Insufficient available units. Available: {inv.available_quantity}, Requested: {offered_quantity}"
        )

    price = unit_transfer_price if unit_transfer_price is not None else inv.transfer_price
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=validity_minutes)

    offer = SupplierOffer(
        request_id=request_id,
        supplying_store_id=supplying_store_id,
        product_id=product_id,
        offered_quantity=offered_quantity,
        unit_transfer_price=price,
        status="PENDING",
        expires_at=expires_at
    )
    db.add(offer)
    req.status = "OFFERED"
    db.flush()

    audit = AuditEvent(
        id=generate_id("evt"),
        event_type="SUPPLIER_OFFER_ISSUED",
        entity_type="SupplierOffer",
        entity_id=offer.id,
        actor_store_id=supplying_store_id,
        payload_json={"request_id": request_id, "transfer_price": price, "qty": offered_quantity}
    )
    db.add(audit)
    db.commit()
    db.refresh(offer)
    return offer


def accept_offer_and_reserve(
    db: Session,
    offer_id: str,
    pickup_window_minutes: int = 20
) -> Tuple[Reservation, Fulfilment]:
    """
    Step 5: Shop A accepts the offer.
    Atomic reservation creation with database concurrency protection.
    Locks units so they cannot be double-reserved.
    """
    with _reservation_lock:
        db.expire_all()
        offer = db.query(SupplierOffer).filter(SupplierOffer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found.")

        if offer.status != "PENDING":
            raise StockConflictError(f"Cannot accept offer with status '{offer.status}'.")

        if datetime.datetime.utcnow() > offer.expires_at:
            offer.status = "EXPIRED"
            db.commit()
            raise StockConflictError("Supplier offer has expired.")

        # Concurrency check on inventory
        # SQLite does not support SELECT ... FOR UPDATE; use it only on PostgreSQL.
        _db_url = os.getenv("DATABASE_URL", "sqlite://")
        _use_for_update = not _db_url.startswith("sqlite")
        inv_q = db.query(InventoryItem).filter(
            InventoryItem.store_id == offer.supplying_store_id,
            InventoryItem.product_id == offer.product_id
        )
        inv = inv_q.with_for_update().first() if _use_for_update else inv_q.first()

        if not inv or inv.available_quantity < offer.offered_quantity:
            raise StockConflictError("Stock was depleted or reserved by a competing request.")

        # Atomic Reservation
        inv.reserved_quantity += offer.offered_quantity
        offer.status = "ACCEPTED"

        res_expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=pickup_window_minutes)
        res_id = generate_id("res")
        reservation = Reservation(
            id=res_id,
            offer_id=offer.id,
            request_id=offer.request_id,
            inventory_id=inv.id,
            quantity=offer.offered_quantity,
            expires_at=res_expires_at,
            status="ACTIVE"
        )
        db.add(reservation)
        db.flush()

        # Create Fulfilment record with verification code
        ful_id = generate_id("ful")
        handover_code = f"SB-{random.randint(1000, 9999)}"
        fulfilment = Fulfilment(
            id=ful_id,
            reservation_id=reservation.id,
            request_id=offer.request_id,
            fulfilment_type="STORE_TO_STORE_TRANSFER",
            handover_code=handover_code,
            status="READY_FOR_PICKUP"
        )
        db.add(fulfilment)

        # Update request state
        req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == offer.request_id).first()
        if req:
            req.status = "RESERVED"

        audit = AuditEvent(
            id=generate_id("evt"),
            event_type="ATOMIC_RESERVATION_ACQUIRED",
            entity_type="Reservation",
            entity_id=reservation.id,
            actor_store_id=req.requesting_store_id if req else None,
            payload_json={"handover_code": handover_code, "locked_units": offer.offered_quantity, "supplier": offer.supplying_store_id}
        )
        db.add(audit)

        db.commit()
        db.refresh(reservation)
        db.refresh(fulfilment)
        return reservation, fulfilment


def cancel_or_expire_reservation(db: Session, reservation_id: str, reason: str = "EXPIRED") -> Reservation:
    """
    Safely release reserved units back into available inventory pool.
    """
    res = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not res:
        raise ValueError("Reservation not found.")

    if res.status != "ACTIVE":
        raise StockConflictError(f"Reservation already finalized with status: {res.status}")

    inv = db.query(InventoryItem).filter(InventoryItem.id == res.inventory_id).first()
    if inv:
        inv.reserved_quantity = max(0, inv.reserved_quantity - res.quantity)

    res.status = reason
    req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == res.request_id).first()
    if req:
        req.status = "EXPIRED" if reason == "EXPIRED" else "CANCELLED"

    fulfilment = db.query(Fulfilment).filter(Fulfilment.reservation_id == res.id).first()
    if fulfilment:
        fulfilment.status = "CANCELLED"

    audit = AuditEvent(
        id=generate_id("evt"),
        event_type="RESERVATION_CANCELLED_STOCK_RELEASED",
        entity_type="Reservation",
        entity_id=res.id,
        actor_store_id=req.requesting_store_id if req else None,
        payload_json={"reason": reason, "released_units": res.quantity}
    )
    db.add(audit)

    db.commit()
    db.refresh(res)
    return res


def complete_fulfilment_and_settlement(
    db: Session,
    fulfilment_id: str,
    handover_code: str,
    actual_customer_price: Optional[float] = None,
    logistics_cost: float = 30.0
) -> TransactionOutcome:
    """
    Step 6 & 7: Handover verification and transparent deterministic commercial outcome calculation.
    """
    ful = db.query(Fulfilment).filter(Fulfilment.id == fulfilment_id).first()
    if not ful:
        raise ValueError("Fulfilment record not found.")

    if ful.status != "READY_FOR_PICKUP":
        raise ValueError(f"Fulfilment cannot be completed; current status is '{ful.status}'.")

    if ful.handover_code != handover_code.strip():
        raise ValueError(f"Invalid handover code. Verification failed.")

    res = db.query(Reservation).filter(Reservation.id == ful.reservation_id).first()
    if not res:
        raise ValueError("Reservation record missing.")

    inv = db.query(InventoryItem).filter(InventoryItem.id == res.inventory_id).first()
    if not inv:
        raise ValueError("Inventory record missing.")

    offer = db.query(SupplierOffer).filter(SupplierOffer.id == res.offer_id).first()
    req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == res.request_id).first()

    # Deduct actual physical stock & clear reserved quantity
    inv.stock_quantity = max(0, inv.stock_quantity - res.quantity)
    inv.reserved_quantity = max(0, inv.reserved_quantity - res.quantity)

    now = datetime.datetime.utcnow()
    ful.status = "FULFILLED"
    ful.fulfilled_at = now
    res.status = "FULFILLED"
    req.status = "FULFILLED"

    # Financial Settlement Calculation
    # Sale price: what customer paid Shop A per unit.
    # Distinguish explicitly provided price from omitted price (None).
    # If explicitly supplied, validate that it is strictly positive; do NOT silently substitute retail_price.
    if actual_customer_price is not None:
        if actual_customer_price <= 0:
            raise ValueError(f"Invalid customer sale price per unit: ₹{actual_customer_price}. Price must be greater than zero.")
        sale_price = float(actual_customer_price)
    else:
        # Intended fallback only when price was explicitly omitted
        sale_price = float(inv.retail_price)

    unit_transfer_price = offer.unit_transfer_price
    total_transfer_price = unit_transfer_price * res.quantity
    total_sale_price = sale_price * res.quantity
    total_cost_price = inv.purchase_cost * res.quantity

    # Platform fee: 2.5% of GMV or ₹25 minimum
    platform_fee = max(25.0, round(total_sale_price * 0.025, 2))
    platform_variable_cost = 4.0  # SMS alerts, server compute

    # Shop A (requesting store) margin: Customer revenue - Transfer price - Logistics - Platform fee
    shop_a_net_margin = round(total_sale_price - total_transfer_price - logistics_cost - platform_fee, 2)

    # Shop B (supplying store) margin: Transfer price - wholesale purchase cost
    shop_b_net_margin = round(total_transfer_price - total_cost_price, 2)

    # ShelfBridge net margin: Platform fee - variable cost
    platform_net_margin = round(platform_fee - platform_variable_cost, 2)

    breakdown = {
        "quantity": res.quantity,
        "unit_retail_price": sale_price,
        "unit_transfer_price": unit_transfer_price,
        "unit_cost_price": inv.purchase_cost,
        "logistics_cost": logistics_cost,
        "logistics_type": "Local neighbourhood runner / self-pickup",
        "platform_fee_formula": "Max(₹25, 2.5% of GMV)",
        "platform_variable_cost": platform_variable_cost,
        "is_economically_viable": shop_a_net_margin > 0 and shop_b_net_margin > 0
    }

    tx_id = generate_id("tx")
    outcome = TransactionOutcome(
        id=tx_id,
        fulfilment_id=ful.id,
        request_id=req.id,
        customer_sale_price=total_sale_price,
        transfer_price_paid=total_transfer_price,
        logistics_cost=logistics_cost,
        platform_fee=platform_fee,
        platform_variable_cost=platform_variable_cost,
        requesting_store_margin=shop_a_net_margin,
        supplying_store_margin=shop_b_net_margin,
        platform_net_margin=platform_net_margin,
        total_recovered_gmv=total_sale_price,
        calculation_breakdown_json=breakdown
    )
    db.add(outcome)
    db.flush()

    # Record Audit Event
    audit = AuditEvent(
        id=generate_id("evt"),
        event_type="TRANSACTION_FULFILLED_AND_SETTLED",
        entity_type="TransactionOutcome",
        entity_id=outcome.id,
        actor_store_id=req.requesting_store_id,
        payload_json={"gmv": total_sale_price, "shop_a_margin": shop_a_net_margin, "shop_b_margin": shop_b_net_margin}
    )
    db.add(audit)

    db.commit()
    db.refresh(outcome)
    return outcome
