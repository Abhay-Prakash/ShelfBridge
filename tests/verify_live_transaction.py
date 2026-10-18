import httpx
import json

BASE = "http://127.0.0.1:8000"
client = httpx.Client()

print("--- Step 1: Create stockout request at Shop A (Apex Mobile, Nehru Place) ---")
req_payload = {
    "requesting_store_id": "store_np_apex",
    "customer_query": "Anker 65W GaN USB-C charger A2663 for laptop and phone",
    "quantity": 1,
    "allow_substitutes": True,
    "notes": "Walk-in customer urgent"
}
r1 = client.post(f"{BASE}/api/requests", json=req_payload).json()
req_id = r1["id"]
candidates = r1["match_candidates"]
print(f"Request created: {req_id}, status: {r1['status']}, candidates found: {len(candidates)}")

print("\n--- Step 2 & 3: Identity resolution & candidate discovery ---")
exact = [c for c in candidates if c["match_type"] == "EXACT_MATCH"][0]
incompat = [c for c in candidates if c["match_type"] == "INCOMPATIBLE"][0]
print(f"Exact match at {exact['supplying_store_id']} (product: {exact['product_id']})")
print(f"Incompatible candidate flagged at {incompat['supplying_store_id']}")
print(f"Incompatible reasons: {incompat['incompatible_reasons_json']}")

print("\n--- Step 4: Supplier confirms stock and issues offer ---")
offer_payload = {
    "request_id": req_id,
    "supplying_store_id": exact["supplying_store_id"],
    "product_id": exact["product_id"],
    "offered_quantity": 1,
    "unit_transfer_price": exact["transfer_price"],
    "validity_minutes": 15
}
r2 = client.post(f"{BASE}/api/offers", json=offer_payload).json()
offer_id = r2["id"]
print(f"Offer issued: {offer_id}, transfer price: Rs.{r2['unit_transfer_price']}")

print("\n--- Step 5: Shop A accepts offer -> atomic reservation ---")
r3 = client.post(f"{BASE}/api/offers/{offer_id}/accept", json={"pickup_window_minutes": 15}).json()
res_id = r3["id"]
print(f"Reservation created: {res_id}, status: {r3['status']}, expires at: {r3['expires_at']}")

req_detail = client.get(f"{BASE}/api/requests/{req_id}").json()
ful_id = req_detail["reservation"]["fulfilment"]["id"]
code = req_detail["reservation"]["fulfilment"]["handover_code"]
print(f"Fulfilment record ready: {ful_id}, handover verification code: {code}")

print("\n--- Step 6 & 7: Handover verification and commercial settlement ---")
comp_payload = {
    "handover_code": code,
    "actual_customer_price": 2499.0,
    "logistics_cost": 0.0
}
r4 = client.post(f"{BASE}/api/fulfilments/{ful_id}/complete", json=comp_payload).json()
print(f"Handover verified and fulfilled! Transaction outcome ID: {r4['id']}")
print(f"Recovered GMV: Rs.{r4['total_recovered_gmv']}")
print(f"Shop A (Requesting Store) Net Margin: Rs.{r4['requesting_store_margin']}")
print(f"Shop B (Supplying Store) Net Margin: Rs.{r4['supplying_store_margin']}")
print(f"ShelfBridge Platform Net Fee: Rs.{r4['platform_net_margin']}")
print(f"Breakdown: {json.dumps(r4['calculation_breakdown_json'], indent=2)}")

print("\n--- Step 8: Network financial summary ---")
summary = client.get(f"{BASE}/api/summary").json()
print(f"Total Recovered GMV: Rs.{summary['total_recovered_gmv']}")
print(f"Total Fulfilled Requests: {summary['completed_fulfilments_count']}")
print(f"Total Requesting Store Margin: Rs.{summary['total_requesting_store_margin']}")
print(f"Total Supplying Store Margin: Rs.{summary['total_supplying_store_margin']}")
print(f"Total Platform Net Revenue: Rs.{summary['total_platform_net_revenue']}")
