# ShelfBridge — Neighbourhood Inventory Discovery & Lost-Sale Recovery Network

**Hackathon:** AMD Developer 3 | **Track:** Reinvent Commerce  
**Stack:** FastAPI (Python 3.11), SQLAlchemy 2.0, SQLite, React 18 (Vite 6), ONNX Runtime (AMD Ryzen 5 5600H CPU)

---

## 1. Executive Summary

When an independent mobile-accessory store (Shop A) experiences a stockout for a specific technical item (e.g., a 25W or 65W USB-C charger), the walk-in customer leaves and the retailer loses a high-margin sale. Meanwhile, a nearby partner store (Shop B) has available stock sitting unsold.

**ShelfBridge** coordinates this transaction end-to-end:

1. **Captures unmet demand** rapidly at the counter.
2. **Deterministically verifies product identity & electrical specifications** — distinguishing exact matches, safe substitutes, and performance deficits.
3. **Discovers nearby neighbourhood inventory** via haversine-distance ranking.
4. **Coordinates time-limited supplier confirmation & offers**.
5. **Locks stock with atomic reservations** to prevent double-booking.
6. **Verifies physical retailer-to-retailer handover** via unique codes (`SB-XXXX`).
7. **Calculates transparent settlement margins** for both retailers and the platform.

> [!NOTE]
> **Simulated Domain**: All stores are deterministic synthetic seed datasets. The Indiranagar (backend) and Nehru Place (frontend demo) clusters are fabricated. The "5-minute walking distance" is an unvalidated design assumption, not live GPS tracking.

---

## 2. Architecture & Directory Structure

```
ShelfBridge/
├── backend/
│   ├── __init__.py
│   ├── database.py           # SQLAlchemy engine & session maker (SQLite local / PostgreSQL)
│   ├── models.py             # 10 relational domain models
│   ├── schemas.py            # Pydantic v2 request/response schemas with price validation
│   ├── matcher.py            # 4-tier deterministic spec & compatibility matching engine
│   ├── services.py           # 7-step transaction workflow & financial settlement service
│   ├── seed.py               # Canonical database seeder (loads data/ CSVs)
│   ├── validate_catalogue.py # Catalogue integrity validator (run independently)
│   ├── amd_engine.py         # AMD Ryzen 5600H CPU thread-scaling benchmark
│   ├── reranker_embedding_model.onnx  # Synthetic ONNX benchmark graph (not used in matching)
│   └── main.py               # FastAPI application with all REST endpoints
├── Frontend/
│   ├── vite.config.js        # Vite 6 dev server with /api and /health proxy to port 8000
│   ├── package.json          # Pinned Vite 6.3.5 & esbuild 0.21.5
│   ├── index.html            # Vite entrypoint (source; used by dev server)
│   ├── src/
│   │   ├── App.jsx           # 9-tab dashboard, AMD benchmark modal, negotiated-price handover
│   │   ├── main.jsx          # React application root
│   │   ├── api/client.js     # Axios API client (all 21 backend routes, dual audit alias)
│   │   ├── pages/            # Modular page components (Overview, Coordination, Economics, …)
│   │   └── data/seedData.js  # Static Nehru Place UI cluster (display only, not authoritative)
│   ├── assets/               # Brand logos (dark & light theme)
│   └── dist/                 # Vite build output (ignored by .gitignore except index.html preview)
├── data/
│   ├── canonical/
│   │   ├── products.csv      # 36 canonical products with specs & MRP
│   │   └── product_sources.csv  # 36 provenance records (brand, model, wattage, connector)
│   └── seed/
│       ├── stores.csv        # 4 Indiranagar Bengaluru pilot stores with GPS coordinates
│       └── inventory.csv     # 21 store-product inventory records with stock & pricing
├── tests/
│   ├── test_matcher.py            # 7 unit tests: spec parsing & compatibility engine
│   ├── test_workflow.py           # 3 integration tests: vertical slice, concurrency, cancellation
│   ├── test_settlement_semantics.py  # 6 tests: multi-unit, discounted price, alias conflict
│   ├── test_stock_conflicts.py    # 6 tests: 409 stock conflicts, double-accept, invalid codes
│   ├── verify_live_transaction.py # Live HTTP end-to-end 7-step transaction script
│   └── verify_phase1_2.py        # Phase 1.2 hardening verification script
├── Frontend/tests_browser/        # Node.js browser acceptance tests (headless Edge)
│   ├── run_acceptance_suite.cjs   # Full browser acceptance suite (9 scenarios)
│   ├── test_financial_integrity.cjs  # 9 financial integrity regression tests
│   ├── test_fix1_lifecycle.cjs    # 5 API failure/retry lifecycle tests
│   └── test_negotiated_price_handover.cjs  # 8-step negotiated price browser flow
├── CANONICAL_DATA_CONTRACT.md     # Canonical data schema and validation contract
├── AUDIT_AND_GAP_ANALYSIS_FRONTEND_BACKEND.md  # Frontend/backend gap analysis
├── STRATEGY_BACKEND_DRIVEN_ARCHITECTURE.md     # Architecture decision record
├── .gitignore                     # Excludes .venv/, *.db, __pycache__/, node_modules/, dist/
└── README.md
```

