import React, { useState, useEffect } from "react";
import api from "../../api";
import { UtensilsCrossed, Search, ChevronLeft, ChevronRight, AlertCircle, X, FileText, Printer, QrCode, ShieldAlert, CheckCircle2, Clock, Ban, RefreshCw, Send } from "lucide-react";
import Swal from "sweetalert2";
import ThermalReceipt from "../../components/ThermalReceipt";

export default function AdminKotReports() {
  const [activeView, setActiveView] = useState("orders"); // "orders" or "audits"
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const [orderType, setOrderType] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [printIsKot, setPrintIsKot] = useState(false);

  // Anti-theft cancellation audits state
  const [audits, setAudits] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, search, paymentMode, orderType, statusFilter, sourceFilter, fromDate, toDate]);

  useEffect(() => {
    if (activeView === "audits") {
      fetchAudits();
    }
  }, [activeView, auditPage]);

  const fetchAudits = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("api/orders/cancellation-audits", {
        params: { page: auditPage, limit: 10 }
      });
      if (res.data.success) {
        setAudits(res.data.data);
        setAuditTotalPages(res.data.pages);
        setAuditTotal(res.data.total);
      }
    } catch (err) {
      console.error("Error fetching cancellation audits:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Real-time SSE listener so status changes (preparing -> ready -> delivered -> billed) reflect instantly
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
    const streamUrl = new URL("/api/kds/stream", baseUrl);
    streamUrl.searchParams.set("token", token);
    const eventSource = new EventSource(streamUrl.toString());

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "kds_status_update" ||
          data.type === "new_order" ||
          data.type === "order_billed" ||
          data.type === "order_cancelled" ||
          data.type === "addon_acknowledged"
        ) {
          fetchOrders();
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("api/orders/all", {
        params: { page, limit, search, paymentMode, orderType, status: statusFilter, source: sourceFilter, fromDate, toDate }
      });
      if (res.data.success) {
        setOrders(res.data.data);
        setTotalPages(res.data.pages);
        setTotalOrders(res.data.total);
      }
    } catch (error) {
      console.error("Error fetching KOT orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSendWhatsAppFromKot = async (order) => {
    if (!order) return;

    const defaultPhone = order.customerMobile || order.customerPhone || "";
    const cleanDefault = defaultPhone.replace(/\D/g, "").slice(-10);

    const { value: inputMobile } = await Swal.fire({
      title: "Send KOT Bill on WhatsApp",
      text: "Customer ka 10-digit WhatsApp number dalein ya confirm karein:",
      input: "tel",
      inputValue: cleanDefault,
      inputPlaceholder: "9876543210",
      showCancelButton: true,
      confirmButtonText: "📲 Send Bill",
      cancelButtonText: "Cancel",
      didOpen: (modal) => {
        const container = modal.closest(".swal2-container") || modal.parentElement;
        if (container) container.style.zIndex = "99999999";
      }
    });

    if (!inputMobile) return;
    const mobile = inputMobile.trim();

    try {
      Swal.fire({
        title: "Preparing WhatsApp Bill...",
        text: "Opening WhatsApp chat...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
          const container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "99999999";
        }
      });

      const res = await api.post(`/api/invoices/${order._id}/send-whatsapp`, {
        targetMobile: mobile,
      });

      if (res.data?.waLink) {
        window.open(res.data.waLink, "_blank");
        Swal.fire({
          icon: "success",
          title: "Opening WhatsApp Web 📲",
          text: `WhatsApp chat opened for ${mobile}. Bas WhatsApp me Send button dabayein!`,
          timer: 3500,
          showConfirmButton: false,
          didOpen: (modal) => {
            const container = modal.closest(".swal2-container") || modal.parentElement;
            if (container) container.style.zIndex = "99999999";
          }
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "WhatsApp Bill Ready",
          text: res.data?.message || "Bill processed.",
          didOpen: (modal) => {
            const container = modal.closest(".swal2-container") || modal.parentElement;
            if (container) container.style.zIndex = "99999999";
          }
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed to Send",
        text: err.response?.data?.message || "Could not generate WhatsApp bill.",
        didOpen: (modal) => {
          const container = modal.closest(".swal2-container") || modal.parentElement;
          if (container) container.style.zIndex = "99999999";
        }
      });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-8 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {activeView === "orders" ? (
              <>
                <UtensilsCrossed className="w-8 h-8 text-amber-500" />
                <span className="text-amber-500">KOT Billing Data</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-8 h-8 text-rose-500" />
                <span className="text-rose-500">Anti-Theft Void & Cancellation Audits</span>
              </>
            )}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {activeView === "orders"
              ? "View all Kitchen Order Tickets (Dine-in, Parcel, Swiggy, Zomato, QR Orders)"
              : "Review all voided food items & cancelled KOTs with cashier details, void amounts, and OTP status."}
          </p>
        </div>

        {/* View Switch Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setActiveView("orders")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === "orders"
                ? "bg-amber-500 text-slate-950 shadow font-black"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            KOT Orders ({totalOrders})
          </button>
          <button
            onClick={() => setActiveView("audits")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === "audits"
                ? "bg-rose-500 text-white shadow shadow-rose-500/25 font-black"
                : "text-slate-400 hover:text-rose-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Void Audits ({auditTotal})
          </button>
        </div>
      </div>

      {activeView === "orders" ? (

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/20 flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={orderType}
              onChange={(e) => { setOrderType(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-3 py-2 outline-none focus:border-amber-500/50"
            >
              <option value="">All Order Types</option>
              <option value="Table">Dine-in (Table)</option>
              <option value="Room">Room Guest</option>
              <option value="Parcel">Parcel</option>
              <option value="Swiggy">Swiggy</option>
              <option value="Zomato">Zomato</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-3 py-2 outline-none focus:border-amber-500/50"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Billed">Billed</option>
              <option value="Cancelled">Declined / Cancelled</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-3 py-2 outline-none focus:border-amber-500/50 font-semibold"
            >
              <option value="">All Sources</option>
              <option value="QR_SCAN">📱 QR Code Scan Only</option>
              <option value="POS">🖥️ POS / Staff Only</option>
            </select>

            <select
              value={paymentMode}
              onChange={(e) => { setPaymentMode(e.target.value); setPage(1); }}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs px-3 py-2 outline-none focus:border-amber-500/50"
            >
              <option value="">All Payment Modes</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="UPI">UPI</option>
              <option value="NC Bill">NC Bill</option>
              <option value="Credit Bill">Credit Bill</option>
            </select>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="bg-transparent text-slate-300 text-xs outline-none focus:text-amber-500"
              />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider border-l border-slate-700 pl-2">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="bg-transparent text-slate-300 text-xs outline-none focus:text-amber-500"
              />
              {(fromDate || toDate) && (
                <button 
                  onClick={() => { setFromDate(""); setToDate(""); setPage(1); }}
                  className="text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/40 px-2 py-1 rounded-md transition-all ml-1"
                  title="Clear Dates"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative max-w-sm w-full xl:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID, Type..."
              value={search}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:border-amber-500/60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-amber-500 font-bold">
              Loading KOT orders...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Order Date</th>
                  <th className="py-4 px-6">Type & ID</th>
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Items</th>
                  <th className="py-4 px-6">Created By</th>
                  <th className="py-4 px-6">Payment Mode</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr 
                      key={order._id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-900/30 text-slate-350 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-200">
                          {order.orderType === 'Table' ? `Table ${order.table?.tableNo || 'N/A'}` : order.orderDisplayId}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] text-amber-500 font-mono">{order.orderType}</span>
                          {order.source === "QR_SCAN" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                              <QrCode className="w-2.5 h-2.5" /> QR Order
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {order.customerName ? (
                          <>
                            <div className="font-semibold text-slate-200">{order.customerName}</div>
                            {order.customerMobile && <div className="text-[10px] text-slate-400">{order.customerMobile}</div>}
                          </>
                        ) : (
                          <span className="text-slate-500 italic text-xs">
                            {order.orderType === 'Table' ? `Table ${order.table?.tableNo || 'N/A'}` : order.orderDisplayId} (Unbilled)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {order.items.length} items
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {order.source === "QR_SCAN" ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <QrCode className="w-3 h-3" /> Guest (QR)
                          </span>
                        ) : (
                          order.createdBy?.name || "Staff"
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                        {order.status === "Billed" && order.paymentMode ? order.paymentMode : "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.status === "Billed" 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : order.status === "Cancelled" || order.approvalStatus === "rejected"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400"
                          }`}>
                            {order.status === "Cancelled" || order.approvalStatus === "rejected" ? "Declined" : order.status}
                          </span>
                          {(order.status === "Cancelled" || order.approvalStatus === "rejected") && order.rejectionReason && (
                            <span className="text-[9px] text-rose-400/80 max-w-[120px] truncate" title={order.rejectionReason}>
                              {order.rejectionReason}
                            </span>
                          )}
                          {order.status === "Active" && order.approvalStatus !== "rejected" && order.kdsStatus && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                              order.kdsStatus === "ready"
                                ? "bg-emerald-500 text-slate-950"
                                : order.kdsStatus === "delivered"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-slate-800 text-slate-300"
                            }`}>
                              {order.kdsStatus === "ready" ? "🍽️ Ready" : order.kdsStatus === "delivered" ? "✓ Delivered" : `🍳 ${order.kdsStatus}`}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-amber-500 text-sm">
                        ₹{(order.grandTotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-550">
                      <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-slate-650" />
                        <span className="font-semibold">No KOTs found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/10 flex items-center justify-between">
            <span className="text-slate-500 font-medium">
              Showing page <strong className="text-slate-300">{page}</strong> of <strong className="text-slate-300">{totalPages}</strong> ({totalOrders} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border border-slate-800 hover:bg-slate-850 disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      ) : (
        /* ANTI-THEFT AUDIT LOGS CARD */
        <div className="glass-card rounded-2xl overflow-hidden border border-rose-500/20 shadow-xl">
          <div className="p-6 border-b border-white/10 bg-rose-950/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                KOT Cancellation & Item Void Logs
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Full chronological audit trail of all KOT cancellations with Owner authorization status.
              </p>
            </div>
            <button
              onClick={fetchAudits}
              disabled={auditLoading}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/10 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? "animate-spin text-rose-400" : ""}`} />
              Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400 uppercase font-bold tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">Cancelled Items</th>
                  <th className="py-3.5 px-4 text-right">Void Amount</th>
                  <th className="py-3.5 px-4">Cashier</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {auditLoading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-400 mb-2" />
                      Loading void audit logs...
                    </td>
                  </tr>
                ) : audits.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      No cancellation or void records found. All KOTs are clean!
                    </td>
                  </tr>
                ) : (
                  audits.map((audit) => (
                    <tr key={audit._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                        {new Date(audit.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span className="text-slate-500">
                          {new Date(audit.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-white">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                          {audit.tableNo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {audit.cancellationType === "full_order" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            🚨 Full KOT Cancel
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ⚠️ Item Void
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="space-y-1 max-w-xs">
                          {audit.cancelledItems?.map((it, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-semibold text-white">{it.name}</span>{" "}
                              <span className="text-slate-400 font-mono">({it.quantity}x)</span>
                              <span className="text-slate-500 ml-1 font-mono">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400 text-sm whitespace-nowrap">
                        ₹{audit.totalAmount}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        <div className="font-semibold text-white">{audit.cashierName}</div>
                        <div className="text-[10px] text-slate-500">Staff / Cashier</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={audit.reason}>
                        {audit.reason || "Not specified"}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {audit.status === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Authorized
                          </span>
                        )}
                        {audit.status === "pending_otp" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400" /> Pending OTP
                          </span>
                        )}
                        {audit.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <Ban className="w-3 h-3 text-rose-400" /> Expired / Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Audits Pagination */}
          {auditTotalPages > 1 && (
            <div className="p-4 border-t border-white/10 bg-slate-900/30 flex justify-between items-center text-xs text-slate-400">
              <span>
                Page {auditPage} of {auditTotalPages} ({auditTotal} total records)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={auditPage <= 1}
                  onClick={() => setAuditPage(auditPage - 1)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Previous
                </button>
                <button
                  disabled={auditPage >= auditTotalPages}
                  onClick={() => setAuditPage(auditPage + 1)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* THERMAL RECEIPT */}
      {showPrint && selectedOrder && (
        <ThermalReceipt 
          invoice={selectedOrder} 
          isKot={printIsKot}
          onClose={() => setShowPrint(false)} 
        />
      )}

      {/* KOT DETAILS MODAL */}
      {selectedOrder && !showPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">KOT Details</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedOrder.orderType === 'Table' ? `Table ${selectedOrder.table?.tableNo || 'N/A'}` : selectedOrder.orderDisplayId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setPrintIsKot(true); setShowPrint(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-500/20 rounded-lg font-bold text-xs transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print KOT
                </button>
                <button
                  onClick={() => { setPrintIsKot(false); setShowPrint(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 rounded-lg font-bold text-xs transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Bill
                </button>
                <button
                  onClick={() => handleSendWhatsAppFromKot(selectedOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition-all cursor-pointer"
                  title="WhatsApp par digital bill send karein"
                >
                  <Send className="w-3.5 h-3.5" /> WhatsApp Bill
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className={`text-sm font-semibold ${
                    selectedOrder.status === 'Billed' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : selectedOrder.status === 'Cancelled' || selectedOrder.approvalStatus === 'rejected'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedOrder.status === 'Cancelled' || selectedOrder.approvalStatus === 'rejected' 
                      ? `Declined (${selectedOrder.rejectionReason || 'Declined'})` 
                      : selectedOrder.status}
                  </p>
                </div>
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Payment</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedOrder.paymentMode || "-"}</p>
                </div>
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Created By</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {selectedOrder.source === "QR_SCAN" ? "Guest (Self)" : (selectedOrder.createdBy?.name || "Staff")}
                  </p>
                </div>
                <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Order Source</p>
                  <p className={`text-sm font-bold ${selectedOrder.source === "QR_SCAN" ? "text-amber-500" : "text-slate-300"}`}>
                    {selectedOrder.source === "QR_SCAN" ? "📱 QR Code Scan" : "POS Terminal"}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  Order Items
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
                    {selectedOrder.items.length}
                  </span>
                </h3>
                <div className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4 text-center">Qty</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300">
                          <td className="py-3 px-4 font-medium">{item.name}</td>
                          <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">₹{item.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-500 font-semibold">₹{(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">₹{selectedOrder.subTotal.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-amber-500 dark:text-amber-500">
                      <span>Discount ({selectedOrder.discountPercentage}%)</span>
                      <span className="font-mono">-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Tax (5%)</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">₹{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Total</span>
                    <span className="text-lg font-black font-mono text-amber-600 dark:text-amber-500">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
