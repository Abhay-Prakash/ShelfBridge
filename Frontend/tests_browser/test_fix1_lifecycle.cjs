const puppeteer = require('puppeteer-core');
const assert = require('assert');

const FRONTEND_URL = 'http://localhost:5174';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runFix1LifecycleTest() {
  console.log('================================================================');
  console.log('  FIX 1 AUTOMATED LIFECYCLE TEST: Loading, Empty, Failure, Retry');
  console.log('================================================================');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Successful Response — Backend Data Displayed
    // -------------------------------------------------------------------------
    console.log('\n[TEST 1] Verifying successful load populates live backend data...');
    const page = await browser.newPage();
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });

    // Navigate to Store Network tab
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Store Network'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify stores from database are rendered
    const hasApex = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).some(h => h.textContent.includes('Apex Mobile & Tech'));
    });
    console.log(`  -> Apex Mobile & Tech card visible: ${hasApex}`);
    assert.strictEqual(hasApex, true, 'Apex Mobile & Tech card must be visible');
    console.log('  [PASS] Live backend records successfully displayed in Store Network.');
    await page.close();

    // -------------------------------------------------------------------------
    // TEST 2: API Failure & Error Banner Display (No Mock Fallback)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Verifying API failure shows error banner with retry option (NO mock fallback)...');
    const failingPage = await browser.newPage();
    await failingPage.setRequestInterception(true);

    let failApi = true;
    failingPage.on('request', req => {
      if (failApi && req.url().includes('/api/stores')) {
        req.respond({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Simulated backend database unavailable' })
        });
      } else {
        req.continue();
      }
    });

    await failingPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Verify global connection error banner is present
    const hasErrorBanner = await failingPage.evaluate(() => {
      return document.body.textContent.includes('Backend Connection Issue');
    });
    console.log(`  -> Global backend connection error banner visible: ${hasErrorBanner}`);
    assert.strictEqual(hasErrorBanner, true, 'Error banner must be shown on API failure');

    // Verify Retry button is present
    const hasRetryBtn = await failingPage.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Retry Connection'));
    });
    console.log(`  -> "Retry Connection" button visible: ${hasRetryBtn}`);
    assert.strictEqual(hasRetryBtn, true, 'Retry button must be visible');

    // Navigate to network tab and confirm it shows error state, NOT mock stores
    await failingPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Store Network'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const hasStoreErrorBanner = await failingPage.evaluate(() => {
      return document.body.textContent.includes('Failed to load partner stores');
    });
    console.log(`  -> Network tab specific error banner visible: ${hasStoreErrorBanner}`);
    assert.strictEqual(hasStoreErrorBanner, true, 'Network tab must show error state on failure');

    // Confirm that simulated mock stores are NOT shown
    const mockStoreCount = await failingPage.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).filter(h => h.textContent.includes('Apex Mobile & Tech (Simulated)')).length;
    });
    console.log(`  -> Mock stores rendered during failure: ${mockStoreCount} (must be 0)`);
    assert.strictEqual(mockStoreCount, 0, 'Mock store data must NEVER be displayed during API failure');
    console.log('  [PASS] API failure communicates error cleanly without substituting sample mock data.');

    // -------------------------------------------------------------------------
    // TEST 3: Retry Behaviour — Restoring Backend Connection
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Verifying retry button recovers state after API restores...');
    failApi = false; // Allow API requests to succeed now

    await failingPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Retry Connection') || b.textContent.includes('Retry'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    // Error banner should disappear
    const errorBannerAfter = await failingPage.evaluate(() => {
      return document.body.textContent.includes('Backend Connection Issue');
    });
    console.log(`  -> Error banner after retry: ${errorBannerAfter} (must be false)`);
    assert.strictEqual(errorBannerAfter, false, 'Error banner must clear after successful retry');

    // Live store card should now be visible
    const storeVisibleAfter = await failingPage.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).some(h => h.textContent.includes('Apex Mobile & Tech'));
    });
    console.log(`  -> Live store card visible after retry: ${storeVisibleAfter}`);
    assert.strictEqual(storeVisibleAfter, true, 'Live store data must be visible after retry');
    console.log('  [PASS] Retrying after API failure successfully restores data.');

    await failingPage.close();

    // -------------------------------------------------------------------------
    // TEST 4: Empty Successful Response — Legitimate Empty State
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Verifying empty API response displays legitimate empty state...');
    const emptyPage = await browser.newPage();
    await emptyPage.setRequestInterception(true);
    emptyPage.on('request', req => {
      if (req.url().includes('/api/stores')) {
        req.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        req.continue();
      }
    });

    await emptyPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Navigate to Store Network
    await emptyPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Store Network'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const hasEmptyMsg = await emptyPage.evaluate(() => {
      return document.body.textContent.includes('No partner stores registered yet');
    });
    console.log(`  -> Empty state message visible: ${hasEmptyMsg}`);
    assert.strictEqual(hasEmptyMsg, true, 'Legitimate empty state message must be visible');

    // Confirm mock stores are not rendered
    const storesOnEmpty = await emptyPage.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).filter(h => h.textContent.includes('Apex Mobile & Tech')).length;
    });
    console.log(`  -> Stores rendered on empty response: ${storesOnEmpty} (must be 0)`);
    assert.strictEqual(storesOnEmpty, 0, 'No mock stores must appear on empty response');
    console.log('  [PASS] Empty response treated as legitimate empty state.');

    await emptyPage.close();

    // -------------------------------------------------------------------------
    // TEST 5: Successful Load Followed by Backend Failure on Subsequent Action/Refetch
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Verifying successful load followed by backend failure on subsequent refetch...');
    const liveThenFailPage = await browser.newPage();
    await liveThenFailPage.setRequestInterception(true);

    let crashBackend = false;
    liveThenFailPage.on('request', req => {
      if (crashBackend && req.url().includes('/api/')) {
        req.respond({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Simulated downstream database timeout' })
        });
      } else {
        req.continue();
      }
    });

    // 1. Initial load succeeds
    await liveThenFailPage.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 800));

    // Navigate to Store Network tab
    await liveThenFailPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Store Network'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // Confirm initial live data loaded
    const initialStoreCount = await liveThenFailPage.evaluate(() => {
      return Array.from(document.querySelectorAll('h3, button, span')).filter(el => el.textContent.includes('Apex Mobile & Tech')).length;
    });
    console.log(`  -> Initial live stores found in DOM: ${initialStoreCount > 0}`);
    assert.strictEqual(initialStoreCount > 0, true, 'Initial load must populate live store data');

    // 2. Now backend crashes on subsequent actions
    crashBackend = true;
    console.log('  -> Simulating backend service crash on subsequent calls...');

    // Trigger subsequent refetch via window.__shelfbridge_loadDomainData()
    await liveThenFailPage.evaluate(() => {
      if (window.__shelfbridge_loadDomainData) {
        window.__shelfbridge_loadDomainData();
      }
    });
    await new Promise(r => setTimeout(r, 800));

    // Assert: Global error banner appears
    const errorBannerAppeared = await liveThenFailPage.evaluate(() => {
      return document.body.textContent.includes('Backend Connection Issue');
    });
    console.log(`  -> Connection error banner appeared on subsequent failure: ${errorBannerAppeared}`);
    assert.strictEqual(errorBannerAppeared, true, 'Error banner must appear when subsequent refetch fails');

    // Assert: No mock stores substituted (INITIAL_STORES default must NOT bleed in)
    const mockStoreCount5 = await liveThenFailPage.evaluate(() => {
      return Array.from(document.querySelectorAll('h3')).filter(h => h.textContent.includes('Apex Mobile & Tech (Simulated)')).length;
    });
    console.log(`  -> Mock stores substituted on subsequent failure: ${mockStoreCount5} (must be 0)`);
    assert.strictEqual(mockStoreCount5, 0, 'No mock stores must ever be substituted when backend fails after load');

    // 3. Test failed request creation does not fabricate success
    console.log('  -> Attempting request creation while backend is down...');
    await liveThenFailPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Capture Studio') || b.textContent.includes('New Unmet Request'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const modalOpen = await liveThenFailPage.evaluate(() => {
      return !!document.querySelector('form');
    });
    if (modalOpen) {
      await liveThenFailPage.evaluate(() => {
        const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.textContent.includes('Broadcast') || b.textContent.includes('Create'));
        if (submitBtn) submitBtn.click();
      });
      await new Promise(r => setTimeout(r, 800));

      const hasFailureToast = await liveThenFailPage.evaluate(() => {
        return document.body.textContent.includes('Request Creation Failed') || document.body.textContent.includes('Backend error') || document.body.textContent.includes('Backend Connection Issue');
      });
      console.log(`  -> Failure toast visible for rejected submission: ${hasFailureToast}`);
      assert.strictEqual(hasFailureToast, true, 'UI must display failure toast when action fails');
    }

    // 4. Restore backend and verify retry clears the error banner
    console.log('  -> Restoring backend connection and clicking Retry Connection...');
    crashBackend = false;
    await liveThenFailPage.evaluate(() => {
      const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Retry Connection'));
      if (retryBtn) retryBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    const bannerCleared = await liveThenFailPage.evaluate(() => {
      return !document.body.textContent.includes('Backend Connection Issue');
    });
    console.log(`  -> Error banner cleared after retry: ${bannerCleared}`);
    assert.strictEqual(bannerCleared, true, 'Error banner must clear when backend recovers');
    console.log('  [PASS] Subsequent backend failure handled cleanly without corrupting live state or falling back to mock fixtures.');

    await liveThenFailPage.close();

    console.log('\n================================================================');
    console.log('  ALL FIX 1 LIFECYCLE TESTS COMPLETED SUCCESSFULLY!             ');
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runFix1LifecycleTest().catch(err => {
  console.error('\n[FAIL] FIX 1 Lifecycle Test Failed:', err);
  process.exit(1);
});
