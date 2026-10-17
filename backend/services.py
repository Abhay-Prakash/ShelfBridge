"""
ShelfBridge Core Business Logic and Domain Services.
Handles catalogue search, inventory discovery, atomic reservations,
fulfilment coordination, and deterministic financial settlement.
"""

import os
import datetime
import random
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session



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
    Populate deterministic, reproducible seed data representing a compact
    electronics retail neighbourhood in Indiranagar, Bengaluru.
    """
    # 1. Stores
    stores_data = [
        {
            "id": "store_gupta_mobile",
            "name": "Gupta Mobile & Accessories",
            "owner_name": "Ramesh Gupta",
            "phone": "+91 98450 11223",
            "neighbourhood": "100ft Road, Indiranagar",
            "address": "#142, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
            "latitude": 12.9716,
            "longitude": 77.6412
        },
        {
            "id": "store_balaji_electronics",
            "name": "Sri Balaji Electronics",
            "owner_name": "K. Venkatesh",
            "phone": "+91 98451 44556",
            "neighbourhood": "CMH Road, Indiranagar",
            "address": "#88, Chinmaya Mission Hospital Rd, Indiranagar, Bengaluru",
            "latitude": 12.9784,
            "longitude": 77.6435
        },
        {
            "id": "store_sharma_telecom",
            "name": "Sharma Telecom Hub",
            "owner_name": "Anil Sharma",
            "phone": "+91 98452 77889",
            "neighbourhood": "Thippasandra Market",
            "address": "#23, Thippasandra Main Rd, HAL 3rd Stage, Bengaluru",
            "latitude": 12.9735,
            "longitude": 77.6531
        },
        {
            "id": "store_quickfix_gadgets",
            "name": "QuickFix Gadgets & Care",
            "owner_name": "Faizan Ahmed",
            "phone": "+91 98453 99001",
            "neighbourhood": "Double Road, Indiranagar",
            "address": "#510, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru",
            "latitude": 12.9698,
            "longitude": 77.6385
        }
    ]

    for s in stores_data:
        existing = db.query(Store).filter(Store.id == s["id"]).first()
        if not existing:
            db.add(Store(**s))
    db.commit()

    # 2. Curated Electronics Product Catalogue
    products_data = [
        # Chargers
        {
            "id": "prod_samsung_25w_ta800",
            "sku": "SAM-CHG-25W-TA800",
            "barcode": "8806090159450",
            "brand": "Samsung",
            "model_name": "25W Type-C Super Fast Adapter",
            "model_number": "EP-TA800",
            "category": "CHARGERS",
            "subcategory": "Wall Adapter",
            "mrp": 1299.0,
            "attributes_json": {
                "wattage": 25,
                "port_type": "USB-C",
                "standards": ["PD 3.0", "PPS"],
                "color": "Black",
                "warranty_months": 6
            }
        },
        {
            "id": "prod_samsung_15w_ta200",
            "sku": "SAM-CHG-15W-TA200",
            "barcode": "8806088820010",
            "brand": "Samsung",
            "model_name": "15W Adaptive Fast Charging Adapter",
            "model_number": "EP-TA200",
            "category": "CHARGERS",
            "subcategory": "Wall Adapter",
            "mrp": 799.0,
            "attributes_json": {
                "wattage": 15,
                "port_type": "USB-A",
                "standards": ["AFC", "QC 2.0"],
                "color": "White",
                "warranty_months": 6
            }
        },
        {
            "id": "prod_anker_nano_30w",
            "sku": "ANK-CHG-30W-A2146",
            "barcode": "194644084201",
            "brand": "Anker",
            "model_name": "511 Charger (Nano 3 30W PIQ 3.0)",
            "model_number": "A2146",
            "category": "CHARGERS",
            "subcategory": "GaN Charger",
            "mrp": 1799.0,
            "attributes_json": {
                "wattage": 30,
                "port_type": "USB-C",
                "standards": ["PD 3.0", "PPS", "PIQ 3.0"],
                "color": "Phantom Black",
                "warranty_months": 18
            }
        },
        {
            "id": "prod_anker_735_65w",
            "sku": "ANK-CHG-65W-A2668",
            "barcode": "194644098932",
            "brand": "Anker",
            "model_name": "735 Charger (GaNPrime 65W 3-Port)",
            "model_number": "A2668",
            "category": "CHARGERS",
            "subcategory": "GaN Multi-port Charger",
            "mrp": 3499.0,
            "attributes_json": {
                "wattage": 65,
                "port_type": "Dual USB-C + USB-A",
                "standards": ["PD 3.0", "PPS", "QC 4.0+"],
                "color": "Gunmetal",
                "warranty_months": 24
            }
        },
        {
            "id": "prod_apple_20w_adapter",
            "sku": "APL-CHG-20W-MHJE3",
            "barcode": "194252157008",
            "brand": "Apple",
            "model_name": "20W USB-C Power Adapter",
            "model_number": "MHJE3HN/A",
            "category": "CHARGERS",
            "subcategory": "Wall Adapter",
            "mrp": 1900.0,
            "attributes_json": {
                "wattage": 20,
                "port_type": "USB-C",
                "standards": ["PD 3.0"],
                "color": "White",
                "warranty_months": 12
            }
        },
        {
            "id": "prod_mi_67w_soniccharge",
            "sku": "MI-CHG-67W-MDY12EH",
            "barcode": "8904374501234",
            "brand": "Mi",
            "model_name": "SonicCharge 3.0 67W Combo Charger",
            "model_number": "MDY-12-EH",
            "category": "CHARGERS",
            "subcategory": "Fast Charger",
            "mrp": 1999.0,
            "attributes_json": {
                "wattage": 67,
                "port_type": "USB-A",
                "standards": ["QC 3.0", "SonicCharge"],
                "color": "White",
                "warranty_months": 6
            }
        },

        # Cables
        {
            "id": "prod_boat_deuce_c_to_c_100w",
            "sku": "BOAT-CBL-100W-CC",
            "barcode": "8904130867890",
            "brand": "boAt",
            "model_name": "Deuce USB 300 Type-C to Type-C 100W Cable",
            "model_number": "Deuce-300",
            "category": "CABLES",
            "subcategory": "Braided Cable",
            "mrp": 599.0,
            "attributes_json": {
                "connector_from": "USB-C",
                "connector_to": "USB-C",
                "cable_wattage_rating": 100,
                "cable_length_m": 1.5,
                "data_transfer_mbps": 480,
                "braided": True
            }
        },
        {
            "id": "prod_samsung_c_to_c_5a",
            "sku": "SAM-CBL-100W-5A",
            "barcode": "8806092045614",
            "brand": "Samsung",
            "model_name": "Type-C to Type-C 5A 100W Cable (1.8m)",
            "model_number": "EP-DN975",
            "category": "CABLES",
            "subcategory": "OEM Cable",
            "mrp": 899.0,
            "attributes_json": {
                "connector_from": "USB-C",
                "connector_to": "USB-C",
                "cable_wattage_rating": 100,
                "cable_length_m": 1.8,
                "data_transfer_mbps": 480,
                "braided": False
            }
        },
        {
            "id": "prod_boat_rugged_a_to_c",
            "sku": "BOAT-CBL-ATC-60W",
            "barcode": "8904130867891",
            "brand": "boAt",
            "model_name": "Rugged V3 USB-A to Type-C 3A Cable (1.5m)",
            "model_number": "Rugged-V3",
            "category": "CABLES",
            "subcategory": "Braided Cable",
            "mrp": 399.0,
            "attributes_json": {
                "connector_from": "USB-A",
                "connector_to": "USB-C",
                "cable_wattage_rating": 18,
                "cable_length_m": 1.5,
                "data_transfer_mbps": 480,
                "braided": True
            }
        },
        {
            "id": "prod_apple_lightning_to_c",
            "sku": "APL-CBL-LTC-1M",
            "barcode": "190199403487",
            "brand": "Apple",
            "model_name": "USB-C to Lightning Cable (1m)",
            "model_number": "MM0A3ZM/A",
            "category": "CABLES",
            "subcategory": "OEM Cable",
            "mrp": 1900.0,
            "attributes_json": {
                "connector_from": "USB-C",
                "connector_to": "Lightning",
                "cable_wattage_rating": 27,
                "cable_length_m": 1.0,
                "braided": False
            }
        },

        # Power Banks
        {
            "id": "prod_mi_powerbank_3i_20000",
            "sku": "MI-PB-20000-3I",
            "barcode": "8904374509988",
            "brand": "Mi",
            "model_name": "Mi Power Bank 3i 20000mAh (18W Fast Charging)",
            "model_number": "PLM18ZM",
            "category": "POWER_BANKS",
            "subcategory": "Lithium Polymer",
            "mrp": 2199.0,
            "attributes_json": {
                "capacity_mah": 20000,
                "max_output_w": 18,
                "ports": "Triple Output (2x USB-A + 1x USB-C)",
                "standards": ["QC 3.0", "PD"]
            }
        },
        {
            "id": "prod_ambrane_powerbank_65w_20000",
            "sku": "AMB-PB-20000-65W",
            "barcode": "8904258412345",
            "brand": "Ambrane",
            "model_name": "PowerLit Ultra 20000mAh 65W Laptop Power Bank",
            "model_number": "PL-Ultra-65",
            "category": "POWER_BANKS",
            "subcategory": "Laptop Power Bank",
            "mrp": 3999.0,
            "attributes_json": {
                "capacity_mah": 20000,
                "max_output_w": 65,
                "ports": "Dual Type-C + USB-A",
                "standards": ["PD 3.0", "PPS", "QC 3.0"]
            }
        },

        # Audio
        {
            "id": "prod_boat_airdopes_141",
            "sku": "BOAT-TWS-AD141",
            "barcode": "8904130872221",
            "brand": "boAt",
            "model_name": "Airdopes 141 True Wireless Earbuds",
            "model_number": "AD-141",
            "category": "AUDIO",
            "subcategory": "TWS",
            "mrp": 1499.0,
            "attributes_json": {
                "playback_hours": 42,
                "latency_ms": 80,
                "charging_port": "Type-C"
            }
        }
    ]

    for p in products_data:
        existing = db.query(Product).filter(Product.id == p["id"]).first()
        if not existing:
            db.add(Product(**p))
    db.commit()

    # 3. Store-Specific Inventory Distributions
    # Scenario:
    # Shop A (Gupta Mobile): Out of stock on Samsung 25W TA800 and Anker 65W!
    # Shop B (Balaji Electronics): Has 4 units of Samsung 25W TA800 and 2 units of Anker 735 65W!
    # Shop C (Sharma Telecom): Has 3 units of Samsung 15W TA200 (INCOMPATIBLE with 25W/65W request) and 5 cables!
    # Shop D (QuickFix Gadgets): Has 1 unit of Anker Nano 30W (COMPATIBLE ALTERNATIVE for 25W Samsung)!

    now = datetime.datetime.utcnow()
    inv_data = [
        # Shop A (Gupta Mobile) - requesting store in main demo
        {"id": "inv_gm_sam_ta800", "store_id": "store_gupta_mobile", "product_id": "prod_samsung_25w_ta800", "stock_quantity": 0, "reserved_quantity": 0, "purchase_cost": 750.0, "retail_price": 1199.0, "transfer_price": 950.0, "last_confirmed_at": now, "status": "OUT_OF_STOCK"},
        {"id": "inv_gm_boat_c2c", "store_id": "store_gupta_mobile", "product_id": "prod_boat_deuce_c_to_c_100w", "stock_quantity": 3, "reserved_quantity": 0, "purchase_cost": 280.0, "retail_price": 499.0, "transfer_price": 380.0, "last_confirmed_at": now, "status": "ACTIVE"},

        # Shop B (Sri Balaji Electronics) - primary supplier for demo
        {"id": "inv_sb_sam_ta800", "store_id": "store_balaji_electronics", "product_id": "prod_samsung_25w_ta800", "stock_quantity": 4, "reserved_quantity": 0, "purchase_cost": 740.0, "retail_price": 1199.0, "transfer_price": 920.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_sb_anker_65w", "store_id": "store_balaji_electronics", "product_id": "prod_anker_735_65w", "stock_quantity": 2, "reserved_quantity": 0, "purchase_cost": 2200.0, "retail_price": 3199.0, "transfer_price": 2650.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_sb_mi_pb20k", "store_id": "store_balaji_electronics", "product_id": "prod_mi_powerbank_3i_20000", "stock_quantity": 5, "reserved_quantity": 0, "purchase_cost": 1400.0, "retail_price": 1899.0, "transfer_price": 1600.0, "last_confirmed_at": now, "status": "ACTIVE"},

        # Shop C (Sharma Telecom) - has incompatible or stale inventory
        {"id": "inv_st_sam_ta200", "store_id": "store_sharma_telecom", "product_id": "prod_samsung_15w_ta200", "stock_quantity": 3, "reserved_quantity": 0, "purchase_cost": 420.0, "retail_price": 699.0, "transfer_price": 530.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_st_boat_a2c", "store_id": "store_sharma_telecom", "product_id": "prod_boat_rugged_a_to_c", "stock_quantity": 6, "reserved_quantity": 0, "purchase_cost": 180.0, "retail_price": 349.0, "transfer_price": 240.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_st_mi_67w", "store_id": "store_sharma_telecom", "product_id": "prod_mi_67w_soniccharge", "stock_quantity": 2, "reserved_quantity": 0, "purchase_cost": 1250.0, "retail_price": 1799.0, "transfer_price": 1450.0, "last_confirmed_at": now, "status": "ACTIVE"},

        # Shop D (QuickFix Gadgets) - has compatible alternative (Anker Nano 30W)
        {"id": "inv_qf_anker_30w", "store_id": "store_quickfix_gadgets", "product_id": "prod_anker_nano_30w", "stock_quantity": 3, "reserved_quantity": 0, "purchase_cost": 1050.0, "retail_price": 1599.0, "transfer_price": 1280.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_qf_boat_ad141", "store_id": "store_quickfix_gadgets", "product_id": "prod_boat_airdopes_141", "stock_quantity": 4, "reserved_quantity": 0, "purchase_cost": 850.0, "retail_price": 1299.0, "transfer_price": 1020.0, "last_confirmed_at": now, "status": "ACTIVE"},
        {"id": "inv_qf_amb_65w", "store_id": "store_quickfix_gadgets", "product_id": "prod_ambrane_powerbank_65w_20000", "stock_quantity": 2, "reserved_quantity": 0, "purchase_cost": 2600.0, "retail_price": 3699.0, "transfer_price": 3050.0, "last_confirmed_at": now, "status": "ACTIVE"}
    ]

    for inv in inv_data:
        existing = db.query(InventoryItem).filter(InventoryItem.id == inv["id"]).first()
        if not existing:
            db.add(InventoryItem(**inv))
    db.commit()

    return {
        "stores": len(stores_data),
        "products": len(products_data),
        "inventory_records": len(inv_data)
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

    # Check barcode / SKU / exact model matches
    q_lower = customer_query.lower()
    for p in all_products:
        if (p.barcode and p.barcode in q_lower) or (p.sku and p.sku.lower() in q_lower):
            resolved_product = p
            break
        if p.model_number and p.model_number.lower() in q_lower:
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
        raise ValueError(
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
    offer = db.query(SupplierOffer).filter(SupplierOffer.id == offer_id).first()
    if not offer:
        raise ValueError("Offer not found.")

    if offer.status != "PENDING":
        raise ValueError(f"Cannot accept offer with status '{offer.status}'.")

    if datetime.datetime.utcnow() > offer.expires_at:
        offer.status = "EXPIRED"
        db.commit()
        raise ValueError("Supplier offer has expired.")

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
        raise ValueError("Stock was depleted or reserved by a competing request.")

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
        raise ValueError(f"Reservation already finalized with status: {res.status}")

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
    # Sale price: what customer paid Shop A (defaults to product MRP or retail price)
    sale_price = actual_customer_price if actual_customer_price else inv.retail_price
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
