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
// InventoryCatalogPage — Standalone Page Component (Pure React JSX)
// ============================================================================
export default function InventoryCatalogPage(props) {
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
  );
}
