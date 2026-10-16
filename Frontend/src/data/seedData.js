// Seeded Domain Data for ShelfBridge Nehru Place Pilot Cluster
export const INITIAL_STORES = [
  {
    id: 'store-a',
    code: 'SHP-A',
    name: 'Apex Mobile & Tech',
    neighbourhood: 'Nehru Place · Block B (Ground Floor)',
    distanceMeters: 0,
    distanceLabel: 'Your Store (Origin)',
    owner: 'Rajesh Verma',
    role: 'Primary Requesting & Supplying Node',
    trustScore: 98,
    avgConfirmMins: 1.8,
    phone: '+91 98112 •••41',
    completedTransfers: 34,
    activeSince: 'Pilot Week 1'
  },
  {
    id: 'store-b',
    code: 'SHP-B',
    name: 'MetroVolt Electronics',
    neighbourhood: 'Nehru Place · Block C (180m walk)',
    distanceMeters: 180,
    distanceLabel: '180m · 2 min walk',
    owner: 'Vikram Sethi',
    role: 'Verified Neighbourhood Partner',
    trustScore: 96,
    avgConfirmMins: 2.1,
    phone: '+91 98180 •••92',
    completedTransfers: 29,
    activeSince: 'Pilot Week 1'
  },
  {
    id: 'store-c',
    code: 'SHP-C',
    name: 'QuickCharge Accessory Hub',
    neighbourhood: 'Nehru Place · Arcade Lane (310m walk)',
    distanceMeters: 310,
    distanceLabel: '310m · 4 min walk',
    owner: 'Amanpreet Singh',
    role: 'Verified Neighbourhood Partner',
    trustScore: 93,
    avgConfirmMins: 3.4,
    phone: '+91 99104 •••18',
    completedTransfers: 21,
    activeSince: 'Pilot Week 2'
  }
];

const INITIAL_CATALOGUE = [
  {
    id: 'prod-1',
    sku: 'ANK-A2663-65W',
    barcode: '848061026634',
    name: 'Anker Nano II 65W GaN USB-C Charger',
    brand: 'Anker',
    category: 'Charger',
    attributes: {
      connector: 'USB-C',
      wattage: 65,
      protocols: ['USB-PD 3.0', 'PPS', 'QC 4+'],
      outputSpec: '20V ⎓ 3.25A Max',
      compatibility: ['MacBook Air/Pro', 'Samsung S24 Ultra', 'Dell XPS', 'iPhone 15/16']
    },
    mrp: 2499,
    typicalSalePrice: 1200,
    typicalTransferPrice: 1000
  },
  {
    id: 'prod-2',
    sku: 'SAM-EPT6530-65W',
    barcode: '880609297821',
    name: 'Samsung 65W Power Adapter Trio (USB-C PD/PPS)',
    brand: 'Samsung',
    category: 'Charger',
    attributes: {
      connector: 'USB-C',
      wattage: 65,
      protocols: ['USB-PD 3.0', 'PPS Super Fast 2.0'],
      outputSpec: '20V ⎓ 3.25A (65W Single Port)',
      compatibility: ['Galaxy Book', 'Samsung S24 Ultra', 'USB-C Laptops', 'Tablets']
    },
    mrp: 2999,
    typicalSalePrice: 1350,
    typicalTransferPrice: 1120
  },
  {
    id: 'prod-3',
    sku: 'ANK-A2643-45W',
    barcode: '848061026436',
    name: 'Anker Nano II 45W Compact USB-C Charger',
    brand: 'Anker',
    category: 'Charger',
    attributes: {
      connector: 'USB-C',
      wattage: 45,
      protocols: ['USB-PD 3.0', 'PPS'],
      outputSpec: '20V ⎓ 2.25A Max (45W Limit)',
      compatibility: ['Samsung S24+', 'MacBook Air M1/M2', 'iPad Pro']
    },
    mrp: 1899,
    typicalSalePrice: 950,
    typicalTransferPrice: 780
  },
  {
    id: 'prod-4',
    sku: 'BEL-CAB100W-2M',
    barcode: '745883829104',
    name: 'Belkin BoostCharge Pro 100W USB-C to USB-C Braided Cable (2m)',
    brand: 'Belkin',
    category: 'Cable',
    attributes: {
      connector: 'USB-C to USB-C',
      wattage: 100,
      length: '2.0m',
      protocols: ['E-Marker 5A', 'USB-PD 100W', '480Mbps Data'],
      outputSpec: '20V ⎓ 5A (100W)',
      compatibility: ['16" MacBook Pro', 'iPhone 15/16 Pro', 'iPad', 'Gaming Laptops']
    },
    mrp: 1499,
    typicalSalePrice: 900,
    typicalTransferPrice: 720
  },
  {
    id: 'prod-5',
    sku: 'POR-PB20K-65W',
    barcode: '890433681120',
    name: 'Portronics Luxcell 20000mAh 65W PD Laptop Power Bank',
    brand: 'Portronics',
    category: 'Power Bank',
    attributes: {
      connector: 'Dual USB-C + USB-A',
      wattage: 65,
      capacity: '20000mAh (74Wh)',
      protocols: ['Bidirectional PD 3.0', 'QC 3.0', 'PPS'],
      outputSpec: '20V ⎓ 3.25A (65W Laptop Out)',
      compatibility: ['Type-C Laptops', 'Steam Deck', 'Smartphones']
    },
    mrp: 3499,
    typicalSalePrice: 1850,
    typicalTransferPrice: 1550
  },
  {
    id: 'prod-6',
    sku: 'SPG-QI2-15W',
    barcode: '880989674512',
    name: 'Spigen ArcField Qi2 MagSafe 15W Wireless Charger Pad',
    brand: 'Spigen',
    category: 'Charger',
    attributes: {
      connector: 'MagSafe / Qi2 Wireless (USB-C In)',
      wattage: 15,
      protocols: ['Qi2 Certified', 'MagSafe 15W'],
      outputSpec: '15W Magnetic Fast Wireless',
      compatibility: ['iPhone 12/13/14/15/16 Series', 'AirPods Pro']
    },
    mrp: 2199,
    typicalSalePrice: 1400,
    typicalTransferPrice: 1150
  }
];

