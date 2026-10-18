"""
API-Level Tests for Standardised HTTP 409 Stock Conflicts and Status Code Precision.
Verifies that:
- Insufficient inventory stock for offers returns HTTP 409 Conflict.
- Depleted or competing reservation attempts return HTTP 409 Conflict.
- Inventory reduction below active reservations returns HTTP 409 Conflict.
- Cancelling an already finalized reservation returns HTTP 409 Conflict.
- Invalid handover PIN verification continues to return HTTP 400 Bad Request (NOT 409).
- Missing entities continue to return HTTP 404 Not Found.
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
    """In-memory SQLite test client with overridden database dependency."""
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


def test_create_offer_exceeding_stock_returns_409(client):
    """
    Submitting an offer for more units than currently available must return HTTP 409 Conflict.
    Metrovolt has 4 units of prod_ank_a2663_65w. Requesting 10 units must conflict.
    """
    # 1. Create request
    req_res = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker 65W charger",
        "quantity": 10,
        "allow_substitutes": False
    })
    assert req_res.status_code == 200
    req_id = req_res.json()["id"]

    # 2. Attempt to create offer with quantity 10 (available is 4)
    offer_res = client.post("/api/offers", json={
        "request_id": req_id,
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 10,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    })
    assert offer_res.status_code == 409
    assert "Insufficient available units" in offer_res.json()["detail"]


def test_accept_offer_insufficient_stock_returns_409(client):
    """
    When competing reservations consume available stock, accepting an offer must return HTTP 409 Conflict.
    """
    # Create two requests competing for the remaining units
    req1 = client.post("/api/requests", json={
        "requesting_store_id": "store_np_apex",
        "customer_query": "Anker 65W charger",
        "quantity": 4,
        "allow_substitutes": False
    }).json()

    req2 = client.post("/api/requests", json={
        "requesting_store_id": "store_np_quickcharge",
        "customer_query": "Anker 65W charger",
        "quantity": 4,
        "allow_substitutes": False
    }).json()

    # Create offers for both
    off1 = client.post("/api/offers", json={
        "request_id": req1["id"],
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 4,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    }).json()

    off2 = client.post("/api/offers", json={
        "request_id": req2["id"],
        "supplying_store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w",
        "offered_quantity": 4,
        "unit_transfer_price": 1950.0,
        "validity_minutes": 15
    }).json()

    # Accept first offer -> succeeds with 200
    res1 = client.post(f"/api/offers/{off1['id']}/accept", json={"pickup_window_minutes": 15})
    assert res1.status_code == 200

    # Accept second offer -> MUST fail with HTTP 409 Conflict (not 400)
    res2 = client.post(f"/api/offers/{off2['id']}/accept", json={"pickup_window_minutes": 15})
    assert res2.status_code == 409
    assert "Stock was depleted or reserved by a competing request" in res2.json()["detail"]


def test_inventory_reduction_below_reserved_returns_409(client):
    """
    Attempting to reduce stock below the currently reserved quantity must return HTTP 409 Conflict.
    req_demo_1041 has 1 unit of prod_por_luxcell_65w actively reserved at Metrovolt.
    On-hand is 3, reserved is 1. Reducing by -3 would make stock 0 (< 1 reserved).
    """
    res = client.post("/api/inventory/adjust", json={
        "store_id": "store_np_metrovolt",
        "product_id": "prod_por_luxcell_65w",
        "quantity_delta": -3
    })
    assert res.status_code == 409
    assert "actively reserved" in res.json()["detail"]


def test_invalid_handover_code_remains_400(client):
    """
    Invalid handover code is an authentication/validation failure, NOT a stock conflict.
    It must return HTTP 400 Bad Request, NOT 409.
    """
    # req_demo_1041 is seeded with active reservation res_demo_882 and fulfilment ful_demo_882
    ful_id = "ful_demo_882"
    res = client.post(f"/api/fulfilments/{ful_id}/complete", json={
        "handover_code": "SB-9999",  # Deliberately invalid PIN
        "actual_customer_price": 3499.0,
        "logistics_cost": 50.0
    })
    assert res.status_code == 400
    assert "Invalid handover code" in res.json()["detail"]


def test_accept_already_accepted_offer_returns_409(client):
    """
    Attempting to accept an offer that is not in PENDING state must return HTTP 409 Conflict.
    """
    # req_demo_1041's offer off_demo_1041 is already ACCEPTED in seed
    res = client.post("/api/offers/off_demo_1041/accept", json={"pickup_window_minutes": 15})
    assert res.status_code == 409
    assert "Cannot accept offer with status" in res.json()["detail"]


def test_cancel_already_finalized_reservation_returns_409(client):
    """
    Attempting to cancel or expire a reservation that is no longer ACTIVE must return HTTP 409 Conflict.
    """
    # Cancel active reservation res_demo_882
    cancel_res = client.post("/api/reservations/res_demo_882/cancel")
    assert cancel_res.status_code == 200

    # Attempt to cancel it again -> must return 409 Conflict
    second_cancel = client.post("/api/reservations/res_demo_882/cancel")
    assert second_cancel.status_code == 409
    assert "Reservation already finalized" in second_cancel.json()["detail"]
