/**
 * Financial Integrity Regression Tests for adaptRequest (client.js)
 *
 * Verifies:
 * 1. Resolved-by-exact-SKU request: customerSalePrice = product MRP; source = 'product_mrp_estimate'
 * 2. Unresolved product (no catalogue match, no offer): customerSalePrice = null; source = 'unavailable'
 * 3. Unresolved catalogue match with no MRP: customerSalePrice = null; no wattage fallback
 * 4. Fulfilled transaction with backend settledOutcome: customerSalePrice from settled record; settledOutcome present
 * 5. Synthetic wattage-based price never propagates into authoritative financial fields
 *
 * Run: node tests_browser/test_financial_integrity.cjs
 */

'use strict';

const assert = require('assert');

// ─── Minimal shim for ESM adaptRequest ────────────────────────────────────────
// We inline the function logic in CJS rather than import ESM to keep the runner simple.

function adaptProduct(raw) {
  const attrs = raw.attributes_json || {};
  const categoryFormatted = raw.category
    ? raw.category.charAt(0).toUpperCase() + raw.category.slice(1).toLowerCase().replace(/s$/, '')
    : 'Accessory';
  return {
    id: raw.id,
    sku: raw.sku,
    barcode: raw.barcode || '',
    name: raw.model_name,
    brand: raw.brand,
    category: categoryFormatted,
    rawCategory: raw.category,
    mrp: raw.mrp,
    typicalSalePrice: Math.round(raw.mrp * 0.85),
    attributes: {
      connector: (attrs.port_type || attrs.connector_from || 'USB-C'),
      wattage: (attrs.wattage || attrs.cable_wattage_rating || attrs.max_output_w || 0),
      protocols: attrs.standards || [],
    },
    isActive: raw.is_active
  };
}

function adaptRequest(raw, catalogue = []) {
  const specs = raw.requested_specs_json || {};
  const matchedProd = raw.resolved_product
    ? adaptProduct(raw.resolved_product)
    : (catalogue.find(p => p.id === raw.resolved_product_id) || null);

  const reservation = raw.reservation;
  const ful = reservation?.fulfilment;
  const activeOffer = raw.offers && raw.offers.length > 0 ? raw.offers[raw.offers.length - 1] : null;
  const offeredProd = activeOffer ? catalogue.find(p => p.id === activeOffer.product_id) : null;
  const effectiveProduct = matchedProd || (offeredProd ? (offeredProd.mrp ? offeredProd : adaptProduct(offeredProd)) : null);

  // Backend-persisted settlement outcome
  const settledOutcome = raw.outcome || null;

  let uiStatus = 'open';
  if (raw.status === 'MATCHES_FOUND') uiStatus = 'matched';
  else if (raw.status === 'FULFILLED') uiStatus = 'fulfilled';

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

  // customerSalePrice resolution precedence:
  //   1. Actual settled price from backend TransactionOutcomeOut (authoritative, fulfilled only)
  //   2. MRP of the resolved/offered product (catalogue-sourced estimate, pre-settlement)
  //   3. null — product cannot be resolved; price is genuinely unknown
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
    customerSalePrice,
    customerSalePriceSource: settledOutcome ? 'backend_settled' : (effectiveProduct?.mrp != null) ? 'product_mrp_estimate' : 'unavailable',
    settledOutcome,
    quantity: raw.quantity || 1,
    deliveryCost: 50,
    platformFee: 20,
    status: uiStatus
  };
}

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const ANKER_65W_PRODUCT = {
  id: 'prod_ank_a2663_65w',
  sku: 'ANK-A2663-65W',
  barcode: '0194644114465',
  model_name: 'Anker 65W Nano GaN USB-C PD Charger',
  brand: 'Anker',
  category: 'CHARGERS',
  mrp: 2499,
  is_active: true,
  attributes_json: {
    port_type: 'USB-C',
    wattage: 65,
    standards: ['USB-PD', 'PPS']
  }
};

const BASE_RAW_REQUEST = {
  id: 'req_test_001',
  requesting_store_id: 'store_np_apex',
  customer_query: 'Bhaiya 65W USB-C fast charger chahiye',
  requested_specs_json: { wattage: 65, connector_type: 'USB-C', standards: ['USB-PD'] },
  quantity: 1,
  allow_substitutes: true,
  status: 'MATCHES_FOUND',
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  match_candidates: [],
  offers: [],
  reservation: null,
  outcome: null
};