---

## 3. Deployment Model

**This project uses a source-based local development workflow.** There is no static file server or production deployment.

- The **backend** runs as a `uvicorn` process on port 8000.
- The **frontend** runs as a `vite dev` process on port 5173, which proxies `/api/*` and `/health` to the backend.
- `Frontend/dist/` is **not served by the backend** and is not part of the active deployment path. `Frontend/dist/index.html` is tracked in git as a static preview artifact only.

---

## 4. Local Setup & Reproducible Execution

### Prerequisites

- Python 3.11+
- Node.js 18+ / 20+ / 24+

### Python Environment

```powershell
python -m venv .venv
.venv\Scripts\pip install fastapi uvicorn sqlalchemy pydantic onnxruntime numpy pytest httpx
```

### Node Environment

```powershell
cd Frontend
npm install
```

### Step 1 — Start the FastAPI Backend

```powershell
$env:OPENBLAS_NUM_THREADS="1"
.venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

The backend seeds the database automatically on startup (via SQLAlchemy lifespan handler calling `seed_database()`).

- Health check: `http://localhost:8000/health`
- Interactive API docs: `http://localhost:8000/docs`

### Step 2 — Start the React Frontend

```powershell
cd Frontend
npm run dev
```

- Web application: `http://localhost:5173/`

### Step 3 — Seed and Validate the Canonical Catalogue

The database is auto-seeded on backend startup. To manually reseed or validate:

```powershell
# Reseed canonical data into a fresh database
.venv\Scripts\python.exe -m backend.seed

# Validate catalogue CSVs independently (does not require a running server)
.venv\Scripts\python.exe -m backend.validate_catalogue
```

Expected output from `validate_catalogue`:
```
✓ Products CSV verified: 36 unique products validated.
✓ Product Sources CSV verified: 36 provenance records mapped.
✓ Stores CSV verified: 4 stores validated.
✓ Inventory CSV verified: 21 inventory records validated across 4 stores.
✅ ALL VALIDATION CHECKS PASSED PERFECTLY!
```

---

## 5. Running the Test Suite

### Backend Pytest (22 tests)

```powershell
$env:OPENBLAS_NUM_THREADS="1"
.venv\Scripts\python.exe -m pytest tests/ -v
```

| File | Tests | Coverage |
|---|---|---|
| `test_matcher.py` | 7 | Spec parsing (chargers, cables, powerbanks), wattage deficit rejection, category mismatch, compatible alternative, exact SKU/model |
| `test_workflow.py` | 3 | Full vertical slice, concurrent over-reservation prevention, cancellation stock release |
| `test_settlement_semantics.py` | 6 | Multi-unit consistency, discounted price persistence, two-unit discounted settlement, invalid price rejection, MRP fallback, conflicting alias rejection |
| `test_stock_conflicts.py` | 6 | Offer-exceeds-stock (409), accept-insufficient-stock (409), inventory-below-reserved (409), invalid handover code (400), double-accept (409), cancel-finalised (409) |

### Live HTTP Script (requires running backend)

```powershell
.venv\Scripts\python.exe tests/verify_live_transaction.py
```

### Browser Acceptance Tests (requires running backend + frontend on port 5173)

```powershell
cd Frontend
node tests_browser/run_acceptance_suite.cjs
node tests_browser/test_financial_integrity.cjs
node tests_browser/test_fix1_lifecycle.cjs
node tests_browser/test_negotiated_price_handover.cjs
```

---

## 6. Key Transaction & Settlement Rules

### 7-Step Workflow

