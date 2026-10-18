"""
ShelfBridge Relational Domain Models.
Implements the core neighbourhood-level inventory and transaction coordination schema.
"""

import datetime
import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from backend.database import Base


def generate_id(prefix: str) -> str:
    """Generate a clean prefix-based unique identifier."""
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


class Store(Base):
    __tablename__ = "stores"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("store"))
    name = Column(String(150), nullable=False)
    owner_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    neighbourhood = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    inventory_items = relationship("InventoryItem", back_populates="store", cascade="all, delete-orphan")
    requests = relationship("UnmetDemandRequest", back_populates="requesting_store", foreign_keys="UnmetDemandRequest.requesting_store_id")


class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("prod"))
    sku = Column(String(50), unique=True, nullable=False, index=True)
    barcode = Column(String(50), unique=True, nullable=True, index=True)
    brand = Column(String(100), nullable=False, index=True)
    model_name = Column(String(150), nullable=False)
    model_number = Column(String(100), nullable=True, index=True)
    category = Column(String(50), nullable=False, index=True)  # CHARGERS, CABLES, POWER_BANKS, AUDIO
    subcategory = Column(String(50), nullable=True)
    mrp = Column(Float, nullable=False)  # Maximum Retail Price in INR
    attributes_json = Column(JSON, default=dict)  # Technical electrical specifications
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inventory_items = relationship("InventoryItem", back_populates="product")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("inv"))
    store_id = Column(String(50), ForeignKey("stores.id"), nullable=False, index=True)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False, index=True)
    stock_quantity = Column(Integer, nullable=False, default=0)
    reserved_quantity = Column(Integer, nullable=False, default=0)
    purchase_cost = Column(Float, nullable=False)   # Store's cost price in INR
    retail_price = Column(Float, nullable=False)    # Standard shelf selling price in INR
    transfer_price = Column(Float, nullable=False)  # Baseline wholesale transfer price to peer stores
    last_confirmed_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(30), default="ACTIVE")   # ACTIVE, STALE, OUT_OF_STOCK

    store = relationship("Store", back_populates="inventory_items")
    product = relationship("Product", back_populates="inventory_items")
    reservations = relationship("Reservation", back_populates="inventory_item")

    @property
    def available_quantity(self) -> int:
        return max(0, self.stock_quantity - self.reserved_quantity)


