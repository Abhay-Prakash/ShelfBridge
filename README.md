# ShelfBridge — Neighbourhood Inventory Discovery & Lost-Sale Recovery Network

**Hackathon:** AMD Developer 3 | **Track:** Reinvent Commerce  
**Stack:** FastAPI (Python 3.11), SQLAlchemy 2.0, SQLite / PostgreSQL, React 18 (Vite 6), ONNX Runtime (AMD Ryzen 5 5600H CPU)

---

## 1. Executive Summary

When an independent mobile-accessory store (Shop A) experiences a stockout for a specific technical item (e.g., a 25W or 65W USB-C charger), the walk-in customer leaves, and the retailer loses a high-margin sale. Meanwhile, a nearby partner store (Shop B) has available stock sitting unsold.

**ShelfBridge** coordinates this transaction end-to-end:
1. **Captures unmet demand** rapidly at the counter.
2. **Deterministically verifies product identity & electrical specifications** (distinguishing exact matches, safe substitutes, and performance deficits).
3. **Discovers nearby neighbourhood inventory**.
4. **Coordinates time-limited supplier confirmation & offers**.
5. **Locks stock with atomic reservations** to prevent double-booking.
6. **Verifies physical retailer-to-retailer handover** via unique codes (`SB-XXXX`).
7. **Calculates transparent settlement margins** for both retailers and the platform.

> [!NOTE]
> **Simulated Domain Classification**: All stores in the demo (Nehru Place cluster in the frontend; Indiranagar cluster in the backend) are **deterministic synthetic seed datasets**. The "5-minute walking distance" is an unvalidated design assumption representing high-density retail clusters, rather than live GPS tracking.

---

## 2. Architecture & Directory Structure

```
ShelfBridge/
├── backend/
│   ├── database.py                   # SQLAlchemy engine, session maker (SQLite / Postgres)
│   ├── models.py                     # 10 relational domain models
│   ├── schemas.py                    # Pydantic v2 validation schemas
│   ├── matcher.py                    # 4-tier deterministic spec & compatibility engine
│   ├── services.py                   # 7-step transaction coordination logic
│   ├── amd_engine.py                 # AMD Ryzen 5600H CPU thread-scaling benchmark
│   ├── reranker_embedding_model.onnx # Synthetic projection benchmark graph
│   └── main.py                       # FastAPI REST API with CORS and lifespan handler
├── Frontend/
│   ├── vite.config.js                # Vite 6 config with /api and /health reverse proxy
│   ├── package.json                  # Pinned Vite 6.3.5 & esbuild 0.21.5
│   ├── src/
│   │   ├── App.jsx                   # Integrated 9-tab dashboard & AMD benchmark modal
│   │   ├── main.jsx                  # React application root
│   │   ├── pages/                    # Modular page component exports
│   │   └── data/seedData.js          # Seed dataset for simulated UI cluster
│   └── assets/                       # Brand assets & logos
├── tests/
│   ├── test_matcher.py               # 7 unit tests (spec extraction & compatibility)
│   ├── test_workflow.py              # 3 integration tests (vertical slice & concurrency)
│   └── verify_live_transaction.py    # Live HTTP test executing the 7-step transaction
└── .gitignore                        # Excludes .venv/, *.db, node_modules/, dist/
```

---

## 3. Truthful Hardware Execution

- **Host Processor**: AMD Ryzen 5 5600H (Zen 3, 6 Physical Cores / 12 Logical Threads).
- **Execution Model**: Benchmarking runs **CPU-only inference** using ONNX Runtime. DirectML probing confirms that no Direct3D 12 GPU adapter is detected; the runtime transparently executes on the CPU intra-op thread pool.
- **CPU Scaling**: Testing demonstrates up to **1.55x throughput speedup** when scaling from 1 thread to 12 threads on batch size 2,048. Speedup is attributed to multi-threaded CPU intra-op scaling.
- **Separation of Benchmark from Matching**: `reranker_embedding_model.onnx` is a synthetic matrix benchmark graph. The actual commercial transaction matching uses **100% deterministic rule-based logic** (`backend/matcher.py`).

---

## 4. Setup & Reproducible Execution

### Prerequisites
- Python 3.11+
- Node.js 18+ / 20+ / 24+

### Step 1: Start the FastAPI Backend
```powershell
$env:OPENBLAS_NUM_THREADS="1"
.venv\Scripts\uvicorn.exe backend.main:app --port 8000 --host 127.0.0.1
```
- Health Check: `http://localhost:8000/health`
- Interactive API Docs: `http://localhost:8000/docs`

### Step 2: Start the React Frontend
```powershell
cd Frontend
npm run dev
```
- Web Application: `http://localhost:5173/`

### Step 3: Run the Automated Test Suite & Live Scenario
```powershell
$env:OPENBLAS_NUM_THREADS="1"
.venv\Scripts\python.exe -m pytest tests/ -v
.venv\Scripts\python.exe tests/verify_live_transaction.py
```
