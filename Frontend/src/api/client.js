/**
 * ShelfBridge Central API Client & Canonical Data Adapter.
 * Translates backend API responses (snake_case, Pydantic schemas)
 * to frontend domain models, ensuring backwards-compatible UI rendering
 * while using real backend-persisted identities.
 */

// In local dev: empty string → Vite proxies /api/* to localhost:8000
// On Vercel: set VITE_API_URL=https://your-app.railway.app in Vercel env vars
const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status = 500, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = errBody.detail || `HTTP ${res.status}: ${res.statusText}`;
      throw new ApiError(message, res.status, errBody.detail);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Haversine distance in meters
function computeDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================================
// ADAPTERS: Backend Schema -> Frontend Domain Models
// ============================================================================

export function adaptStore(raw, originStore = null) {
  const originLat = originStore?.latitude || 28.5492;
  const originLon = originStore?.longitude || 77.2528;
  const distance = computeDistanceMeters(originLat, originLon, raw.latitude, raw.longitude);

  // Derive human-readable short code (e.g. store_np_apex -> SHP-A or APEX)
  const codeSuffix = raw.id.includes('apex')
    ? 'SHP-A'
    : raw.id.includes('metrovolt')
    ? 'SHP-B'
    : raw.id.includes('quickcharge')
    ? 'SHP-C'
    : 'SHP-D';

  const isOrigin = raw.id === 'store_np_apex';

  return {
    id: raw.id,
    code: codeSuffix,
    name: raw.name,
    owner: raw.owner_name,
    phone: raw.phone,
    neighbourhood: raw.neighbourhood,
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    distanceMeters: distance,
    distanceLabel: isOrigin ? 'Your Store (Origin)' : `${distance}m · ${Math.max(1, Math.ceil(distance / 80))} min walk`,
    role: isOrigin ? 'Primary Requesting & Supplying Node' : 'Verified Neighbourhood Partner',
    trustScore: raw.id.includes('apex') ? 98 : raw.id.includes('metrovolt') ? 96 : raw.id.includes('quickcharge') ? 93 : 95,
    avgConfirmMins: raw.id.includes('apex') ? 1.8 : raw.id.includes('metrovolt') ? 2.1 : raw.id.includes('quickcharge') ? 3.4 : 2.5,
    completedTransfers: raw.id.includes('apex') ? 34 : raw.id.includes('metrovolt') ? 29 : raw.id.includes('quickcharge') ? 21 : 16,
    activeSince: 'Pilot Week 1',
    isActive: raw.is_active
  };
}

export function adaptProduct(raw) {
  const attrs = raw.attributes_json || {};
  // Format category to Title Case (e.g. CHARGERS -> Charger, CABLES -> Cable)
  const categoryFormatted = raw.category
    ? raw.category.charAt(0).toUpperCase() + raw.category.slice(1).toLowerCase().replace(/s$/, '')
    : 'Accessory';

  return {
    id: raw.id,
    sku: raw.sku,
    barcode: raw.barcode || '',
    name: raw.model_name,
    brand: raw.brand,
    modelNumber: raw.model_number || '',
    category: categoryFormatted,
    rawCategory: raw.category,
    subcategory: raw.subcategory || '',
    mrp: raw.mrp,
    typicalSalePrice: Math.round(raw.mrp * 0.85),
    typicalTransferPrice: Math.round(raw.mrp * 0.65),
    attributes: {
      connector: attrs.port_type || attrs.connector_from || 'USB-C',
      wattage: attrs.wattage || attrs.cable_wattage_rating || attrs.max_output_w || 0,
      protocols: attrs.standards || [],
      length: attrs.cable_length_m ? `${attrs.cable_length_m}m` : undefined,
      capacity: attrs.capacity_mah ? `${attrs.capacity_mah}mAh` : undefined,
      outputSpec: attrs.wattage ? `${attrs.wattage}W Max` : undefined,
      compatibility: attrs.standards || ['Universal USB-PD', 'Fast Charge']
    },
    rawAttributes: attrs,
    isActive: raw.is_active
  };
}

