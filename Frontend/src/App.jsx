import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Search,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Package,
  RefreshCw,
  Layers,
  TrendingUp,
  Terminal,
  Barcode,
  Lock,
  MapPin,
  Info,
  RotateCcw,
  Plus,
  Activity,
  Cpu,
  IndianRupee,
  Check,
  X,
  Zap,
  Sun,
  Moon,
  Menu,
  Home,
  Compass,
  FileSpreadsheet,
  Users,
  BarChart3,
  Sliders,
  ChevronRight,
  Download,
  Upload,
  ScanLine,
  Sparkles,
  Building2,
  Truck,
  KeyRound,
  Eye
} from 'lucide-react';

// ============================================================================
// SEEDED DOMAIN DATA (Strictly grounded in ShelfBridge_Product_and_Business_Plan.md)
// ============================================================================

const INITIAL_STORES = [
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
  { id: 'inv-c2', storeId: 'store-c', productId: 'prod-2', onHand: 1, reserved: 0, transferPrice: 1140, acquisitionCost: 960, lastUpdated: '14 mins ago' },
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
  { id: 'dispatch', label: 'Coordination Desk', shortLabel: 'Dispatch', icon: Zap, desc: 'Live requests, stock matches & order fulfilment' },
  { id: 'capture', label: 'Log Stockout', shortLabel: 'Log Request', icon: Plus, desc: 'Quick customer request entry & barcode scan' },
  { id: 'inventory', label: 'Inventory & Catalogue', shortLabel: 'Inventory', icon: Package, desc: 'Multi-store shelf availability & specifications' },
  { id: 'network', label: 'Store Network', shortLabel: 'Network', icon: Building2, desc: 'Partner stores in Nehru Place cluster' },
  { id: 'demand', label: 'Demand & Insights', shortLabel: 'Insights', icon: BarChart3, desc: 'Unmet demand patterns & stockout trends' },
  { id: 'economics', label: 'Unit Economics', shortLabel: 'Economics', icon: IndianRupee, desc: 'Contribution margin waterfall & revenue' },
  { id: 'home', label: 'Overview', shortLabel: 'Overview', icon: Home, desc: 'System overview & problem context' }
];