const INITIAL_INVENTORY = [
  { id: 'inv-a1', storeId: 'store-a', productId: 'prod-1', onHand: 0, reserved: 0, transferPrice: 1000, acquisitionCost: 840, lastUpdated: '12 mins ago' },
  { id: 'inv-a2', storeId: 'store-a', productId: 'prod-2', onHand: 0, reserved: 0, transferPrice: 1120, acquisitionCost: 950, lastUpdated: '25 mins ago' },
  { id: 'inv-a3', storeId: 'store-a', productId: 'prod-4', onHand: 3, reserved: 1, transferPrice: 720, acquisitionCost: 590, lastUpdated: '4 mins ago' },
  { id: 'inv-a4', storeId: 'store-a', productId: 'prod-5', onHand: 0, reserved: 0, transferPrice: 1550, acquisitionCost: 1320, lastUpdated: '18 mins ago' },
  { id: 'inv-a5', storeId: 'store-a', productId: 'prod-6', onHand: 2, reserved: 0, transferPrice: 1150, acquisitionCost: 960, lastUpdated: '9 mins ago' },

  { id: 'inv-b1', storeId: 'store-b', productId: 'prod-1', onHand: 4, reserved: 0, transferPrice: 1000, acquisitionCost: 830, lastUpdated: '2 mins ago' },
  { id: 'inv-b2', storeId: 'store-b', productId: 'prod-2', onHand: 2, reserved: 0, transferPrice: 1120, acquisitionCost: 940, lastUpdated: '7 mins ago' },
  { id: 'inv-b3', storeId: 'store-b', productId: 'prod-4', onHand: 0, reserved: 0, transferPrice: 720, acquisitionCost: 600, lastUpdated: '31 mins ago' },
  { id: 'inv-b4', storeId: 'store-b', productId: 'prod-5', onHand: 3, reserved: 0, transferPrice: 1550, acquisitionCost: 1310, lastUpdated: '5 mins ago' },

  { id: 'inv-c1', storeId: 'store-c', productId: 'prod-3', onHand: 5, reserved: 0, transferPrice: 780, acquisitionCost: 640, lastUpdated: '6 mins ago' },
  { id: 'inv-c2', storeId: 'store-c', productId: 'prod-2', productId: 'prod-2', onHand: 1, reserved: 0, transferPrice: 1140, acquisitionCost: 960, lastUpdated: '14 mins ago' },
  { id: 'inv-c3', storeId: 'store-c', productId: 'prod-4', onHand: 6, reserved: 0, transferPrice: 710, acquisitionCost: 580, lastUpdated: '3 mins ago' },
  { id: 'inv-c4', storeId: 'store-c', productId: 'prod-6', onHand: 3, reserved: 0, transferPrice: 1130, acquisitionCost: 950, lastUpdated: '11 mins ago' }
];

