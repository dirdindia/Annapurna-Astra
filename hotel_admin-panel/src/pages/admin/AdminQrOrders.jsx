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
  Ticket,
  PhoneCall,
  UserPlus,
  Users,
  Phone,
  Globe,
  Laptop,
} from "lucide-react";
import QRCode from "qrcode";
import api, { qrOrderAPI, tableAPI, waitlistAPI } from "../../api";
import Swal from "sweetalert2";
import MagneticButton from "../../components/MagneticButton";

export default function AdminQrOrders() {
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const hotelId = currentUser?.hotelId || "";

  // Live Production URL config (Default to Live URL as requested)
  const LIVE_URL = import.meta.env?.VITE_LIVE_URL || "https://hotel.e-annapurna.co.in";
  const [domainMode, setDomainMode] = useState("live"); // 'live' | 'local' | 'custom'
  const [customDomain, setCustomDomain] = useState(LIVE_URL);
  const [selectedTable, setSelectedTable] = useState("");

  const activeBaseUrl =
    domainMode === "live"
      ? LIVE_URL
      : domainMode === "local"
      ? (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174")
      : customDomain;

  const cleanBaseUrl = (activeBaseUrl || "").replace(/\/+$/, "");
  const tableQuery = selectedTable ? `?table=${encodeURIComponent(selectedTable)}` : "";
  const publicMenuUrl = `${cleanBaseUrl}/menu/${hotelId}${tableQuery}`;
  const localhostMenuUrl = `${(typeof window !== "undefined" ? window.location.origin : "http://localhost:5174").replace(/\/+$/, "")}/menu/${hotelId}${tableQuery}`;

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
  const [allTables, setAllTables] = useState([]);

  // Waitlist state
  const [waitlistActive, setWaitlistActive] = useState([]);
  const [waitlistCompleted, setWaitlistCompleted] = useState([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [waitlistSubTab, setWaitlistSubTab] = useState("queue"); // "queue" | "manual" | "history"
  const [manualGuest, setManualGuest] = useState({
    customerName: "",
    customerMobile: "",
    guestsCount: 2,
    notes: "",
    assignedTableNo: "",
  });
  const [submittingManual, setSubmittingManual] = useState(false);

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
      const [bRes, tRes] = await Promise.all([
        qrOrderAPI.getTableBookings(),
        tableAPI.getTables().catch(() => ({ data: { data: [] } }))
      ]);
      if (bRes.data.success) {
        setBookings(bRes.data.data || []);
      }
      if (tRes.data?.data) {
        setAllTables(tRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await tableAPI.getTables();
      if (res.data?.success) {
        setAllTables(res.data.data || []);
      }
    } catch (e) {}
  };

  const fetchAdminWaitlist = async () => {
    setLoadingWaitlist(true);
    try {
      const res = await waitlistAPI.getAdminWaitlist();
      if (res.data?.success) {
        setWaitlistActive(res.data.data.active || []);
        setWaitlistCompleted(res.data.data.completed || []);
      }
    } catch (err) {
      console.error("Error fetching waitlist:", err);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const handleCallWaitlistGuest = async (entry, tableNo) => {
    try {
      const res = await waitlistAPI.callGuest(entry._id, { tableNo });
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Guest Called!",
          text: `Guest ${entry.customerName} alerted for Table ${tableNo || entry.assignedTableNo || "Next Ready Table"}.`,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchAdminWaitlist();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to call guest" });
    }
  };

  const handleSeatWaitlistGuest = async (entry, tableNo) => {
    const chosenTable = tableNo || entry.assignedTableNo;
    if (!chosenTable) {
      Swal.fire({ icon: "warning", title: "Select Table", text: "Please pick an available table from the dropdown." });
      return;
    }
    const tableObj = allTables.find((t) => String(t.tableNo) === String(chosenTable));
    try {
      const res = await waitlistAPI.seatGuest(entry._id, { tableNo: chosenTable, tableId: tableObj?._id });
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Guest Seated!",
          text: `Token ${entry.tokenNo} seated at Table ${chosenTable}. Table is now Occupied.`,
          timer: 2200,
          showConfirmButton: false,
        });
        fetchAdminWaitlist();
        fetchTables();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Seating Failed", text: err.response?.data?.message || "Failed to seat guest" });
    }
  };

  const handleUpdateWaitlistStatus = async (id, status) => {
    const res = await Swal.fire({
      title: `Confirm ${status === "cancelled" ? "Cancellation" : "No-Show"}?`,
      text: `Are you sure you want to mark this guest as ${status}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed",
      confirmButtonColor: "#ef4444",
    });
    if (!res.isConfirmed) return;

    try {
      await waitlistAPI.updateStatus(id, status);
      Swal.fire({ icon: "info", title: "Updated", timer: 1500, showConfirmButton: false });
      fetchAdminWaitlist();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to update status" });
    }
  };

  const handleAddManualGuest = async (e) => {
    e.preventDefault();
    if (!manualGuest.customerName.trim() || !manualGuest.customerMobile.trim()) {
      Swal.fire({ icon: "warning", title: "Missing Details", text: "Customer name and mobile number are required." });
      return;
    }
    setSubmittingManual(true);
    try {
      const res = await waitlistAPI.addManualGuest(manualGuest);
      if (res.data.success) {
        Swal.fire({
          icon: "success",
          title: "Token Issued!",
          text: `Queue Token #${res.data.data.tokenNo} generated for ${res.data.data.customerName}!`,
        });
        setManualGuest({ customerName: "", customerMobile: "", guestsCount: 2, notes: "", assignedTableNo: "" });
        setWaitlistSubTab("queue");
        fetchAdminWaitlist();
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to generate token" });
    } finally {
      setSubmittingManual(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchBookings();
    fetchAdminWaitlist();
    fetchTables();
  }, [filterStatus]);

  // Real-time SSE Connection: Listens for instant order push from backend
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
        } else if (data.type === "new_table_booking") {
          // Play chime sound
          playAlertSound();

          // Refresh table bookings
          fetchBookings();

          // Toast notification for new table reservation
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: `📅 New Table Reservation!`,
            text: `${data.customerName || "Customer"} • ${data.bookingDate || ""} at ${data.bookingTime || ""}`,
            showConfirmButton: false,
            timer: 6000,
            timerProgressBar: true,
            background: "#0f172a",
            color: "#ffffff",
          });
        } else if (data.type === "table_booking_updated") {
          fetchBookings();
        } else if (data.type === "waitlist_updated") {
          fetchAdminWaitlist();
          fetchTables();
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
    } else if (activeTab === "waitlist") {
      fetchAdminWaitlist();
      fetchTables();
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
    const tableSuffix = selectedTable ? `-Table-${selectedTable}` : "-Master";
    downloadLink.download = `${currentUser?.hotelName || "E-Annapurna"}${tableSuffix}-QR.png`;
    downloadLink.href = qrDataUrl;
    downloadLink.click();
  };

  const pendingCount = orders.filter((o) => o.approvalStatus === "pending").length;
  const pendingBookingsCount = bookings.filter((b) => b.status === "pending").length;

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
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl shrink-0">
          <MagneticButton>
            <button
              onClick={() => setActiveTab("approvals")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "approvals"
                  ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Incoming Orders</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </MagneticButton>

          <MagneticButton>
            <button
              onClick={() => setActiveTab("generator")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "generator"
                  ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Standee Card</span>
            </button>
          </MagneticButton>

          <MagneticButton>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "bookings"
                  ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Table Reservations</span>
              {pendingBookingsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-black animate-pulse">
                  {pendingBookingsCount}
                </span>
              )}
            </button>
          </MagneticButton>

          <MagneticButton>
            <button
              onClick={() => setActiveTab("waitlist")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "waitlist"
                  ? "bg-gradient-to-r from-saffron-400 to-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Live Waitlist</span>
              {waitlistActive.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-black animate-pulse">
                  {waitlistActive.filter((w) => w.status === "waiting").length}
                </span>
              )}
            </button>
          </MagneticButton>
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
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-black text-white">Your Hotel's QR Code</h2>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {domainMode === "live" ? "Live Production URL" : domainMode === "local" ? "Localhost Dev" : "Custom Domain"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Scan &amp; Order QR code for your restaurant. Customers scan it with their phone camera to view your digital menu and order dishes instantly.
              </p>
            </div>

            {/* Target URL Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                QR Code Domain / URL Mode:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setDomainMode("live")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    domainMode === "live"
                      ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Live URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDomainMode("local")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    domainMode === "local"
                      ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Localhost</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDomainMode("custom")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    domainMode === "custom"
                      ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-slate-950 shadow-md font-black"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <span>Custom</span>
                </button>
              </div>

              {domainMode === "custom" && (
                <div className="pt-2">
                  <input
                    type="url"
                    placeholder="https://menu.yourhotel.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter your custom website or subdomain URL pointing to the guest portal.
                  </p>
                </div>
              )}
            </div>

            {/* Target Table Dropdown (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Table Filter (Optional):
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="">🍽️ Master QR Code (Customer selects table or takeaway on phone)</option>
                {allTables.map((t) => (
                  <option key={t._id || t.tableNo} value={t.tableNo}>
                    📍 Table {t.tableNo} {t.capacity ? `(${t.capacity} Seater)` : ""} {t.type ? `[${t.type}]` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500">
                {selectedTable
                  ? `QR code will automatically pre-select Table ${selectedTable} when scanned.`
                  : "Generates master QR code for your entire dining area & takeaway."}
              </p>
            </div>

            {/* Public Link Display & Copy */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Public Guest Portal Link:
                </label>
                <span className="text-[10px] font-mono text-emerald-400">
                  {domainMode === "live" ? "🌐 Live URL Active" : domainMode === "local" ? "💻 Local Dev Mode" : "⚙️ Custom Domain"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicMenuUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 truncate focus:outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-saffron-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Public Ordering Portal in New Tab</span>
              </a>

              {domainMode === "live" && (
                <a
                  href={localhostMenuUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-amber-400 font-bold text-[11px] border border-slate-800 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Laptop className="w-3.5 h-3.5 text-slate-500" />
                  <span>Test on Local Dev Server (localhost:5174)</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadQR}
                  className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Download QR (PNG)</span>
                </button>

                <button
                  onClick={handlePrintStandee}
                  className="py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
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
                <li>Customer scans the QR code with their mobile camera (encodes live URL).</li>
                <li>Customer browses menu, picks dishes, and submits order directly.</li>
                <li>Order instantly arrives under "Incoming Orders" tab for kitchen approval.</li>
                <li>Once approved, KOT prints and items are prepared for the table!</li>
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
                <h3 className="text-xl font-black text-white tracking-tight">{currentUser?.hotelName || "E-Annapurna Dining"}</h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5 uppercase tracking-widest">
                  Scan to View Menu &amp; Order
                </p>
                {selectedTable && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 font-black text-xs print:bg-slate-200 print:text-black print:border-black">
                    <span>📍 Table {selectedTable}</span>
                  </div>
                )}
              </div>

              {/* QR Code Container */}
              <div className="p-3 bg-white rounded-3xl shadow-inner max-w-[220px] mx-auto border-4 border-amber-500/20 flex items-center justify-center print:border-black">
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
                <div className="flex items-center justify-center gap-2 text-slate-300 font-bold print:text-black">
                  <span>🍽️ Table Dining</span>
                  <span>•</span>
                  <span>🥡 Takeaway</span>
                  <span>•</span>
                  <span>💳 Online / Cash</span>
                </div>

                <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] text-slate-400 print:border-black print:text-black print:bg-slate-50">
                  <p className="font-bold text-amber-400 print:text-black">1. Scan with Camera</p>
                  <p className="mt-0.5">2. Choose Table No &amp; Delicious Dishes</p>
                  <p className="mt-0.5">3. Freshly Prepared for You!</p>
                </div>
              </div>

              {/* Clean URL display for guests */}
              <div className="mt-3 px-3 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] font-mono text-amber-400 break-all select-all print:text-slate-900 print:bg-slate-100 print:border-slate-300">
                {publicMenuUrl.replace(/^https?:\/\//, "")}
              </div>

              {/* Footer Powered By */}
              <p className="text-[10px] text-slate-500 mt-3 tracking-wider uppercase font-semibold print:text-slate-600">
                Powered by E-Annapurna SaaS
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
                      <td className="py-3 px-4">
                        {b.tableNo ? (
                          <span className="font-bold text-amber-400">Table {b.tableNo}</span>
                        ) : b.status === "pending" ? (
                          <select
                            id={`assign-table-${b._id}`}
                            defaultValue=""
                            className="bg-slate-900 border border-slate-700 text-amber-400 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-500"
                          >
                            <option value="">Auto / Assign Table</option>
                            {allTables.map(t => (
                              <option key={t._id} value={t.tableNo}>Table {t.tableNo} ({t.capacity} Seater)</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
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
                                const selectEl = document.getElementById(`assign-table-${b._id}`);
                                const chosenTable = selectEl?.value || b.tableNo || "";
                                await qrOrderAPI.updateTableBooking(b._id, { 
                                  status: "confirmed",
                                  tableNo: chosenTable 
                                });
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

      {/* TAB 4: LIVE WAITLIST & DIGITAL QUEUE */}
      {activeTab === "waitlist" && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total In Queue</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {waitlistActive.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-amber-400 font-medium">Waiting Turn</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {waitlistActive.filter((w) => w.status === "waiting").length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-xs text-cyan-400 font-medium">Called (Table Ready)</span>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                {waitlistActive.filter((w) => w.status === "called").length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-400 font-medium">Available Tables</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {allTables.filter((t) => t.status === "Available").length} / {allTables.length}
              </div>
            </div>
          </div>

          {/* Sub-Tab Navigation & Refresh */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setWaitlistSubTab("queue")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  waitlistSubTab === "queue"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Live Queue ({waitlistActive.length})</span>
              </button>

              <button
                onClick={() => setWaitlistSubTab("manual")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  waitlistSubTab === "manual"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Issue Walk-In Token</span>
              </button>

              <button
                onClick={() => setWaitlistSubTab("history")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  waitlistSubTab === "history"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed Today ({waitlistCompleted.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                fetchAdminWaitlist();
                fetchTables();
              }}
              disabled={loadingWaitlist}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingWaitlist ? "animate-spin text-cyan-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Sub-View 1: Live Queue */}
          {waitlistSubTab === "queue" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {waitlistActive.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Ticket className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-40" />
                  <p className="font-bold text-white text-base">All caught up! No waiting guests in line.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    When dining tables are full, guests scanning the QR code can join the live waiting queue, or you can issue walk-in tokens.
                  </p>
                  <button
                    onClick={() => setWaitlistSubTab("manual")}
                    className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Issue Walk-In Token
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold">Token & Position</th>
                        <th className="py-3 px-4 font-bold">Guest Info</th>
                        <th className="py-3 px-4 font-bold">Party Size</th>
                        <th className="py-3 px-4 font-bold">Wait Duration</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold">Assign Table</th>
                        <th className="py-3 px-4 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {waitlistActive.map((entry, index) => {
                        const minutesWaiting = Math.max(
                          1,
                          Math.round((new Date() - new Date(entry.createdAt)) / 60000)
                        );
                        const availableTables = allTables.filter((t) => t.status === "Available");

                        return (
                          <tr
                            key={entry._id}
                            className={`hover:bg-slate-850/50 transition-colors ${
                              entry.status === "called" ? "bg-cyan-500/5" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 rounded-xl text-sm">
                                  {entry.tokenNo}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  #{index + 1}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">{entry.customerName}</div>
                              <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <a href={`tel:${entry.customerMobile}`} className="hover:underline">
                                  {entry.customerMobile}
                                </a>
                              </div>
                              {entry.notes && (
                                <p className="text-[11px] text-amber-400/90 italic mt-0.5 max-w-xs truncate">
                                  "{entry.notes}"
                                </p>
                              )}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-300">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {entry.guestsCount} Guests
                              </span>
                            </td>

                            <td className="py-3.5 px-4 font-bold text-amber-400">
                              ⏱ {minutesWaiting} mins
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  entry.status === "called"
                                    ? "bg-cyan-500 text-slate-950 animate-pulse font-extrabold"
                                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {entry.status === "called" ? "📣 Called - Table Ready" : "⏳ Waiting"}
                              </span>
                              {entry.assignedTableNo && (
                                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  T-{entry.assignedTableNo}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <select
                                id={`admin-wait-tbl-${entry._id}`}
                                defaultValue={entry.assignedTableNo || ""}
                                className="bg-slate-950 border border-slate-700 text-cyan-400 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:border-cyan-500"
                              >
                                <option value="">-- Pick Table --</option>
                                {availableTables.map((tbl) => (
                                  <option key={tbl._id} value={tbl.tableNo}>
                                    Table {tbl.tableNo} ({tbl.capacity}P)
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const selectEl = document.getElementById(`admin-wait-tbl-${entry._id}`);
                                    const chosenTable = selectEl?.value || entry.assignedTableNo;
                                    handleCallWaitlistGuest(entry, chosenTable);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-md shadow-cyan-600/20 active:scale-95 cursor-pointer"
                                  title="Call guest to restaurant counter"
                                >
                                  <PhoneCall className="w-3 h-3" />
                                  <span>{entry.status === "called" ? "Call Again" : "Call"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const selectEl = document.getElementById(`admin-wait-tbl-${entry._id}`);
                                    const chosenTable = selectEl?.value || entry.assignedTableNo;
                                    handleSeatWaitlistGuest(entry, chosenTable);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] flex items-center gap-1 transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
                                  title="Seat guest at table"
                                >
                                  <Utensils className="w-3 h-3" />
                                  <span>Seat Guest</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleUpdateWaitlistStatus(entry._id, "no_show")}
                                  className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 font-bold text-[11px] transition-all"
                                  title="Mark as no-show"
                                >
                                  No Show
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sub-View 2: Issue Walk-In Token Form */}
          {waitlistSubTab === "manual" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                <Ticket className="w-5 h-5 text-cyan-400" />
                <span>Issue Live Walk-in Token</span>
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                When dining tables are full and guests walk in, issue them a sequential digital token. They will be called as soon as a table frees up.
              </p>

              <form onSubmit={handleAddManualGuest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Guest Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualGuest.customerName}
                      onChange={(e) => setManualGuest({ ...manualGuest, customerName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={manualGuest.customerMobile}
                      onChange={(e) => setManualGuest({ ...manualGuest, customerMobile: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-mono font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Party Size (Number of Guests)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setManualGuest({ ...manualGuest, guestsCount: Math.max(1, manualGuest.guestsCount - 1) })
                        }
                        className="w-10 h-10 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 flex items-center justify-center transition-all"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={manualGuest.guestsCount}
                        onChange={(e) =>
                          setManualGuest({ ...manualGuest, guestsCount: Number(e.target.value) || 1 })
                        }
                        className="w-20 text-center bg-slate-950 border border-slate-800 text-white rounded-xl py-2 font-bold text-base outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setManualGuest({ ...manualGuest, guestsCount: manualGuest.guestsCount + 1 })
                        }
                        className="w-10 h-10 rounded-xl bg-slate-800 text-white font-black hover:bg-slate-700 flex items-center justify-center transition-all"
                      >
                        +
                      </button>
                      <span className="text-xs text-slate-400 ml-1">Guests</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Table Preference (Optional)
                    </label>
                    <select
                      value={manualGuest.assignedTableNo}
                      onChange={(e) => setManualGuest({ ...manualGuest, assignedTableNo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500 font-semibold"
                    >
                      <option value="">Any Available Table</option>
                      {allTables.map((t) => (
                        <option key={t._id} value={t.tableNo}>
                          Table {t.tableNo} ({t.capacity} Seater) - {t.status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Special Notes
                  </label>
                  <input
                    type="text"
                    value={manualGuest.notes}
                    onChange={(e) => setManualGuest({ ...manualGuest, notes: e.target.value })}
                    placeholder="e.g. High chair needed, AC section, window side"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2">
                  <MagneticButton className="w-full">
                    <button
                      type="submit"
                      disabled={submittingManual}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-lg shadow-cyan-600/20 text-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{submittingManual ? "Generating..." : "Generate Queue Token"}</span>
                    </button>
                  </MagneticButton>
                </div>
              </form>
            </div>
          )}

          {/* Sub-View 3: Completed History */}
          {waitlistSubTab === "history" && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {waitlistCompleted.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No seated or completed tokens yet today.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 font-bold">Token</th>
                        <th className="py-3 px-4 font-bold">Customer Name</th>
                        <th className="py-3 px-4 font-bold">Mobile</th>
                        <th className="py-3 px-4 font-bold">Party</th>
                        <th className="py-3 px-4 font-bold">Assigned Table</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {waitlistCompleted.map((entry) => (
                        <tr key={entry._id} className="hover:bg-slate-850/40">
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">{entry.tokenNo}</td>
                          <td className="py-3 px-4 font-bold text-white">{entry.customerName}</td>
                          <td className="py-3 px-4 text-slate-400">{entry.customerMobile}</td>
                          <td className="py-3 px-4">{entry.guestsCount} Guests</td>
                          <td className="py-3 px-4 text-emerald-400 font-bold">
                            {entry.assignedTableNo ? `Table ${entry.assignedTableNo}` : "-"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                entry.status === "seated"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {entry.status}
                            </span>
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
      )}
    </div>
  );
}