class UnmetDemandRequest(Base):
    __tablename__ = "unmet_demand_requests"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("req"))
    requesting_store_id = Column(String(50), ForeignKey("stores.id"), nullable=False, index=True)
    customer_query = Column(String(255), nullable=False)
    resolved_product_id = Column(String(50), ForeignKey("products.id"), nullable=True)
    requested_specs_json = Column(JSON, default=dict)
    quantity = Column(Integer, default=1, nullable=False)
    allow_substitutes = Column(Boolean, default=True)
    # Status: OPEN, MATCHES_FOUND, OFFER_REQUESTED, OFFERED, RESERVED, FULFILLED, CANCELLED, EXPIRED, UNFULFILLED
    status = Column(String(30), default="OPEN", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    requesting_store = relationship("Store", back_populates="requests", foreign_keys=[requesting_store_id])
    resolved_product = relationship("Product", foreign_keys=[resolved_product_id])
    match_candidates = relationship("MatchCandidate", back_populates="request", cascade="all, delete-orphan")
    offers = relationship("SupplierOffer", back_populates="request", cascade="all, delete-orphan")
    reservation = relationship("Reservation", back_populates="request", uselist=False)
    outcome = relationship("TransactionOutcome", back_populates="request", uselist=False)


class MatchCandidate(Base):
    __tablename__ = "match_candidates"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("match"))
    request_id = Column(String(50), ForeignKey("unmet_demand_requests.id"), nullable=False, index=True)
    supplying_store_id = Column(String(50), ForeignKey("stores.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    # Match type: EXACT_MATCH, COMPATIBLE_ALTERNATIVE, POTENTIAL_REQUIRES_CONFIRMATION, INCOMPATIBLE
    match_type = Column(String(40), nullable=False, index=True)
    confidence_score = Column(Float, nullable=False)
    reasons_json = Column(JSON, default=list)            # Positive match explanations
    incompatible_reasons_json = Column(JSON, default=list) # Critical electrical or spec warnings
    available_units = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    transfer_price = Column(Float, nullable=False)
    freshness_status = Column(String(30), default="FRESH")  # FRESH, AGED, STALE
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("UnmetDemandRequest", back_populates="match_candidates")
    supplying_store = relationship("Store")
    product = relationship("Product")


class SupplierOffer(Base):
    __tablename__ = "supplier_offers"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("off"))
    request_id = Column(String(50), ForeignKey("unmet_demand_requests.id"), nullable=False, index=True)
    supplying_store_id = Column(String(50), ForeignKey("stores.id"), nullable=False)
    product_id = Column(String(50), ForeignKey("products.id"), nullable=False)
    offered_quantity = Column(Integer, nullable=False, default=1)
    unit_transfer_price = Column(Float, nullable=False)
    # Status: PENDING, ACCEPTED, REJECTED, EXPIRED
    status = Column(String(30), default="PENDING", index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("UnmetDemandRequest", back_populates="offers")
    supplying_store = relationship("Store")
    product = relationship("Product")
    reservation = relationship("Reservation", back_populates="offer", uselist=False)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("res"))
    offer_id = Column(String(50), ForeignKey("supplier_offers.id"), nullable=False, unique=True)
    request_id = Column(String(50), ForeignKey("unmet_demand_requests.id"), nullable=False, unique=True)
    inventory_id = Column(String(50), ForeignKey("inventory_items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    reserved_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    # Status: ACTIVE, FULFILLED, CANCELLED, EXPIRED
    status = Column(String(30), default="ACTIVE", index=True)

    offer = relationship("SupplierOffer", back_populates="reservation")
    request = relationship("UnmetDemandRequest", back_populates="reservation")
    inventory_item = relationship("InventoryItem", back_populates="reservations")
    fulfilment = relationship("Fulfilment", back_populates="reservation", uselist=False)


class Fulfilment(Base):
    __tablename__ = "fulfilments"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("ful"))
    reservation_id = Column(String(50), ForeignKey("reservations.id"), nullable=False, unique=True)
    request_id = Column(String(50), ForeignKey("unmet_demand_requests.id"), nullable=False)
    fulfilment_type = Column(String(40), default="STORE_TO_STORE_TRANSFER")
    handover_code = Column(String(10), nullable=False)  # e.g. "SB-4819"
    ready_at = Column(DateTime, default=datetime.datetime.utcnow)
    fulfilled_at = Column(DateTime, nullable=True)
    # Status: READY_FOR_PICKUP, FULFILLED, CANCELLED
    status = Column(String(30), default="READY_FOR_PICKUP", index=True)

    reservation = relationship("Reservation", back_populates="fulfilment")
    outcome = relationship("TransactionOutcome", back_populates="fulfilment", uselist=False)


class TransactionOutcome(Base):
    __tablename__ = "transaction_outcomes"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("tx"))
    fulfilment_id = Column(String(50), ForeignKey("fulfilments.id"), nullable=False, unique=True)
    request_id = Column(String(50), ForeignKey("unmet_demand_requests.id"), nullable=False, unique=True)
    customer_sale_price = Column(Float, nullable=False)      # What customer paid to Shop A
    transfer_price_paid = Column(Float, nullable=False)      # Paid to Shop B
    logistics_cost = Column(Float, nullable=False, default=0.0) # Local runner/handling fee
    platform_fee = Column(Float, nullable=False)            # ShelfBridge coordination fee
    platform_variable_cost = Column(Float, nullable=False, default=3.0) # SMS/infra cost
    
    # Financial Contributions
    requesting_store_margin = Column(Float, nullable=False)  # Shop A net contribution
    supplying_store_margin = Column(Float, nullable=False)   # Shop B net contribution
    platform_net_margin = Column(Float, nullable=False)      # ShelfBridge net margin
    total_recovered_gmv = Column(Float, nullable=False)      # Gross recovered value
    calculation_breakdown_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    fulfilment = relationship("Fulfilment", back_populates="outcome")
    request = relationship("UnmetDemandRequest", back_populates="outcome")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(50), primary_key=True, default=lambda: generate_id("evt"))
    event_type = Column(String(50), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False)
    actor_store_id = Column(String(50), nullable=True)
    payload_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