const INITIAL_REQUESTS = [
  {
    id: 'REQ-1042',
    requestingStoreId: 'store-a',
    rawQuery: 'Customer needs Anker 65W GaN USB-C charger (ANK-A2663-65W) for laptop & S24 Ultra fast charge',
    category: 'Charger',
    requestedSku: 'ANK-A2663-65W',
    requestedBarcode: '848061026634',
    requestedBrand: 'Anker',
    requiredSpecs: {
      connector: 'USB-C',
      minWattage: 65,
      protocols: ['USB-PD 3.0', 'PPS']
    },
    quantity: 1,
    customerDeadlineMins: 15,
    allowSubstitutes: true,
    customerSalePrice: 1200,
    deliveryCost: 50,
    platformFee: 20,
    status: 'matched',
    selectedCandidateId: null,
    offerDetails: null,
    reservationDetails: null,
    createdAt: '18:52:10',
    updatedAt: '18:52:14'
  },
  {
    id: 'REQ-1041',
    requestingStoreId: 'store-a',
    rawQuery: 'Portronics 20000mAh 65W PD Laptop Power Bank (POR-PB20K-65W)',
    category: 'Power Bank',
    requestedSku: 'POR-PB20K-65W',
    requestedBarcode: '890433681120',
    requestedBrand: 'Portronics',
    requiredSpecs: {
      connector: 'Dual USB-C + USB-A',
      minWattage: 65,
      protocols: ['Bidirectional PD 3.0']
    },
    quantity: 1,
    customerDeadlineMins: 20,
    allowSubstitutes: false,
    customerSalePrice: 1850,
    deliveryCost: 50,
    platformFee: 20,
    status: 'reserved',
    selectedCandidateId: 'store-b__prod-5',
    offerDetails: {
      supplierStoreId: 'store-b',
      productId: 'prod-5',
      confirmedQty: 1,
      transferPrice: 1550,
      deliveryCharge: 50,
      holdMinutes: 15,
      confirmedBy: 'Vikram Sethi (MetroVolt)',
      confirmedAt: '18:44:02'
    },
    reservationDetails: {
      id: 'RES-882',
      expiresInSeconds: 510,
      lockedUnits: 1,
      handoverCode: '4829',
      createdAt: '18:45:10'
    },
    createdAt: '18:41:00',
    updatedAt: '18:45:10'
  },
  {
    id: 'REQ-1039',
    requestingStoreId: 'store-b',
    rawQuery: 'Belkin 100W 2m USB-C to USB-C E-Marker braided cable',
    category: 'Cable',
    requestedSku: 'BEL-CAB100W-2M',
    requestedBarcode: '745883829104',
    requestedBrand: 'Belkin',
    requiredSpecs: {
      connector: 'USB-C to USB-C',
      minWattage: 100,
      protocols: ['E-Marker 5A']
    },
    quantity: 1,
    customerDeadlineMins: 15,
    allowSubstitutes: true,
    customerSalePrice: 900,
    deliveryCost: 40,
    platformFee: 20,
    status: 'fulfilled',
    selectedCandidateId: 'store-c__prod-4',
    offerDetails: {
      supplierStoreId: 'store-c',
      productId: 'prod-4',
      confirmedQty: 1,
      transferPrice: 710,
      deliveryCharge: 40,
      holdMinutes: 15,
      confirmedBy: 'Amanpreet Singh (QuickCharge)',
      confirmedAt: '17:19:30'
    },
    reservationDetails: {
      id: 'RES-879',
      expiresInSeconds: 0,
      lockedUnits: 1,
      handoverCode: '7310',
      completedAt: '17:26:12'
    },
    createdAt: '17:18:05',
    updatedAt: '17:26:12'
  },
  {
    id: 'REQ-1038',
    requestingStoreId: 'store-a',
    rawQuery: 'Anker 65W GaN USB-C Charger for walk-in buyer',
    category: 'Charger',
    requestedSku: 'ANK-A2663-65W',
    requestedBarcode: '848061026634',
    requestedBrand: 'Anker',
    requiredSpecs: {
      connector: 'USB-C',
      minWattage: 65,
      protocols: ['USB-PD 3.0', 'PPS']
    },
    quantity: 1,
    customerDeadlineMins: 15,
    allowSubstitutes: false,
    customerSalePrice: 1200,
    deliveryCost: 50,
    platformFee: 20,
    status: 'fulfilled',
    selectedCandidateId: 'store-b__prod-1',
    offerDetails: {
      supplierStoreId: 'store-b',
      productId: 'prod-1',
      confirmedQty: 1,
      transferPrice: 1000,
      deliveryCharge: 50,
      holdMinutes: 15,
      confirmedBy: 'Vikram Sethi (MetroVolt)',
      confirmedAt: '16:12:45'
    },
    reservationDetails: {
      id: 'RES-874',
      expiresInSeconds: 0,
      lockedUnits: 1,
      handoverCode: '9104',
      completedAt: '16:19:50'
    },
    createdAt: '16:10:11',
    updatedAt: '16:19:50'
  }
];