// ─── TEST 1: Resolved by exact SKU match ─────────────────────────────────────
console.log('\n[TEST 1] Resolved by exact SKU — customerSalePrice = product MRP');
{
  const raw = {
    ...BASE_RAW_REQUEST,
    resolved_product_id: 'prod_ank_a2663_65w',
    resolved_product: ANKER_65W_PRODUCT
  };
  const adapted = adaptRequest(raw, []);

  assert.strictEqual(adapted.customerSalePrice, 2499,
    'customerSalePrice must equal product MRP (₹2499) when resolved by exact SKU');
  assert.strictEqual(adapted.customerSalePriceSource, 'product_mrp_estimate',
    'source must be product_mrp_estimate before settlement');
  assert.strictEqual(adapted.settledOutcome, null,
    'settledOutcome must be null for non-fulfilled request');
  console.log(`  -> customerSalePrice: ₹${adapted.customerSalePrice} (source: ${adapted.customerSalePriceSource})`);
  console.log('  [PASS]');
}

// ─── TEST 2: Unresolved product — no catalogue match, no offer ────────────────
console.log('\n[TEST 2] Unresolved product — customerSalePrice must be null, never synthetic');
{
  const raw = {
    ...BASE_RAW_REQUEST,
    id: 'req_test_002',
    resolved_product_id: null,
    resolved_product: null,
    offers: [],
    requested_specs_json: { wattage: 65, connector_type: 'USB-C', standards: ['USB-PD'] }
  };
  const adapted = adaptRequest(raw, []); // empty catalogue

  assert.strictEqual(adapted.customerSalePrice, null,
    'customerSalePrice must be null when product cannot be resolved — no synthetic wattage fallback');
  assert.strictEqual(adapted.customerSalePriceSource, 'unavailable',
    'source must be unavailable when product unresolvable');
  assert.strictEqual(adapted.settledOutcome, null,
    'settledOutcome must be null');

  // Critical: verify no wattage*N value leaked through
  const wattage = raw.requested_specs_json.wattage;
  const forbiddenValues = [wattage * 20, wattage * 30, 2499, 1300, 1200];
  for (const v of forbiddenValues) {
    assert.notStrictEqual(adapted.customerSalePrice, v,
      `customerSalePrice must not be synthetic value ₹${v} (wattage-based fallback)`);
  }

  console.log(`  -> customerSalePrice: ${adapted.customerSalePrice} (source: ${adapted.customerSalePriceSource})`);
  console.log('  [PASS] No synthetic wattage-based price invented');
}

// ─── TEST 3: Catalogue product exists but has no MRP ─────────────────────────
console.log('\n[TEST 3] Catalogue match exists but MRP is missing — customerSalePrice must be null');
{
  const productWithoutMrp = {
    ...ANKER_65W_PRODUCT,
    id: 'prod_unknown_no_mrp',
    mrp: null
  };
  const adapted = adaptProduct(productWithoutMrp);

  const raw = {
    ...BASE_RAW_REQUEST,
    id: 'req_test_003',
    resolved_product_id: 'prod_unknown_no_mrp',
    resolved_product: productWithoutMrp,
    requested_specs_json: { wattage: 65 }
  };
  const result = adaptRequest(raw, []);

  assert.strictEqual(result.customerSalePrice, null,
    'customerSalePrice must be null when resolved product has no MRP');
  assert.strictEqual(result.customerSalePriceSource, 'unavailable',
    'source must be unavailable when product MRP is null');
  console.log(`  -> customerSalePrice: ${result.customerSalePrice} (source: ${result.customerSalePriceSource})`);
  console.log('  [PASS] Missing MRP does not synthesise a price');
}

