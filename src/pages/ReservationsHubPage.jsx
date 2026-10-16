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
// ReservationsHubPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function ReservationsHubPage(props) {
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
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#C84B20] font-bold">
                      Section 7.5 · Concurrency Control
                    </span>
                    <h3 className="text-base font-bold mt-0.5">
                      Row-Level Lock Stress Tester
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed ${ui.mutedText}`}>
                    A reservation only succeeds if `on_hand_quantity - active_reserved_quantity >= requested_quantity` inside an atomic database transaction (`SELECT ... FOR UPDATE`).
                  </p>
                  <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-2 ${ui.subCardBg}`}>
                    <div className="text-[#C84B20] font-bold">BEGIN TRANSACTION;</div>
                    <div>SELECT on_hand, reserved FROM inventory_items</div>
                    <div>WHERE store_id = 'store-b' AND product_id = 'prod-1'</div>
                    <div className="text-emerald-600 font-bold">FOR UPDATE;</div>
                    <div>-- Checks available &gt;= 1 before commit</div>
                    <div className="text-[#C84B20] font-bold">COMMIT;</div>
                  </div>
                  <button
                    onClick={handleSimulateRaceCondition}
                    className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 ${ui.accentBtn}`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simulate Competing Buyer Race Condition</span>
                  </button>
                </div>
              </div>
            </div>
  );
}
