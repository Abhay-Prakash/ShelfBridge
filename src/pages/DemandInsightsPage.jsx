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
// DemandInsightsPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function DemandInsightsPage(props) {
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
  );
}