const STATUS_META = {
  open: { label: 'Open Request', bg: 'bg-stone-100 text-stone-700 border-stone-200/80', darkBg: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
  matched: { label: 'Matches Found', bg: 'bg-blue-50 text-[#0071E3] border-blue-200/80', darkBg: 'bg-blue-950/40 text-blue-300 border-blue-800' },
  awaiting_supplier: { label: 'Awaiting Supplier', bg: 'bg-amber-50 text-amber-800 border-amber-200/80', darkBg: 'bg-amber-950/40 text-amber-300 border-amber-800' },
  offered: { label: 'Offer Confirmed', bg: 'bg-sky-50 text-sky-800 border-sky-200/80', darkBg: 'bg-sky-950/40 text-sky-300 border-sky-800' },
  reserved: { label: 'Stock Reserved', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', darkBg: 'bg-indigo-950/40 text-indigo-300 border-indigo-800' },
  fulfilled: { label: 'Sale Recovered', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', darkBg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-800 border-rose-200/80', darkBg: 'bg-rose-950/40 text-rose-300 border-rose-800' },
  expired: { label: 'Hold Expired', bg: 'bg-stone-100 text-stone-600 border-stone-200/80', darkBg: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  unfulfilled: { label: 'Unfulfilled', bg: 'bg-rose-50 text-rose-800 border-rose-200/80', darkBg: 'bg-rose-950/40 text-rose-300 border-rose-800' }
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Active Store Perspective: 'store-a' | 'store-b' | 'store-c' | 'network'
  const [activeStoreId, setActiveStoreId] = useState('store-a');

  // Multi-Page Navigation State (defaults directly to live Coordination Desk)
  const [activeTab, setActiveTab] = useState('dispatch');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Domain State
  const [stores, setStores] = useState(INITIAL_STORES);
  const [catalogue, setCatalogue] = useState(INITIAL_CATALOGUE);
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState('REQ-1042');
  const [demoStep, setDemoStep] = useState(1);

  const [auditLog, setAuditLog] = useState([
    { id: 'evt-4', time: '18:52:14', actor: 'MatchingService (ROCm)', action: 'Ranked 3 neighbourhood candidates for REQ-1042 (1 Exact, 1 Compatible Substitute, 1 Flagged Incompatible)', type: 'match' },
    { id: 'evt-3', time: '18:52:10', actor: 'Shop A (Rajesh V.)', action: 'Created unmet-demand request REQ-1042 for ANK-A2663-65W (65W USB-C Charger)', type: 'request' },
    { id: 'evt-2', time: '18:45:10', actor: 'ReservationService', action: 'Atomic lock RES-882 acquired on 1 unit of POR-PB20K-65W at Shop B (15m hold)', type: 'reserve' },
    { id: 'evt-1', time: '17:26:12', actor: 'FulfilmentService', action: 'Completed handover for REQ-1039. Recovered ₹900 sale (+₹130 net contribution)', type: 'fulfil' }
  ]);

  const [toast, setToast] = useState(null);
  const triggerToast = (title, detail, tone = 'info') => {
    setToast({ title, detail, tone, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Live Reservation Countdown Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests((prev) =>
        prev.map((req) => {
          if (req.status === 'reserved' && req.reservationDetails && req.reservationDetails.expiresInSeconds > 0) {
            const nextSec = req.reservationDetails.expiresInSeconds - 1;
            if (nextSec <= 0) {
              if (req.offerDetails) {
                setInventory((invPrev) =>
                  invPrev.map((item) =>
                    item.storeId === req.offerDetails.supplierStoreId && item.productId === req.offerDetails.productId
                      ? { ...item, reserved: Math.max(0, item.reserved - req.quantity), lastUpdated: 'Just now' }
                      : item
                  )
                );
              }
              return {
                ...req,
                status: 'expired',
                reservationDetails: { ...req.reservationDetails, expiresInSeconds: 0 }
              };
            }
            return {
              ...req,
              reservationDetails: { ...req.reservationDetails, expiresInSeconds: nextSec }
            };
          }
          return req;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Request Creation State (used in both Modal & dedicated Capture Studio Page)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newReqInput, setNewReqInput] = useState('Bhaiya Samsung S24 Ultra aur MacBook ke liye 65W USB-C PD PPS fast charger chahiye urgent');
  const [newReqCategory, setNewReqCategory] = useState('Charger');
  const [newReqSku, setNewReqSku] = useState('ANK-A2663-65W');
  const [newReqMinWattage, setNewReqMinWattage] = useState(65);
  const [newReqConnector, setNewReqConnector] = useState('USB-C');
  const [newReqProtocols, setNewReqProtocols] = useState('USB-PD 3.0, PPS');
  const [newReqQty, setNewReqQty] = useState(1);
  const [newReqDeadline, setNewReqDeadline] = useState(15);
  const [newReqSalePrice, setNewReqSalePrice] = useState(1200);
  const [newReqAllowSub, setNewReqAllowSub] = useState(true);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('848061026634');

  // Offer Config State
  const [customTransferPrice, setCustomTransferPrice] = useState(1000);
  const [customHoldMins, setCustomHoldMins] = useState(15);

  // Unit Economics Simulator State (Section 5.2 & 5.3)
  const [simSaleValue, setSimSaleValue] = useState(1200);
  const [simTransferPrice, setSimTransferPrice] = useState(1000);
  const [simDeliveryCost, setSimDeliveryCost] = useState(50);
  const [simPlatformFee, setSimPlatformFee] = useState(20);
  const [simVariablePlatformCost, setSimVariablePlatformCost] = useState(5);
  const [simFixedMonthlyCost, setSimFixedMonthlyCost] = useState(15000);
  const [simMonthlyTxns, setSimMonthlyTxns] = useState(1000);

  // Inventory Filter & Stock Modal State
  const [invSearch, setInvSearch] = useState('');
  const [invStoreFilter, setInvStoreFilter] = useState('all');
  const [invCategoryFilter, setInvCategoryFilter] = useState('all');
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStockStore, setNewStockStore] = useState('store-b');
  const [newStockProduct, setNewStockProduct] = useState('prod-1');
  const [newStockDelta, setNewStockDelta] = useState(2);

  // Store Onboarding State (Page 7: Store Network)
  const [newStoreName, setNewStoreName] = useState('Galaxy Tech Point');
  const [newStoreBlock, setNewStoreBlock] = useState('Nehru Place · Block A (220m walk)');
  const [newStoreOwner, setNewStoreOwner] = useState('Sandeep Malhotra');
  const [newStoreDistance, setNewStoreDistance] = useState(220);

  // Handover Verification OTP State (Page 5: Reservations)
  const [handoverOtpInput, setHandoverOtpInput] = useState('');

  const navigateToPage = (pageId) => {
    setActiveTab(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const logAudit = (actor, action, type = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setAuditLog((prev) => [{ id: `evt-${Date.now()}`, time: timeStr, actor, action, type }, ...prev.slice(0, 19)]);
  };

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) || requests[0],
    [requests, selectedRequestId]
  );

  // ============================================================================
  // 4-STAGE DETERMINISTIC + AI MATCHING ENGINE (Section 7.4)
  // ============================================================================
  const candidatesForSelectedRequest = useMemo(() => {
    if (!selectedRequest) return [];
    const results = [];

    inventory.forEach((inv) => {
      if (inv.storeId === selectedRequest.requestingStoreId) return;

      const store = stores.find((s) => s.id === inv.storeId);
      const product = catalogue.find((p) => p.id === inv.productId);
      if (!store || !product) return;

      if (product.category !== selectedRequest.category) return;

      const availableQty = Math.max(0, inv.onHand - inv.reserved);

      const isExactSku =
        product.sku.toLowerCase() === (selectedRequest.requestedSku || '').toLowerCase() ||
        product.barcode === selectedRequest.requestedBarcode;

      const connectorMatch =
        product.attributes.connector.toLowerCase().includes(selectedRequest.requiredSpecs.connector.toLowerCase());
      const wattagePass = product.attributes.wattage >= selectedRequest.requiredSpecs.minWattage;
      const protocolMatches = selectedRequest.requiredSpecs.protocols.filter((reqProt) =>
        product.attributes.protocols.some((p) => p.toLowerCase().includes(reqProt.toLowerCase().replace('usb-', '')))
      );
      const allProtocolsPass = protocolMatches.length === selectedRequest.requiredSpecs.protocols.length;

      let matchTier = 'incompatible';
      let matchLabel = 'INCOMPATIBLE LOOKALIKE — FLAGGED';
      let confidenceScore = 38;
      let stageExplanation = [];
      let canReserve = false;

      if (isExactSku && wattagePass && connectorMatch) {
        matchTier = 'exact';
        matchLabel = 'STAGE 1 · EXACT SKU & GTIN MATCH';
        confidenceScore = 99;
        canReserve = availableQty >= selectedRequest.quantity;
        stageExplanation = [
          `Exact Model/SKU (${product.sku}) & Barcode (${product.barcode}) verified`,
          `Meets ${product.attributes.wattage}W output & ${product.attributes.protocols.join(' + ')}`,
          `Net Retailer Contribution: ₹${selectedRequest.customerSalePrice - inv.transferPrice - selectedRequest.deliveryCost - selectedRequest.platformFee}`
        ];
      } else if (wattagePass && connectorMatch) {
        matchTier = 'substitute';
        matchLabel = 'STAGE 2 · VERIFIED COMPATIBLE ALTERNATIVE';
        confidenceScore = allProtocolsPass ? 91 : 84;
        canReserve = availableQty >= selectedRequest.quantity && selectedRequest.allowSubstitutes;
        stageExplanation = [
          `Different brand/SKU (${product.sku}), but matches ${product.attributes.wattage}W ≥ ${selectedRequest.requiredSpecs.minWattage}W requirement`,
          `Connector (${product.attributes.connector}) & PD/PPS protocol verified`,
          selectedRequest.allowSubstitutes
            ? 'Customer accepts verified substitute — human confirmation required'
            : 'Blocked: Request specifies Exact Match Only'
        ];
      } else {
        matchTier = 'incompatible';
        matchLabel = 'STAGE 2 SAFEGUARD · ELECTRICAL MISMATCH';
        confidenceScore = 29;
        canReserve = false;
        const wattageGap = selectedRequest.requiredSpecs.minWattage - product.attributes.wattage;
        stageExplanation = [
          `CRITICAL SAFEGUARD: Name looks similar ("${product.name}"), but rated at ${product.attributes.wattage}W (${wattageGap}W below ${selectedRequest.requiredSpecs.minWattage}W requirement)`,
          `Cannot sustain 20V⎓3.25A laptop charging load — prevented false-positive match`
        ];
      }

      const estimatedContribution =
        selectedRequest.customerSalePrice - inv.transferPrice - selectedRequest.deliveryCost - selectedRequest.platformFee;

      results.push({
        candidateId: `${store.id}__${product.id}`,
        store,
        product,
        inventory: inv,
        availableQty,
        isExactSku,
        connectorMatch,
        wattagePass,
        allProtocolsPass,
        matchTier,
        matchLabel,
        confidenceScore,
        stageExplanation,
        canReserve,
        estimatedContribution
      });
    });

    const tierOrder = { exact: 1, substitute: 2, incompatible: 3 };
    return results.sort((a, b) => {
      if (tierOrder[a.matchTier] !== tierOrder[b.matchTier]) {
        return tierOrder[a.matchTier] - tierOrder[b.matchTier];
      }
      if ((b.availableQty > 0) !== (a.availableQty > 0)) {
        return b.availableQty > 0 ? 1 : -1;
      }
      return a.store.distanceMeters - b.store.distanceMeters;
    });
  }, [selectedRequest, inventory, stores, catalogue]);

  // ============================================================================
  // WORKFLOW STATE TRANSITION HANDLERS
  // ============================================================================
  const handlePingSupplier = (candidate) => {
    if (!selectedRequest) return;
    if (candidate.matchTier === 'incompatible') {
      triggerToast(
        'Safeguard Blocked Request',
        `${candidate.product.sku} is rated at ${candidate.product.attributes.wattage}W (< ${selectedRequest.requiredSpecs.minWattage}W required). Cannot request incompatible stock.`,
        'error'
      );
      return;
    }
    if (candidate.availableQty < selectedRequest.quantity) {
      triggerToast('Insufficient Unreserved Stock', `${candidate.store.name} has 0 unreserved units available.`, 'error');
      return;
    }

    setCustomTransferPrice(candidate.inventory.transferPrice);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedRequest.id
          ? {
              ...r,
              status: 'awaiting_supplier',
              selectedCandidateId: candidate.candidateId,
              offerDetails: {
                supplierStoreId: candidate.store.id,
                productId: candidate.product.id,
                confirmedQty: r.quantity,
                transferPrice: candidate.inventory.transferPrice,
                deliveryCharge: r.deliveryCost,
                holdMinutes: 15,
                confirmedBy: null,
                confirmedAt: null
              },
              updatedAt: new Date().toTimeString().split(' ')[0]
            }
          : r
      )
    );

    if (demoStep <= 3) setDemoStep(4);
    logAudit(
      `${stores.find((s) => s.id === selectedRequest.requestingStoreId)?.name}`,
      `Requested stock & price confirmation from ${candidate.store.name} for ${candidate.product.sku}`,
      'request'
    );
    triggerToast(
      'Supplier Ping Dispatched',
      `Awaiting ${candidate.store.name} to confirm shelf stock and ₹${candidate.inventory.transferPrice} transfer price.`,
      'info'
    );
  };

  const handleSupplierConfirmOffer = (reqId, overridePrice, overrideHold) => {
    const targetReq = requests.find((r) => r.id === reqId);
    if (!targetReq || !targetReq.offerDetails) return;

    const supplierStore = stores.find((s) => s.id === targetReq.offerDetails.supplierStoreId);
    const finalPrice = overridePrice || targetReq.offerDetails.transferPrice;
    const finalHold = overrideHold || 15;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'offered',
              offerDetails: {
                ...r.offerDetails,
                transferPrice: Number(finalPrice),
                holdMinutes: Number(finalHold),
                confirmedBy: `${supplierStore?.owner} (${supplierStore?.name})`,
                confirmedAt: new Date().toTimeString().split(' ')[0]
              },
              updatedAt: new Date().toTimeString().split(' ')[0]
            }
          : r
      )
    );

    if (demoStep === 4) setDemoStep(5);
    logAudit(
      `${supplierStore?.name}`,
      `Confirmed ${targetReq.quantity} unit(s) on shelf at ₹${finalPrice} transfer price (${finalHold}m hold offer)`,
      'offer'
    );
    triggerToast(
      'Supplier Confirmed Stock & Price',
      `${supplierStore?.name} verified physical unit on shelf at ₹${finalPrice}. Ready for atomic reservation.`,
      'success'
    );
  };

  const handleAcceptAndReserve = (reqId) => {
    const targetReq = requests.find((r) => r.id === reqId);
    if (!targetReq || !targetReq.offerDetails) return;

    const { supplierStoreId, productId, holdMinutes } = targetReq.offerDetails;
    const invItem = inventory.find((i) => i.storeId === supplierStoreId && i.productId === productId);
    const availableNow = invItem ? invItem.onHand - invItem.reserved : 0;

    if (!invItem || availableNow < targetReq.quantity) {
      triggerToast(
        'Atomic Reservation Rejected (409 Conflict)',
        `Row lock check failed: available_quantity (${availableNow}) < requested (${targetReq.quantity}).`,
        'error'
      );
      return;
    }

    setInventory((prev) =>
      prev.map((item) =>
        item.storeId === supplierStoreId && item.productId === productId
          ? { ...item, reserved: item.reserved + targetReq.quantity, lastUpdated: 'Just now (Locked)' }
          : item
      )
    );

    const resId = `RES-${Math.floor(883 + Math.random() * 100)}`;
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'reserved',
              reservationDetails: {
                id: resId,
                expiresInSeconds: (holdMinutes || 15) * 60,
                lockedUnits: r.quantity,
                handoverCode: otp,
                createdAt: new Date().toTimeString().split(' ')[0]
              },
              updatedAt: new Date().toTimeString().split(' ')[0]
            }
          : r
      )
    );

    if (demoStep === 5) setDemoStep(6);
    logAudit(
      'ReservationService (DB Row Lock)',
      `Created reservation ${resId} for ${reqId}. Available stock at ${supplierStoreId.toUpperCase()} decremented (${availableNow} → ${availableNow - targetReq.quantity}).`,
      'reserve'
    );
    triggerToast(
      `Atomic Reservation ${resId} Active`,
      `1 unit locked at ${stores.find((s) => s.id === supplierStoreId)?.name} for ${holdMinutes} mins. Handover PIN: ${otp}.`,
      'success'
    );
  };

  const handleCompleteFulfilment = (reqId) => {
    const targetReq = requests.find((r) => r.id === reqId);
    if (!targetReq || !targetReq.offerDetails) return;

    const { supplierStoreId, productId, transferPrice } = targetReq.offerDetails;

    setInventory((prev) =>
      prev.map((item) =>
        item.storeId === supplierStoreId && item.productId === productId
          ? {
              ...item,
              onHand: Math.max(0, item.onHand - targetReq.quantity),
              reserved: Math.max(0, item.reserved - targetReq.quantity),
              lastUpdated: 'Just now (Fulfilled)'
            }
          : item
      )
    );

    const netContribution =
      targetReq.customerSalePrice - transferPrice - targetReq.deliveryCost - targetReq.platformFee;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'fulfilled',
              reservationDetails: {
                ...(r.reservationDetails || { id: 'RES-900', lockedUnits: r.quantity }),
                expiresInSeconds: 0,
                completedAt: new Date().toTimeString().split(' ')[0]
              },
              updatedAt: new Date().toTimeString().split(' ')[0]
            }
          : r
      )
    );

    logAudit(
      'FulfilmentService',
      `${reqId} marked FULFILLED. Recovered Sale: ₹${targetReq.customerSalePrice} | Net Retailer Contribution: +₹${netContribution} | Platform Fee: ₹${targetReq.platformFee}`,
      'fulfil'
    );
    triggerToast(
      `Sale Recovered! (+₹${targetReq.customerSalePrice} Revenue)`,
      `Net retailer contribution: +₹${netContribution} after ₹${transferPrice} transfer, ₹${targetReq.deliveryCost} runner & ₹${targetReq.platformFee} ShelfBridge fee.`,
      'success'
    );
  };

  const handleCancelReservation = (reqId) => {
    const targetReq = requests.find((r) => r.id === reqId);
    if (!targetReq) return;

    if (targetReq.status === 'reserved' && targetReq.offerDetails) {
      const { supplierStoreId, productId } = targetReq.offerDetails;
      setInventory((prev) =>
        prev.map((item) =>
          item.storeId === supplierStoreId && item.productId === productId
            ? {
                ...item,
                reserved: Math.max(0, item.reserved - targetReq.quantity),
                lastUpdated: 'Just now (Released)'
              }
            : item
        )
      );
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: 'cancelled',
              reservationDetails: r.reservationDetails ? { ...r.reservationDetails, expiresInSeconds: 0 } : null,
              updatedAt: new Date().toTimeString().split(' ')[0]
            }
          : r
      )
    );

    logAudit('ReservationService', `Cancelled ${reqId} and released reserved stock back to available pool.`, 'cancel');
    triggerToast('Reservation Cancelled & Stock Released', `Reserved units for ${reqId} returned to supplier's available stock.`, 'info');
  };

  const handleSimulateRaceCondition = () => {
    if (!selectedRequest) return;
    logAudit(
      'ConcurrencyGuard (PostgreSQL SELECT FOR UPDATE)',
      `Blocked duplicate reservation attempt on ${selectedRequest.requestedSku} — active hold lock enforced.`,
      'cancel'
    );
    triggerToast(
      'Concurrency Lock Verified (SELECT ... FOR UPDATE)',
      'Simulated competing buyer attempt: Database transaction rejected over-reservation beyond available_quantity.',
      'info'
    );
  };

  const handleResetDemo = () => {
    setStores(INITIAL_STORES);
    setInventory(INITIAL_INVENTORY);
    setRequests(INITIAL_REQUESTS);
    setSelectedRequestId('REQ-1042');
    setActiveStoreId('store-a');
    setActiveTab('dispatch');
    setDemoStep(2);
    triggerToast('Hackathon Demo Reset', 'All stores, inventory counts, and REQ-1042 restored to initial state.', 'info');
  };

  const handleParseMessyQuery = (presetType) => {
    setIsParsingAI(true);
    setTimeout(() => {
      if (presetType === 'charger65') {
        setNewReqInput('Bhaiya Samsung S24 Ultra aur MacBook ke liye 65W USB-C PD PPS fast charger chahiye urgent');
        setNewReqCategory('Charger');
        setNewReqSku('ANK-A2663-65W');
        setScannedBarcode('848061026634');
        setNewReqMinWattage(65);
        setNewReqConnector('USB-C');
        setNewReqProtocols('USB-PD 3.0, PPS');
        setNewReqSalePrice(1200);
        setNewReqAllowSub(true);
      } else if (presetType === 'cable100') {
        setNewReqInput('Need 2 meter braided Type-C to Type-C 100W 5A E-Marker cable for MacBook Pro');
        setNewReqCategory('Cable');
        setNewReqSku('BEL-CAB100W-2M');
        setScannedBarcode('745883829104');
        setNewReqMinWattage(100);
        setNewReqConnector('USB-C to USB-C');
        setNewReqProtocols('E-Marker 5A, USB-PD 100W');
        setNewReqSalePrice(900);
        setNewReqAllowSub(true);
      } else if (presetType === 'powerbank65') {
        setNewReqInput('20000mAh power bank that can charge Dell Type-C laptop at 65W PD output');
        setNewReqCategory('Power Bank');
        setNewReqSku('POR-PB20K-65W');
        setScannedBarcode('890433681120');
        setNewReqMinWattage(65);
        setNewReqConnector('Dual USB-C + USB-A');
        setNewReqProtocols('Bidirectional PD 3.0');
        setNewReqSalePrice(1850);
        setNewReqAllowSub(false);
      } else if (presetType === 'wireless15') {
        setNewReqInput('iPhone 15 Pro ke liye original Qi2 15W magnetic wireless charger pad');
        setNewReqCategory('Charger');
        setNewReqSku('SPG-QI2-15W');
        setScannedBarcode('880989674512');
        setNewReqMinWattage(15);
        setNewReqConnector('MagSafe / Qi2 Wireless');
        setNewReqProtocols('Qi2 Certified, MagSafe 15W');
        setNewReqSalePrice(1400);
        setNewReqAllowSub(true);
      }
      setIsParsingAI(false);
    }, 260);
  };

  const handleScanBarcodePreset = (prod) => {
    setScannedBarcode(prod.barcode);
    setNewReqSku(prod.sku);
    setNewReqCategory(prod.category);
    setNewReqMinWattage(prod.attributes.wattage);
    setNewReqConnector(prod.attributes.connector);
    setNewReqProtocols(prod.attributes.protocols.join(', '));
    setNewReqSalePrice(prod.typicalSalePrice);
    setNewReqInput(`Barcode Scan [${prod.barcode}]: Customer requested ${prod.name}`);
    triggerToast(`Barcode Scanned: ${prod.barcode}`, `Auto-populated exact technical specs for ${prod.sku}.`, 'success');
  };

  const handleCreateRequestSubmit = (e) => {
    e.preventDefault();
    const newId = `REQ-${1043 + requests.length - 4}`;
    const matchedCatalog = catalogue.find((c) => c.sku === newReqSku) || catalogue[0];
    const created = {
      id: newId,
      requestingStoreId: activeStoreId === 'network' ? 'store-a' : activeStoreId,
      rawQuery: newReqInput,
      category: newReqCategory,
      requestedSku: newReqSku,
      requestedBarcode: matchedCatalog.barcode,
      requestedBrand: matchedCatalog.brand,
      requiredSpecs: {
        connector: newReqConnector,
        minWattage: Number(newReqMinWattage),
        protocols: newReqProtocols.split(',').map((s) => s.trim()).filter(Boolean)
      },
      quantity: Number(newReqQty) || 1,
      customerDeadlineMins: Number(newReqDeadline) || 15,
      allowSubstitutes: newReqAllowSub,
      customerSalePrice: Number(newReqSalePrice) || 1200,
      deliveryCost: 50,
      platformFee: 20,
      status: 'matched',
      selectedCandidateId: null,
      offerDetails: null,
      reservationDetails: null,
      createdAt: new Date().toTimeString().split(' ')[0],
      updatedAt: new Date().toTimeString().split(' ')[0]
    };

    setRequests((prev) => [created, ...prev]);
    setSelectedRequestId(newId);
    setShowNewRequestModal(false);
    logAudit(
      `${stores.find((s) => s.id === created.requestingStoreId)?.name}`,
      `Logged unmet customer request ${newId} (${created.requestedSku}, ${created.requiredSpecs.minWattage}W)`,
      'request'
    );
    triggerToast(`Created ${newId}`, '4-stage deterministic & attribute matching completed across neighbourhood stores.', 'success');
    navigateToPage('matching');
  };

  const handleAddStockSubmit = (e) => {
    e.preventDefault();
    setInventory((prev) => {
      const existing = prev.find((i) => i.storeId === newStockStore && i.productId === newStockProduct);
      if (existing) {
        return prev.map((i) =>
          i.storeId === newStockStore && i.productId === newStockProduct
            ? { ...i, onHand: Math.max(0, i.onHand + Number(newStockDelta)), lastUpdated: 'Just now' }
            : i
        );
      }
      const prod = catalogue.find((p) => p.id === newStockProduct);
      return [
        ...prev,
        {
          id: `inv-${Date.now()}`,
          storeId: newStockStore,
          productId: newStockProduct,
          onHand: Math.max(1, Number(newStockDelta)),
          reserved: 0,
          transferPrice: prod ? prod.typicalTransferPrice : 1000,
          acquisitionCost: prod ? Math.round(prod.typicalTransferPrice * 0.84) : 840,
          lastUpdated: 'Just now'
        }
      ];
    });
    setShowAddStockModal(false);
    logAudit('InventoryService', `Updated stock for ${newStockProduct} at ${newStockStore.toUpperCase()} (+${newStockDelta} units)`, 'info');
    triggerToast('Inventory Record Updated', 'Available quantity recalculated atomically.', 'success');
  };

  const handleOnboardStoreSubmit = (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    const nextIdx = stores.length + 1;
    const code = `SHP-${String.fromCharCode(64 + nextIdx)}`;
    const newId = `store-${code.toLowerCase()}`;
    const newSt = {
      id: newId,
      code,
      name: newStoreName.trim(),
      neighbourhood: newStoreBlock.trim(),
      distanceMeters: Number(newStoreDistance) || 250,
      distanceLabel: `${newStoreDistance}m · 3 min walk`,
      owner: newStoreOwner.trim() || 'Store Manager',
      role: 'Verified Neighbourhood Partner',
      trustScore: 95,
      avgConfirmMins: 2.0,
      phone: '+91 98109 •••55',
      completedTransfers: 0,
      activeSince: 'Just Onboarded'
    };
    setStores((prev) => [...prev, newSt]);
    // Seed 2 units of 65W charger for the newly onboarded store
    setInventory((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}`,
        storeId: newId,
        productId: 'prod-1',
        onHand: 2,
        reserved: 0,
        transferPrice: 990,
        acquisitionCost: 830,
        lastUpdated: 'Just onboarded'
      }
    ]);
    logAudit('StoreService', `Onboarded new partner store ${code} (${newSt.name}) into Nehru Place cluster.`, 'info');
    triggerToast(`Partner Store ${code} Onboarded`, `${newSt.name} added to the neighbourhood inventory mesh with initial stock.`, 'success');
    setNewStoreName('');
  };

  const handleExportInventoryCsv = () => {
    const headers = ['Store_Code,Store_Name,SKU,Barcode_GTIN,Product_Name,On_Hand,Reserved,Available,Transfer_Price_INR'];
    const rows = filteredInventory.map(
      (r) =>
        `${r.store.code},"${r.store.name}",${r.product.sku},${r.product.barcode},"${r.product.name}",${r.onHand},${r.reserved},${r.available},${r.transferPrice}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'shelfbridge_cluster_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('CSV Inventory Exported', 'Downloaded shelfbridge_cluster_inventory.csv with live atomic stock counts.', 'success');
  };

  // ============================================================================
  // LIVE ANALYTICS & FINANCIAL METRICS
  // ============================================================================
  const metrics = useMemo(() => {
    const fulfilledReqs = requests.filter((r) => r.status === 'fulfilled');
    const reservedReqs = requests.filter((r) => r.status === 'reserved');
    const openOrActiveReqs = requests.filter((r) => ['open', 'matched', 'awaiting_supplier', 'offered'].includes(r.status));

    const totalRecoveredRevenue = fulfilledReqs.reduce((acc, r) => acc + r.customerSalePrice * r.quantity, 0);
    const totalRetailerContribution = fulfilledReqs.reduce((acc, r) => {
      const tPrice = r.offerDetails ? r.offerDetails.transferPrice : 1000;
      return acc + (r.customerSalePrice - tPrice - r.deliveryCost - r.platformFee) * r.quantity;
    }, 0);
    const totalPlatformFees = fulfilledReqs.reduce((acc, r) => acc + r.platformFee * r.quantity, 0);
    const recoveryRate = requests.length > 0 ? Math.round((fulfilledReqs.length / requests.length) * 100) : 0;

    return {
      totalRequests: requests.length,
      fulfilledCount: fulfilledReqs.length,
      reservedCount: reservedReqs.length,
      activeCount: openOrActiveReqs.length,
      totalRecoveredRevenue,
      totalRetailerContribution,
      totalPlatformFees,
      recoveryRate
    };
  }, [requests]);

  const simMath = useMemo(() => {
    const requestingShopContribution = simSaleValue - simTransferPrice - simDeliveryCost - simPlatformFee;
    const platformUnitContribution = simPlatformFee - simVariablePlatformCost;
    const breakEvenTxns =
      platformUnitContribution > 0 ? Math.ceil(simFixedMonthlyCost / platformUnitContribution) : Infinity;
    const monthlyPlatformRevenue = simMonthlyTxns * simPlatformFee;
    const monthlyPlatformContribution = simMonthlyTxns * platformUnitContribution;
    const monthlyNetOperatingProfit = monthlyPlatformContribution - simFixedMonthlyCost;
    const monthlyClusterRetailerContribution = simMonthlyTxns * requestingShopContribution;

    return {
      requestingShopContribution,
      platformUnitContribution,
      breakEvenTxns,
      monthlyPlatformRevenue,
      monthlyPlatformContribution,
      monthlyNetOperatingProfit,
      monthlyClusterRetailerContribution
    };
  }, [
    simSaleValue,
    simTransferPrice,
    simDeliveryCost,
    simPlatformFee,
    simVariablePlatformCost,
    simFixedMonthlyCost,
    simMonthlyTxns
  ]);

  const filteredInventory = useMemo(() => {
    return inventory
      .map((inv) => {
        const store = stores.find((s) => s.id === inv.storeId);
        const product = catalogue.find((p) => p.id === inv.productId);
        return {
          ...inv,
          store,
          product,
          available: Math.max(0, inv.onHand - inv.reserved)
        };
      })
      .filter((item) => {
        if (!item.store || !item.product) return false;
        if (invStoreFilter !== 'all' && item.storeId !== invStoreFilter) return false;
        if (invCategoryFilter !== 'all' && item.product.category !== invCategoryFilter) return false;
        if (!invSearch.trim()) return true;
        const q = invSearch.toLowerCase();
        return (
          item.product.name.toLowerCase().includes(q) ||
          item.product.sku.toLowerCase().includes(q) ||
          item.product.barcode.includes(q) ||
          item.product.category.toLowerCase().includes(q)
        );
      });
  }, [inventory, stores, catalogue, invStoreFilter, invCategoryFilter, invSearch]);

  const ui = {
    pageBg: isDark ? 'bg-[#000000] text-[#F5F5F7]' : 'bg-[#F5F5F7] text-[#1D1D1F]',
    headerBg: isDark ? 'bg-[#1C1C1E]/90 border-white/[0.08]' : 'bg-white/85 border-black/[0.06]',
    sidebarBg: isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06]',
    cardBg: isDark ? 'bg-[#1C1C1E] border-white/[0.08]' : 'bg-white border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
    subCardBg: isDark ? 'bg-[#2C2C2E] border-white/[0.06]' : 'bg-[#F9F9FB] border-black/[0.04]',
    textPrimary: isDark ? 'text-white' : 'text-[#1D1D1F]',
    mutedText: isDark ? 'text-[#8E8E93]' : 'text-[#86868B]',
    faintText: isDark ? 'text-[#636366]' : 'text-[#A1A1A6]',
    borderCol: isDark ? 'border-white/[0.08]' : 'border-black/[0.06]',
    accentBtn: 'bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-xs rounded-xl font-medium transition-all duration-150',
    secondaryBtn: isDark
      ? 'bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white border border-white/[0.08] rounded-xl'
      : 'bg-black/[0.04] hover:bg-black/[0.07] text-[#1D1D1F] border border-black/[0.06] rounded-xl'
  };

  const currentPageMeta = PAGES_NAVIGATION.find((p) => p.id === activeTab) || PAGES_NAVIGATION[0];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 pb-20 lg:pb-8 ${ui.pageBg}`}>
      {/* ====================================================================
          APPLE-STYLE TOP NAVIGATION HEADER
      ==================================================================== */}
      <header className={`sticky top-0 z-30 border-b ${ui.headerBg} backdrop-blur-xl`}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Left: Mobile Menu Button + Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl border ${ui.secondaryBtn}`}
              aria-label="Toggle Page Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => navigateToPage('dispatch')}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0071E3] flex items-center justify-center text-white font-semibold text-sm shadow-xs">
                SB
              </div>
              <div>
                <div className={`font-semibold tracking-tight text-sm sm:text-base ${ui.textPrimary} leading-tight`}>
                  ShelfBridge
                </div>
                <p className={`text-[11px] hidden sm:block ${ui.mutedText}`}>
                  Inventory Coordination Network
                </p>
              </div>
            </div>
          </div>

          {/* Right: Primary Action + Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateToPage('capture')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${ui.accentBtn}`}
            >
              <Plus className="w-4 h-4" />
              <span>Log Stockout</span>
            </button>

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title="Toggle Theme"
              className={`p-2 rounded-xl border transition-colors ${ui.secondaryBtn}`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-stone-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-black/40 backdrop-blur-xs flex">
          <div className={`w-72 max-w-[80vw] h-full border-r p-4 overflow-y-auto flex flex-col justify-between ${ui.sidebarBg}`}>
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-xs uppercase font-semibold text-[#86868B]">
                  Navigation
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-1">
                {PAGES_NAVIGATION.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateToPage(item.id)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center gap-3 ${
                        isActive
                          ? isDark
                            ? 'bg-white/10 text-white font-semibold'
                            : 'bg-[#0071E3]/10 text-[#0071E3] font-semibold'
                          : isDark
                          ? 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                          : 'text-stone-700 hover:text-stone-950 hover:bg-black/[0.04]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isDark ? 'text-white' : 'text-[#0071E3]') : (isDark ? 'text-zinc-400' : 'text-stone-500')}`} />
                      <span className="text-xs">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`p-3 rounded-xl border mt-4 text-xs ${ui.subCardBg}`}>
              <div className={`text-[11px] ${ui.mutedText}`}>Active Store</div>
              <div className={`font-semibold mt-0.5 ${ui.textPrimary}`}>
                Apex Mobile & Tech
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-16 lg:bottom-5 right-4 z-50 max-w-md animate-slide-up">
          <div
            className={`p-4 rounded-2xl shadow-lg border flex items-start gap-3 ${
              toast.tone === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : toast.tone === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : 'bg-stone-900 text-stone-100 border-stone-700'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.tone === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-semibold text-sm mb-0.5">{toast.title}</div>
              <div className="opacity-90 leading-relaxed">{toast.detail}</div>
            </div>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MAIN LAYOUT: LEFT SIDEBAR NAV + RIGHT PAGE VIEWPORT
      ==================================================================== */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* DESKTOP SIDEBAR NAVIGATION */}
        <aside className={`hidden lg:block lg:col-span-3 xl:col-span-2.5 sticky top-20 rounded-2xl border p-2.5 ${ui.sidebarBg}`}>
          <div className="px-3 py-2 mb-1 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
              Navigation
            </span>
          </div>

          <nav className="space-y-1">
            {PAGES_NAVIGATION.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToPage(item.id)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-white font-semibold'
                        : 'bg-[#0071E3]/10 text-[#0071E3] font-semibold'
                      : isDark
                      ? 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-black/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isDark ? 'text-white' : 'text-[#0071E3]') : (isDark ? 'text-zinc-400' : 'text-stone-500')}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Health Summary Footer inside Sidebar */}
          <div className={`mt-4 p-3.5 rounded-xl border text-xs space-y-2 ${ui.subCardBg}`}>
            <div className="flex items-center justify-between">
              <span className={ui.mutedText}>Recovered Sales:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{metrics.totalRecoveredRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={ui.mutedText}>Net Margin:</span>
              <span className="font-semibold text-[#0071E3]">
                +₹{metrics.totalRetailerContribution.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={ui.mutedText}>Active Holds:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {metrics.reservedCount} locked
              </span>
            </div>
          </div>
        </aside>

        {/* ACTIVE PAGE VIEWPORT */}
        <section className="lg:col-span-9 xl:col-span-9.5 space-y-5 min-w-0">
          {/* Page Header & Quick Metric Strip */}
          <div className={`p-4 rounded-2xl border ${ui.cardBg} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight">
                {currentPageMeta.label}
              </h1>
              <p className={`text-xs mt-0.5 ${ui.mutedText}`}>{currentPageMeta.desc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className={`px-3 py-1.5 rounded-full border ${ui.subCardBg}`}>
                Recovered: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{metrics.totalRecoveredRevenue.toLocaleString('en-IN')}</strong>
              </div>
              <div className={`px-3 py-1.5 rounded-full border ${ui.subCardBg}`}>
                Contrib: <strong className="text-[#0071E3] font-semibold">+₹{metrics.totalRetailerContribution.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* ================================================================
              PAGE 1: OVERVIEW PAGE ('home')
          ================================================================ */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-slide-up">
              {/* Hero Banner */}
              <div className={`p-6 sm:p-8 rounded-2xl border ${ui.cardBg} relative overflow-hidden`}>
                <div className="max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C84B20]/15 text-[#C84B20] text-xs font-mono font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AMD Developer 3 Hackathon · Reinvent Commerce</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
                    Turn Neighbourhood Stockouts Into Verified, High-Margin Recovered Sales.
                  </h2>
                  <p className={`text-sm sm:text-base leading-relaxed ${ui.mutedText}`}>
                    When a customer asks an independent mobile-accessory shop for a 65W GaN charger that is out of stock, the store usually loses the buyer. Meanwhile, another shop 180 metres away has four units sitting unsold. <strong>ShelfBridge</strong> coordinates that commercial transaction end-to-end: capturing unmet demand, verifying electrical compatibility, locking an atomic reservation, and recording net retailer contribution.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigateToPage('dispatch')}
                      className={`px-5 py-3 rounded-xl text-sm font-mono font-bold flex items-center gap-2 ${ui.accentBtn}`}
                    >
                      <span>Launch Live Coordination Desk</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateToPage('capture')}
                      className={`px-4 py-3 rounded-xl text-sm font-mono font-semibold flex items-center gap-2 ${ui.secondaryBtn}`}
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>Open Request Capture Studio</span>
                    </button>
                    <button
                      onClick={() => navigateToPage('matching')}
                      className={`px-4 py-3 rounded-xl text-sm font-mono font-semibold flex items-center gap-2 ${ui.secondaryBtn}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-[#C84B20]" />
                      <span>Inspect 45W Lookalike Safeguard</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 Stakeholder Value Propositions (Section 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    role: 'For Requesting Shop (Shop A)',
                    title: 'Recover Lost Walk-In Sales',
                    metric: '+₹130 Net Contrib / Sale',
                    desc: 'Serve the walk-in customer immediately instead of sending them to a competitor or online marketplace.'
                  },
                  {
                    role: 'For Supplying Shop (Shop B)',
                    title: 'Monetise Idle Shelf Inventory',
                    metric: '₹1,000 Instant B2B Transfer',
                    desc: 'Turn slow-moving or excess SKUs into immediate cash flow without customer acquisition cost.'
                  },
                  {
                    role: 'For The Walk-In Customer',
                    title: 'Verified Product in < 5 Mins',
                    metric: '0 Wrong-Spec Substitutes',
                    desc: 'Get the exact 65W charger or verified compatible unit nearby without walking store to store.'
                  },
                  {
                    role: 'For Neighbourhood Network',
                    title: 'Local Restocking Intelligence',
                    metric: 'Privacy-Safe SKU Deficit Map',
                    desc: 'Reveal repeated unmet demand across the cluster without exposing confidential store ledgers.'
                  }
                ].map((card) => (
                  <div key={card.role} className={`p-5 rounded-2xl border ${ui.cardBg} flex flex-col justify-between`}>
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#C84B20] font-bold">
                        {card.role}
                      </span>
                      <h3 className="text-base font-bold mt-1">{card.title}</h3>
                      <p className={`text-xs mt-2 leading-relaxed ${ui.mutedText}`}>{card.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-stone-200 dark:border-zinc-800 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {card.metric}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 2.2: Why Existing Approaches Do Not Solve It */}
              <div className={`p-6 rounded-2xl border ${ui.cardBg}`}>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                  Section 2.2 · Competitive Differentiation Matrix
                </span>
                <h3 className="text-lg font-bold mt-0.5 mb-4">
                  Why Existing Approaches Fail Independent Neighbourhood Retailers
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${ui.borderCol} font-mono text-[11px] uppercase ${ui.mutedText}`}>
                        <th className="py-3 px-4">Approach</th>
                        <th className="py-3 px-4">Cross-Store Visibility</th>
                        <th className="py-3 px-4">Electrical Spec Safeguard</th>
                        <th className="py-3 px-4">Atomic Stock Hold</th>
                        <th className="py-3 px-4">Preserves Shop Relationship</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                      <tr>
                        <td className="py-3 px-4 font-bold">Manual Phone / WhatsApp</td>
                        <td className="py-3 px-4 text-amber-600 font-mono">Ad-hoc, slow (11m+ wait)</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ High lookalike error risk</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ No hold lock</td>
                        <td className="py-3 px-4 text-emerald-600 font-mono">✓ Yes</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold">Standalone Store POS / ERP</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Isolated single-store</td>
                        <td className="py-3 px-4 text-amber-600 font-mono">SKU string only</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Single store only</td>
                        <td className="py-3 px-4 text-emerald-600 font-mono">✓ Yes</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold">Quick-Commerce / Marketplaces</td>
                        <td className="py-3 px-4 text-emerald-600 font-mono">✓ Dark stores</td>
                        <td className="py-3 px-4 text-amber-600 font-mono">Keyword search</td>
                        <td className="py-3 px-4 text-emerald-600 font-mono">✓ Central warehouse</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Disintermediates local shop</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-bold">Generic AI Chat Copilots</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Cannot query live shelves</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Hallucinates specs</td>
                        <td className="py-3 px-4 text-rose-600 font-mono">✗ Cannot lock DB rows</td>
                        <td className="py-3 px-4 text-amber-600 font-mono">Advisory only</td>
                      </tr>
                      <tr className="bg-emerald-500/10 font-semibold">
                        <td className="py-3 px-4 font-bold text-[#C84B20]">ShelfBridge Network (Ours)</td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-mono">✓ Real-time 300m cluster</td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-mono">✓ 4-Stage deterministic + AI</td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-mono">✓ Atomic time-limited locks</td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-300 font-mono">✓ B2B transfer (+₹130 contrib)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Interactive Directory of All 9 Pages */}
              <div className={`p-6 rounded-2xl border ${ui.cardBg}`}>
                <h3 className="text-base font-bold mb-3">
                  Explore All 9 Dedicated Platform Pages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PAGES_NAVIGATION.map((pg) => {
                    const Icon = pg.icon;
                    return (
                      <button
                        key={pg.id}
                        onClick={() => navigateToPage(pg.id)}
                        className={`p-4 rounded-xl border text-left transition-all hover:border-[#C84B20] flex items-start gap-3 ${ui.subCardBg}`}
                      >
                        <div className="p-2 rounded-lg bg-[#C84B20]/15 text-[#C84B20] shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm truncate">{pg.label}</span>
                            <ChevronRight className="w-4 h-4 text-[#C84B20] shrink-0" />
                          </div>
                          <p className={`text-xs mt-1 ${ui.mutedText}`}>{pg.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 2: COORDINATION DESK ('dispatch')
          ================================================================ */}
          {activeTab === 'dispatch' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-slide-up">
              <div className="xl:col-span-4 space-y-4">
                <div className={`rounded-xl border ${ui.cardBg} overflow-hidden`}>
                  <div className={`px-4 py-3 border-b ${ui.borderCol} flex items-center justify-between`}>
                    <div>
                      <h2 className="font-bold text-sm flex items-center gap-2">
                        <span>Unmet-Demand Request Ledger</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#C84B20]/15 text-[#C84B20]">
                          {requests.length}
                        </span>
                      </h2>
                      <p className={`text-xs ${ui.mutedText}`}>
                        Select any request to coordinate matching & reservation
                      </p>
                    </div>
                    <button
                      onClick={() => navigateToPage('capture')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold ${ui.accentBtn}`}
                    >
                      + Studio
                    </button>
                  </div>

                  <div className="divide-y divide-stone-200 dark:divide-zinc-800 max-h-[560px] overflow-y-auto">
                    {requests.map((req) => {
                      const isSelected = req.id === selectedRequest?.id;
                      const reqStore = stores.find((s) => s.id === req.requestingStoreId);
                      const stMeta = STATUS_META[req.status] || STATUS_META.open;
                      const netContrib =
                        req.customerSalePrice -
                        (req.offerDetails?.transferPrice || 1000) -
                        req.deliveryCost -
                        req.platformFee;

                      return (
                        <div
                          key={req.id}
                          onClick={() => setSelectedRequestId(req.id)}
                          className={`p-4 cursor-pointer transition-all ${
                            isSelected
                              ? isDark
                                ? 'bg-[#1F2532] border-l-4 border-l-[#C84B20]'
                                : 'bg-[#FBF6F0] border-l-4 border-l-[#C84B20]'
                              : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#C84B20]">
                                {req.id}
                              </span>
                              <span className={`text-xs font-mono ${ui.mutedText}`}>
                                · {reqStore?.code} ({reqStore?.name.split(' ')[0]})
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                isDark ? stMeta.darkBg : stMeta.bg
                              }`}
                            >
                              {stMeta.label}
                            </span>
                          </div>

                          <div className="font-semibold text-sm leading-snug mb-2">
                            {req.rawQuery}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono mb-2">
                            <span className={`px-2 py-0.5 rounded border ${ui.subCardBg}`}>
                              SKU: {req.requestedSku}
                            </span>
                            <span className={`px-2 py-0.5 rounded border ${ui.subCardBg}`}>
                              {req.requiredSpecs.minWattage}W {req.requiredSpecs.connector}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                              +₹{netContrib} contrib
                            </span>
                          </div>

                          {req.status === 'reserved' && req.reservationDetails && (
                            <div className="mt-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs font-mono">
                              <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold">
                                <Clock className="w-3.5 h-3.5 pulse-dot" />
                                Hold {req.reservationDetails.id}
                              </span>
                              <span className="font-bold tabular-nums text-indigo-800 dark:text-indigo-200">
                                {formatTimer(req.reservationDetails.expiresInSeconds)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedRequest && (
                <div className="xl:col-span-8 space-y-5">
                  <div className={`p-5 rounded-xl border ${ui.cardBg}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-zinc-800">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded bg-[#C84B20] text-white">
                            {selectedRequest.id}
                          </span>
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${
                              isDark
                                ? STATUS_META[selectedRequest.status]?.darkBg
                                : STATUS_META[selectedRequest.status]?.bg
                            }`}
                          >
                            {STATUS_META[selectedRequest.status]?.label}
                          </span>
                          <span className={`text-xs font-mono ${ui.mutedText}`}>
                            Origin: {stores.find((s) => s.id === selectedRequest.requestingStoreId)?.name}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1">
                          {selectedRequest.rawQuery}
                        </h2>
                      </div>

                      <div className={`p-3 rounded-lg border ${ui.subCardBg} text-right font-mono`}>
                        <div className={`text-[10px] uppercase ${ui.mutedText}`}>
                          Customer Sale Value
                        </div>
                        <div className="text-lg font-bold tabular-nums">
                          ₹{selectedRequest.customerSalePrice}
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          Target Contrib: +₹
                          {selectedRequest.customerSalePrice -
                            (selectedRequest.offerDetails?.transferPrice || 1000) -
                            selectedRequest.deliveryCost -
                            selectedRequest.platformFee}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider mb-2">
                        <span className={ui.mutedText}>Transaction State Machine (Deterministic Lifecycle)</span>
                        <span className="text-[#C84B20]">Current state: `{selectedRequest.status}`</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { key: 'matched', label: '1. Matched' },
                          { key: 'awaiting_supplier', label: '2. Supplier Ping' },
                          { key: 'offered', label: '3. Offer Confirmed' },
                          { key: 'reserved', label: '4. Atomic Hold' },
                          { key: 'fulfilled', label: '5. Sale Recovered' }
                        ].map((stage) => {
                          const order = ['open', 'matched', 'awaiting_supplier', 'offered', 'reserved', 'fulfilled'];
                          const currIdx = order.indexOf(selectedRequest.status);
                          const stageIdx = order.indexOf(stage.key);
                          const isPassed = currIdx >= stageIdx && currIdx !== -1;
                          const isActive = selectedRequest.status === stage.key;

                          return (
                            <div
                              key={stage.key}
                              className={`p-2 rounded-lg border text-center font-mono text-xs transition-all ${
                                isActive
                                  ? 'bg-[#C84B20] text-white border-[#C84B20] font-bold shadow-sm'
                                  : isPassed
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 font-semibold'
                                  : `${ui.subCardBg} ${ui.faintText}`
                              }`}
                            >
                              <div className="truncate">{stage.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Active Transaction Action Panel */}
                  {selectedRequest.status !== 'matched' && selectedRequest.status !== 'open' && (
                    <div
                      className={`p-5 rounded-xl border-2 animate-slide-up ${
                        selectedRequest.status === 'fulfilled'
                          ? 'border-emerald-600 bg-emerald-500/10'
                          : selectedRequest.status === 'reserved'
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-[#C84B20] bg-[#C84B20]/10'
                      }`}
                    >
                      {selectedRequest.status === 'awaiting_supplier' && selectedRequest.offerDetails && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C84B20] block">
                                Step 4 · Supplier Stock & Price Confirmation Required
                              </span>
                              <h3 className="text-base font-bold mt-0.5">
                                Waiting for{' '}
                                {stores.find((s) => s.id === selectedRequest.offerDetails.supplierStoreId)?.name} to
                                verify shelf availability
                              </h3>
                            </div>
                            <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-semibold">
                              Supplier Perspective Action
                            </span>
                          </div>

                          <div className={`p-3.5 rounded-lg border ${ui.cardBg} grid grid-cols-1 sm:grid-cols-3 gap-3 items-end`}>
                            <div>
                              <label className={`text-xs font-mono block mb-1 ${ui.mutedText}`}>
                                Transfer Price to Requesting Shop (₹)
                              </label>
                              <input
                                type="number"
                                value={customTransferPrice}
                                onChange={(e) => setCustomTransferPrice(e.target.value)}
                                className={`w-full px-3 py-1.5 rounded border font-mono text-sm ${ui.subCardBg}`}
                              />
                            </div>
                            <div>
                              <label className={`text-xs font-mono block mb-1 ${ui.mutedText}`}>
                                Reservation Hold Window (Minutes)
                              </label>
                              <select
                                value={customHoldMins}
                                onChange={(e) => setCustomHoldMins(Number(e.target.value))}
                                className={`w-full px-3 py-1.5 rounded border font-mono text-sm ${ui.subCardBg}`}
                              >
                                <option value={10}>10 mins hold</option>
                                <option value={15}>15 mins hold (Standard)</option>
                                <option value={30}>30 mins hold</option>
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleSupplierConfirmOffer(selectedRequest.id, customTransferPrice, customHoldMins)
                                }
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 ${ui.accentBtn}`}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Confirm Shelf Stock & Price
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'offered' && selectedRequest.offerDetails && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 block">
                                Step 5 · Supplier Confirmed Offer — Ready to Reserve Stock
                              </span>
                              <h3 className="text-base font-bold mt-0.5">
                                {selectedRequest.offerDetails.confirmedBy} confirmed {selectedRequest.quantity} unit at ₹
                                {selectedRequest.offerDetails.transferPrice} ({selectedRequest.offerDetails.holdMinutes}m
                                hold)
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handleAcceptAndReserve(selectedRequest.id)}
                                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
                              >
                                <Lock className="w-4 h-4" />
                                Accept Offer & Lock Atomic Reservation
                              </button>
                              <button
                                onClick={() => handleCancelReservation(selectedRequest.id)}
                                className={`px-3 py-2.5 rounded-lg text-xs font-mono ${ui.secondaryBtn}`}
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'reserved' && selectedRequest.reservationDetails && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                  Step 6 · Atomic Reservation Lock Active ({selectedRequest.reservationDetails.id})
                                </span>
                                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-600 text-white tabular-nums">
                                  Hold Timer: {formatTimer(selectedRequest.reservationDetails.expiresInSeconds)}
                                </span>
                              </div>
                              <h3 className="text-base font-bold mt-1">
                                1 unit locked at{' '}
                                {stores.find((s) => s.id === selectedRequest.offerDetails?.supplierStoreId)?.name}.
                                Available stock decremented atomically.
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => handleCompleteFulfilment(selectedRequest.id)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Record Handover & Complete Sale
                              </button>
                              <button
                                onClick={() => handleCancelReservation(selectedRequest.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-600/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-600/20"
                              >
                                Cancel Hold & Release Stock
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'fulfilled' && selectedRequest.offerDetails && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 block">
                              Transaction Completed ({selectedRequest.reservationDetails?.completedAt})
                            </span>
                            <h3 className="text-base font-semibold mt-0.5">
                              Lost sale recovered via{' '}
                              {stores.find((s) => s.id === selectedRequest.offerDetails.supplierStoreId)?.name}!
                            </h3>
                            <p className={`text-xs mt-1 ${ui.mutedText}`}>
                              Sale: ₹{selectedRequest.customerSalePrice} − Transfer: ₹
                              {selectedRequest.offerDetails.transferPrice} − Runner: ₹{selectedRequest.deliveryCost} −
                              Platform Fee: ₹{selectedRequest.platformFee} ={' '}
                              <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                +₹
                                {selectedRequest.customerSalePrice -
                                  selectedRequest.offerDetails.transferPrice -
                                  selectedRequest.deliveryCost -
                                  selectedRequest.platformFee}{' '}
                                Incremental Contribution
                              </strong>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidate List */}
                  <div className={`rounded-2xl border ${ui.cardBg} overflow-hidden`}>
                    <div className={`px-5 py-4 border-b ${ui.borderCol} flex flex-wrap items-center justify-between gap-2`}>
                      <div>
                        <h3 className="font-semibold text-base flex items-center gap-2">
                          <span>Nearby Store Candidates & Spec Verification</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">
                            {candidatesForSelectedRequest.length} found
                          </span>
                        </h3>
                        <p className={`text-xs mt-0.5 ${ui.mutedText}`}>
                          Exact matches first → Verified substitutes second → Incompatible blocked
                        </p>
                      </div>
                    </div>

                    <div className="divide-y divide-stone-200 dark:divide-zinc-800">
                      {candidatesForSelectedRequest.map((cand, index) => {
                        const isExact = cand.matchTier === 'exact';
                        const isSub = cand.matchTier === 'substitute';
                        const isIncomp = cand.matchTier === 'incompatible';
                        const isSelectedCand = selectedRequest.selectedCandidateId === cand.candidateId;

                        return (
                          <div
                            key={cand.candidateId}
                            className={`p-5 transition-all ${
                              isIncomp
                                ? isDark
                                  ? 'bg-rose-950/15'
                                  : 'bg-rose-50/50'
                                : isSelectedCand
                                ? isDark
                                  ? 'bg-indigo-950/20'
                                  : 'bg-amber-50/70'
                                : ''
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="space-y-1.5 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                    #{index + 1} · {cand.store.code}
                                  </span>
                                  <span className="font-bold text-sm">{cand.store.name}</span>
                                  <span className={`text-xs font-mono ${ui.mutedText}`}>
                                    ({cand.store.distanceLabel})
                                  </span>
                                  <span
                                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                                      isExact
                                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                                        : isSub
                                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                                        : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/40'
                                    }`}
                                  >
                                    {cand.matchLabel}
                                  </span>
                                </div>

                                <div className="text-base font-bold flex flex-wrap items-center gap-2">
                                  <span>{cand.product.name}</span>
                                  <span className={`text-xs font-mono font-normal ${ui.mutedText}`}>
                                    SKU: {cand.product.sku}
                                  </span>
                                </div>

                                <div className={`mt-2 p-3 rounded-lg border text-xs space-y-1 ${ui.subCardBg}`}>
                                  {cand.stageExplanation.map((line, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="font-mono text-[11px] text-[#C84B20] font-bold">→</span>
                                      <span className={isIncomp && i === 0 ? 'font-semibold text-rose-600 dark:text-rose-400' : ''}>
                                        {line}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className={`p-3.5 rounded-xl border ${ui.subCardBg} w-full sm:w-auto min-w-[230px] flex flex-col justify-between space-y-3`}>
                                <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-700 pb-2">
                                  <div>
                                    <span className={`text-[10px] font-mono uppercase block ${ui.faintText}`}>
                                      Available Stock
                                    </span>
                                    <span
                                      className={`text-lg font-mono font-bold tabular-nums ${
                                        cand.availableQty > 0
                                          ? 'text-emerald-700 dark:text-emerald-400'
                                          : 'text-rose-600'
                                      }`}
                                    >
                                      {cand.availableQty} unit{cand.availableQty === 1 ? '' : 's'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[10px] font-mono uppercase block ${ui.faintText}`}>
                                      Transfer Ask
                                    </span>
                                    <span className="text-lg font-mono font-bold tabular-nums">
                                      ₹{cand.inventory.transferPrice}
                                    </span>
                                    <span className="text-[10px] font-mono block text-emerald-700 dark:text-emerald-400 font-semibold">
                                      Net +₹{cand.estimatedContribution} contrib
                                    </span>
                                  </div>
                                </div>

                                {isIncomp ? (
                                  <div className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200/50 text-xs font-medium flex items-center justify-center gap-1.5">
                                    <XCircle className="w-4 h-4 text-rose-500" />
                                    <span>Incompatible Spec ({cand.product.attributes.wattage}W &lt; {selectedRequest.requiredSpecs.minWattage}W)</span>
                                  </div>
                                ) : selectedRequest.status === 'matched' || selectedRequest.status === 'open' ? (
                                  <button
                                    onClick={() => handlePingSupplier(cand)}
                                    disabled={!cand.canReserve}
                                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 ${
                                      cand.canReserve
                                        ? ui.accentBtn
                                        : 'bg-stone-200 dark:bg-zinc-800 text-stone-400 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>
                                      {isSub ? 'Select Substitute' : 'Request Transfer'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePingSupplier(cand)}
                                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium ${ui.secondaryBtn}`}
                                  >
                                    Switch Store
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              PAGE 3: REQUEST CAPTURE STUDIO & BARCODE/HINGLISH PARSER ('capture')
          ================================================================ */}
          {activeTab === 'capture' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-slide-up">
              {/* Left 7 Cols: Fast Request Entry & Hinglish AI Parser */}
              <div className={`lg:col-span-7 p-6 rounded-2xl border ${ui.cardBg} space-y-5`}>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                    Surface A · Fast Unmet-Demand Capture Studio
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    Log Customer Stockout Request in &lt; 10 Seconds
                  </h2>
                  <p className={`text-xs mt-1 ${ui.mutedText}`}>
                    Supports conversational Hindi/English (Hinglish) notes, structured electrical spec extraction, or 1-tap GTIN barcode scanning.
                  </p>
                </div>

                <form onSubmit={handleCreateRequestSubmit} className="space-y-4">
                  <div>
                    <label className={`text-xs font-mono block mb-2 ${ui.mutedText}`}>
                      1. Try a Real-World Hinglish / Retail Counter Query Preset:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleParseMessyQuery('charger65')}
                        className={`p-2.5 rounded-xl text-left text-xs font-mono border ${ui.secondaryBtn}`}
                      >
                        <div className="font-bold text-[#C84B20]">⚡ 65W USB-C Laptop/S24 Charger</div>
                        <div className="text-[11px] opacity-80 truncate">"Bhaiya S24 Ultra aur MacBook ke liye 65W..."</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleParseMessyQuery('cable100')}
                        className={`p-2.5 rounded-xl text-left text-xs font-mono border ${ui.secondaryBtn}`}
                      >
                        <div className="font-bold text-[#C84B20]">🔌 100W 5A E-Marker 2m Cable</div>
                        <div className="text-[11px] opacity-80 truncate">"Need 2m braided Type-C 100W E-Marker..."</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleParseMessyQuery('powerbank65')}
                        className={`p-2.5 rounded-xl text-left text-xs font-mono border ${ui.secondaryBtn}`}
                      >
                        <div className="font-bold text-[#C84B20]">🔋 20,000mAh 65W PD Power Bank</div>
                        <div className="text-[11px] opacity-80 truncate">"20000mAh power bank for Dell Type-C..."</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleParseMessyQuery('wireless15')}
                        className={`p-2.5 rounded-xl text-left text-xs font-mono border ${ui.secondaryBtn}`}
                      >
                        <div className="font-bold text-[#C84B20]">🧲 Qi2 15W MagSafe Wireless Pad</div>
                        <div className="text-[11px] opacity-80 truncate">"iPhone 15 Pro ke liye Qi2 15W pad..."</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-mono font-bold block mb-1">
                      2. Raw Shopkeeper Note / Customer Request
                    </label>
                    <textarea
                      rows={3}
                      value={newReqInput}
                      onChange={(e) => setNewReqInput(e.target.value)}
                      required
                      className={`w-full p-3 rounded-xl border text-sm ${ui.subCardBg}`}
                    />
                    {isParsingAI && (
                      <div className="text-xs font-mono text-[#C84B20] mt-1.5 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> AMD ROCm Local LLM extracting structured electrical specs...
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Product Category</label>
                      <select
                        value={newReqCategory}
                        onChange={(e) => setNewReqCategory(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      >
                        <option value="Charger">Charger</option>
                        <option value="Cable">Cable</option>
                        <option value="Power Bank">Power Bank</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Matched Catalogue SKU</label>
                      <select
                        value={newReqSku}
                        onChange={(e) => setNewReqSku(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      >
                        {catalogue.map((c) => (
                          <option key={c.id} value={c.sku}>
                            {c.sku} ({c.brand})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Min Wattage (W)</label>
                      <input
                        type="number"
                        value={newReqMinWattage}
                        onChange={(e) => setNewReqMinWattage(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Connector Spec</label>
                      <input
                        type="text"
                        value={newReqConnector}
                        onChange={(e) => setNewReqConnector(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Required Protocols</label>
                      <input
                        type="text"
                        value={newReqProtocols}
                        onChange={(e) => setNewReqProtocols(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Customer Sale Price (₹)</label>
                      <input
                        type="number"
                        value={newReqSalePrice}
                        onChange={(e) => setNewReqSalePrice(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                    <div className={`p-3 rounded-xl border ${ui.subCardBg} flex items-center justify-between`}>
                      <span>Customer Wait Window (Mins):</span>
                      <select
                        value={newReqDeadline}
                        onChange={(e) => setNewReqDeadline(Number(e.target.value))}
                        className="px-2 py-1 rounded border bg-transparent font-bold"
                      >
                        <option value={10}>10 mins</option>
                        <option value={15}>15 mins</option>
                        <option value={30}>30 mins</option>
                      </select>
                    </div>

                    <label className={`p-3 rounded-xl border ${ui.subCardBg} flex items-center gap-2 cursor-pointer`}>
                      <input
                        type="checkbox"
                        checked={newReqAllowSub}
                        onChange={(e) => setNewReqAllowSub(e.target.checked)}
                        className="rounded accent-[#C84B20]"
                      />
                      <span>Allow verified compatible substitutes</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3 rounded-xl font-mono text-sm font-bold flex items-center justify-center gap-2 ${ui.accentBtn}`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Create Request & Run 4-Stage Neighbourhood Matcher</span>
                  </button>
                </form>
              </div>

              {/* Right 5 Cols: Interactive Barcode / GTIN Scanner Simulator */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`p-6 rounded-2xl border ${ui.cardBg} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-[#86868B] font-semibold">
                        Instant Lookup
                      </span>
                      <h3 className="text-base font-semibold mt-0.5">
                        Barcode & Box Scanner
                      </h3>
                    </div>
                    <Barcode className="w-5 h-5 text-[#0071E3]" />
                  </div>

                  {/* Clean Scanner Box */}
                  <div className="relative h-28 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center justify-center p-4">
                    <Barcode className="w-10 h-10 text-stone-500 mb-1" />
                    <div className={`text-xs font-semibold tracking-wider ${ui.textPrimary}`}>{scannedBarcode}</div>
                    <div className="text-[11px] text-[#0071E3] mt-0.5">
                      Ready to Scan Box or Enter GTIN
                    </div>
                  </div>

                  <p className={`text-xs ${ui.mutedText}`}>
                    Select any catalogue product below to test instant barcode fill:
                  </p>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {catalogue.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleScanBarcodePreset(prod)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          scannedBarcode === prod.barcode
                            ? 'border-[#0071E3] bg-[#0071E3]/5'
                            : `${ui.subCardBg} hover:border-[#0071E3]/40`
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-[#0071E3]">
                            {prod.barcode} · {prod.sku}
                          </div>
                          <div className="text-xs font-medium mt-0.5">{prod.name}</div>
                        </div>
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 shrink-0 font-medium">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 4: 4-STAGE MATCH & ELECTRICAL SAFEGUARD INSPECTOR ('matching')
          ================================================================ */}
          {activeTab === 'matching' && selectedRequest && (
            <div className="space-y-5 animate-slide-up">
              {/* Pipeline Stage Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  {
                    stage: 'Stage 1 · Deterministic',
                    title: 'Exact Barcode & SKU Match',
                    status: '1 Exact Match Found (Shop B)',
                    desc: 'Checks GTIN-12/13 barcode and normalised brand + model number first.'
                  },
                  {
                    stage: 'Stage 2 · Safety Filter',
                    title: 'Electrical Spec Guardrail',
                    status: '1 Lookalike Blocked (Shop C 45W)',
                    desc: 'Verifies connector, minimum wattage (≥65W), and PD/PPS protocol compliance.'
                  },
                  {
                    stage: 'Stage 3 · Fuzzy + ROCm',
                    title: 'BM25 + Embedding Rerank',
                    status: '18.4ms ROCm Inference',
                    desc: 'Retrieves compatible substitutes (Samsung 65W Trio) when names differ.'
                  },
                  {
                    stage: 'Stage 4 · Explainability',
                    title: 'Human Confirmation Gate',
                    status: 'Explicit Spec Evidence Shown',
                    desc: 'Separates Exact Matches from Substitutes and requires retailer sign-off.'
                  }
                ].map((st) => (
                  <div key={st.stage} className={`p-4 rounded-xl border ${ui.cardBg}`}>
                    <span className="text-[10px] font-mono uppercase text-[#C84B20] font-bold">
                      {st.stage}
                    </span>
                    <div className="font-bold text-sm mt-1">{st.title}</div>
                    <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                      {st.status}
                    </div>
                    <p className={`text-xs mt-1.5 ${ui.mutedText}`}>{st.desc}</p>
                  </div>
                ))}
              </div>

              {/* Side-by-Side Spec Comparison Matrix */}
              <div className={`p-5 rounded-2xl border ${ui.cardBg}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 7.4 · Explainable Compatibility Matrix
                    </span>
                    <h2 className="text-lg font-bold mt-0.5">
                      Side-by-Side Electrical Attribute Verification for {selectedRequest.id} ({selectedRequest.requestedSku})
                    </h2>
                  </div>
                  <select
                    value={selectedRequest.id}
                    onChange={(e) => setSelectedRequestId(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${ui.subCardBg}`}
                  >
                    {requests.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} · {r.requestedSku} ({r.requiredSpecs.minWattage}W)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${ui.borderCol} text-[10px] uppercase ${ui.mutedText}`}>
                        <th className="py-3 px-3">Store & Candidate Product</th>
                        <th className="py-3 px-3">SKU & GTIN Check</th>
                        <th className="py-3 px-3">Wattage Check (Req ≥{selectedRequest.requiredSpecs.minWattage}W)</th>
                        <th className="py-3 px-3">Connector & Protocols</th>
                        <th className="py-3 px-3 text-right">Available</th>
                        <th className="py-3 px-3 text-right">Net Contrib</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                      {candidatesForSelectedRequest.map((cand) => (
                        <tr
                          key={cand.candidateId}
                          className={cand.matchTier === 'incompatible' ? 'bg-rose-500/10' : ''}
                        >
                          <td className="py-3.5 px-3 font-sans">
                            <div className="font-bold text-sm">{cand.product.name}</div>
                            <div className={`text-xs font-mono ${ui.mutedText}`}>
                              {cand.store.code} · {cand.store.name} ({cand.store.distanceLabel})
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="font-bold">{cand.product.sku}</div>
                            <span
                              className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] ${
                                cand.isExactSku
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {cand.isExactSku ? 'EXACT SKU/GTIN' : 'DIFFERENT MODEL'}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2 py-1 rounded font-bold ${
                                cand.wattagePass
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-rose-600 text-white'
                              }`}
                            >
                              {cand.product.attributes.wattage}W{' '}
                              {cand.wattagePass ? '✓ PASS' : `✗ FAIL (<${selectedRequest.requiredSpecs.minWattage}W)`}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div>{cand.product.attributes.connector}</div>
                            <div className={`text-[10px] ${ui.mutedText}`}>
                              {cand.product.attributes.protocols.join(', ')}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold">{cand.availableQty} units</td>
                          <td className="py-3.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                            +₹{cand.estimatedContribution}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            {cand.matchTier === 'incompatible' ? (
                              <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-[11px]">
                                Blocked
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  handlePingSupplier(cand);
                                  navigateToPage('dispatch');
                                }}
                                className={`px-3 py-1.5 rounded-lg font-bold text-xs ${ui.accentBtn}`}
                              >
                                Ping Store →
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 5: ACTIVE OFFERS, ATOMIC RESERVATIONS & HANDOVER HUB ('reservations')
          ================================================================ */}
          {activeTab === 'reservations' && (
            <div className="space-y-5 animate-slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 8 Cols: Active Holds & Offers */}
                <div className={`lg:col-span-8 p-5 rounded-2xl border ${ui.cardBg} space-y-4`}>
                  <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                        Surface C & Section 7.5 · Atomic Reservation Consistency
                      </span>
                      <h2 className="text-lg font-bold mt-0.5">
                        Active Time-Limited Stock Holds & Handover Verification
                      </h2>
                    </div>
                    <Lock className="w-5 h-5 text-indigo-500" />
                  </div>

                  <div className="space-y-3">
                    {requests.map((req) => {
                      const supplier = stores.find((s) => s.id === req.offerDetails?.supplierStoreId);
                      const requester = stores.find((s) => s.id === req.requestingStoreId);
                      const stMeta = STATUS_META[req.status] || STATUS_META.open;

                      return (
                        <div key={req.id} className={`p-4 rounded-xl border ${ui.subCardBg} space-y-3`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="font-bold text-[#C84B20]">{req.id}</span>
                              <span>·</span>
                              <span className="font-bold">{req.requestedSku}</span>
                              <span
                                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                  isDark ? stMeta.darkBg : stMeta.bg
                                }`}
                              >
                                {stMeta.label}
                              </span>
                            </div>
                            {req.reservationDetails && req.status === 'reserved' && (
                              <span className="px-2.5 py-1 rounded bg-indigo-600 text-white font-mono text-xs font-bold tabular-nums">
                                Expires in {formatTimer(req.reservationDetails.expiresInSeconds)}
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-semibold">{req.rawQuery}</div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                            <div>
                              <span className={`text-[10px] block ${ui.faintText}`}>Requesting Store</span>
                              <span className="font-bold">{requester?.name}</span>
                            </div>
                            <div>
                              <span className={`text-[10px] block ${ui.faintText}`}>Supplying Store</span>
                              <span className="font-bold">{supplier ? supplier.name : 'Pending Selection'}</span>
                            </div>
                            <div>
                              <span className={`text-[10px] block ${ui.faintText}`}>Transfer Terms</span>
                              <span className="font-bold">
                                ₹{req.offerDetails?.transferPrice || 1000} (+₹{req.deliveryCost} runner)
                              </span>
                            </div>
                            <div>
                              <span className={`text-[10px] block ${ui.faintText}`}>Handover PIN</span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {req.reservationDetails?.handoverCode || 'Generated on Lock'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-zinc-700">
                            {req.status === 'reserved' && (
                              <>
                                <button
                                  onClick={() => handleCompleteFulfilment(req.id)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify Handover & Complete Sale
                                </button>
                                <button
                                  onClick={() => handleCancelReservation(req.id)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-mono text-xs font-semibold"
                                >
                                  Cancel Hold & Release Stock
                                </button>
                              </>
                            )}
                            {req.status !== 'reserved' && (
                              <button
                                onClick={() => {
                                  setSelectedRequestId(req.id);
                                  navigateToPage('dispatch');
                                }}
                                className={`px-3 py-1.5 rounded-lg font-mono text-xs ${ui.secondaryBtn}`}
                              >
                                Manage in Coordination Desk →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 4 Cols: Concurrency & Double-Booking Simulator */}
                <div className={`lg:col-span-4 p-5 rounded-2xl border ${ui.cardBg} space-y-4`}>
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#86868B] font-semibold">
                      Reliability & Protection
                    </span>
                    <h3 className="text-base font-semibold mt-0.5">
                      Atomic Hold Guarantees
                    </h3>
                  </div>
                  <div className={`p-4 rounded-2xl border text-xs space-y-3 ${ui.subCardBg}`}>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>15-Minute Expiry:</strong> Holds automatically release if unfulfilled, restoring item to store stock.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Zero Double-Booking:</strong> Available inventory is locked atomically at the moment of reservation.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Handover PIN:</strong> Counter staff enter the 4-digit PIN upon runner pickup to settle payment.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 6: MULTI-STORE INVENTORY & CATALOGUE ('inventory')
          ================================================================ */}
          {activeTab === 'inventory' && (
            <div className="space-y-5 animate-slide-up">
              <div className={`p-5 rounded-xl border ${ui.cardBg} flex flex-wrap items-center justify-between gap-4`}>
                <div>
                  <h2 className="text-lg font-bold">
                    Neighbourhood Multi-Store Inventory & Reservation Ledger
                  </h2>
                  <p className={`text-xs ${ui.mutedText}`}>
                    Formula enforced: `available_quantity = on_hand_quantity − active_reserved_quantity`
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className={`w-4 h-4 absolute left-3 top-2.5 ${ui.mutedText}`} />
                    <input
                      type="text"
                      placeholder="Filter SKU, barcode, wattage..."
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      className={`pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono ${ui.subCardBg}`}
                    />
                  </div>

                  <select
                    value={invStoreFilter}
                    onChange={(e) => setInvStoreFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${ui.subCardBg}`}
                  >
                    <option value="all">All Stores ({stores.length})</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} · {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={invCategoryFilter}
                    onChange={(e) => setInvCategoryFilter(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono ${ui.subCardBg}`}
                  >
                    <option value="all">All Categories</option>
                    <option value="Charger">Chargers</option>
                    <option value="Cable">Cables</option>
                    <option value="Power Bank">Power Banks</option>
                  </select>

                  <button
                    onClick={handleExportInventoryCsv}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 ${ui.secondaryBtn}`}
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>

                  <button
                    onClick={() => setShowAddStockModal(true)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${ui.accentBtn}`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Update Shelf Stock
                  </button>
                </div>
              </div>

              <div className={`rounded-xl border ${ui.cardBg} overflow-x-auto`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${ui.borderCol} text-[11px] font-mono uppercase ${ui.mutedText}`}>
                      <th className="py-3.5 px-4">Store Node</th>
                      <th className="py-3.5 px-4">SKU & Barcode (GTIN)</th>
                      <th className="py-3.5 px-4">Standardised Product & Technical Specs</th>
                      <th className="py-3.5 px-4 text-right">On-Hand</th>
                      <th className="py-3.5 px-4 text-right">Reserved</th>
                      <th className="py-3.5 px-4 text-right">Available</th>
                      <th className="py-3.5 px-4 text-right">Transfer Ask</th>
                      <th className="py-3.5 px-4 text-right">Last Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-zinc-800 text-xs">
                    {filteredInventory.map((row) => (
                      <tr key={row.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015]">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-[#C84B20]">{row.store.code}</span>
                          <div className="font-sans font-semibold text-xs">{row.store.name}</div>
                          <div className={`text-[10px] ${ui.faintText}`}>{row.store.distanceLabel}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold">{row.product.sku}</div>
                          <div className={`text-[11px] ${ui.mutedText}`}>GTIN: {row.product.barcode}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-sm">{row.product.name}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1 font-mono text-[11px]">
                            <span className={`px-1.5 py-0.2 rounded border ${ui.subCardBg}`}>
                              {row.product.attributes.wattage}W · {row.product.attributes.connector}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded border ${ui.subCardBg}`}>
                              {row.product.attributes.protocols.join(', ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-sm">
                          {row.onHand}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          {row.reserved > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold">
                              {row.reserved} locked
                            </span>
                          ) : (
                            <span className={ui.faintText}>0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-sm">
                          <span
                            className={`px-2.5 py-1 rounded ${
                              row.available > 0
                                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {row.available}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          <div className="font-bold">₹{row.transferPrice}</div>
                          <div className={`text-[10px] ${ui.faintText}`}>MRP ₹{row.product.mrp}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                          {row.lastUpdated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 7: PARTNER STORE NETWORK & PILOT ONBOARDING ('network')
          ================================================================ */}
          {activeTab === 'network' && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Participating Stores Cards */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stores.map((st) => (
                      <div key={st.id} className={`p-5 rounded-2xl border ${ui.cardBg} flex flex-col justify-between`}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded bg-[#C84B20] text-white font-mono text-xs font-bold">
                              {st.code}
                            </span>
                            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                              {st.trustScore}% Trust · {st.avgConfirmMins}m confirm
                            </span>
                          </div>
                          <h3 className="text-base font-bold">{st.name}</h3>
                          <p className={`text-xs mt-0.5 ${ui.mutedText}`}>{st.neighbourhood}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between text-xs font-mono">
                          <span>Owner: {st.owner}</span>
                          <button
                            onClick={() => {
                              setActiveStoreId(st.id);
                              navigateToPage('dispatch');
                            }}
                            className="text-[#C84B20] font-bold hover:underline"
                          >
                            Switch Terminal →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section 5.6: Commercial Risks & Mitigations Table */}
                  <div className={`p-5 rounded-2xl border ${ui.cardBg}`}>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 5.6 · Commercial Risk Engineering
                    </span>
                    <h3 className="text-base font-bold mt-0.5 mb-3">
                      Neighbourhood Network Risks & Built-In Product Mitigations
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {[
                        { risk: 'Inaccurate / Stale Stock', mit: 'Timestamped stock records + mandatory supplier confirmation before reservation lock.' },
                        { risk: 'Lookalike Product Mismatch', mit: 'Deterministic barcode/SKU check first; electrical spec filter blocks 45W vs 65W mismatches.' },
                        { risk: 'Low-Margin Transfers', mit: 'Automatic net contribution check (`Sale − Transfer − Runner − Fee`) before offer acceptance.' },
                        { risk: 'Platform Bypass / Disintermediation', mit: 'Time-limited atomic holds, audit trail, and aggregate restock demand insights keep shops on-network.' }
                      ].map((rm) => (
                        <div key={rm.risk} className={`p-3.5 rounded-xl border ${ui.subCardBg}`}>
                          <div className="font-bold text-[#C84B20] mb-1">{rm.risk}</div>
                          <div className={ui.mutedText}>{rm.mit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Onboard a New Neighbourhood Store Live */}
                <div className={`lg:col-span-4 p-5 rounded-2xl border ${ui.cardBg} space-y-4`}>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 5.5 & 12 · Cold-Start Pilot Expansion
                    </span>
                    <h3 className="text-base font-bold mt-0.5">
                      Onboard New Neighbourhood Shop
                    </h3>
                    <p className={`text-xs mt-1 ${ui.mutedText}`}>
                      Recruit a new mobile-accessory shop in the same commercial block and seed initial stock.
                    </p>
                  </div>

                  <form onSubmit={handleOnboardStoreSubmit} className="space-y-3 text-xs font-mono">
                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Store Name</label>
                      <input
                        type="text"
                        required
                        value={newStoreName}
                        onChange={(e) => setNewStoreName(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Block / Walking Distance</label>
                      <input
                        type="text"
                        required
                        value={newStoreBlock}
                        onChange={(e) => setNewStoreBlock(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Owner / Manager Name</label>
                      <input
                        type="text"
                        required
                        value={newStoreOwner}
                        onChange={(e) => setNewStoreOwner(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>
                    <div>
                      <label className={`block mb-1 ${ui.mutedText}`}>Distance from Shop A (Meters)</label>
                      <input
                        type="number"
                        value={newStoreDistance}
                        onChange={(e) => setNewStoreDistance(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                      />
                    </div>
                    <button
                      type="submit"
                      className={`w-full py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 ${ui.accentBtn}`}
                    >
                      <Plus className="w-4 h-4" /> Add Store to Nehru Place Mesh
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 8: PRIVACY-PRESERVING NETWORK DEMAND INSIGHTS ('demand')
          ================================================================ */}
          {activeTab === 'demand' && (
            <div className="space-y-5 animate-slide-up">
              <div className={`p-5 rounded-2xl border ${ui.cardBg}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Surface E · Privacy-Preserving Network Demand Aggregator
                    </span>
                    <h2 className="text-lg font-bold mt-0.5">
                      Frequently Requested Unmet SKUs in Nehru Place Cluster (Last 7 Days)
                    </h2>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Zero customer PII or competitor ledger exposed
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AGGREGATE_UNMET_DEMAND.map((item) => (
                    <div key={item.sku} className={`p-5 rounded-xl border ${ui.subCardBg} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="font-bold text-[#C84B20]">{item.sku}</span>
                          <span className={ui.mutedText}>Peak: {item.peakWindow}</span>
                        </div>
                        <div className="font-bold text-base leading-snug">{item.name}</div>
                      </div>

                      <div className="my-3 pt-3 border-t border-stone-200 dark:border-zinc-700 grid grid-cols-4 gap-2 font-mono text-xs">
                        <div>
                          <span className={`text-[10px] block ${ui.faintText}`}>Requests</span>
                          <span className="font-bold text-sm">{item.weeklyRequests}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] block ${ui.faintText}`}>Recovered</span>
                          <span className="font-bold text-sm text-emerald-600">{item.recoveredCount}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] block ${ui.faintText}`}>Deficit</span>
                          <span className="font-bold text-sm text-rose-600">{item.unfulfilledCount}</span>
                        </div>
                        <div>
                          <span className={`text-[10px] block ${ui.faintText}`}>Avg Contrib</span>
                          <span className="font-bold text-sm text-[#C84B20]">+₹{item.avgMargin}</span>
                        </div>
                      </div>

                      <div className="text-xs font-mono p-2.5 rounded-lg bg-black/5 dark:bg-white/5">
                        <strong>Stocking Action:</strong> {item.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              PAGE 9: UNIT ECONOMICS, PROFITABILITY & SYSTEM ARCHITECTURE ('economics' / 'architecture')
          ================================================================ */}
          {(activeTab === 'economics' || activeTab === 'architecture') && (
            <div className="space-y-6 animate-slide-up">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className={`lg:col-span-7 p-5 rounded-xl border ${ui.cardBg} space-y-5`}>
                  <div className="border-b border-stone-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                        Section 5.2 · Illustrative Unit Economics & Break-Even Model
                      </span>
                      <h2 className="text-lg font-bold mt-0.5">
                        Interactive Per-Transaction Contribution & Volume Simulator
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setSimSaleValue(1200);
                        setSimTransferPrice(1000);
                        setSimDeliveryCost(50);
                        setSimPlatformFee(20);
                        setSimVariablePlatformCost(5);
                        setSimFixedMonthlyCost(15000);
                        setSimMonthlyTxns(1000);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono ${ui.secondaryBtn}`}
                    >
                      Reset to Plan Defaults
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>Customer Sale Value:</span>
                        <span className="font-bold">₹{simSaleValue}</span>
                      </div>
                      <input
                        type="range"
                        min={600}
                        max={3000}
                        step={50}
                        value={simSaleValue}
                        onChange={(e) => setSimSaleValue(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>

                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>Supplier Transfer Price:</span>
                        <span className="font-bold">₹{simTransferPrice}</span>
                      </div>
                      <input
                        type="range"
                        min={450}
                        max={2500}
                        step={25}
                        value={simTransferPrice}
                        onChange={(e) => setSimTransferPrice(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>

                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>Local Runner / Handling Cost:</span>
                        <span className="font-bold">₹{simDeliveryCost}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={150}
                        step={10}
                        value={simDeliveryCost}
                        onChange={(e) => setSimDeliveryCost(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>

                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>ShelfBridge Success Fee:</span>
                        <span className="font-bold">₹{simPlatformFee}</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={60}
                        step={5}
                        value={simPlatformFee}
                        onChange={(e) => setSimPlatformFee(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>

                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>Monthly Completed Recoveries:</span>
                        <span className="font-bold">{simMonthlyTxns.toLocaleString('en-IN')} txns/mo</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={5000}
                        step={100}
                        value={simMonthlyTxns}
                        onChange={(e) => setSimMonthlyTxns(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>

                    <div className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                      <div className="flex justify-between mb-1">
                        <span>Fixed Monthly Ops Cost:</span>
                        <span className="font-bold">₹{simFixedMonthlyCost.toLocaleString('en-IN')}</span>
                      </div>
                      <input
                        type="range"
                        min={5000}
                        max={50000}
                        step={2500}
                        value={simFixedMonthlyCost}
                        onChange={(e) => setSimFixedMonthlyCost(Number(e.target.value))}
                        className="w-full accent-[#C84B20]"
                      />
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl border ${ui.subCardBg} font-mono text-xs space-y-2.5`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-zinc-700">
                      <span className={ui.mutedText}>Requesting Shop Net Contribution:</span>
                      <span
                        className={`text-sm font-bold ${
                          simMath.requestingShopContribution > 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-rose-600'
                        }`}
                      >
                        ₹{simSaleValue} − ₹{simTransferPrice} − ₹{simDeliveryCost} − ₹{simPlatformFee} = ₹
                        {simMath.requestingShopContribution} / txn
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-zinc-700">
                      <span className={ui.mutedText}>ShelfBridge Contribution / Txn:</span>
                      <span className="text-sm font-bold">
                        ₹{simPlatformFee} fee − ₹{simVariablePlatformCost} var cost = ₹{simMath.platformUnitContribution} / txn
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200 dark:border-zinc-700">
                      <span className={ui.mutedText}>Monthly Break-Even Volume:</span>
                      <span className="text-sm font-bold text-[#C84B20]">
                        ₹{simFixedMonthlyCost.toLocaleString('en-IN')} ÷ ₹{simMath.platformUnitContribution} ={' '}
                        {simMath.breakEvenTxns.toLocaleString('en-IN')} completed txns/mo
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className={ui.mutedText}>Simulated Monthly Platform Net (After Fixed Costs):</span>
                      <span
                        className={`text-base font-bold ${
                          simMath.monthlyNetOperatingProfit >= 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600'
                        }`}
                      >
                        {simMath.monthlyNetOperatingProfit >= 0 ? '+' : ''}₹
                        {simMath.monthlyNetOperatingProfit.toLocaleString('en-IN')} / mo
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-5">
                  <div className={`p-5 rounded-xl border ${ui.cardBg}`}>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 5.3 · Sensitivity to Volume
                    </span>
                    <h3 className="text-base font-bold mt-0.5 mb-3">
                      Monthly Network Scenarios (Click to Load)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className={`border-b ${ui.borderCol} text-[10px] uppercase ${ui.mutedText}`}>
                            <th className="py-2">Scenario</th>
                            <th className="py-2 text-right">Txns/Mo</th>
                            <th className="py-2 text-right">Fee</th>
                            <th className="py-2 text-right">Var Cost</th>
                            <th className="py-2 text-right">Contrib (Pre-Fixed)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                          {[
                            { name: 'Early Pilot', txns: 100, fee: 20, varCost: 5, contrib: '₹1,500' },
                            { name: 'Local Network', txns: 1000, fee: 20, varCost: 5, contrib: '₹15,000' },
                            { name: 'Larger Network', txns: 5000, fee: 25, varCost: 7, contrib: '₹90,000' }
                          ].map((sc) => (
                            <tr
                              key={sc.name}
                              onClick={() => {
                                setSimMonthlyTxns(sc.txns);
                                setSimPlatformFee(sc.fee);
                                setSimVariablePlatformCost(sc.varCost);
                              }}
                              className="cursor-pointer hover:bg-[#C84B20]/10 transition-colors"
                            >
                              <td className="py-2.5 font-bold text-[#C84B20]">{sc.name}</td>
                              <td className="py-2.5 text-right tabular-nums">{sc.txns.toLocaleString('en-IN')}</td>
                              <td className="py-2.5 text-right tabular-nums">₹{sc.fee}</td>
                              <td className="py-2.5 text-right tabular-nums">₹{sc.varCost}</td>
                              <td className="py-2.5 text-right font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {sc.contrib}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={`p-5 rounded-xl border ${ui.cardBg}`}>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 10 · Evaluation Plan Benchmark
                    </span>
                    <h3 className="text-base font-bold mt-0.5 mb-3">
                      Seeded Cohort Comparison (25 Unmet Requests)
                    </h3>
                    <div className="space-y-2.5 text-xs font-mono">
                      <div className={`p-3 rounded-lg border ${ui.subCardBg} flex items-center justify-between`}>
                        <div>
                          <div className="font-bold">1. Isolated Store (No Discovery)</div>
                          <div className={`text-[11px] ${ui.mutedText}`}>Customer walks out or buys online</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-rose-600">0% Fulfilment</div>
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${ui.subCardBg} flex items-center justify-between`}>
                        <div>
                          <div className="font-bold">2. Ad-Hoc WhatsApp / Phone Calls</div>
                          <div className={`text-[11px] ${ui.mutedText}`}>Avg 11.4m delay · 18% wrong spec risk</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-600">24% Fulfilment</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-emerald-800 dark:text-emerald-300">
                            3. ShelfBridge Coordinated Network
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Avg 2.1m to offer · 0% false-positive spec error
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400">76% Fulfilment</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FastAPI Service Contract & Live Audit Trail */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className={`lg:col-span-7 p-5 rounded-xl border ${ui.cardBg} space-y-4`}>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 7 & 8 · Deterministic Backend & AMD ROCm Workload
                    </span>
                    <h3 className="text-base font-bold mt-0.5">
                      FastAPI Service Boundaries & REST API Contract
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className={`border-b ${ui.borderCol} text-[10px] uppercase ${ui.mutedText}`}>
                          <th className="py-2 px-3">Method</th>
                          <th className="py-2 px-3">Endpoint</th>
                          <th className="py-2 px-3">Service Module</th>
                          <th className="py-2 px-3">Responsibility</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
                        {[
                          { m: 'POST', ep: '/api/requests', svc: 'RequestService', desc: 'Capture unmet request + LLM attribute normalisation' },
                          { m: 'GET', ep: '/api/requests/{id}/matches', svc: 'MatchingService', desc: '4-stage deterministic SKU + electrical filter + ROCm rerank' },
                          { m: 'POST', ep: '/api/offers', svc: 'OfferService', desc: 'Supplier confirms shelf stock, transfer price & hold window' },
                          { m: 'POST', ep: '/api/offers/{id}/accept', svc: 'ReservationService', desc: 'Atomic DB row lock (`on_hand - reserved`) & expiry timer' },
                          { m: 'POST', ep: '/api/reservations/{id}/cancel', svc: 'ReservationService', desc: 'Cancel hold & release reserved units exactly once' },
                          { m: 'POST', ep: '/api/fulfilments/{id}/complete', svc: 'FulfilmentService', desc: 'Record handover & compute net incremental contribution' },
                          { m: 'GET', ep: '/api/analytics/summary', svc: 'AnalyticsService', desc: 'Recovered sales, contribution ledger & aggregate demand' }
                        ].map((api) => (
                          <tr key={api.ep}>
                            <td className="py-2 px-3 font-bold text-[#C84B20]">{api.m}</td>
                            <td className="py-2 px-3 font-bold">{api.ep}</td>
                            <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400">{api.svc}</td>
                            <td className={`py-2 px-3 font-sans ${ui.mutedText}`}>{api.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`lg:col-span-5 p-5 rounded-xl border ${ui.cardBg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                        Table: `audit_events`
                      </span>
                      <h3 className="text-base font-bold mt-0.5">
                        Immutable Transaction Audit Trail
                      </h3>
                    </div>
                    <Activity className="w-4 h-4 text-[#C84B20]" />
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
                    {auditLog.map((log) => (
                      <div key={log.id} className={`p-3 rounded-lg border ${ui.subCardBg}`}>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-[#C84B20]">{log.actor}</span>
                          <span className={ui.faintText}>{log.time}</span>
                        </div>
                        <div className="font-sans text-xs leading-relaxed">{log.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ====================================================================
          MOBILE BOTTOM QUICK-NAVIGATION BAR (Responsive Mobile UX)
      ==================================================================== */}
      <nav className={`lg:hidden fixed bottom-0 inset-x-0 z-30 border-t ${ui.headerBg} px-2 py-1.5 grid grid-cols-5 gap-1`}>
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'dispatch', label: 'Dispatch', icon: Zap },
          { id: 'capture', label: 'Capture', icon: ScanLine },
          { id: 'inventory', label: 'Stock', icon: Package },
          { id: 'economics', label: 'Economics', icon: IndianRupee }
        ].map((nav) => {
          const Icon = nav.icon;
          const active = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => navigateToPage(nav.id)}
              className={`py-1.5 rounded-xl flex flex-col items-center justify-center text-[10px] ${
                active ? 'text-[#0071E3] font-semibold' : ui.mutedText
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL 1: FAST UNMET-DEMAND REQUEST CAPTURE */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-2xl border shadow-xl overflow-hidden animate-slide-up ${ui.cardBg}`}>
            <div className={`px-6 py-4 border-b ${ui.borderCol} flex items-center justify-between`}>
              <div>
                <h3 className="text-base font-semibold">Log Customer Stockout</h3>
                <p className={`text-xs ${ui.mutedText}`}>Create a new unmet demand request across the network</p>
              </div>
              <button onClick={() => setShowNewRequestModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="p-6 space-y-4">
              <div>
                <label className={`text-xs font-mono block mb-1.5 ${ui.mutedText}`}>
                  Quick-Load Messy Retail Queries (Hindi/English AI Attribute Extraction):
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleParseMessyQuery('charger65')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${ui.secondaryBtn}`}
                  >
                    ⚡ 65W USB-C GaN Charger (Hinglish)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleParseMessyQuery('cable100')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${ui.secondaryBtn}`}
                  >
                    🔌 100W E-Marker 2m Cable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleParseMessyQuery('powerbank65')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${ui.secondaryBtn}`}
                  >
                    🔋 20,000mAh 65W Laptop Power Bank
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-semibold block mb-1">
                  Raw Customer Request / Model Note
                </label>
                <textarea
                  rows={2}
                  value={newReqInput}
                  onChange={(e) => setNewReqInput(e.target.value)}
                  required
                  className={`w-full p-3 rounded-lg border text-sm ${ui.subCardBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <label className={`block mb-1 ${ui.mutedText}`}>Category</label>
                  <select
                    value={newReqCategory}
                    onChange={(e) => setNewReqCategory(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                  >
                    <option value="Charger">Charger</option>
                    <option value="Cable">Cable</option>
                    <option value="Power Bank">Power Bank</option>
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 ${ui.mutedText}`}>Target SKU / Model</label>
                  <select
                    value={newReqSku}
                    onChange={(e) => setNewReqSku(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                  >
                    {catalogue.map((c) => (
                      <option key={c.id} value={c.sku}>
                        {c.sku} ({c.brand})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block mb-1 ${ui.mutedText}`}>Min Required Wattage (W)</label>
                  <input
                    type="number"
                    value={newReqMinWattage}
                    onChange={(e) => setNewReqMinWattage(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newReqAllowSub}
                    onChange={(e) => setNewReqAllowSub(e.target.checked)}
                    className="rounded accent-[#C84B20]"
                  />
                  <span>Allow verified compatible alternatives</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono ${ui.secondaryBtn}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded-lg text-xs font-mono font-bold ${ui.accentBtn}`}
                  >
                    Run 4-Stage Neighbourhood Match
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: UPDATE STORE SHELF STOCK */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden animate-slide-up ${ui.cardBg}`}>
            <div className={`px-6 py-4 border-b ${ui.borderCol} flex items-center justify-between`}>
              <h3 className="text-base font-bold">Update Store Shelf Inventory</h3>
              <button onClick={() => setShowAddStockModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className={`block mb-1 ${ui.mutedText}`}>Select Store</label>
                <select
                  value={newStockStore}
                  onChange={(e) => setNewStockStore(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${ui.mutedText}`}>Select Catalogue SKU</label>
                <select
                  value={newStockProduct}
                  onChange={(e) => setNewStockProduct(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                >
                  {catalogue.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block mb-1 ${ui.mutedText}`}>Add / Subtract On-Hand Units</label>
                <input
                  type="number"
                  value={newStockDelta}
                  onChange={(e) => setNewStockDelta(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${ui.subCardBg}`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className={`px-4 py-2 rounded-lg ${ui.secondaryBtn}`}
                >
                  Cancel
                </button>
                <button type="submit" className={`px-4 py-2 rounded-lg font-bold ${ui.accentBtn}`}>
                  Commit Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
