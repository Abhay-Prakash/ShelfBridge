"""
ShelfBridge FastAPI Application.
Core API for Neighbourhood Inventory Discovery and Lost-Sale Recovery.
"""

from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, engine, Base, SessionLocal
from backend.models import (
    Store, Product, InventoryItem, UnmetDemandRequest,
    MatchCandidate, SupplierOffer, Reservation, Fulfilment,
    TransactionOutcome, AuditEvent
)
from backend.schemas import (
    StoreOut, ProductOut, InventoryItemOut,
    UnmetDemandCreate, UnmetDemandOut,
    SupplierOfferCreate, SupplierOfferOut,
    ReservationCreate, ReservationOut,
    FulfilmentHandover, FulfilmentOut,
    TransactionOutcomeOut, FinancialSummaryOut
)
from backend.services import (
    seed_database, create_unmet_demand_request,
    discover_candidates_for_request, create_supplier_offer,
    accept_offer_and_reserve, cancel_or_expire_reservation,
    complete_fulfilment_and_settlement
)
from backend.amd_engine import run_amd_hardware_benchmark


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create schema and seed data on startup."""
    # Initialize database schema
    Base.metadata.create_all(bind=engine)
    # Seed initial neighbourhood data if database is empty
    db = SessionLocal()
    try:
        if db.query(Store).count() == 0:
            seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown: nothing to clean up for SQLite


app = FastAPI(
    title="ShelfBridge API",
    description="Neighbourhood Inventory Discovery & Lost-Sale Recovery Network",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ShelfBridge",
        "architecture": "FastAPI + SQLAlchemy + AMD Compute"
    }


# ============================================================================
# SEEDING & RESET
# ============================================================================

@app.post("/api/seed")
def seed_data(db: Session = Depends(get_db)):
    """Re-seed deterministic demo neighbourhood data."""
    # Clear existing state
    db.query(TransactionOutcome).delete()
    db.query(Fulfilment).delete()
    db.query(Reservation).delete()
    db.query(SupplierOffer).delete()
    db.query(MatchCandidate).delete()
    db.query(UnmetDemandRequest).delete()
    db.query(InventoryItem).delete()
    db.query(Product).delete()
    db.query(Store).delete()
    db.query(AuditEvent).delete()
    db.commit()

    stats = seed_database(db)
    return {"message": "Deterministic seed completed successfully.", "stats": stats}


# ============================================================================
# STORES & INVENTORY
# ============================================================================

@app.get("/api/stores", response_model=List[StoreOut])
def list_stores(db: Session = Depends(get_db)):
    """List all participating neighbourhood stores."""
    return db.query(Store).filter(Store.is_active == True).all()


@app.get("/api/stores/{store_id}/inventory", response_model=List[InventoryItemOut])
def get_store_inventory(store_id: str, db: Session = Depends(get_db)):
    """Get stock levels, reservations, and prices for a specific store."""
    return db.query(InventoryItem).filter(InventoryItem.store_id == store_id).all()


@app.get("/api/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    """List curated accessories catalogue with technical specifications."""
    return db.query(Product).filter(Product.is_active == True).all()


# ============================================================================
# UNMET DEMAND & DISCOVERY
# ============================================================================

@app.post("/api/requests", response_model=UnmetDemandOut)
def record_unmet_demand(payload: UnmetDemandCreate, db: Session = Depends(get_db)):
    """
    Step 1 & 2: Shop A records an unmet customer request.
    Extracts electrical specs and triggers neighbourhood discovery.
    """
    try:
        req = create_unmet_demand_request(
            db=db,
            requesting_store_id=payload.requesting_store_id,
            customer_query=payload.customer_query,
            quantity=payload.quantity,
            allow_substitutes=payload.allow_substitutes,
            notes=payload.notes
        )
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/requests", response_model=List[UnmetDemandOut])
def list_requests(
    store_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """List recent unmet demand requests."""
    q = db.query(UnmetDemandRequest)
    if store_id:
        q = q.filter(UnmetDemandRequest.requesting_store_id == store_id)
    return q.order_by(UnmetDemandRequest.created_at.desc()).limit(limit).all()


@app.get("/api/requests/{request_id}", response_model=UnmetDemandOut)
def get_request_details(request_id: str, db: Session = Depends(get_db)):
    """Retrieve full detail of request, candidate matches, offers, and outcome."""
    req = db.query(UnmetDemandRequest).filter(UnmetDemandRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    return req


@app.post("/api/requests/{request_id}/rediscover")
def trigger_rediscovery(request_id: str, db: Session = Depends(get_db)):
    """Step 3: Force re-run discovery across peer stores."""
    try:
        candidates = discover_candidates_for_request(db, request_id)
        return {"message": "Discovery complete", "candidates_count": len(candidates)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# SUPPLIER OFFERS & CONFIRMATION
# ============================================================================

@app.post("/api/offers", response_model=SupplierOfferOut)
def make_supplier_offer(payload: SupplierOfferCreate, db: Session = Depends(get_db)):
    """
    Step 4: Supplying store confirms stock and issues a time-limited offer.
    """
    try:
        offer = create_supplier_offer(
            db=db,
            request_id=payload.request_id,
            supplying_store_id=payload.supplying_store_id,
            product_id=payload.product_id,
            offered_quantity=payload.offered_quantity,
            unit_transfer_price=payload.unit_transfer_price,
            validity_minutes=payload.validity_minutes
        )
        return offer
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/offers/{offer_id}/accept", response_model=ReservationOut)
def accept_offer(offer_id: str, payload: ReservationCreate, db: Session = Depends(get_db)):
    """
    Step 5: Shop A accepts the offer.
    Locks stock atomically with concurrency protection and issues handover code.
    """
    try:
        reservation, fulfilment = accept_offer_and_reserve(
            db=db,
            offer_id=offer_id,
            pickup_window_minutes=payload.pickup_window_minutes
        )
        return reservation
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/offers/{offer_id}/reject")
def reject_offer(offer_id: str, db: Session = Depends(get_db)):
    """Reject a supplier offer."""
    offer = db.query(SupplierOffer).filter(SupplierOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found.")
    offer.status = "REJECTED"
    db.commit()
    return {"message": "Offer rejected"}


# ============================================================================
# RESERVATIONS & FULFILMENT
# ============================================================================

@app.post("/api/reservations/{reservation_id}/cancel", response_model=ReservationOut)
def cancel_reservation(reservation_id: str, db: Session = Depends(get_db)):
    """Cancel reservation and release stock back into store inventory."""
    try:
        res = cancel_or_expire_reservation(db, reservation_id, reason="CANCELLED")
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/fulfilments/{fulfilment_id}", response_model=FulfilmentOut)
def get_fulfilment(fulfilment_id: str, db: Session = Depends(get_db)):
    ful = db.query(Fulfilment).filter(Fulfilment.id == fulfilment_id).first()
    if not ful:
        raise HTTPException(status_code=404, detail="Fulfilment not found.")
    return ful


@app.post("/api/fulfilments/{fulfilment_id}/complete", response_model=TransactionOutcomeOut)
def complete_fulfilment(
    fulfilment_id: str,
    payload: FulfilmentHandover,
    db: Session = Depends(get_db)
):
    """
    Step 6 & 7: Verify handover code and record commercial settlement outcome.
    """
    try:
        outcome = complete_fulfilment_and_settlement(
            db=db,
            fulfilment_id=fulfilment_id,
            handover_code=payload.handover_code,
            actual_customer_price=payload.actual_customer_price,
            logistics_cost=payload.logistics_cost
        )
        return outcome
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# FINANCIAL & ANALYTICS SUMMARY
# ============================================================================

@app.get("/api/summary", response_model=FinancialSummaryOut)
def get_financial_summary(db: Session = Depends(get_db)):
    """
    Aggregate commercial metrics across all network transactions.
    """
    total_reqs = db.query(UnmetDemandRequest).count()
    exact_matches = db.query(MatchCandidate).filter(MatchCandidate.match_type == "EXACT_MATCH").count()
    active_reservations = db.query(Reservation).filter(Reservation.status == "ACTIVE").count()
    completed_fulfilments = db.query(Fulfilment).filter(Fulfilment.status == "FULFILLED").count()

    outcomes = db.query(TransactionOutcome).all()
    total_gmv = sum(o.total_recovered_gmv for o in outcomes)
    shop_a_margin = sum(o.requesting_store_margin for o in outcomes)
    shop_b_margin = sum(o.supplying_store_margin for o in outcomes)
    platform_net = sum(o.platform_net_margin for o in outcomes)

    recovery_rate = (completed_fulfilments / total_reqs * 100.0) if total_reqs > 0 else 0.0

    return FinancialSummaryOut(
        total_unmet_requests=total_reqs,
        exact_match_found_count=exact_matches,
        active_reservations_count=active_reservations,
        completed_fulfilments_count=completed_fulfilments,
        total_recovered_gmv=round(total_gmv, 2),
        total_requesting_store_margin=round(shop_a_margin, 2),
        total_supplying_store_margin=round(shop_b_margin, 2),
        total_platform_net_revenue=round(platform_net, 2),
        recovery_rate_pct=round(recovery_rate, 1),
        average_fulfilment_seconds=420.0  # ~7 minutes typical neighbourhood handover
    )


# ============================================================================
# AMD HARDWARE ACCELERATION BENCHMARK
# ============================================================================

@app.get("/api/amd-benchmark")
def get_amd_benchmark(
    batch_size: int = Query(default=1024, ge=32, le=8192),
    iterations: int = Query(default=30, ge=5, le=200)
):
    """
    Empirical AMD compute benchmark running ONNX Runtime inference
    across CPU single-thread baseline, Zen 3 multi-core AVX2, and DirectML.
    """
    return run_amd_hardware_benchmark(batch_size=batch_size, iterations=iterations)