const AGGREGATE_UNMET_DEMAND = [
  { sku: 'ANK-A2663-65W', name: 'Anker Nano II 65W GaN USB-C Charger', category: 'Charger', weeklyRequests: 19, recoveredCount: 14, unfulfilledCount: 5, avgMargin: 130, peakWindow: '14:00 – 19:00', recommendation: 'High velocity across Block B & C — increase safety stock by +6 units' },
  { sku: 'POR-PB20K-65W', name: 'Portronics Luxcell 20000mAh 65W PD Power Bank', category: 'Power Bank', weeklyRequests: 12, recoveredCount: 9, unfulfilledCount: 3, avgMargin: 230, peakWindow: '17:00 – 20:30', recommendation: 'Frequent laptop commuter demand between 17:00–20:00' },
  { sku: 'BEL-CAB100W-2M', name: 'Belkin 100W E-Marker USB-C to C Cable (2m)', category: 'Cable', weeklyRequests: 15, recoveredCount: 13, unfulfilledCount: 2, avgMargin: 130, peakWindow: '12:00 – 16:00', recommendation: 'Well-supplied at QuickCharge Hub; Shop A & B under-stocked' },
  { sku: 'APPL-35W-DUAL', name: 'Apple 35W Dual USB-C Port Compact Power Adapter', category: 'Charger', weeklyRequests: 11, recoveredCount: 2, unfulfilledCount: 9, avgMargin: 210, peakWindow: '15:00 – 19:30', recommendation: 'Cluster-wide deficit — 0 units in 300m radius. Priority distributor order' }
];

const DEMO_STEPS = [
  {
    step: 1,
    page: 'capture',
    title: '1. Stockout Capture (Shop A)',
    desc: 'Customer walks into Shop A asking for a 65W USB-C charger. Shop A has 0 available units and logs REQ-1042.'
  },
  {
    step: 2,
    page: 'matching',
    title: '2. 4-Stage Match & 45W Guard',
    desc: 'ShelfBridge ranks Shop B (Exact 65W SKU match, 4 units) #1, verifies Samsung 65W as substitute, and blocks Shop C’s 45W lookalike.'
  },
  {
    step: 3,
    page: 'dispatch',
    title: '3. Ping Supplier Stock',
    desc: 'Shop A pings Shop B to verify physical stock on shelf and lock transfer price (₹1,000).'
  },
  {
    step: 4,
    page: 'dispatch',
    title: '4. Supplier Confirms Offer',
    desc: 'Shop B confirms 1 unit available on shelf at ₹1,000 transfer price with a 15-minute hold window.'
  },
  {
    step: 5,
    page: 'reservations',
    title: '5. Atomic Reservation Lock',
    desc: 'Shop A accepts offer. Backend atomically decrements Shop B available stock (4 → 3) and starts a live expiry countdown.'
  },
  {
    step: 6,
    page: 'economics',
    title: '6. Handover & Unit Economics',
    desc: 'Runner/pickup completes handover. Sale is marked Fulfilled: ₹1,200 recovered sale and ₹130 net incremental contribution logged!'
  }
];