1. **Capture Unmet Demand** — `POST /api/demand-requests` creates a `UnmetDemandRequest` with parsed specs.
2. **Discover Candidates** — `POST /api/matches` runs the 4-tier matching engine against live inventory.
3. **Supplier Offer** — `POST /api/offers` creates a time-limited `SupplierOffer`.
4. **Accept Offer / Reserve Stock** — `POST /api/offers/{id}/accept` atomically creates a `Reservation` with a unique handover PIN (`SB-XXXX`) and reduces `reserved_quantity`. Concurrent requests exceeding available stock receive HTTP 409.
5. **Cancel / Expire** — `POST /api/reservations/{id}/cancel` releases stock hold.
6. **Physical Handover** — `POST /api/fulfilments/{id}/complete` validates the handover PIN and settles the transaction.
7. **Settlement** — `complete_fulfilment_and_settlement` in `services.py` persists a `TransactionOutcome`.

### Financial Settlement Semantics

- `actual_customer_price_per_unit` is the per-unit price the customer actually paid.
- `total_sale_price = actual_customer_price_per_unit × quantity` (total GMV).
- Platform fee: `max(₹25, 2.5% × GMV)`.
- Shop A margin: `GMV − transfer_price − logistics_cost − platform_fee`.
- Shop B margin: `transfer_price − purchase_cost × quantity`.
- If no actual price is supplied, `retail_price` from inventory is used as the MRP fallback.
- Explicitly supplied prices must be strictly positive (`> 0`); zero or negative values return HTTP 400.
- Supplying conflicting values for `actual_customer_price_per_unit` and the legacy alias `actual_customer_price` returns HTTP 400.

### 4-Tier Matching Engine (`backend/matcher.py`)

1. Exact barcode / SKU match.
2. Brand + model string match.
3. Electrical specification rules (wattage, connector type, charging standard) — a 45W charger is rejected for a 65W laptop request as a performance deficit, not a safe substitute.
4. BM25 lexical retrieval fallback.

---

## 7. AMD Hardware Benchmark

> [!IMPORTANT]
> **Honest limitations — read before presenting benchmark results.**

- **Host:** AMD Ryzen 5 5600H (Zen 3, 6 physical cores / 12 logical threads).
- **Execution model:** CPU-only inference via ONNX Runtime. DirectML probing at startup confirms **no Direct3D 12 GPU adapter detected**; the runtime falls back to CPU intra-op thread pool transparently.
- **What is benchmarked:** `reranker_embedding_model.onnx` is a **synthetic matrix projection graph**, not a production NLP model. It is used solely to demonstrate CPU thread-scaling throughput.
- **What is NOT benchmarked:** The actual commercial transaction matching in `backend/matcher.py` is 100% deterministic rule-based logic with no ONNX inference.
- **Observed throughput:** Up to ~1.55× speedup scaling from 1 thread to 12 threads at batch size 2,048. This is multi-threaded CPU intra-op scaling, not GPU acceleration.
- **ROCm / DirectML / GPU:** Not applicable on this hardware configuration. The frontend benchmark modal correctly labels results as "AVX2 CPU" and reports the DirectML probe result honestly.

---

## 8. Known Production Limitations

> [!WARNING]
> The following limitations apply to this hackathon implementation. Do not represent these as solved.

| Limitation | Status |
|---|---|
| **SQLite concurrency** | The application uses SQLite in WAL mode. Concurrent reservation conflicts are detected correctly in tests. Multi-worker PostgreSQL `SELECT … FOR UPDATE` row-level locking has **not** been tested or verified in this implementation. |
| **No authentication** | All API endpoints are unauthenticated. Any caller can create requests, accept offers, or complete fulfilments. |
| **No real GPS** | Store proximity uses haversine distance on hardcoded seed coordinates. There is no live location tracking. |
| **Synthetic inventory** | All stock levels, prices, and store data are deterministic seed data, not live retail inventory. |
| **Single-region** | No multi-region or multi-tenant support. |
| **No offer expiry enforcement** | Offer TTL is stored but not automatically enforced by a background job. Expiry is manual via the cancel endpoint. |

---

## 9. Implemented vs. Future Work

### Implemented in Phase 1.3

- Full 7-step transaction lifecycle with state machine enforcement.
- Atomic stock reservation with concurrent conflict detection (HTTP 409).
- Financial settlement with per-unit negotiated price, MRP fallback, alias conflict rejection.
- Canonical product catalogue (36 products, 4 stores, 21 inventory records) loaded from versioned CSV files.
- Audit event log (`/api/audit-events` and `/api/audit-logs` alias).
- 22 backend pytest tests + 4 browser acceptance test suites.
- Honest AMD CPU benchmark with DirectML probe and accurate labelling.

### Not Implemented / Out of Scope

- PostgreSQL production deployment and multi-worker concurrency verification.
- User authentication and store onboarding workflows.
- Real-time offer expiry via background scheduler.
- Live GPS proximity detection.
- Payment processing or actual financial transfers.
- Production error monitoring, logging infrastructure, or alerting.
