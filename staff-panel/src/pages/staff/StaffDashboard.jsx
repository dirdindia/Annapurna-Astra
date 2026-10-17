import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { 
  Utensils, 
  BedDouble, 
  ClipboardList, 
  Tv, 
  ChefHat, 
  FileText, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Sparkles,
  Layers,
  ShoppingBag,
  IndianRupee,
  Receipt,
  UserCheck,
  RefreshCw,
  Phone,
  DoorOpen,
  Coffee,
  CheckCircle,
  Hourglass
} from "lucide-react";
import MagneticButton from "../../components/MagneticButton";

export default function StaffDashboard({ currentUser, theme }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeTables: 0,
    totalTables: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    pendingKotCount: 0,
    activeBookingsCount: 0,
    todaySales: 0,
    todayInvoicesCount: 0,
    loading: true,
  });

  const [recentInvoices, setRecentInvoices] = useState([]);
  const [activeGuests, setActiveGuests] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsRefreshing(true);
      setStats((prev) => ({ ...prev, loading: true }));
      
      const todayStr = new Date().toISOString().split("T")[0];

      const [tablesRes, roomsRes, bookingsRes, virtualOrdersRes, invoicesRes] = await Promise.allSettled([
        api.get("api/tables"),
        api.get("api/rooms"),
        api.get("api/room-bookings?status=Checked-In"),
        api.get("api/orders/virtual/active"),
        api.get(`api/invoices?limit=6&fromDate=${todayStr}`),
      ]);

      // Tables
      let totalTables = 0;
      let activeTables = 0;
      if (tablesRes.status === "fulfilled" && tablesRes.value.data?.success) {
        const tableList = tablesRes.value.data.data || [];
        totalTables = tableList.length;
        activeTables = tableList.filter((t) => t.status === "Occupied" || t.isOccupied).length;
      }

      // Rooms
      let totalRooms = 0;
      let occupiedRooms = 0;
      if (roomsRes.status === "fulfilled" && roomsRes.value.data?.success) {
        const roomList = roomsRes.value.data.data || [];
        totalRooms = roomList.length;
        occupiedRooms = roomList.filter((r) => r.status === "Occupied" || r.isOccupied).length;
      }

      // Active Guest Bookings
      let activeBookingsCount = 0;
      let guestList = [];
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.data?.success) {
        guestList = bookingsRes.value.data.data || [];
        activeBookingsCount = guestList.length;
        setActiveGuests(guestList.slice(0, 5));
      }

      // KOT Virtual Orders
      let pendingKotCount = 0;
      let ordersList = [];
      if (virtualOrdersRes.status === "fulfilled" && virtualOrdersRes.value.data?.success) {
        ordersList = virtualOrdersRes.value.data.data || [];
        pendingKotCount = ordersList.length;
        setLiveOrders(ordersList.slice(0, 5));
      }

      // Today's Invoices & Sales
      let todaySales = 0;
      let todayInvoicesCount = 0;
      if (invoicesRes.status === "fulfilled" && invoicesRes.value.data?.success) {
        const invList = invoicesRes.value.data.invoices || invoicesRes.value.data.data || [];
        todayInvoicesCount = invoicesRes.value.data.total || invList.length;
        todaySales = invList.reduce((acc, curr) => acc + (Number(curr.finalAmount) || Number(curr.totalAmount) || Number(curr.grandTotal) || 0), 0);
        setRecentInvoices(invList.slice(0, 5));
      } else {
        // Fallback fetch latest invoices without date filter if today's is empty
        try {
          const fallbackInv = await api.get("api/invoices?limit=5");
          if (fallbackInv.data?.success) {
            setRecentInvoices(fallbackInv.data.invoices || fallbackInv.data.data || []);
          }
        } catch (e) {
          console.error("Fallback invoices fetch error:", e);
        }
      }

      setStats({
        activeTables,
        totalTables,
        occupiedRooms,
        totalRooms,
        pendingKotCount,
        activeBookingsCount,
        todaySales,
        todayInvoicesCount,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching staff dashboard stats:", err);
      setStats((prev) => ({ ...prev, loading: false }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const quickActionCards = [
    {
      title: "KOT & Orders (Dining, Parcel, Room)",
      subtitle: "Dine-in Tables, Takeaway Parcels & Room Guest Orders",
      badge: "KOT Central",
      icon: ClipboardList,
      path: "/staff/kot",
      accent: "from-amber-500/20 to-amber-600/5",
      iconColor: "text-amber-500",
      permission: !currentUser?.staffPermissions || currentUser.staffPermissions.kot,
      statText: `${stats.activeTables}/${stats.totalTables || "0"} Tables • ${stats.pendingKotCount} Orders`,
    },
    {
      title: "Room Booking & Frontdesk",
      subtitle: "Guest Check-in, Check-out & Room Allocation",
      badge: "Front Desk",
      icon: BedDouble,
      path: "/staff/rooms",
      accent: "from-blue-500/20 to-blue-600/5",
      iconColor: "text-blue-500",
      permission: !currentUser?.staffPermissions || currentUser.staffPermissions.roomBooking,
      statText: `${stats.occupiedRooms}/${stats.totalRooms || "0"} Occupied Rooms`,
    },
    {
      title: "Kitchen Display (KDS)",
      subtitle: "Chef station screen for order preparation",
      badge: "Chef Screen",
      icon: ChefHat,
      path: "/staff/kds",
      accent: "from-orange-500/20 to-orange-600/5",
      iconColor: "text-orange-500",
      permission: !currentUser?.staffPermissions || currentUser.staffPermissions.restaurant,
      statText: "Live Kitchen Feed",
    },
    {
      title: "Customer Hall Display",
      subtitle: "Ready & Preparing token display screen",
      badge: "Live TV",
      icon: Tv,
      path: "/staff/hall-display",
      accent: "from-purple-500/20 to-purple-600/5",
      iconColor: "text-purple-500",
      permission: !currentUser?.staffPermissions || currentUser.staffPermissions.restaurant,
      statText: "Public Token Screen",
    },
    {
      title: "Print GRC Documents",
      subtitle: "Generate and print Guest Registration Cards",
      badge: "Compliance",
      icon: FileText,
      path: "/staff/grc",
      accent: "from-teal-500/20 to-teal-600/5",
      iconColor: "text-teal-500",
      permission: !currentUser?.staffPermissions || currentUser.staffPermissions.grc,
      statText: "Instant Document Print",
    },
  ];

  const allowedActions = quickActionCards.filter((card) => card.permission);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome & Shift Banner */}
      <div className={`p-6 md:p-8 rounded-3xl border transition-all relative overflow-hidden ${
        theme === "light"
          ? "bg-white/80 border-slate-200 shadow-xl shadow-lagoon-900/5 text-slate-900"
          : "glass-card text-slate-100"
      }`}>
        {/* Glow ambient background decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-lagoon-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border bg-saffron-500/15 text-saffron-700 dark:text-saffron-400 border-saffron-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Staff Operation Hub • Active Shift</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold font-display tracking-tight leading-tight text-slate-900 dark:text-white">
              Welcome back, <span className="text-saffron-700 dark:text-saffron-400">{currentUser?.name || "Staff Member"}</span>
            </h1>
            <p className={`text-sm md:text-base max-w-2xl font-normal leading-relaxed ${
              theme === "light" ? "text-slate-600" : "text-slate-300"
            }`}>
              Hotel desk command center: monitor live restaurant tables, occupied rooms, pending kitchen tickets, and billing metrics in real-time.
            </p>
          </div>

          {/* Clock & Action Controls */}
          <div className="flex items-center gap-3">
            <div className={`flex flex-col items-start md:items-end p-4 rounded-2xl border min-w-[200px] shadow-md ${
              theme === "light"
                ? "bg-slate-50 border-slate-200"
                : "bg-slate-900/80 border-slate-800"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-700 dark:text-saffron-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Shift Clock</span>
              </div>
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
              <div className={`text-xs mt-0.5 flex items-center gap-1.5 font-medium ${
                theme === "light" ? "text-slate-500" : "text-slate-400"
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentTime.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              </div>
            </div>

            <MagneticButton>
              <button
                onClick={fetchDashboardStats}
                disabled={isRefreshing}
                className={`p-4 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-md ${
                  theme === "light"
                    ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200"
                }`}
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin text-saffron-500" : ""}`} />
              </button>
            </MagneticButton>
          </div>
        </div>
      </div>

      {/* Staff Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className={`p-4 md:p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 shadow-md ${
          theme === "light"
            ? "bg-white/90 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/60 border-slate-800 text-white"
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Restaurant Tables</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black font-display text-slate-900 dark:text-white">
            {stats.loading ? "..." : `${stats.activeTables} / ${stats.totalTables}`}
          </div>
          <p className="text-[11px] text-amber-800 dark:text-amber-400 font-bold mt-1">
            {stats.totalTables ? `${Math.round((stats.activeTables / stats.totalTables) * 100)}% Current Occupancy` : "No tables defined"}
          </p>
        </div>

        {/* Metric 2 */}
        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
          theme === "light"
            ? "bg-white/80 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/50 border-slate-800/80 text-slate-100"
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Room Occupancy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-display">
            {stats.loading ? "..." : `${stats.occupiedRooms} / ${stats.totalRooms}`}
          </div>
          <p className="text-[11px] text-blue-600/90 dark:text-blue-400/80 mt-1">
            {stats.activeBookingsCount} Checked-in Guests
          </p>
        </div>

        {/* Metric 3 */}
        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
          theme === "light"
            ? "bg-white/80 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/50 border-slate-800/80 text-slate-100"
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Live KOT Orders</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-display">
            {stats.loading ? "..." : stats.pendingKotCount}
          </div>
          <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 mt-1">
            Active in Kitchen / Takeaway
          </p>
        </div>

        {/* Metric 4 */}
        <div className={`p-4 md:p-5 rounded-2xl border transition-all ${
          theme === "light"
            ? "bg-white/80 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/50 border-slate-800/80 text-slate-100"
        }`}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Invoices</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold font-display text-saffron-500">
            {stats.loading ? "..." : stats.todayInvoicesCount}
          </div>
          <p className={`text-[11px] mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
            ₹{stats.todaySales.toLocaleString("en-IN")} Total Generated
          </p>
        </div>
      </div>

      {/* Real-Time Operational Activity Tables (Staff Relevant Live Data) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Checked-In Guests Status */}
        <div className={`p-5 md:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          theme === "light"
            ? "bg-white/90 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/60 border-slate-800/80 text-slate-100"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display tracking-tight">Active In-House Guests</h3>
                  <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    Currently checked-in guest rooms
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/staff/rooms")}
                className="text-xs font-semibold text-saffron-500 hover:underline flex items-center gap-1"
              >
                <span>Manage Rooms</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {activeGuests.length === 0 ? (
              <div className={`py-8 text-center text-xs rounded-2xl border ${
                theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950/40 border-slate-800 text-slate-400"
              }`}>
                No guests currently checked-in
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeGuests.map((booking) => {
                  const guestName = booking.guests?.[0]?.name || "Guest";
                  const guestPhone = booking.guests?.[0]?.phone || "N/A";
                  const roomNumber = booking.room?.roomNumber || "Room";

                  return (
                    <div
                      key={booking._id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        theme === "light"
                          ? "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                          : "bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0">
                          {roomNumber}
                        </div>
                        <div>
                          <div className="text-sm font-semibold leading-tight">{guestName}</div>
                          <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${
                            theme === "light" ? "text-slate-500" : "text-slate-400"
                          }`}>
                            <Phone className="w-3 h-3" />
                            <span>{guestPhone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Checked-In
                        </span>
                        <div className={`text-[10px] mt-1 ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                          Adv: ₹{booking.advanceAmount || 0}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.occupiedRooms} Total Occupied Rooms</span>
            <span className="text-saffron-500 font-semibold">{stats.totalRooms - stats.occupiedRooms} Rooms Available</span>
          </div>
        </div>

        {/* Right: Recent Invoices & Bill Generated */}
        <div className={`p-5 md:p-6 rounded-3xl border transition-all flex flex-col justify-between ${
          theme === "light"
            ? "bg-white/90 border-slate-200 shadow-sm text-slate-900"
            : "bg-slate-900/60 border-slate-800/80 text-slate-100"
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display tracking-tight">Recent Billed Orders</h3>
                  <p className={`text-xs ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    Latest receipts and customer orders
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/staff/kot")}
                className="text-xs font-semibold text-saffron-500 hover:underline flex items-center gap-1"
              >
                <span>New KOT / Order</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {recentInvoices.length === 0 ? (
              <div className={`py-8 text-center text-xs rounded-2xl border ${
                theme === "light" ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-slate-950/40 border-slate-800 text-slate-400"
              }`}>
                No recent invoices recorded
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentInvoices.map((inv) => {
                  const billAmount = inv.finalAmount || inv.totalAmount || inv.grandTotal || 0;
                  const customer = inv.customerName || "Customer";
                  const invNum = inv.invoiceNumber || inv.orderDisplayId || "INV";
                  const paymentMode = inv.paymentMode || "Cash";

                  return (
                    <div
                      key={inv._id}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        theme === "light"
                          ? "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                          : "bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <IndianRupee className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold leading-tight">{customer}</div>
                          <div className={`text-[11px] truncate mt-0.5 ${
                            theme === "light" ? "text-slate-500" : "text-slate-400"
                          }`}>
                            #{invNum} • {inv.items?.length || 0} items
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-saffron-500 font-mono">
                          ₹{Number(billAmount).toFixed(0)}
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          theme === "light" ? "bg-slate-200/80 text-slate-700" : "bg-slate-700/60 text-slate-300"
                        }`}>
                          {paymentMode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Payment Modes: Cash • UPI • Card</span>
            <span className="text-emerald-500 font-semibold">Active Counter Ready</span>
          </div>
        </div>
      </div>

      {/* Main Operational Modules Section */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Staff Workspaces</h2>
            <p className={`text-xs md:text-sm ${theme === "light" ? "text-slate-500" : "text-slate-400"}`}>
              Launch point for POS, Kitchen KDS, Rooms and Order management
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allowedActions.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.path}
                onClick={() => navigate(module.path)}
                className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                  theme === "light"
                    ? "bg-white/90 border-slate-200/90 hover:border-amber-500/50 shadow-md hover:shadow-xl shadow-lagoon-900/5"
                    : "bg-slate-900/50 border-slate-800/80 hover:border-saffron-500/40 hover:bg-slate-900/80 shadow-lg"
                }`}
              >
                {/* Subtle top background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl border transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                      theme === "light"
                        ? "bg-slate-50 border-slate-200"
                        : "bg-slate-800/70 border-slate-700/60"
                    }`}>
                      <Icon className={`w-6 h-6 ${module.iconColor}`} />
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      theme === "light"
                        ? "bg-slate-100 text-slate-600 border-slate-200"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}>
                      {module.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-display group-hover:text-saffron-500 transition-colors">
                      {module.title}
                    </h3>
                    <p className={`text-xs md:text-sm mt-1 leading-relaxed ${
                      theme === "light" ? "text-slate-600" : "text-slate-400"
                    }`}>
                      {module.subtitle}
                    </p>
                  </div>
                </div>

                {/* Bottom footer in card */}
                <div className="relative z-10 pt-6 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {module.statText}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:translate-x-1 group-hover:-translate-y-1 bg-saffron-500/10 text-saffron-500 group-hover:bg-saffron-500 group-hover:text-black">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