const PAGES_NAVIGATION = [
  { id: 'home', label: 'Overview & Pitch', shortLabel: 'Home', badge: 'Sec 1–4', icon: Home, desc: 'Problem, value prop & guided walkthrough' },
  { id: 'dispatch', label: 'Coordination Desk', shortLabel: 'Dispatch', badge: 'Live MVP', icon: Zap, desc: 'End-to-end request to fulfilment desk' },
  { id: 'capture', label: 'Request Capture Studio', shortLabel: 'Capture', badge: 'Surface A', icon: ScanLine, desc: 'Fast entry, barcode & Hinglish AI parser' },
  { id: 'matching', label: '4-Stage Match Inspector', shortLabel: 'Matcher', badge: 'Surface B', icon: ShieldCheck, desc: 'Exact SKU vs 45W lookalike safeguards' },
  { id: 'reservations', label: 'Offers & Atomic Holds', shortLabel: 'Holds', badge: 'Surface C', icon: Lock, desc: 'Live timers, row locks & handover OTP' },
  { id: 'inventory', label: 'Multi-Store Inventory', shortLabel: 'Stock', badge: '3 Stores', icon: Package, desc: 'Catalogue, stock ledger & CSV sync' },
  { id: 'network', label: 'Store Network & Pilot', shortLabel: 'Stores', badge: 'Sec 5.5', icon: Building2, desc: 'Nehru Place cluster map & store onboarding' },
  { id: 'demand', label: 'Network Demand Insights', shortLabel: 'Demand', badge: 'Surface E', icon: BarChart3, desc: 'Privacy-safe aggregate unmet SKU trends' },
  { id: 'economics', label: 'Unit Economics & API', shortLabel: 'Economics', badge: 'Sec 5–10', icon: IndianRupee, desc: 'Contribution waterfall, ROI & FastAPI spec' }
];

const STATUS_META = {
  open: { label: 'OPEN REQUEST', bg: 'bg-stone-200 text-stone-800 border-stone-400', darkBg: 'bg-zinc-800 text-zinc-200 border-zinc-600' },
  matched: { label: 'CANDIDATES MATCHED', bg: 'bg-amber-100 text-amber-900 border-amber-400', darkBg: 'bg-amber-950/70 text-amber-300 border-amber-700' },
  awaiting_supplier: { label: 'AWAITING SUPPLIER', bg: 'bg-orange-100 text-orange-900 border-orange-400', darkBg: 'bg-orange-950/70 text-orange-300 border-orange-700' },
  offered: { label: 'OFFER CONFIRMED', bg: 'bg-sky-100 text-sky-900 border-sky-400', darkBg: 'bg-sky-950/70 text-sky-300 border-sky-700' },
  reserved: { label: 'STOCK RESERVED (ATOMIC)', bg: 'bg-indigo-100 text-indigo-900 border-indigo-400', darkBg: 'bg-indigo-950/70 text-indigo-300 border-indigo-700' },
  fulfilled: { label: 'SALE RECOVERED', bg: 'bg-emerald-100 text-emerald-900 border-emerald-500', darkBg: 'bg-emerald-950/70 text-emerald-300 border-emerald-700' },
  cancelled: { label: 'CANCELLED (RELEASED)', bg: 'bg-rose-100 text-rose-900 border-rose-400', darkBg: 'bg-rose-950/70 text-rose-300 border-rose-700' },
  expired: { label: 'HOLD EXPIRED', bg: 'bg-stone-200 text-stone-600 border-stone-400', darkBg: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  unfulfilled: { label: 'UNFULFILLED', bg: 'bg-rose-100 text-rose-900 border-rose-400', darkBg: 'bg-rose-950/70 text-rose-300 border-rose-700' }
};

