"""
Pydantic Request and Response Schemas for ShelfBridge API.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import datetime


class StoreCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    owner_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(default="+91 98110 00000", max_length=25)
    neighbourhood: str = Field(..., min_length=2, max_length=100)
    address: str = Field(default="Nehru Place Commercial Complex, New Delhi 110019", max_length=255)
    latitude: float = Field(default=28.5492)
    longitude: float = Field(default=77.2528)


class InventoryUpdate(BaseModel):
    store_id: str
    product_id: str
    quantity_delta: int = Field(..., description="Units to add or remove (e.g. +2 or -1)")
    transfer_price: Optional[float] = None
    retail_price: Optional[float] = None


class StoreOut(BaseModel):
    id: str
    name: str
    owner_name: str
    phone: str
    neighbourhood: str
    address: str
    latitude: float
    longitude: float
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: str
    sku: str
    barcode: Optional[str] = None
    brand: str
    model_name: str
    model_number: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    mrp: float
    attributes_json: Dict[str, Any]
    is_active: bool

    class Config:
        from_attributes = True


class InventoryItemOut(BaseModel):
    id: str
    store_id: str
    product_id: str
    stock_quantity: int
    reserved_quantity: int
    available_quantity: int
    purchase_cost: float
    retail_price: float
    transfer_price: float
    last_confirmed_at: datetime.datetime
    status: str
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class UnmetDemandCreate(BaseModel):
    requesting_store_id: str
    customer_query: str
    quantity: int = Field(default=1, ge=1)
    allow_substitutes: bool = True
    customer_budget: Optional[float] = None
    notes: Optional[str] = None


class MatchCandidateOut(BaseModel):
    id: str
    request_id: str
    supplying_store_id: str
    supplying_store_name: Optional[str] = None
    supplying_store_neighbourhood: Optional[str] = None
    product_id: str
    product: Optional[ProductOut] = None
    match_type: str  # EXACT_MATCH, COMPATIBLE_ALTERNATIVE, POTENTIAL_REQUIRES_CONFIRMATION, INCOMPATIBLE
    confidence_score: float
    reasons_json: List[str]
    incompatible_reasons_json: List[str]
    available_units: int
    distance_km: float
    transfer_price: float
    freshness_status: str

    class Config:
        from_attributes = True


class SupplierOfferCreate(BaseModel):
    request_id: str
    supplying_store_id: str
    product_id: str
    offered_quantity: int = Field(default=1, ge=1)
    unit_transfer_price: float
    validity_minutes: int = Field(default=15, ge=1, le=120)


class SupplierOfferOut(BaseModel):
    id: str
    request_id: str
    supplying_store_id: str
    supplying_store_name: Optional[str] = None
    product_id: str
    product: Optional[ProductOut] = None
    offered_quantity: int
    unit_transfer_price: float
    status: str
    expires_at: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ReservationCreate(BaseModel):
    offer_id: Optional[str] = None
    pickup_window_minutes: int = Field(default=20, ge=5, le=120)



class ReservationOut(BaseModel):
    id: str
    offer_id: str
    request_id: str
    inventory_id: str
    quantity: int
    reserved_at: datetime.datetime
    expires_at: datetime.datetime
    status: str
    fulfilment: Optional["FulfilmentOut"] = None

    class Config:
        from_attributes = True



class FulfilmentHandover(BaseModel):
    handover_code: str
    actual_customer_price_per_unit: Optional[float] = Field(
        default=None,
        description="Agreed per-unit customer sale price in INR. Multiplied by quantity to determine total GMV."
    )
    actual_customer_price: Optional[float] = Field(
        default=None,
        description="Legacy alias for actual_customer_price_per_unit. Permitted for backwards compatibility."
    )
    logistics_cost: float = Field(
        default=30.0,
        ge=0.0,
        description="Flat per-order runner/delivery fee (not multiplied by quantity)."
    )

    def get_actual_unit_price(self) -> Optional[float]:
        """
        Resolves unambiguous per-unit price:
        - If both are supplied and differ, raises ValueError (HTTP 400).
        - If both are supplied and agree, returns the agreed price.
        - If only one is supplied, returns that price.
        - If neither is supplied, returns None for documented MRP fallback.
        """
        if self.actual_customer_price_per_unit is not None and self.actual_customer_price is not None:
            if abs(self.actual_customer_price_per_unit - self.actual_customer_price) > 0.001:
                raise ValueError(
                    f"Conflicting price fields supplied: actual_customer_price_per_unit ({self.actual_customer_price_per_unit}) "
                    f"and legacy actual_customer_price ({self.actual_customer_price}) do not match."
                )
            return self.actual_customer_price_per_unit

        if self.actual_customer_price_per_unit is not None:
            return self.actual_customer_price_per_unit

        return self.actual_customer_price


class TransactionOutcomeOut(BaseModel):
    id: str
    fulfilment_id: str
    request_id: str
    customer_sale_price: float
    transfer_price_paid: float
    logistics_cost: float
    platform_fee: float
    platform_variable_cost: float
    requesting_store_margin: float
    supplying_store_margin: float
    platform_net_margin: float
    total_recovered_gmv: float
    calculation_breakdown_json: Dict[str, Any]
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class FulfilmentOut(BaseModel):
    id: str
    reservation_id: str
    request_id: str
    fulfilment_type: str
    handover_code: str
    ready_at: datetime.datetime
    fulfilled_at: Optional[datetime.datetime] = None
    status: str
    outcome: Optional[TransactionOutcomeOut] = None

    class Config:
        from_attributes = True


class UnmetDemandOut(BaseModel):
    id: str
    requesting_store_id: str
    requesting_store_name: Optional[str] = None
    customer_query: str
    resolved_product_id: Optional[str] = None
    resolved_product: Optional[ProductOut] = None
    requested_specs_json: Dict[str, Any]
    quantity: int
    allow_substitutes: bool
    status: str
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    match_candidates: List[MatchCandidateOut] = []
    offers: List[SupplierOfferOut] = []
    reservation: Optional[ReservationOut] = None
    outcome: Optional[TransactionOutcomeOut] = None

    class Config:
        from_attributes = True


class FinancialSummaryOut(BaseModel):
    total_unmet_requests: int
    exact_match_found_count: int
    active_reservations_count: int
    completed_fulfilments_count: int
    total_recovered_gmv: float
    total_requesting_store_margin: float
    total_supplying_store_margin: float
    total_platform_net_revenue: float
    recovery_rate_pct: float
    average_fulfilment_seconds: float


ReservationOut.model_rebuild()
UnmetDemandOut.model_rebuild()
