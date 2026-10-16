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
// OverviewPitchPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function OverviewPitchPage(props) {
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
  );
}