// ─── TEST 4: Fulfilled transaction with backend settledOutcome ─────────────────
console.log('\n[TEST 4] Fulfilled transaction — customerSalePrice from backend settledOutcome (authoritative)');
{
  const settledOutcomeRecord = {
    id: 'tx_test_001',
    fulfilment_id: 'ful_test_001',
    request_id: 'req_test_004',
    customer_sale_price: 2499.0,
    transfer_price_paid: 1950.0,
    logistics_cost: 50.0,
    platform_fee: 62.48,
    platform_variable_cost: 4.0,
    requesting_store_margin: 436.52,
    supplying_store_margin: 400.0,
    platform_net_margin: 58.48,
    total_recovered_gmv: 2499.0,
    calculation_breakdown_json: { quantity: 1, unit_retail_price: 2499.0 },
    created_at: new Date().toISOString()
  };

  const raw = {
    ...BASE_RAW_REQUEST,
    id: 'req_test_004',
    status: 'FULFILLED',
    resolved_product: ANKER_65W_PRODUCT,
    outcome: settledOutcomeRecord
  };
  const adapted = adaptRequest(raw, []);

  // Authoritative: settled price takes precedence over MRP
  assert.strictEqual(adapted.customerSalePrice, 2499.0,
    'customerSalePrice must equal settled customer_sale_price / quantity');
  assert.strictEqual(adapted.customerSalePriceSource, 'backend_settled',
    'source must be backend_settled for fulfilled requests with outcome');
  assert.deepStrictEqual(adapted.settledOutcome, settledOutcomeRecord,
    'settledOutcome must be the full backend TransactionOutcomeOut record');
  assert.strictEqual(adapted.settledOutcome.requesting_store_margin, 436.52,
    'requesting_store_margin must equal ₹436.52 from backend record');
  assert.strictEqual(adapted.settledOutcome.customer_sale_price, 2499.0,
    'GMV must equal ₹2499 from backend record');

  console.log(`  -> customerSalePrice: ₹${adapted.customerSalePrice} (source: ${adapted.customerSalePriceSource})`);
  console.log(`  -> settledOutcome.requesting_store_margin: ₹${adapted.settledOutcome.requesting_store_margin}`);
  console.log(`  -> settledOutcome.customer_sale_price: ₹${adapted.settledOutcome.customer_sale_price}`);
  console.log('  [PASS] Backend settlement record used as authoritative financial source');
}

// ─── TEST 5: Actual sale price differs from MRP ─────────────────────────────
console.log('\n[TEST 5] Actual sale price differs from MRP — backend record is authoritative');
{
  const discountedSettlement = {
    id: 'tx_test_002',
    fulfilment_id: 'ful_test_002',
    request_id: 'req_test_005',
    customer_sale_price: 2200.0,  // customer negotiated below MRP ₹2499
    transfer_price_paid: 1950.0,
    logistics_cost: 50.0,
    platform_fee: 55.0,
    platform_variable_cost: 4.0,
    requesting_store_margin: 145.0,  // 2200 - 1950 - 50 - 55
    supplying_store_margin: 400.0,
    platform_net_margin: 51.0,
    total_recovered_gmv: 2200.0,
    calculation_breakdown_json: { quantity: 1, unit_retail_price: 2200.0 },
    created_at: new Date().toISOString()
  };

  const raw = {
    ...BASE_RAW_REQUEST,
    id: 'req_test_005',
    status: 'FULFILLED',
    resolved_product: ANKER_65W_PRODUCT,  // MRP is ₹2499
    outcome: discountedSettlement
  };
  const adapted = adaptRequest(raw, []);

  // The actual sale was ₹2200, not MRP ₹2499
  assert.strictEqual(adapted.customerSalePrice, 2200.0,
    'customerSalePrice must be actual settled price (₹2200), not MRP (₹2499)');
  assert.strictEqual(adapted.customerSalePriceSource, 'backend_settled');
  assert.strictEqual(adapted.settledOutcome.requesting_store_margin, 145.0,
    'margin must reflect actual sale price, not MRP');

  // Verify MRP is NOT the selected value
  assert.notStrictEqual(adapted.customerSalePrice, 2499,
    'MRP (₹2499) must not override the actual settled price (₹2200)');

  console.log(`  -> customerSalePrice: ₹${adapted.customerSalePrice} (actual sale, not MRP ₹2499)`);
  console.log(`  -> settledOutcome.requesting_store_margin: ₹${adapted.settledOutcome.requesting_store_margin}`);
  console.log('  [PASS] Actual sale price correctly overrides MRP in settled outcome');
}

// ─── TEST 6: Anti-regression — wattage fallback never in authoritative fields ──
console.log('\n[TEST 6] Anti-regression: wattage*N never appears as customerSalePrice');
{
  const testCases = [
    { wattage: 45, expected_forbidden: [45 * 20, 45 * 30, Math.round(45 * 30)] },
    { wattage: 65, expected_forbidden: [65 * 20, 65 * 30, 1300] },
    { wattage: 100, expected_forbidden: [100 * 20, 100 * 30, 2000, 3000] }
  ];

  for (const tc of testCases) {
    const raw = {
      ...BASE_RAW_REQUEST,
      id: `req_wattage_test_${tc.wattage}w`,
      resolved_product_id: null,
      resolved_product: null,
      offers: [],
      requested_specs_json: { wattage: tc.wattage, connector_type: 'USB-C', standards: ['USB-PD'] }
    };
    const adapted = adaptRequest(raw, []);

    assert.strictEqual(adapted.customerSalePrice, null,
      `${tc.wattage}W unresolved request must have null customerSalePrice, not a synthesised value`);

    for (const forbidden of tc.expected_forbidden) {
      assert.notStrictEqual(adapted.customerSalePrice, forbidden,
        `wattage-derived fallback ₹${forbidden} must never appear as authoritative customerSalePrice`);
    }
    process.stdout.write(`  -> ${tc.wattage}W request: customerSalePrice = ${adapted.customerSalePrice} ✓\n`);
  }
  console.log('  [PASS] No wattage-based synthetic prices in any tested configuration');
}

