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
// MatchInspectorPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function MatchInspectorPage(props) {
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
                    stage: 'Stage 3 · Fuzzy + AMD ML',
                    title: 'BM25 + Embedding Rerank',
                    status: '18.4ms AMD Ryzen AVX2 Inference',
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
  );
}
