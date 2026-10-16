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
// StoreNetworkPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function StoreNetworkPage(props) {
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
  );
}