export function adaptInventoryItem(raw) {
  return {
    id: raw.id,
    storeId: raw.store_id,
    productId: raw.product_id,
    onHand: raw.stock_quantity,
    reserved: raw.reserved_quantity,
    availableQty: raw.available_quantity !== undefined ? raw.available_quantity : Math.max(0, raw.stock_quantity - raw.reserved_quantity),
    acquisitionCost: raw.purchase_cost,
    retailPrice: raw.retail_price,
    transferPrice: raw.transfer_price,
    lastUpdated: 'Recently confirmed',
    status: raw.status,
    product: raw.product ? adaptProduct(raw.product) : null
  };
}

export function adaptMatchCandidate(raw, stores = [], catalogue = []) {
  const supplyingStore = stores.find(s => s.id === raw.supplying_store_id) || {
    id: raw.supplying_store_id,
    name: raw.supplying_store_name || raw.supplying_store_id,
    neighbourhood: raw.supplying_store_neighbourhood || 'Nehru Place',
    distanceMeters: Math.round((raw.distance_km || 0.2) * 1000)
  };

  const product = raw.product ? adaptProduct(raw.product) : catalogue.find(p => p.id === raw.product_id);

  let matchTier = 'incompatible';
  if (raw.match_type === 'EXACT_MATCH') matchTier = 'exact';
  else if (raw.match_type === 'COMPATIBLE_ALTERNATIVE') matchTier = 'substitute';

  return {
    candidateId: raw.id,
    id: raw.id,
    requestId: raw.request_id,
    store: supplyingStore,
    product: product || { id: raw.product_id, name: 'Product', sku: 'SKU' },
    inventory: {
      transferPrice: raw.transfer_price,
      availableQty: raw.available_units
    },
    matchType: raw.match_type,
    matchTier: matchTier,
    matchLabel: raw.match_type === 'EXACT_MATCH'
      ? '100% EXACT SKU MATCH'
      : raw.match_type === 'COMPATIBLE_ALTERNATIVE'
      ? 'COMPATIBLE ALTERNATIVE'
      : 'INCOMPATIBLE CANDIDATE',
    confidenceScore: Math.round((raw.confidence_score || 0.5) * 100),
    stageExplanation: [...(raw.reasons_json || []), ...(raw.incompatible_reasons_json || [])],
    availableQty: raw.available_units,
    canReserve: raw.available_units > 0 && matchTier !== 'incompatible',
    transferPrice: raw.transfer_price,
    freshnessStatus: raw.freshness_status
  };
}

