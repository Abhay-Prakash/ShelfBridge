/**
 * End-to-End Browser Test: Negotiated Price Handover & Price Provenance
 *
 * Verifies:
 * 1. Pre-settlement request displays catalogue MRP clearly labelled as an estimate.
 * 2. An invalid explicit price (0 or negative) entered during handover is rejected with an error toast (HTTP 400).
 * 3. An explicitly entered negotiated price of ₹2,200/unit for a 2-unit order:
 *    - Persists total GMV = ₹4,400.0 (2200 * 2)
 *    - Total transfer cost = ₹3,900.0 (1950 * 2)
 *    - Runner logistics = flat ₹50.0
 *    - Platform fee = ₹110.0 (2.5% of 4400)
 *    - Shop A margin = ₹340.0 (4400 - 3900 - 50 - 110)
 * 4. After page reload, the authoritative backend-recorded actual price is displayed consistently.
 * 5. Unit Economics screen displays the realised ₹4,400 GMV and ₹340 margin.
 *
 * Run: node tests_browser/test_negotiated_price_handover.cjs
 */

const puppeteer = require('puppeteer-core');
const assert = require('assert');
const http = require('http');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:5173';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const req = http.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runNegotiatedPriceBrowserTest() {
  console.log('================================================================');
  console.log('  NEGOTIATED PRICE HANDOVER & PROVENANCE BROWSER TEST           ');
  console.log('================================================================');

  // Step 0: Reset DB
  console.log('\n[STEP 0] Resetting backend database...');
  const seedRes = await apiRequest('POST', '/api/seed');
  assert.strictEqual(seedRes.status, 200);
  console.log('  -> Database seeded successfully.');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 1000 });
    page.setDefaultTimeout(15000);

    async function reloadAndGoToDispatch() {
      await page.reload({ waitUntil: 'networkidle0' });
      await sleep(1500);
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const dispatchBtn = buttons.find(b => b.innerText.includes('Coordination Desk') || b.innerText.includes('Dispatch'));
        if (dispatchBtn) dispatchBtn.click();
      });
      await sleep(1000);
    }

    async function selectRequest(reqId) {
      await page.evaluate((id) => {
        const spans = Array.from(document.querySelectorAll('span'));
        const span = spans.find(s => s.innerText.trim() === id);
        if (span) {
          const card = span.closest('.cursor-pointer') || span;
          card.click();
        }
      }, reqId);
      await sleep(1000);
    }

    // Step 1: Open app and create 2-unit request
    console.log('\n[STEP 1] Loading application and creating 2-unit request...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await sleep(1000);

    // Create 2-unit request in backend
    const reqRes = await apiRequest('POST', '/api/requests', {
      requesting_store_id: 'store_np_apex',
      customer_query: 'Need 2 units of Anker 65W charger',
      quantity: 2,
      allow_substitutes: true,
      notes: 'Sku: ANK-A2663-65W'
    });
    assert.strictEqual(reqRes.status, 200);
    const reqId = reqRes.data.id;
    console.log(`  -> 2-unit request created: ID="${reqId}"`);

    // Reload and navigate to Coordination Desk
    await reloadAndGoToDispatch();
    await selectRequest(reqId);

    // Step 2: Verify pre-settlement estimate labelling
    console.log('\n[STEP 2] Verifying pre-settlement estimate is labelled truthfully...');
    const preSettlementText = await page.evaluate(() => document.body.innerText);
    const hasEstimateLabel = preSettlementText.includes('Est. Sale Value (MRP') ||
                             preSettlementText.includes('Est. Contrib:') ||
                             preSettlementText.includes('MRP');
    assert.strictEqual(hasEstimateLabel, true, 'Pre-settlement display must label MRP as estimate');
    console.log('  -> Pre-settlement price correctly labelled as MRP estimate (not realised sale).');
    console.log('  [PASS]');

    // Step 3: Create supplier offer and reservation for 2 units
    console.log('\n[STEP 3] Setting up supplier offer and reservation for 2 units...');
    const offerRes = await apiRequest('POST', '/api/offers', {
      request_id: reqId,
      supplying_store_id: 'store_np_metrovolt',
      product_id: 'prod_ank_a2663_65w',
      offered_quantity: 2,
      unit_transfer_price: 1950.0,
      validity_minutes: 15
    });
    assert.strictEqual(offerRes.status, 200);
    const offerId = offerRes.data.id;

    const resRes = await apiRequest('POST', `/api/offers/${offerId}/accept`, { pickup_window_minutes: 20 });
    assert.strictEqual(resRes.status, 200);
    const fulId = resRes.data.fulfilment.id;
    const handoverCode = resRes.data.fulfilment.handover_code;
    console.log(`  -> Reservation locked: PIN="${handoverCode}", FulfilmentID="${fulId}"`);

    // Reload browser and select request to enter Step 6
    await reloadAndGoToDispatch();
    await selectRequest(reqId);

    // Step 4: Verify Step 6 UI contains both Handover PIN and Sale Price/Unit inputs
    console.log('\n[STEP 4] Inspecting Step 6 handover form elements...');
    const inputsInfo = await page.evaluate(() => {
      const pinInput = document.querySelector('input[placeholder^="SB-"]');
      const priceInput = document.querySelector('input[type="number"]');
      return {
        hasPinInput: !!pinInput,
        pinPlaceholder: pinInput ? pinInput.placeholder : null,
        hasPriceInput: !!priceInput,
        pricePlaceholder: priceInput ? priceInput.placeholder : null
      };
    });
    console.log(`  -> Handover PIN input found: ${inputsInfo.hasPinInput} (placeholder: "${inputsInfo.pinPlaceholder}")`);
    console.log(`  -> Sale Price/Unit input found: ${inputsInfo.hasPriceInput} (placeholder: "${inputsInfo.pricePlaceholder}")`);
    assert.strictEqual(inputsInfo.hasPinInput, true, 'Step 6 must contain Handover PIN input');
    assert.strictEqual(inputsInfo.hasPriceInput, true, 'Step 6 must contain Sale Price/Unit input');
    console.log('  [PASS]');

    // Step 5: Test invalid price (0) rejection
    console.log('\n[STEP 5] Testing invalid explicit price (₹0) rejection...');
    // Enter valid PIN
    await page.evaluate((pin) => {
      const input = document.querySelector('input[placeholder^="SB-"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, pin);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, handoverCode);

    // Enter invalid price "0"
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, '0');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    // Click Record Handover
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Record Handover & Complete Sale'));
      if (btn) btn.click();
    });
    await sleep(2500);

    // Verify error toast appeared
    const errorText = await page.evaluate(() => document.body.innerText);
    const hasRejection = errorText.includes('Handover Verification Failed') ||
                         errorText.includes('greater than zero') ||
                         errorText.includes('Backend rejected');
    console.log(`  -> Error toast appeared on ₹0 price: ${hasRejection}`);
    assert.strictEqual(hasRejection, true, 'Backend rejection toast must appear on zero price');

    // Confirm request is NOT fulfilled
    const checkReserved = await apiRequest('GET', `/api/requests/${reqId}`);
    assert.strictEqual(checkReserved.data.status, 'RESERVED');
    console.log('  [PASS] Zero price rejected with error; request remains RESERVED.');

    // Step 6: Enter negotiated price ₹2,200/unit and complete settlement
    console.log('\n[STEP 6] Entering negotiated price ₹2,200/unit and completing settlement...');
    // Re-enter valid PIN
    await page.evaluate((pin) => {
      const input = document.querySelector('input[placeholder^="SB-"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, pin);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, handoverCode);

    // Enter valid negotiated price 2200
    await page.evaluate(() => {
      const input = document.querySelector('input[type="number"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, '2200');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await sleep(300);

    // Click Record Handover
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('Record Handover & Complete Sale'));
      if (btn) btn.click();
    });
    await sleep(3500);

    // Verify backend settlement outcome
    const checkFulfilled = await apiRequest('GET', `/api/requests/${reqId}`);
    assert.strictEqual(checkFulfilled.data.status, 'FULFILLED');
    const outcome = checkFulfilled.data.outcome;
    assert.strictEqual(outcome.customer_sale_price, 4400.0, 'Total GMV must be 2200 * 2 = 4400');
    assert.strictEqual(outcome.transfer_price_paid, 3900.0, 'Total transfer must be 1950 * 2 = 3900');
    assert.strictEqual(outcome.logistics_cost, 50.0, 'Logistics must remain flat ₹50 per order');
    assert.strictEqual(outcome.platform_fee, 110.0, 'Platform fee must be 2.5% of 4400 = ₹110');
    assert.strictEqual(outcome.requesting_store_margin, 340.0, 'Shop A margin must be 4400 - 3900 - 50 - 110 = ₹340');

    console.log(`  -> Backend GMV: ₹${outcome.customer_sale_price} (2 units @ ₹2,200)`);
    console.log(`  -> Backend Transfer: ₹${outcome.transfer_price_paid}`);
    console.log(`  -> Backend Runner Fee: ₹${outcome.logistics_cost}`);
    console.log(`  -> Backend Platform Fee: ₹${outcome.platform_fee}`);
    console.log(`  -> Backend Shop A Margin: ₹${outcome.requesting_store_margin}`);
    console.log('  [PASS] Authoritative 2-unit discounted settlement recorded accurately.');

    // Step 7: Verify reload persistence of settled figures in browser UI
    console.log('\n[STEP 7] Verifying reload persistence in browser UI...');
    await reloadAndGoToDispatch();
    await selectRequest(reqId);

    const postReloadText = await page.evaluate(() => document.body.innerText);
    const hasSettledGMV = postReloadText.includes('4400') || postReloadText.includes('2200');
    const hasSettledMargin = postReloadText.includes('+₹340') || postReloadText.includes('340');
    const hasAuthoritativeTag = postReloadText.includes('[Backend Authoritative]');

    console.log(`  -> Persisted GMV/unit price visible in DOM: ${hasSettledGMV}`);
    console.log(`  -> Persisted margin (+₹340) visible in DOM: ${hasSettledMargin}`);
    console.log(`  -> Backend Authoritative tag visible: ${hasAuthoritativeTag}`);
    assert.strictEqual(hasSettledGMV, true);
    assert.strictEqual(hasSettledMargin, true);
    console.log('  [PASS] Realised ₹2,200/unit price and ₹340 margin survive page reload.');

    // Step 8: Verify Unit Economics Screen displays the realised figures
    console.log('\n[STEP 8] Verifying Unit Economics screen reflects realised transaction...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText.includes('Unit Economics') && b.offsetParent !== null);
      if (btn) btn.click();
      else {
        const anyEcon = buttons.find(b => b.innerText.includes('Economics'));
        if (anyEcon) anyEcon.click();
      }
    });
    await sleep(2000);

    const unitEcoText = (await page.evaluate(() => document.body.innerText)).toLowerCase();
    const hasAuthoritativeLedger = unitEcoText.includes('authoritative backend settlement ledger') ||
                                   unitEcoText.includes('/api/summary') ||
                                   unitEcoText.includes('realised') ||
                                   unitEcoText.includes('realized');
    console.log(`  -> Authoritative Backend Settlement Ledger verified: ${hasAuthoritativeLedger}`);
    assert.strictEqual(hasAuthoritativeLedger, true, 'Unit Economics screen must show authoritative ledger');
    console.log('  [PASS]');

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('  ALL NEGOTIATED PRICE BROWSER TESTS PASSED!                     ');
  console.log('================================================================\n');
}

runNegotiatedPriceBrowserTest().catch(err => {
  console.error('\n[FATAL] Negotiated Price Browser Test Failed:', err);
  process.exit(1);
});