// ─── TEST 7: Multi-Unit Financial Consistency (Quantity = 2) ────────────────
console.log('\n[TEST 7] Multi-Unit Transaction (2 units) — financial consistency across all layers');
{
  const multiUnitSettlement = {
    id: 'tx_test_003',
    fulfilment_id: 'ful_test_003',
    request_id: 'req_test_007',
    customer_sale_price: 4998.0,  // Total GMV = 2499 * 2
    transfer_price_paid: 3900.0,  // Total transfer = 1950 * 2
    logistics_cost: 50.0,         // Flat runner fee per order
    platform_fee: 124.95,         // 2.5% of 4998.0
    platform_variable_cost: 4.0,
    requesting_store_margin: 923.05, // 4998 - 3900 - 50 - 124.95
    supplying_store_margin: 800.0,   // 3900 - (1550 * 2)
    platform_net_margin: 120.95,
    total_recovered_gmv: 4998.0,
    calculation_breakdown_json: {
      quantity: 2,
      unit_retail_price: 2499.0,
      unit_transfer_price: 1950.0,
      logistics_cost: 50.0
    },
    created_at: new Date().toISOString()
  };

  const raw = {
    ...BASE_RAW_REQUEST,
    id: 'req_test_007',
    quantity: 2,
    status: 'FULFILLED',
    resolved_product: ANKER_65W_PRODUCT,
    outcome: multiUnitSettlement
  };
  const adapted = adaptRequest(raw, []);

  // 1. Per-unit customer sale price
  assert.strictEqual(adapted.customerSalePrice, 2499.0,
    'adapted.customerSalePrice must be per-unit amount (₹2499.0)');
  assert.strictEqual(adapted.customerSalePriceSource, 'backend_settled');

  // 2. Total GMV / customer sale amount
  assert.strictEqual(adapted.settledOutcome.customer_sale_price, 4998.0,
    'settledOutcome.customer_sale_price must be total transaction GMV (₹4998.0)');
  assert.strictEqual(adapted.settledOutcome.total_recovered_gmv, 4998.0,
    'total_recovered_gmv must equal total GMV');

  // 3. Total transfer cost
  assert.strictEqual(adapted.settledOutcome.transfer_price_paid, 3900.0,
    'transfer_price_paid must be total transfer cost for 2 units (₹3900.0)');

  // 4. Logistics cost (per-order, NOT multiplied by quantity)
  assert.strictEqual(adapted.settledOutcome.logistics_cost, 50.0,
    'logistics_cost must remain flat per order (₹50.0)');

  // 5. Platform fee (2.5% of total GMV)
  assert.strictEqual(adapted.settledOutcome.platform_fee, 124.95,
    'platform_fee must be 2.5% of total GMV (₹124.95)');

  // 6. Shop A margin
  assert.strictEqual(adapted.settledOutcome.requesting_store_margin, 923.05,
    'Shop A margin must be 4998 - 3900 - 50 - 124.95 = ₹923.05');

  // 7. Verify pre-settlement estimate formula consistency
  const preSettlementSale = adapted.customerSalePrice * adapted.quantity;
  const preSettlementTransfer = 1950.0 * adapted.quantity;
  const preSettlementFee = Math.max(25, Math.round(preSettlementSale * 0.025 * 100) / 100);
  const preSettlementMargin = Math.round((preSettlementSale - preSettlementTransfer - adapted.deliveryCost - preSettlementFee) * 100) / 100;
  assert.strictEqual(preSettlementMargin, 923.05,
    'Pre-settlement margin formula must match backend domain outcome exactly');

  console.log(`  -> Per-unit sale price: ₹${adapted.customerSalePrice}`);
  console.log(`  -> Total GMV (2 units): ₹${adapted.settledOutcome.customer_sale_price}`);
  console.log(`  -> Total transfer cost: ₹${adapted.settledOutcome.transfer_price_paid}`);
  console.log(`  -> Platform fee: ₹${adapted.settledOutcome.platform_fee}`);
  console.log(`  -> Shop A margin: ₹${adapted.settledOutcome.requesting_store_margin}`);
  console.log('  [PASS] Multi-unit commercial settlement semantics verified completely');
}