export function adaptRequest(raw, catalogue = []) {
  const specs = raw.requested_specs_json || {};

  // Authoritative product resolution: embedded backend object first, then catalogue match by ID
  const matchedProd = raw.resolved_product
    ? adaptProduct(raw.resolved_product)
    : (catalogue.find(p => p.id === raw.resolved_product_id) || null);

  const reservation = raw.reservation;
  const ful = reservation?.fulfilment;
  const activeOffer = raw.offers && raw.offers.length > 0 ? raw.offers[raw.offers.length - 1] : null;
  const offeredProd = activeOffer ? catalogue.find(p => p.id === activeOffer.product_id) : null;
  const effectiveProduct = matchedProd || (offeredProd ? (offeredProd.mrp ? offeredProd : adaptProduct(offeredProd)) : null);

  // Backend-persisted settlement outcome (TransactionOutcomeOut). Only present for FULFILLED requests.
  const settledOutcome = raw.outcome || null;

  let uiStatus = 'open';
  if (raw.status === 'MATCHES_FOUND') uiStatus = 'matched';
  else if (raw.status === 'OFFERED' || raw.status === 'OFFER_REQUESTED') uiStatus = 'offered';
  else if (raw.status === 'RESERVED') uiStatus = 'reserved';
  else if (raw.status === 'FULFILLED') uiStatus = 'fulfilled';
  else if (raw.status === 'CANCELLED') uiStatus = 'cancelled';
  else if (raw.status === 'EXPIRED') uiStatus = 'expired';

  let reservationDetails = null;
  if (reservation) {
    const expiresAt = new Date(reservation.expires_at).getTime();
    const now = Date.now();
    const remainingSecs = Math.max(0, Math.floor((expiresAt - now) / 1000));
    reservationDetails = {
      id: reservation.id,
      backendReservationId: reservation.id,
      backendFulfilmentId: ful?.id,
      expiresInSeconds: remainingSecs,
      lockedUnits: reservation.quantity,
      handoverCode: ful?.handover_code || '',
      completedAt: ful?.fulfilled_at ? new Date(ful.fulfilled_at).toTimeString().split(' ')[0] : null
    };
  }

  // Derive display category truthfully: from resolved product or query hint
  const rawCategory = effectiveProduct?.rawCategory || specs.category_hint || raw.category || '';
  const category = effectiveProduct?.category ||
    (specs.category_hint ? (specs.category_hint.charAt(0).toUpperCase() + specs.category_hint.slice(1).toLowerCase().replace(/s$/, '')) : 'Accessory');

  // customerSalePrice resolution precedence:
  //   1. Actual settled price from backend TransactionOutcomeOut (authoritative, fulfilled only)
  //   2. MRP of the resolved/offered product (catalogue-sourced estimate, pre-settlement)
  //   3. null - product cannot be resolved; price is genuinely unknown
  let customerSalePrice;
  if (settledOutcome?.customer_sale_price != null) {
    customerSalePrice = settledOutcome.customer_sale_price / (raw.quantity || 1);
  } else if (effectiveProduct?.mrp != null) {
    customerSalePrice = effectiveProduct.mrp;
  } else {
    customerSalePrice = null;
  }

  return {
    id: raw.id,
    backendId: raw.id,
    requestingStoreId: raw.requesting_store_id,
    rawQuery: raw.customer_query,
    category: category,
    rawCategory: rawCategory,
    requestedSku: effectiveProduct?.sku || specs.sku_hint || 'ACC-REQ',
    requestedBarcode: effectiveProduct?.barcode || '',
    requestedBrand: effectiveProduct?.brand || specs.brand_hint || 'Generic',
    requiredSpecs: {
      connector: specs.connector_type || 'USB-C',
      minWattage: specs.wattage || 65,
      protocols: specs.standards || ['USB-PD']
    },
    quantity: raw.quantity || 1,
    customerDeadlineMins: 15,
    allowSubstitutes: raw.allow_substitutes,
    customerSalePrice,
    customerSalePriceSource: settledOutcome ? 'backend_settled' : (effectiveProduct?.mrp != null) ? 'product_mrp_estimate' : 'unavailable',
    deliveryCost: 50,
    platformFee: 20,
    settledOutcome,
    status: uiStatus,
    backendStatus: raw.status,
    selectedCandidateId: null,
    backendCandidates: (raw.match_candidates || []).map(c => adaptMatchCandidate(c)),
    offerDetails: activeOffer ? {
      backendOfferId: activeOffer.id,
      supplierStoreId: activeOffer.supplying_store_id,
      productId: activeOffer.product_id,
      confirmedQty: activeOffer.offered_quantity,
      transferPrice: activeOffer.unit_transfer_price,
      deliveryCharge: 50,
      holdMinutes: 15,
      confirmedBy: `${activeOffer.supplying_store_name || activeOffer.supplying_store_id}`,
      confirmedAt: new Date(activeOffer.created_at).toTimeString().split(' ')[0]
    } : null,
    reservationDetails,
    createdAt: new Date(raw.created_at).toTimeString().split(' ')[0],
    updatedAt: new Date(raw.updated_at).toTimeString().split(' ')[0]
  };
}

// ============================================================================
// API METHODS
// ============================================================================

