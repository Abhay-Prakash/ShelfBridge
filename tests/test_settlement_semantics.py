"""
Settlement Semantics & Multi-Unit Financial Integrity Tests
Verifies:
1. Multi-unit transaction (quantity=2):
   - Per-unit customer sale price vs total GMV
   - Total transfer price (unit_transfer * quantity)
   - Logistics cost (flat per-order, not multiplied by quantity)
   - Platform fee (2.5% of total GMV or â‚¹25 minimum)
   - Shop A margin = total_sale - total_transfer - logistics - platform_fee
   - Outcome is persisted in DB and returned in GET /api/requests/{id}

2. Discounted sale price provenance (â‚¹2,200 actual vs â‚¹2,499 MRP):
   - Creates, reserves, and settles a transaction with actual_customer_price=2200.0
   - Confirms â‚¹2,200 is persisted in SQLite DB and survives retrieval via GET /api/requests/{id}
   - Confirms settlement metrics are calculated on the actual â‚¹2,200 price (GMV=2200, fee=55, margin=145)
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import Base, get_db
from backend.services import seed_database


@pytest.fixture
def client():
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    Base.metadata.create_all(test_engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    db = TestingSession()
    seed_database(db)
    db.close()

    def override_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_multi_unit_settlement_consistency(client: TestClient):
    """
    Two-unit transaction using Anker 65W GaN (prod_ank_a2663_65w):
    - MRP / retail price: â‚¹2,499 per unit
    - Quantity: 2 units
    - Expected GMV / total customer sale price: â‚¹4,998.0
    - Unit transfer price: â‚¹1,950 -> Total transfer cost: â‚¹3,900.0
    - Logistics cost: â‚¹50.0 (per-order runner fee, NOT multiplied by 2)
    - Platform fee: max(25, 4998 * 0.025) = â‚¹124.95
    - Shop A margin: 4998 - 3900 - 50 - 124.95 = â‚¹923.05
    - Shop B margin: 3900 - (1550 * 2) = â‚¹800.0
    """
    # 1. Create a 2-unit unmet demand request
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Need 2 units of Anker 65W USB-C GaN charger",
        "quantity": 2,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    assert req_res.status_code == 200, req_res.text
    req_data = req_res.json()
    req_id = req_data["id"]
    assert req_data["quantity"] == 2
    assert req_data["resolved_product_id"] == "prod_ank_a2663_65w"

    # 2. Supplier (Metrovolt) confirms 2 units @ â‚¹1,950 transfer price
    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 2,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    })
    assert offer_res.status_code == 200, offer_res.text
    offer_id = offer_res.json()["id"]

    # 3. Accept offer and create atomic reservation for 2 units
    res_res = client.post(f"/api/offers/{offer_id}/accept", json={
        "pickup_window_minutes": 20
    })
    assert res_res.status_code == 200, res_res.text
    res_data = res_res.json()
    fulfilment_id = res_data["fulfilment"]["id"]
    handover_code = res_data["fulfilment"]["handover_code"]
    assert res_data["quantity"] == 2

    # 4. Complete fulfilment with actual customer price â‚¹2,499 per unit and â‚¹50 runner fee
    complete_res = client.post(f"/api/fulfilments/{fulfilment_id}/complete", json={
        "handover_code": handover_code,
        "actual_customer_price": 2499.0,
        "logistics_cost": 50.0
    })
    assert complete_res.status_code == 200, complete_res.text
    outcome = complete_res.json()

    # 5. Verify authoritative multi-unit commercial settlement semantics
    # Total GMV = 2499.0 * 2 = 4998.0
    assert outcome["customer_sale_price"] == 4998.0, "customer_sale_price must be total transaction GMV"
    assert outcome["total_recovered_gmv"] == 4998.0, "total_recovered_gmv must be total transaction GMV"

    # Total transfer price = 1950.0 * 2 = 3900.0
    assert outcome["transfer_price_paid"] == 3900.0, "transfer_price_paid must be total transfer for all units"

    # Logistics cost is flat per-order (not multiplied by quantity)
    assert outcome["logistics_cost"] == 50.0, "logistics_cost must remain per-order"

    # Platform fee is 2.5% of total GMV (4998 * 0.025 = 124.95)
    assert outcome["platform_fee"] == 124.95, "platform_fee must be 2.5% of total transaction GMV"

    # Shop A margin = 4998 - 3900 - 50 - 124.95 = 923.05
    assert outcome["requesting_store_margin"] == 923.05, "requesting_store_margin calculation mismatch"

    # Shop B margin = 3900 - (1550 * 2) = 800.0
    assert outcome["supplying_store_margin"] == 800.0, "supplying_store_margin calculation mismatch"

    # Per-unit price is truthfully recorded in calculation breakdown
    breakdown = outcome["calculation_breakdown_json"]
    assert breakdown["quantity"] == 2
    assert breakdown["unit_retail_price"] == 2499.0
    assert breakdown["unit_transfer_price"] == 1950.0
    assert breakdown["is_economically_viable"] is True

    # 6. Verify that GET /api/requests/{id} persists and returns this exact outcome
    req_fetch = client.get(f"/api/requests/{req_id}")
    assert req_fetch.status_code == 200
    fetched_data = req_fetch.json()
    assert fetched_data["status"] == "FULFILLED"
    assert fetched_data["outcome"] is not None
    assert fetched_data["outcome"]["customer_sale_price"] == 4998.0
    assert fetched_data["outcome"]["requesting_store_margin"] == 923.05
    assert fetched_data["outcome"]["platform_fee"] == 124.95


def test_discounted_sale_price_backend_persistence(client: TestClient):
    """
    Verifies that a negotiated sale price (â‚¹2,200 vs MRP â‚¹2,499) is:
    1. Accepted by the backend in complete_fulfilment
    2. Persisted in the SQLite database
    3. Used authoritatively for settlement:
       - GMV: â‚¹2,200.0
       - Transfer Price: â‚¹1,950.0
       - Logistics: â‚¹50.0
       - Platform Fee: max(25, 2200 * 0.025) = â‚¹55.0
       - Shop A Margin: 2200 - 1950 - 50 - 55 = â‚¹145.0
    4. Retrieved identically via GET /api/requests/{id} across reload/queries
    """
    # 1. Create unmet request
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker 65W charger",
        "quantity": 1,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    req_id = req_res.json()["id"]

    # 2. Offer @ â‚¹1,950
    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 1,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    })
    offer_id = offer_res.json()["id"]

    # 3. Reserve
    res_res = client.post(f"/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 20})
    fulfilment_id = res_res.json()["fulfilment"]["id"]
    handover_code = res_res.json()["fulfilment"]["handover_code"]

    # 4. Complete with DISCOUNTED price: â‚¹2,200 (customer negotiated below MRP â‚¹2,499)
    complete_res = client.post(f"/api/fulfilments/{fulfilment_id}/complete", json={
        "handover_code": handover_code,
        "actual_customer_price": 2200.0,
        "logistics_cost": 50.0
    })
    assert complete_res.status_code == 200, complete_res.text
    settlement = complete_res.json()

    # 5. Assert settlement used â‚¹2,200, NOT MRP â‚¹2,499
    assert settlement["customer_sale_price"] == 2200.0
    assert settlement["total_recovered_gmv"] == 2200.0
    assert settlement["platform_fee"] == 55.0  # 2.5% of 2200
    assert settlement["requesting_store_margin"] == 145.0  # 2200 - 1950 - 50 - 55

    # 6. Retrieve request from backend â€” confirms persistence in SQLite DB
    get_req = client.get(f"/api/requests/{req_id}")
    assert get_req.status_code == 200
    persisted = get_req.json()
    assert persisted["status"] == "FULFILLED"
    assert persisted["outcome"] is not None
    assert persisted["outcome"]["customer_sale_price"] == 2200.0, "Actual sale price must survive DB retrieval"
    assert persisted["outcome"]["requesting_store_margin"] == 145.0
    assert persisted["outcome"]["platform_fee"] == 55.0

    # Also check /api/summary reflects the discounted GMV and margin
    summary_res = client.get("/api/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    # At least the â‚¹2200 from this transaction is included
    assert summary["total_recovered_gmv"] >= 2200.0
    assert summary["total_requesting_store_margin"] >= 145.0


def test_two_unit_discounted_settlement(client: TestClient):
    """
    High-value regression: two-unit order settled at an actual negotiated price of â‚¹2,200/unit.
    - Actual per-unit price: â‚¹2,200.0
    - Quantity: 2 units
    - Total GMV: â‚¹4,400.0 (2200.0 * 2)
    - Total transfer cost: â‚¹3,900.0 (1950.0 * 2)
    - Logistics: â‚¹50.0 (flat per-order runner charge)
    - Platform fee: max(25.0, round(4400.0 * 0.025, 2)) = â‚¹110.0
    - Shop A margin: 4400.0 - 3900.0 - 50.0 - 110.0 = â‚¹340.0
    - Outcome persists in DB and is retrieved identically via GET /api/requests/{id}
    - GET /api/summary includes this exact GMV and margin
    """
    # 1. Create 2-unit request
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Need two Anker 65W chargers",
        "quantity": 2,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    # 2. Metrovolt offers 2 units @ â‚¹1,950
    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 2,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    })
    assert offer_res.status_code == 200
    offer_id = offer_res.json()["id"]

    # 3. Reserve 2 units
    res_res = client.post(f"/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 20})
    assert res_res.status_code == 200
    ful_id = res_res.json()["fulfilment"]["id"]
    otp = res_res.json()["fulfilment"]["handover_code"]

    # 4. Complete with actual_customer_price_per_unit = 2200.0
    complete_res = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price_per_unit": 2200.0,
        "logistics_cost": 50.0
    })
    assert complete_res.status_code == 200, complete_res.text
    settlement = complete_res.json()

    # 5. Verify exact mathematical settlement
    assert settlement["customer_sale_price"] == 4400.0, "Total GMV must be 2200.0 * 2 = 4400.0"
    assert settlement["total_recovered_gmv"] == 4400.0
    assert settlement["transfer_price_paid"] == 3900.0, "Total transfer cost must be 1950.0 * 2 = 3900.0"
    assert settlement["logistics_cost"] == 50.0, "Logistics must be flat per-order charge"
    assert settlement["platform_fee"] == 110.0, "Platform fee must be 2.5% of 4400 = 110.0"
    assert settlement["requesting_store_margin"] == 340.0, "Shop A margin must be 4400 - 3900 - 50 - 110 = 340.0"

    breakdown = settlement["calculation_breakdown_json"]
    assert breakdown["quantity"] == 2
    assert breakdown["unit_retail_price"] == 2200.0
    assert breakdown["unit_transfer_price"] == 1950.0
    assert breakdown["is_economically_viable"] is True

    # 6. Verify persistence across GET /api/requests/{id}
    persisted_req = client.get(f"/api/requests/{req_id}").json()
    assert persisted_req["status"] == "FULFILLED"
    assert persisted_req["outcome"] is not None
    assert persisted_req["outcome"]["customer_sale_price"] == 4400.0
    assert persisted_req["outcome"]["transfer_price_paid"] == 3900.0
    assert persisted_req["outcome"]["platform_fee"] == 110.0
    assert persisted_req["outcome"]["requesting_store_margin"] == 340.0

    # 7. Verify GET /api/summary incorporates the 4400 GMV and 340 margin
    summary = client.get("/api/summary").json()
    assert summary["total_recovered_gmv"] >= 4400.0
    assert summary["total_requesting_store_margin"] >= 340.0


def test_invalid_customer_sale_price_rejected(client: TestClient):
    """
    Validation test: invalid sale prices (<= 0) are strictly rejected with HTTP 400.
    Ensures the backend does NOT silently substitute MRP when invalid input is supplied.
    """
    # 1. Setup request, offer, reservation
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker charger",
        "quantity": 1,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    req_id = req_res.json()["id"]

    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 1,
        "unit_transfer_price": 1950.0
    })
    offer_id = offer_res.json()["id"]

    res_res = client.post(f"/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 20})
    ful_id = res_res.json()["fulfilment"]["id"]
    otp = res_res.json()["fulfilment"]["handover_code"]

    # 2. Attempt complete with zero price -> MUST return HTTP 400
    res_zero = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price_per_unit": 0.0
    })
    assert res_zero.status_code == 400
    assert "Price must be greater than zero" in res_zero.json()["detail"]

    # 3. Attempt complete with negative price -> MUST return HTTP 400
    res_neg = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price_per_unit": -150.0
    })
    assert res_neg.status_code == 400
    assert "Price must be greater than zero" in res_neg.json()["detail"]

    # 4. Attempt complete with legacy alias zero price -> MUST return HTTP 400
    res_legacy_zero = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price": 0.0
    })
    assert res_legacy_zero.status_code == 400
    assert "Price must be greater than zero" in res_legacy_zero.json()["detail"]

    # 5. Attempt complete with legacy alias negative price -> MUST return HTTP 400
    res_legacy_neg = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price": -500.0
    })
    assert res_legacy_neg.status_code == 400
    assert "Price must be greater than zero" in res_legacy_neg.json()["detail"]

    # 6. Verify fulfilment status was NOT mutated to FULFILLED on invalid input
    get_ful = client.get(f"/api/fulfilments/{ful_id}")
    assert get_ful.json()["status"] == "READY_FOR_PICKUP"


def test_omitted_actual_price_uses_retail_price_fallback(client: TestClient):
    """
    Verifies that when actual_customer_price_per_unit is omitted (None):
    1. The backend applies its documented fallback to catalogue retail price (inv.retail_price / MRP = â‚¹2,499.0).
    2. Settlement calculates:
       - GMV = â‚¹2,499.0
       - Transfer = â‚¹1,950.0
       - Logistics = â‚¹50.0
       - Platform Fee = max(25, 2499 * 0.025) = â‚¹62.48
       - Shop A Margin = 2499 - 1950 - 50 - 62.48 = â‚¹436.52
    3. Outcome is persisted in SQLite DB and retrieved identically via GET /api/requests/{id}.
    """
    # 1. Setup request, offer, reservation
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker 65W charger",
        "quantity": 1,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 1,
        "unit_transfer_price": 1950.0
    })
    assert offer_res.status_code == 200
    offer_id = offer_res.json()["id"]

    res_res = client.post(f"/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 20})
    assert res_res.status_code == 200
    ful_id = res_res.json()["fulfilment"]["id"]
    otp = res_res.json()["fulfilment"]["handover_code"]

    # 2. Complete fulfilment with NO price supplied in payload (omitted price)
    complete_res = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "logistics_cost": 50.0
    })
    assert complete_res.status_code == 200, complete_res.text
    settlement = complete_res.json()

    # 3. Assert fallback to catalogue retail price â‚¹2,499.0
    assert settlement["customer_sale_price"] == 2499.0, "Omitted price must fall back to catalogue retail price"
    assert settlement["total_recovered_gmv"] == 2499.0
    assert settlement["transfer_price_paid"] == 1950.0
    assert settlement["logistics_cost"] == 50.0
    assert settlement["platform_fee"] == 62.48
    assert settlement["requesting_store_margin"] == 436.52

    # 4. Verify persistence across GET /api/requests/{id}
    persisted = client.get(f"/api/requests/{req_id}").json()
    assert persisted["status"] == "FULFILLED"
    assert persisted["outcome"] is not None
    assert persisted["outcome"]["customer_sale_price"] == 2499.0
    assert persisted["outcome"]["requesting_store_margin"] == 436.52
    assert persisted["outcome"]["platform_fee"] == 62.48


def test_conflicting_price_aliases_rejected(client: TestClient):
    """
    Check 3 â€” Conflicting settlement price aliases:
    Verifies that when actual_customer_price_per_unit and legacy actual_customer_price
    are both supplied with different values, the backend rejects the conflict with HTTP 400.
    Also confirms backward compatibility when only one field is supplied, or when both agree.
    """
    # 1. Setup request, offer, reservation
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker 65W charger",
        "quantity": 1,
        "allow_substitutes": True,
        "notes": "Sku: ANK-A2663-65W"
    })
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 1,
        "unit_transfer_price": 1950.0
    })
    assert offer_res.status_code == 200
    offer_id = offer_res.json()["id"]

    res_res = client.post(f"/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 20})
    assert res_res.status_code == 200
    ful_id = res_res.json()["fulfilment"]["id"]
    otp = res_res.json()["fulfilment"]["handover_code"]

    # 2. Conflicting prices: actual_customer_price_per_unit=2200 vs actual_customer_price=2400
    conflict_res = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price_per_unit": 2200.0,
        "actual_customer_price": 2400.0,
        "logistics_cost": 50.0
    })
    assert conflict_res.status_code == 400, "Conflicting prices must be rejected with HTTP 400"
    assert "Conflicting price fields supplied" in conflict_res.json()["detail"]

    # Verify status remains RESERVED and no outcome created
    req_check = client.get(f"/api/requests/{req_id}").json()
    assert req_check["status"] == "RESERVED"
    assert req_check["outcome"] is None

    # 3. Agreeing prices: both = 2200.0 -> MUST SUCCEED with HTTP 200
    agree_res = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": otp,
        "actual_customer_price_per_unit": 2200.0,
        "actual_customer_price": 2200.0,
        "logistics_cost": 50.0
    })
    assert agree_res.status_code == 200, agree_res.text
    assert agree_res.json()["customer_sale_price"] == 2200.0
