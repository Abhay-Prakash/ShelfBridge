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
// CoordinationDeskPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function CoordinationDeskPage(props) {
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
                                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Record Handover & Complete Sale
                              </button>
                              <button
                                onClick={handleSimulateRaceCondition}
                                className={`px-3 py-2.5 rounded-lg text-xs font-mono flex items-center gap-1 ${ui.secondaryBtn}`}
                              >
                                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                Test Conflict Lock
                              </button>
                              <button
                                onClick={() => handleCancelReservation(selectedRequest.id)}
                                className="px-3 py-2.5 rounded-lg text-xs font-mono bg-rose-600/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-600/25"
                              >
                                Cancel & Release Stock
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.status === 'fulfilled' && selectedRequest.offerDetails && (
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                              Transaction Completed & Audited ({selectedRequest.reservationDetails?.completedAt})
                            </span>
                            <h3 className="text-base font-bold mt-0.5">
                              Lost sale recovered via{' '}
                              {stores.find((s) => s.id === selectedRequest.offerDetails.supplierStoreId)?.name}!
                            </h3>
                            <p className={`text-xs font-mono mt-1 ${ui.mutedText}`}>
                              Sale: ₹{selectedRequest.customerSalePrice} − Transfer: ₹
                              {selectedRequest.offerDetails.transferPrice} − Runner: ₹{selectedRequest.deliveryCost} −
                              ShelfBridge Fee: ₹{selectedRequest.platformFee} ={' '}
                              <strong className="text-emerald-700 dark:text-emerald-300">
                                +₹
                                {selectedRequest.customerSalePrice -
                                  selectedRequest.offerDetails.transferPrice -
                                  selectedRequest.deliveryCost -
                                  selectedRequest.platformFee}{' '}
                                Incremental Retailer Contribution
                              </strong>
                            </p>
                          </div>
                          <button
                            onClick={() => navigateToPage('economics')}
                            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 ${ui.secondaryBtn}`}
                          >
                            <span>Inspect Full Unit Economics</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidate List */}
                  <div className={`rounded-xl border ${ui.cardBg} overflow-hidden`}>
                    <div className={`px-5 py-4 border-b ${ui.borderCol} flex flex-wrap items-center justify-between gap-2`}>
                      <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                          <span>Nearby Stock Candidates & Compatibility Safeguards</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-200 dark:bg-zinc-800">
                            {candidatesForSelectedRequest.length} evaluated
                          </span>
                        </h3>
                        <p className={`text-xs ${ui.mutedText}`}>
                          Exact matches first → Verified substitutes second → Incompatible lookalikes blocked
                        </p>
                      </div>
                      <button
                        onClick={() => navigateToPage('matching')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1 ${ui.secondaryBtn}`}
                      >
                        <Eye className="w-3.5 h-3.5" /> Open Full 4-Stage Inspector
                      </button>
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
                                  <button
                                    onClick={() => handlePingSupplier(cand)}
                                    className="w-full py-2 px-3 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-mono text-xs font-bold flex items-center justify-center gap-1.5"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Safeguard Blocked ({cand.product.attributes.wattage}W &lt; {selectedRequest.requiredSpecs.minWattage}W)
                                  </button>
                                ) : selectedRequest.status === 'matched' || selectedRequest.status === 'open' ? (
                                  <button
                                    onClick={() => handlePingSupplier(cand)}
                                    disabled={!cand.canReserve}
                                    className={`w-full py-2 px-3 rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 ${
                                      cand.canReserve
                                        ? ui.accentBtn
                                        : 'bg-stone-300 dark:bg-zinc-800 text-stone-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>
                                      {isSub ? 'Confirm Substitute w/ Shop' : '1-Click Ping Supplier Stock'}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePingSupplier(cand)}
                                    className={`w-full py-1.5 px-3 rounded-lg font-mono text-xs ${ui.secondaryBtn}`}
                                  >
                                    Switch Counterparty
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
  );
}
