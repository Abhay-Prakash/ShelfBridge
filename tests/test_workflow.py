"""
End-to-End Workflow & Business Logic Tests for ShelfBridge.
Verifies the complete 7-step transaction coordination loop:
Capture demand -> Resolve identity -> Discover stock -> Supplier offer ->
Atomic reservation -> Fulfilment handover -> Deterministic financial settlement.

All store IDs and product IDs reference the canonical Nehru Place pilot seed data.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.models import (
    Store, Product, InventoryItem, UnmetDemandRequest,
    MatchCandidate, SupplierOffer, Reservation, Fulfilment,
    TransactionOutcome
)
from backend.services import (
    seed_database, create_unmet_demand_request,
    create_supplier_offer, accept_offer_and_reserve,
    cancel_or_expire_reservation, complete_fulfilment_and_settlement
)


@pytest.fixture
def test_db():
    """In-memory SQLite database for isolated test execution."""
    test_engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    yield db
    db.close()


def test_complete_vertical_slice(test_db):
    """
    Test Step 1 through Step 7 of the ShelfBridge core workflow.
    Uses Nehru Place canonical seed:
      Shop A (store_np_apex) requests Anker 65W GaN charger.
      Shop B (store_np_metrovolt) has EXACT_MATCH with 4 units.
      Shop C (store_np_quickcharge) has Samsung 15W — INCOMPATIBLE.
    """
    # Step 1 & 2: Shop A (Apex Mobile) records customer request for Anker 65W
    req = create_unmet_demand_request(
        db=test_db,
        requesting_store_id="store_np_apex",
        customer_query="Anker 65W USB-C GaN charger A2663 for laptop",
        quantity=1,
        allow_substitutes=True
    )
    assert req.id.startswith("req_")
    assert req.status == "MATCHES_FOUND"
    assert req.requested_specs_json["wattage"] == 65

    # Step 3: Verify Discovery Candidates
    candidates = test_db.query(MatchCandidate).filter(MatchCandidate.request_id == req.id).all()
    assert len(candidates) > 0

    # Verify Shop B (MetroVolt) has EXACT_MATCH on Anker A2663
    shop_b_matches = [c for c in candidates if c.supplying_store_id == "store_np_metrovolt"]
    exact_match = next((c for c in shop_b_matches if c.match_type == "EXACT_MATCH"), None)
    assert exact_match is not None, "Shop B must supply EXACT_MATCH for Anker A2663 65W"
    assert exact_match.available_units == 4

    # Verify Shop C (QuickCharge) has INCOMPATIBLE match (15W adapter vs 65W request)
    shop_c_matches = [c for c in candidates if c.supplying_store_id == "store_np_quickcharge"]
    incompatible_15w = next((c for c in shop_c_matches if "15W" in c.product.model_name), None)
    assert incompatible_15w is not None, "Shop C must have a 15W INCOMPATIBLE candidate"
    assert incompatible_15w.match_type == "INCOMPATIBLE"
    assert len(incompatible_15w.incompatible_reasons_json) > 0

    # Step 4: Shop B confirms availability and creates an offer
    offer = create_supplier_offer(
        db=test_db,
        request_id=req.id,
        supplying_store_id="store_np_metrovolt",
        product_id=exact_match.product_id,
        offered_quantity=1,
        unit_transfer_price=1950.0,
        validity_minutes=15
    )
    assert offer.status == "PENDING"
    assert offer.unit_transfer_price == 1950.0

    # Verify Inventory before reservation
    inv_b = test_db.query(InventoryItem).filter(
        InventoryItem.store_id == "store_np_metrovolt",
        InventoryItem.product_id == exact_match.product_id
    ).first()
    assert inv_b.stock_quantity == 4
    assert inv_b.reserved_quantity == 0
    assert inv_b.available_quantity == 4

    # Step 5: Shop A accepts offer -> Atomic Reservation
    res, ful = accept_offer_and_reserve(
        db=test_db,
        offer_id=offer.id,
        pickup_window_minutes=20
    )
    assert res.status == "ACTIVE"
    assert res.quantity == 1
    assert ful.status == "READY_FOR_PICKUP"
    assert ful.handover_code.startswith("SB-")

    # Verify stock reservation locked units
    test_db.refresh(inv_b)
    assert inv_b.stock_quantity == 4
    assert inv_b.reserved_quantity == 1
    assert inv_b.available_quantity == 3  # Locked from competing requests!

    # Step 6 & 7: Handover verification and commercial settlement
    outcome = complete_fulfilment_and_settlement(
        db=test_db,
        fulfilment_id=ful.id,
        handover_code=ful.handover_code,
        actual_customer_price=2499.0,
        logistics_cost=30.0
    )

    # Verify final states
    test_db.refresh(inv_b)
    assert inv_b.stock_quantity == 3     # Decremented permanently
    assert inv_b.reserved_quantity == 0  # Reservation cleared
    assert inv_b.available_quantity == 3

    assert ful.status == "FULFILLED"
    assert res.status == "FULFILLED"
    assert req.status == "FULFILLED"

    # Verify financial settlement math
    # Customer price: 2499.0, Transfer price: 1950.0, Logistics: 30.0
    # Platform fee = max(25, 2.5% of 2499 = 62.475) -> 62.48 (rounded)
    # Shop A margin = 2499 - 1950 - 30 - platform_fee
    # Shop B wholesale cost = 1550.0 (from seed), margin = 1950 - 1550 = 400.0
    assert outcome.total_recovered_gmv == 2499.0
    assert outcome.transfer_price_paid == 1950.0
    assert outcome.logistics_cost == 30.0
    assert outcome.platform_fee > 0
    assert outcome.requesting_store_margin > 0
    assert outcome.supplying_store_margin == 400.0
    assert outcome.calculation_breakdown_json["is_economically_viable"] is True


def test_concurrent_over_reservation_prevention(test_db):
    """
    Ensure the system rejects attempts to reserve more units than are physically available.
    Uses canonical inv_mv_ank_65w (4 units at store_np_metrovolt).
    """
    inv = test_db.query(InventoryItem).filter(InventoryItem.id == "inv_mv_ank_65w").first()
    assert inv is not None, "Canonical inv_mv_ank_65w inventory item must be seeded"
    initial_avail = inv.available_quantity  # 4 units

    # Request 1: reserve 3 units
    req1 = create_unmet_demand_request(
        db=test_db,
        requesting_store_id="store_np_apex",
        customer_query="Anker 65W A2663 USB-C charger",
        quantity=3
    )
    offer1 = create_supplier_offer(
        db=test_db,
        request_id=req1.id,
        supplying_store_id="store_np_metrovolt",
        product_id="prod_ank_a2663_65w",
        offered_quantity=3
    )
    res1, _ = accept_offer_and_reserve(test_db, offer1.id)
    assert res1.status == "ACTIVE"

    test_db.refresh(inv)
    assert inv.available_quantity == 1  # Only 1 left

    # Request 2: tries to reserve 2 units (exceeds available 1)
    req2 = create_unmet_demand_request(
        db=test_db,
        requesting_store_id="store_np_gadgetpoint",
        customer_query="Anker 65W A2663 USB-C charger",
        quantity=2
    )

    with pytest.raises(ValueError, match="Insufficient available units"):
        create_supplier_offer(
            db=test_db,
            request_id=req2.id,
            supplying_store_id="store_np_metrovolt",
            product_id="prod_ank_a2663_65w",
            offered_quantity=2
        )


def test_reservation_cancellation_releases_stock(test_db):
    """
    Ensure cancelling a reservation restores the inventory units.
    """
    inv = test_db.query(InventoryItem).filter(InventoryItem.id == "inv_mv_ank_65w").first()
    orig_avail = inv.available_quantity

    req = create_unmet_demand_request(
        db=test_db,
        requesting_store_id="store_np_apex",
        customer_query="Anker 65W A2663 GaN charger",
        quantity=1
    )
    offer = create_supplier_offer(
        db=test_db,
        request_id=req.id,
        supplying_store_id="store_np_metrovolt",
        product_id="prod_ank_a2663_65w",
        offered_quantity=1
    )
    res, _ = accept_offer_and_reserve(test_db, offer.id)
    test_db.refresh(inv)
    assert inv.available_quantity == orig_avail - 1

    # Cancel the reservation
    cancelled_res = cancel_or_expire_reservation(test_db, res.id, reason="CANCELLED")
    assert cancelled_res.status == "CANCELLED"

    test_db.refresh(inv)
    assert inv.available_quantity == orig_avail  # Fully released!
