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
// UnitEconomicsPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function UnitEconomicsPage(props) {
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
                      Section 7 & 8 · Deterministic Backend & AMD Compute Workload
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
                          { m: 'GET', ep: '/api/requests/{id}/matches', svc: 'MatchingService', desc: '4-stage deterministic SKU + electrical filter + AMD ML rerank' },
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
  );
}