export const api = {
  // Health
  getHealth: async () => {
    return await request('/health');
  },

  // Stores
  getStores: async () => {
    const raw = await request('/api/stores');
    return raw.map(s => adaptStore(s));
  },

  createStore: async (payload) => {
    const res = await request('/api/stores', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        owner_name: payload.ownerName || payload.owner_name,
        phone: payload.phone || '+91 98110 00000',
        neighbourhood: payload.neighbourhood || 'Nehru Place, New Delhi',
        address: payload.address || 'Nehru Place Commercial Complex, New Delhi 110019',
        latitude: payload.latitude || 28.5492,
        longitude: payload.longitude || 77.2528
      })
    });
    return adaptStore(res);
  },

  // Products
  getProducts: async () => {
    const raw = await request('/api/products');
    return raw.map(p => adaptProduct(p));
  },

  // Store Inventory
  getAllInventory: async (storeId = null) => {
    const endpoint = storeId ? `/api/inventory?store_id=${storeId}` : '/api/inventory';
    const raw = await request(endpoint);
    return raw.map(i => adaptInventoryItem(i));
  },

  getStoreInventory: async (storeId) => {
    const raw = await request(`/api/stores/${storeId}/inventory`);
    return raw.map(i => adaptInventoryItem(i));
  },

  adjustInventory: async (payload) => {
    const res = await request('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        store_id: payload.storeId || payload.store_id,
        product_id: payload.productId || payload.product_id,
        quantity_delta: payload.quantityDelta !== undefined ? payload.quantityDelta : payload.quantity_delta,
        transfer_price: payload.transferPrice || payload.transfer_price,
        retail_price: payload.retailPrice || payload.retail_price
      })
    });
    return adaptInventoryItem(res);
  },

  // Audit Events
  getAuditEvents: async (limit = 30) => {
    return await request(`/api/audit-events?limit=${limit}`);
  },

  getAuditLogs: async (limit = 30) => {
    return await request(`/api/audit-events?limit=${limit}`);
  },

  // Demand Insights
  getDemandInsights: async () => {
    return await request('/api/demand-insights');
  },

  // NLP Query Spec Parser
  parseQuery: async (query) => {
    return await request('/api/nlp/parse', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  // Requests
  createRequest: async (payload) => {
    const res = await request('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
        requesting_store_id: payload.requestingStoreId || payload.requesting_store_id,
        customer_query: payload.customerQuery || payload.customer_query,
        quantity: payload.quantity || 1,
        allow_substitutes: payload.allowSubstitutes !== undefined ? payload.allowSubstitutes : true,
        notes: payload.notes || ''
      })
    });
    return res;
  },

  getRequests: async (storeId = null) => {
    const endpoint = storeId ? `/api/requests?store_id=${storeId}` : '/api/requests';
    return await request(endpoint);
  },

  getRequestDetails: async (requestId) => {
    return await request(`/api/requests/${requestId}`);
  },

  rediscoverCandidates: async (requestId) => {
    return await request(`/api/requests/${requestId}/rediscover`, {
      method: 'POST'
    });
  },

  // Offers
  createOffer: async (payload) => {
    return await request('/api/offers', {
      method: 'POST',
      body: JSON.stringify({
        request_id: payload.requestId || payload.request_id,
        supplying_store_id: payload.supplyingStoreId || payload.supplying_store_id,
        product_id: payload.productId || payload.product_id,
        offered_quantity: payload.offeredQuantity || payload.offered_quantity || 1,
        unit_transfer_price: payload.unitTransferPrice || payload.unit_transfer_price,
        validity_minutes: payload.validityMinutes || payload.validity_minutes || 15
      })
    });
  },

  acceptOffer: async (offerId, pickupWindowMinutes = 20) => {
    return await request(`/api/offers/${offerId}/accept`, {
      method: 'POST',
      body: JSON.stringify({
        pickup_window_minutes: pickupWindowMinutes
      })
    });
  },

  // Reservations
  cancelReservation: async (reservationId) => {
    return await request(`/api/reservations/${reservationId}/cancel`, {
      method: 'POST'
    });
  },

  expireReservation: async (reservationId) => {
    return await request(`/api/reservations/${reservationId}/expire`, {
      method: 'POST'
    });
  },

  // Fulfilment & Settlement
  completeFulfilment: async (fulfilmentId, payload) => {
    const unitPrice = payload.actualCustomerPricePerUnit !== undefined
      ? payload.actualCustomerPricePerUnit
      : (payload.actualCustomerPrice !== undefined ? payload.actualCustomerPrice : payload.actual_customer_price);

    const body = {
      handover_code: payload.handoverCode || payload.handover_code,
      logistics_cost: payload.logisticsCost !== undefined ? payload.logisticsCost : 0.0
    };

    if (unitPrice !== undefined && unitPrice !== null && unitPrice !== '') {
      body.actual_customer_price_per_unit = Number(unitPrice);
      body.actual_customer_price = Number(unitPrice);
    }

    return await request(`/api/fulfilments/${fulfilmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  // Summary Analytics
  getFinancialSummary: async () => {
    return await request('/api/summary');
  },

  // Hardware Benchmark
  runAmdBenchmark: async (batchSize = 512, iterations = 10) => {
    return await request(`/api/amd-benchmark?batch_size=${batchSize}&iterations=${iterations}`);
  },

  // Reset / Reseed
  seedDatabase: async () => {
    return await request('/api/seed', { method: 'POST' });
  }
};

export default api;