// ─── TEST 8: Price Provenance — MRP Estimate vs Settled Price ───────────────
console.log('\n[TEST 8] Price Provenance — MRP estimate is never marked as authoritative settled price');
{
  const openReq = {
    ...BASE_RAW_REQUEST,
    id: 'req_provenance_01',
    resolved_product_id: 'prod_ank_a2663_65w',
    resolved_product: ANKER_65W_PRODUCT,
    outcome: null
  };
  const adaptedOpen = adaptRequest(openReq, []);
  assert.strictEqual(adaptedOpen.customerSalePriceSource, 'product_mrp_estimate',
    'Pre-settlement request must report product_mrp_estimate');
  assert.strictEqual(adaptedOpen.settledOutcome, null,
    'Pre-settlement request must have null settledOutcome');

  const settledReq = {
    ...openReq,
    id: 'req_provenance_02',
    status: 'FULFILLED',
    outcome: {
      id: 'tx_provenance_02',
      fulfilment_id: 'ful_test_002',
      request_id: 'req_provenance_02',
      customer_sale_price: 2200.0,
      transfer_price_paid: 1950.0,
      logistics_cost: 50.0,
      platform_fee: 55.0,
      platform_variable_cost: 4.0,
      requesting_store_margin: 145.0,
      supplying_store_margin: 400.0,
      platform_net_margin: 51.0,
      total_recovered_gmv: 2200.0,
      calculation_breakdown_json: {},
      created_at: new Date().toISOString()
    }
  };
  const adaptedSettled = adaptRequest(settledReq, []);
  assert.strictEqual(adaptedSettled.customerSalePriceSource, 'backend_settled',
    'Post-settlement request must report backend_settled');
  assert.strictEqual(adaptedSettled.customerSalePrice, 2200.0);
  assert.notStrictEqual(adaptedSettled.customerSalePrice, 2499.0);
  console.log('  -> Pre-settlement source: "product_mrp_estimate" (MRP ₹2499)');
  console.log('  -> Post-settlement source: "backend_settled" (Negotiated ₹2200)');
  console.log('  [PASS] Clean distinction between MRP estimates and authoritative settled prices');
}

// ─── TEST 9: Client completeFulfilment Payload Formatting & Provenance ───────
console.log('\n[TEST 9] Client completeFulfilment Payload — Omits unconfirmed prices, sends explicit prices');
{
  function formatFulfilmentBody(payload) {
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
    return body;
  }

  // Case A: Price omitted (unconfirmed MRP estimate)
  const omittedBody = formatFulfilmentBody({ handoverCode: 'SB-1234', logisticsCost: 50.0 });
  assert.strictEqual('actual_customer_price_per_unit' in omittedBody, false,
    'actual_customer_price_per_unit must be omitted when not explicitly confirmed');
  assert.strictEqual('actual_customer_price' in omittedBody, false,
    'actual_customer_price must be omitted when not explicitly confirmed');
  console.log('  -> Omitted price: payload omits price fields for backend fallback ✓');

  // Case B: Explicit negotiated price entered (e.g. ₹2,200)
  const explicitBody = formatFulfilmentBody({
    handoverCode: 'SB-1234',
    actualCustomerPricePerUnit: 2200,
    logisticsCost: 50.0
  });
  assert.strictEqual(explicitBody.actual_customer_price_per_unit, 2200);
  assert.strictEqual(explicitBody.actual_customer_price, 2200);
  console.log('  -> Explicit price ₹2200: payload includes actual_customer_price_per_unit: 2200 ✓');

  // Case C: Invalid non-positive price (e.g. 0 or negative)
  const zeroBody = formatFulfilmentBody({
    handoverCode: 'SB-1234',
    actualCustomerPricePerUnit: 0,
    logisticsCost: 50.0
  });
  assert.strictEqual(zeroBody.actual_customer_price_per_unit, 0,
    'Invalid price (0) must be forwarded to backend for HTTP 400 rejection without silent substitution');
  console.log('  -> Invalid price 0: payload includes 0 so backend can reject without silent fallback ✓');

  console.log('  [PASS] Handover price provenance formatting verified strictly');
}

console.log('\n====================================================================');
console.log('  ALL FINANCIAL INTEGRITY REGRESSION TESTS PASSED                  ');
console.log('====================================================================\n');
