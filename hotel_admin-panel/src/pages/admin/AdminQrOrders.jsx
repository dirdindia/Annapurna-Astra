import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Utensils,
  ShoppingBag,
  CalendarDays,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Banknote,
  Search,
  Filter,
  Check,
} from "lucide-react";
import QRCode from "qrcode";
import { qrOrderAPI } from "../../api";
import Swal from "sweetalert2";

export default function AdminQrOrders() {
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const hotelId = currentUser?.hotelId || "";
  const publicMenuUrl = `${window.location.origin}/menu/${hotelId}`;

  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (publicMenuUrl) {
      QRCode.toDataURL(publicMenuUrl, {
        width: 480,
        margin: 2,
        color: {
          dark: "#0a192f",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Generation error:", err));
    }
  }, [publicMenuUrl]);

  // Tabs: 'approvals' | 'generator' | 'bookings'
  const [activeTab, setActiveTab] = useState("approvals");

  // QR Orders data state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending"); // 'pending' | 'approved' | 'rejected' | 'all'
  const [actionLoading, setActionLoading] = useState({});

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Standee print ref
  const standeeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Audio notification sound for new incoming orders
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const playTone = (freq, time, dur) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.start(time);
        osc.stop(time + dur);
      };

      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.35);        // C5
      playTone(659.25, now + 0.15, 0.35);  // E5
      playTone(783.99, now + 0.3, 0.55);   // G5
    } catch (e) {
      console.warn("Could not play audio chime:", e);
    }
  };

  // Keep latest filterStatus in ref to prevent stale closures in SSE listener
  const filterStatusRef = useRef(filterStatus);
  useEffect(() => {
    filterStatusRef.current = filterStatus;
  }, [filterStatus]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoadingOrders(true);
      const res = await qrOrderAPI.getOrders({ status: filterStatusRef.current });
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await qrOrderAPI.getTableBookings();
      if (res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  // Real-time SSE Connection: Listens for instant order push from backend
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const streamUrl = `http://localhost:5000/api/kds/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "qr_order_pending") {
          // 1. Play bell chime sound
          playAlertSound();

          // 2. Refresh orders list instantly
          fetchOrders(true);

          // 3. Show Toast notification
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: `🔔 New Order #${data.orderDisplayId || ""}`,
            text: `${data.orderType === "Parcel" ? "Takeaway" : `Table ${data.tableNo || ""}`} • ₹${data.grandTotal || ""}`,
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            background: "#0f172a",
            color: "#ffffff",
          });
        } else if (data.type === "kds_status_update") {
          // Update order status in local state directly and fetch to ensure sync
          setOrders((prev) =>
            prev.map((o) =>
              o._id.toString() === data.orderId?.toString()
                ? { ...o, kdsStatus: data.kdsStatus }
                : o
            )
          );
          fetchOrders(true);
        } else if (
          data.type === "order_cancelled" ||
          data.type === "new_order" ||
          data.type === "order_billed" ||
          data.type === "addon_acknowledged"
        ) {
          fetchOrders(true);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = (err) => {
      // Auto-reconnects on disconnection
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    }
  }, [activeTab]);

  // Handle Order Approval
  const handleApprove = async (orderId) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: "approve" }));
    try {
      const res = await qrOrderAPI.approveOrder(orderId);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Order Approved!",
          text: "KOT generated and sent to kitchen display.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchOrders(true);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to approve order." });
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: null }));
    }
  };

  // Handle Order Rejection
  const handleReject = async (orderId) => {
    const { value: reason } = await Swal.fire({
      title: "Decline Order?",
      text: "Enter reason for rejecting this customer order:",
      input: "text",
      inputPlaceholder: "e.g., Item out of stock / Table unavailable",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Reject Order",
    });

    if (reason !== undefined) {
      setActionLoading((prev) => ({ ...prev, [orderId]: "reject" }));
      try {
        const res = await qrOrderAPI.rejectOrder(orderId, reason || "Declined by restaurant staff");
        if (res.data.success) {
          Swal.fire({
            icon: "info",
            title: "Order Rejected",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchOrders(true);
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to reject order" });
      } finally {
        setActionLoading((prev) => ({ ...prev, [orderId]: null }));
      }
    }
  };

  // Handle Addon Approval
  const handleApproveAddon = async (orderId, addonIndex) => {
    const key = `${orderId}-addon-${addonIndex}`;
    setActionLoading((prev) => ({ ...prev, [key]: "approve" }));
    try {
      const res = await qrOrderAPI.approveAddon(orderId, addonIndex);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Add-on Approved!",
          text: "Additional items sent to kitchen display & bill updated.",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchOrders(true);
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to approve addon items." });
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: null }));
    }
  };

  // Handle Addon Rejection
  const handleRejectAddon = async (orderId, addonIndex) => {
    const { value: reason } = await Swal.fire({
      title: "Decline Add-on Items?",
      text: "Enter reason for rejecting these extra items:",
      input: "text",
      inputPlaceholder: "e.g., Item out of stock",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Decline Add-on",
    });

    if (reason !== undefined) {
      const key = `${orderId}-addon-${addonIndex}`;
      setActionLoading((prev) => ({ ...prev, [key]: "reject" }));
      try {
        const res = await qrOrderAPI.rejectAddon(orderId, addonIndex, reason || "Declined by kitchen");
        if (res.data.success) {
          Swal.fire({
            icon: "info",
            title: "Add-on Declined",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchOrders(true);
        }
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to decline addon." });
      } finally {
        setActionLoading((prev) => ({ ...prev, [key]: null }));
      }
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicMenuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print Table Standee
  const handlePrintStandee = () => {
    window.print();
  };

  // Download QR Code PNG
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const downloadLink = document.createElement("a");
    downloadLink.download = `${currentUser?.hotelName || "StayFlow"}-QR.png`;
    downloadLink.href = qrDataUrl;
    downloadLink.click();
  };

  const pendingCount = orders.filter((o) => o.approvalStatus === "pending").length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-lagoon-700/25 p-5 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-saffron-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Scan & Order System
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify customer QR orders, print branded table standees, and manage table reservations.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab("approvals")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "approvals"
                ? "bg-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Incoming Orders</span>
            {pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("generator")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "generator"
                ? "bg-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Standee Card</span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bookings"
                ? "bg-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Table Reservations</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INCOMING QR ORDERS & APPROVALS */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          {/* Status Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter by:
              </span>
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {[
                  { id: "pending", label: "Pending Verification" },
                  { id: "approved", label: "Active Dining (Approved)" },
                  { id: "rejected", label: "Declined" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFilterStatus(st.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filterStatus === st.id
                        ? "bg-saffron-500 text-slate-950 shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <Link
                to="/admin/kot-reports"
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 ml-2 hover:underline"
              >
                <span>View Billed & Completed in KOT Billing</span>
                <span className="text-amber-500">→</span>
              </Link>
            </div>

            <button
              onClick={() => fetchOrders()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-saffron-500/50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* Orders Cards Grid */}
          {loadingOrders ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-saffron-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Fetching incoming QR orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
              <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-200">No {filterStatus} orders right now</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Customer orders placed via scanning your hotel's QR code will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => {
                const isBilled = order.status === "Billed";
                const isPending = order.approvalStatus === "pending" && !isBilled;
                const isApproved = order.approvalStatus === "approved" && !isBilled;
                const isRejected = order.approvalStatus === "rejected";

                return (
                  <div
                    key={order._id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-xl ${
                      isPending
                        ? "bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/40 ring-1 ring-amber-500/20"
                        : isApproved
                        ? "bg-slate-900/70 border-emerald-500/30"
                        : isBilled
                        ? "bg-slate-900/60 border-blue-500/30 shadow-blue-500/5"
                        : "bg-slate-900/40 border-slate-800 opacity-70"
                    }`}
                  >
                    <div>
                      {/* Top Row: Order ID, Type & Status */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white tracking-wide">
                              #{order.orderDisplayId || order._id.slice(-6)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                order.orderType === "Parcel"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {order.orderType === "Parcel" ? "Takeaway" : `Table ${order.tableNo || ""}`}
                            </span>
                            {/* Prominent Add-on Active Flag */}
                            {(order.items?.some((it) => it.isAddon) || order.pendingAddons?.some((a) => a.status === "pending")) && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse flex items-center gap-1">
                                <span>⚡</span> ADD-ON
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide flex items-center gap-1 ${
                            isBilled
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : isPending
                              ? "bg-amber-500 text-slate-950 animate-pulse"
                              : isApproved
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {isBilled && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isPending && <Clock className="w-3.5 h-3.5" />}
                          {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {isRejected && <XCircle className="w-3.5 h-3.5" />}
                          <span>{isBilled ? "Billed" : isPending ? "Pending" : isApproved ? "Active" : "Declined"}</span>
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="py-3 border-b border-slate-800/80 text-xs">
                        <p className="text-slate-300 font-bold truncate">
                          Guest: <span className="text-white">{order.customerName || "Walk-in Guest"}</span>
                        </p>
                        {order.customerMobile && (
                          <p className="text-slate-400 mt-0.5">Contact: {order.customerMobile}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                              order.paymentStatus === "Paid" || isBilled
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-slate-800 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {order.paymentStatus === "Paid" || isBilled ? (
                              <>
                                <CreditCard className="w-3 h-3" /> Paid ({order.paymentMode || "Online"})
                              </>
                            ) : (
                              <>
                                <Banknote className="w-3 h-3" /> Pay at Counter
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Ordered Items List */}
                      <div className="py-3 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Items ({order.items?.length || 0}):
                        </p>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-200 flex items-center gap-1.5">
                                <span className="font-bold text-amber-400">{item.quantity}x</span> {item.name}
                                {item.isAddon && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                    +ADD-ON
                                  </span>
                                )}
                              </span>
                              <span className="font-semibold text-slate-400">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Pending Add-on Requests from Customer */}
                        {order.pendingAddons?.filter((a) => a.status === "pending").map((addon, aIdx) => {
                          const addonKey = `${order._id}-addon-${aIdx}`;
                          return (
                            <div key={aIdx} className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-2">
                              <div className="flex items-center justify-between text-xs font-black text-amber-300">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 animate-spin" /> Additional Items Requested:
                                </span>
                                <span>₹{addon.grandTotal}</span>
                              </div>

                              <div className="space-y-0.5 text-xs">
                                {addon.items?.map((adItem, i) => (
                                  <div key={i} className="flex justify-between text-slate-200">
                                    <span>
                                      <span className="font-bold text-amber-400">{adItem.quantity}x</span> {adItem.name}
                                    </span>
                                    <span className="text-slate-400">₹{adItem.price * adItem.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  disabled={actionLoading[addonKey] === "approve"}
                                  onClick={() => handleApproveAddon(order._id, aIdx)}
                                  className="py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{actionLoading[addonKey] === "approve" ? "..." : "Accept Addon"}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading[addonKey] === "reject"}
                                  onClick={() => handleRejectAddon(order._id, aIdx)}
                                  className="py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{actionLoading[addonKey] === "reject" ? "..." : "Decline"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom: Total & Actions */}
                    <div className="border-t border-slate-800/80 pt-3 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs text-slate-400">Grand Total:</span>
                        <span className="text-base font-black text-white">₹{order.grandTotal}</span>
                      </div>

                      {isPending ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleApprove(order._id)}
                            disabled={actionLoading[order._id] === "approve"}
                            className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{actionLoading[order._id] === "approve" ? "Approving..." : "Approve & KOT"}</span>
                          </button>

                          <button
                            onClick={() => handleReject(order._id)}
                            disabled={actionLoading[order._id] === "reject"}
                            className="py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-rose-400 hover:text-rose-200 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>{actionLoading[order._id] === "reject" ? "Declining..." : "Decline"}</span>
                          </button>
                        </div>
                      ) : isBilled ? (
                        <div className="flex items-center justify-between text-xs text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                          <span>✓ Bill Paid & Table Cleared</span>
                          <span className="text-[11px] uppercase bg-black/40 px-2 py-0.5 rounded text-slate-300">
                            {order.paymentMode || "Paid"}
                          </span>
                        </div>
                      ) : isApproved ? (
                        <div className={`flex items-center justify-between text-xs font-bold rounded-xl px-3 py-2 border ${
                          order.kdsStatus === "ready"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : order.kdsStatus === "delivered"
                            ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                        }`}>
                          <span>
                            {order.kdsStatus === "ready"
                              ? "🍽️ Food Ready to Serve!"
                              : order.kdsStatus === "delivered"
                              ? "✓ Food Delivered to Table"
                              : "👨‍🍳 Cooking in Kitchen"}
                          </span>
                          <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-black tracking-wider ${
                            order.kdsStatus === "ready"
                              ? "bg-emerald-500 text-slate-950 animate-pulse"
                              : order.kdsStatus === "delivered"
                              ? "bg-purple-500 text-white"
                              : "bg-black/50 text-amber-400"
                          }`}>
                            {order.kdsStatus}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                          <span className="font-bold">Declined:</span> {order.rejectionReason || "Order cancelled"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HOTEL QR CODE GENERATOR & STANDEE CARD */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls & Share Options (Left 5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-lagoon-700/25 rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div>
              <h2 className="text-lg font-black text-white">Your Hotel's Master QR Code</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                As requested, this single Master QR code works for your entire restaurant. Customers scan it, select
                their table number or takeaway, and order directly.
              </p>
            </div>

            {/* Public Link Display & Copy */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Public Guest Portal Link:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicMenuUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 truncate focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-saffron-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Test Public Ordering Portal in New Tab</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQR}
                  className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR (PNG)</span>
                </button>

                <button
                  onClick={handlePrintStandee}
                  className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Standee Card</span>
                </button>
              </div>
            </div>

            {/* Instruction Checklist */}
            <div className="p-4 bg-teal-950/30 border border-teal-800/30 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> How this SaaS flow works:
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 pl-1 list-disc list-inside">
                <li>Print this standee card and place it on restaurant tables or reception counter.</li>
                <li>Customer scans the QR code with their phone camera.</li>
                <li>Customer selects Dine-in Table No or Takeaway, picks dishes, and submits order.</li>
                <li>Order instantly arrives under "Incoming Orders" tab for your approval.</li>
                <li>Once you click <b>"Approve & KOT"</b>, KOT is sent to the kitchen & printed!</li>
              </ul>
            </div>
          </div>

          {/* Table Tent / Standee Card Preview (Right 7 Cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div
              ref={standeeRef}
              className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-7 shadow-2xl text-center relative overflow-hidden text-slate-100 print:border-black print:text-black print:bg-white"
            >
              {/* Decorative top accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-500"></div>

              {/* Hotel Logo & Name */}
              <div className="mb-4">
                {Boolean(currentUser?.hotelLogo && currentUser.hotelLogo.trim()) ? (
                  <img
                    src={currentUser.hotelLogo}
                    alt="Logo"
                    className="w-16 h-16 rounded-2xl object-cover mx-auto mb-2 border border-amber-500/40 shadow-md bg-slate-900"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-md">
                    {currentUser?.hotelName?.charAt(0) || "S"}
                  </div>
                )}
                <h3 className="text-xl font-black text-white tracking-tight">{currentUser?.hotelName || "StayFlow Dining"}</h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5 uppercase tracking-widest">
                  Scan to View Menu & Order
                </p>
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-3xl shadow-inner max-w-[220px] mx-auto border-4 border-amber-500/20 flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    id="hotel-qr-img"
                    src={qrDataUrl}
                    alt="Hotel Master QR Code"
                    className="w-48 h-48 rounded-2xl object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                )}
              </div>

              {/* Features / Instructions */}
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex items-center justify-center gap-2 text-slate-300 font-bold">
                  <span>🍽️ Table Dining</span>
                  <span>•</span>
                  <span>🥡 Takeaway</span>
                  <span>•</span>
                  <span>💳 Online / Cash</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                  <p className="font-bold text-amber-400">1. Scan with Camera</p>
                  <p className="mt-0.5">2. Choose Table No & Delicious Dishes</p>
                  <p className="mt-0.5">3. Freshly Prepared for You!</p>
                </div>
              </div>

              {/* Footer Powered By */}
              <p className="text-[10px] text-slate-500 mt-4 tracking-wider uppercase font-semibold">
                Powered by StayFlow SaaS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TABLE RESERVATIONS */}
      {activeTab === "bookings" && (
        <div className="bg-slate-900/60 border border-lagoon-700/25 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Public Table Reservations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customers can book dining tables in advance via the QR portal.
              </p>
            </div>

            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingBookings ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-saffron-400" />
              <span>Loading reservations...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800">
              <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-300">No table bookings received yet</p>
              <p className="text-xs text-slate-500 mt-1">Bookings submitted from the QR portal will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Guests</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Requests</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{b.customerName}</p>
                        <p className="text-[11px] text-slate-400">{b.customerMobile}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-400">
                        {b.bookingDate} at {b.bookingTime}
                      </td>
                      <td className="py-3 px-4 font-bold">{b.guestsCount} People</td>
                      <td className="py-3 px-4">{b.tableNo ? `Table ${b.tableNo}` : "Any Table"}</td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-400">{b.specialRequests || "None"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            b.status === "confirmed"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : b.status === "cancelled"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={async () => {
                                await qrOrderAPI.updateTableBooking(b._id, { status: "confirmed" });
                                fetchBookings();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] hover:bg-emerald-400"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={async () => {
                                await qrOrderAPI.updateTableBooking(b._id, { status: "cancelled" });
                                fetchBookings();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 font-bold text-[11px] hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
