# ShelfBridge — Multi-Page React JSX Frontend

**Project:** AMD Developer 3 Hackathon — *Reinvent Commerce*  
**Format:** Pure JavaScript / React JSX (`.jsx`, `.js`, `.html`, `.css` — zero TypeScript `.tsx`)

## Multi-Page Architecture (`src/pages/`)

1. **`src/pages/OverviewPitchPage.jsx`** — Executive summary, the lost-sale gap, stakeholder value cards, and competitive matrix (Sections 1, 2, 4).
2. **`src/pages/CoordinationDeskPage.jsx`** — Live merchant request queue, 5-stage deterministic state machine, supplier ping, offer confirmation, atomic lock, and handover completion (Sections 3.1, 3.2).
3. **`src/pages/RequestCapturePage.jsx`** — Surface A fast unmet-demand capture studio, Hinglish/messy query AI attribute extractor, and optical GTIN/barcode scanner simulator (Section 3.3.A & P1).
4. **`src/pages/MatchInspectorPage.jsx`** — Surface B 4-stage matching pipeline inspector and electrical spec safeguard table blocking the 45W lookalike charger for a 65W laptop request (Section 7.4).
5. **`src/pages/ReservationsHubPage.jsx`** — Surface C active time-limited holds, live countdown timer, handover PIN verification, and PostgreSQL `SELECT ... FOR UPDATE` concurrency lock tester (Section 7.5).
6. **`src/pages/InventoryCatalogPage.jsx`** — Multi-store inventory ledger (`on_hand - reserved = available`), category filters, shelf stock updater, and CSV export (Section 6.1.2 & 6.1.3).
7. **`src/pages/StoreNetworkPage.jsx`** — Nehru Place 300m store cluster directory, live partner store onboarding form, and commercial risk mitigations (Sections 5.5, 5.6, 12).
8. **`src/pages/DemandInsightsPage.jsx`** — Surface E privacy-preserving neighbourhood unmet demand aggregator and restocking intelligence (Section 3.3.E).
9. **`src/pages/UnitEconomicsPage.jsx`** — Interactive per-transaction contribution waterfall (`₹1,200 - ₹1,000 - ₹50 - ₹20 = ₹130`), break-even volume calculator, FastAPI REST API contract, and immutable `audit_events` log (Sections 5, 7, 8, 10).

## Quick Start

```bash
npm install
npm run dev
```
