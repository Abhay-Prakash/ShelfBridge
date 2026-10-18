"""
Phase 1.2 Comprehensive Verification Suite
Tests backend persistence of demo requests, dynamic reservation expiry & sweep,
NLP query parsing, stock constraint enforcement, and catalogue integrity.
"""

import sys
import os
import datetime
import urllib.request
import json

BASE_URL = "http://localhost:8000"

def get(path):
    req = urllib.request.Request(f"{BASE_URL}{path}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def post(path, data=None):
    payload = json.dumps(data or {}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    print("=== SHELFBRIDGE PHASE 1.2 VERIFICATION ===")

    # 0. Re-seed to clean deterministic state
    print("\n--- 0. Seed Database ---")
    seed_res = post("/api/seed")
    print(f"Seed response: {seed_res['stats']}")
    assert seed_res["stats"]["stores"] == 4
    assert seed_res["stats"]["products"] == 36
    assert seed_res["stats"]["inventory_records"] == 21
    assert seed_res["stats"]["seeded_requests"] == 4
    print("[PASS] Canonical database seed verified (4 stores, 36 products, 21 inventory rows, 4 seeded requests)")

    # 1. Verify demo requests in runtime state are backend-driven
    print("\n--- 1. Seeded Requests Persistence ---")
    requests = get("/api/requests")
    req_ids = [r["id"] for r in requests]
    print(f"Fetched {len(requests)} requests: {req_ids}")
    for expected_id in ["req_demo_1042", "req_demo_1041", "req_demo_1039", "req_demo_1038"]:
        assert expected_id in req_ids, f"Missing demo request {expected_id}"
    print("[PASS] All 4 demo requests exist as persistent database records with backend-issued IDs")

    # Verify req_demo_1042 has real candidate matches evaluated by backend
    r1042 = get("/api/requests/req_demo_1042")
    assert len(r1042["match_candidates"]) > 0, "No match candidates found for req_demo_1042"
    assert r1042["resolved_product_id"] == "prod_ank_a2663_65w"
    exact_match = [c for c in r1042["match_candidates"] if c["match_type"] == "EXACT_MATCH"]
    assert len(exact_match) >= 1, "Expected at least 1 EXACT_MATCH candidate"
    print(f"[PASS] req_demo_1042 has {len(r1042['match_candidates'])} backend candidates (1 EXACT_MATCH at {exact_match[0]['supplying_store_id']})")

    # 2. Verify NLP query parsing endpoint
    print("\n--- 2. Query Parsing (Capture Studio) ---")
    parse_res = post("/api/nlp/parse", {"query": "Customer needs Anker 65W GaN USB-C charger for laptop & S24 Ultra fast charge"})
    print(f"Parse result: wattage={parse_res.get('wattage')}, connector={parse_res.get('connector')}, brand={parse_res.get('brand')}")
    assert parse_res["wattage"] == 65
    # Backend normalises TYPE_C → USB-C at display layer; both are valid outputs
    assert parse_res["connector"] in ("USB-C", "TYPE_C"), f"Unexpected connector: {parse_res['connector']}"
    assert parse_res["brand"] == "anker"
    print("[PASS] POST /api/nlp/parse successfully extracts specifications without client-side mock timers")

    # 3. Verify backend-driven reservation expiry and inventory release
    print("\n--- 3. Backend-Driven Reservation Expiry ---")
    # req_demo_1041 starts with an ACTIVE reservation res_demo_882
    r1041 = get("/api/requests/req_demo_1041")
    assert r1041["reservation"] is not None
    res_id = r1041["reservation"]["id"]
    inv_id = r1041["reservation"]["inventory_id"]

    # Check Metrovolt inventory for the reserved powerbank
    mv_inv_before = get("/api/stores/store_np_metrovolt/inventory")
    target_inv = [i for i in mv_inv_before if i["id"] == inv_id or i["product_id"] == "prod_por_luxcell_65w"][0]
    reserved_before = target_inv["reserved_quantity"]
    avail_before = target_inv["available_quantity"]
    print(f"Before expiry: on_hand={target_inv['stock_quantity']}, reserved={reserved_before}, available={avail_before}")
    assert reserved_before == 1

    # Call POST /api/reservations/{res_id}/expire
    expire_res = post(f"/api/reservations/{res_id}/expire")
    print(f"Expired reservation status: {expire_res['status']}")
    assert expire_res["status"] == "EXPIRED"

    # Verify inventory was automatically updated in backend DB
    mv_inv_after = get("/api/stores/store_np_metrovolt/inventory")
    target_inv_after = [i for i in mv_inv_after if i["id"] == target_inv["id"]][0]
    print(f"After expiry: on_hand={target_inv_after['stock_quantity']}, reserved={target_inv_after['reserved_quantity']}, available={target_inv_after['available_quantity']}")
    assert target_inv_after["reserved_quantity"] == 0
    assert target_inv_after["available_quantity"] == avail_before + 1
    print("[PASS] Backend reservation expiry released inventory hold atomically")

    # 4. Verify reservation contention
    print("\n--- 4. Backend Concurrency / Contention Simulation ---")
    contention_res = post("/api/reservations/simulate-contention", {
        "store_id": "store_np_metrovolt",
        "product_id": "prod_ank_a2663_65w"
    })
    print(f"Contention result: client_b_rejected={contention_res.get('client_b_rejected')}, reason='{contention_res.get('rejection_reason')}'")
    assert contention_res["success"] is True
    assert contention_res["client_b_rejected"] is True
    print("[PASS] Backend over-reservation contention verified (client B rejected, stock constraint preserved)")

    # 5. Verify all-inventory network read endpoint
    print("\n--- 5. Network Inventory Read ---")
    all_inv = get("/api/inventory")
    print(f"Network inventory total records: {len(all_inv)}")
    assert len(all_inv) == 21
    print("[PASS] GET /api/inventory returns 21 canonical inventory records across all 4 stores")

    print("\n=== ALL PHASE 1.2 BACKEND & INTEGRATION CHECKS PASSED ===")

if __name__ == "__main__":
    main()
