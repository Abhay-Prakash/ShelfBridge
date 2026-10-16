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
// RequestCapturePage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function RequestCapturePage(props) {
  const {
    ui, isDark, stores, catalogue, inventory, requests, selectedRequest,
    setSelectedRequestId, candidatesForSelectedRequest, metrics, simMath,
    filteredInventory, auditLog, navigateToPage, handlePingSupplier,
    handleSupplierConfirmOffer, handleAcceptAndReserve, handleCompleteFulfilment,
    handleCancelReservation, handleSimulateRaceCondition, handleParseMessyQuery,
    handleScanBarcodePreset, handleCreateRequestSubmit, handleOnboardStoreSubmit,
    handleExportInventoryCsv, formatTimer, PAGES_NAVIGATION, STATUS_META,
    AGGREGATE_UNMET_DEMAND, customTransferPrice, setCustomTransferPrice,
    customHoldMins, setCustomHoldMins, newReqInput, setNewReqInput,
    newReqCategory, setNewReqCategory, newReqSku, setNewReqSku,
    newReqMinWattage, setNewReqMinWattage, newReqConnector, setNewReqConnector,
    newReqProtocols, setNewReqProtocols, newReqSalePrice, setNewReqSalePrice,
    newReqDeadline, setNewReqDeadline, newReqAllowSub, setNewReqAllowSub,
    isParsingAI, scannedBarcode, invSearch, setInvSearch, invStoreFilter,
    setInvStoreFilter, invCategoryFilter, setInvCategoryFilter,
    setShowAddStockModal, setActiveStoreId, newStoreName, setNewStoreName,
    newStoreBlock, setNewStoreBlock, newStoreOwner, setNewStoreOwner,
    newStoreDistance, setNewStoreDistance, simSaleValue, setSimSaleValue,
    simTransferPrice, setSimTransferPrice, simDeliveryCost, setSimDeliveryCost,
    simPlatformFee, setSimPlatformFee, simVariablePlatformCost,
    setSimVariablePlatformCost, simFixedMonthlyCost, setSimFixedMonthlyCost,
    simMonthlyTxns, setSimMonthlyTxns
  } = props;

  return (
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
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                        P1 Feature · GTIN / Barcode Scanner
                      </span>
                      <h3 className="text-base font-bold mt-0.5">
                        Optical Box / Barcode Scanner Simulator
                      </h3>
                    </div>
                    <Barcode className="w-5 h-5 text-[#C84B20]" />
                  </div>

                  {/* Simulated Viewfinder */}
                  <div className="relative h-36 rounded-xl bg-stone-950 border border-stone-800 flex flex-col items-center justify-center overflow-hidden p-4 text-stone-200 font-mono">
                    <div className="w-full h-0.5 bg-[#C84B20] shadow-[0_0_12px_#C84B20] absolute top-6 laser-line" />
                    <Barcode className="w-12 h-12 text-stone-400 mb-2" />
                    <div className="text-xs font-bold tracking-widest">{scannedBarcode}</div>
                    <div className="text-[10px] text-emerald-400 mt-1">
                      GTIN-12 / EAN-13 Deterministic Lookup Active
                    </div>
                  </div>

                  <p className={`text-xs ${ui.mutedText}`}>
                    Click any product box barcode below to simulate scanning an empty shelf label or customer's old adapter box:
                  </p>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {catalogue.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleScanBarcodePreset(prod)}
                        className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                          scannedBarcode === prod.barcode
                            ? 'border-[#C84B20] bg-[#C84B20]/10'
                            : `${ui.subCardBg} hover:border-[#C84B20]/50`
                        }`}
                      >
                        <div>
                          <div className="font-mono text-xs font-bold text-[#C84B20]">
                            GTIN: {prod.barcode} · {prod.sku}
                          </div>
                          <div className="text-xs font-semibold mt-0.5">{prod.name}</div>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-1 rounded bg-black/10 dark:bg-white/10 shrink-0">
                          Scan Box
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
  );
}
