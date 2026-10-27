import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import PremiumInvoice from "../../components/PremiumInvoice";
import PremiumRoomInvoice from "../../components/PremiumRoomInvoice";
import { 
  TrendingUp, Calendar, Clock, Landmark, Eye, Printer, AlertCircle, Building2, Utensils, LayoutDashboard, ArrowUpRight, ArrowDownRight, Layers, Sparkles, ShieldCheck, Lock, CheckCircle2, ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import MagneticButton from "../../components/MagneticButton";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";

export default function AdminDashboard() {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isSubAdmin = currentUser?.role === "sub_admin";

  const [stats, setStats] = useState({
    today: { amount: 0, count: 0 },
    month: { amount: 0, count: 0 },
    year: { amount: 0, count: 0 }
  });
  const [chartData, setChartData] = useState([]);
  
  // Invoices list state (Recent 5 only)
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRoomInvoice, setSelectedRoomInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [chartType, setChartType] = useState("month");
  const [dataSource, setDataSource] = useState("all");
  const [viewMode, setViewMode] = useState("area"); // 'area' or 'bar'

  useEffect(() => {
    fetchStats();
  }, [chartType, dataSource]);

  useEffect(() => {
    fetchInvoices();
  }, [dataSource]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get("api/invoices/stats", { params: { chartType, source: dataSource }, showLoader: false });
      if (res.data.success) {
        setStats(res.data.stats);
        setChartData(res.data.chartData || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let merged = [];
      
      if (dataSource === 'restaurant' || dataSource === 'all') {
        const res1 = await api.get("api/invoices", { params: { page: 1, limit: 5 } });
        if (res1.data.success) {
          const restaurantData = res1.data.data.map(item => ({ ...item, transactionType: 'restaurant' }));
          merged = [...merged, ...restaurantData];
        }
      }
      
      if (dataSource === 'room' || dataSource === 'all') {
        const res2 = await api.get("api/room-bookings", { params: { page: 1, limit: 5, filter: 'all' } });
        if (res2.data.success) {
          const roomData = res2.data.data.map(item => ({ ...item, transactionType: 'room' }));
          merged = [...merged, ...roomData];
        }
      }

      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setInvoices(merged.slice(0, 5));
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom Glassmorphic Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A2F2F]/95 backdrop-blur-xl border border-amber-500/30 p-3 rounded-2xl shadow-2xl text-xs text-white">
          <p className="font-bold text-amber-300 uppercase tracking-wider text-[10px] mb-1">{label}</p>
          <p className="font-mono font-extrabold text-base text-white">
            ₹{Number(payload[0].value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-teal-200/60 font-medium">Verified Sales</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 overflow-x-hidden">
      
      {/* HEADER SECTION WITH MODERN CHIPS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/10 border border-saffron-500/25 text-saffron-400 text-xs font-semibold mb-2">
            {isSubAdmin ? (
              <>
                <ShieldCheck size={13} className="text-amber-400" />
                <span>Operational Control Center (Sub-Admin Mode)</span>
              </>
            ) : (
              <>
                <Sparkles size={13} className="text-saffron-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Real-time Financial Intelligence</span>
              </>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-saffron-500" />
            {isSubAdmin ? "Operations Dashboard" : "Financial Dashboard"}
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            {isSubAdmin 
              ? "Live room occupancy, desk orders & active operations (Revenue analytics restricted)"
              : "Live occupancy, KOT billing metrics, and revenue breakdown"}
          </p>
        </div>
        
        {/* DATA SOURCE FILTER TABS WITH MAGNETIC FEEL */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800/80 shrink-0 shadow-lg backdrop-blur-md">
          <MagneticButton>
            <button
              onClick={() => setDataSource('all')}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                dataSource === 'all'
                  ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Sales
            </button>
          </MagneticButton>
          <MagneticButton>
            <button
              onClick={() => setDataSource('restaurant')}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                dataSource === 'restaurant'
                  ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Restaurant
            </button>
          </MagneticButton>
          <MagneticButton>
            <button
              onClick={() => setDataSource('room')}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
                dataSource === 'room'
                  ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 shadow-md shadow-saffron-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Rooms
            </button>
          </MagneticButton>
        </div>
      </div>

      {/* STATS TILES GRID - GLASSMORPHIC 3D-LIFT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 no-print">
        
        {/* Today Billing */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.01] border border-white/10 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isSubAdmin ? "Today's Orders / Bills" : "Today's Revenue"}
            </span>
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl shadow-inner">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          {loadingStats ? (
            <div className="space-y-2 mt-2">
              <div className="h-8 w-32 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-4 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div>
              {isSubAdmin ? (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    {stats.today.count} <span className="text-sm font-semibold text-slate-400">Bills</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ArrowUpRight size={13} /> Active Today
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Lock size={10} /> Revenue: Restricted
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight">
                    ₹{stats.today.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ArrowUpRight size={13} /> Active
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {stats.today.count} bills generated today
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Monthly Billing */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.01] border border-white/10 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-saffron-500/40 hover:shadow-2xl hover:shadow-saffron-500/10"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-saffron-500/20 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isSubAdmin ? "Month-to-Date Volume" : "Month-to-Date"}
            </span>
            <div className="p-3 bg-saffron-500/15 border border-saffron-500/30 text-saffron-400 rounded-2xl shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          {loadingStats ? (
            <div className="space-y-2 mt-2">
              <div className="h-8 w-32 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-4 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div>
              {isSubAdmin ? (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    {stats.month.count} <span className="text-sm font-semibold text-slate-400">Transactions</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-400 bg-saffron-500/10 px-2 py-0.5 rounded-full border border-saffron-500/20">
                      <TrendingUp size={13} /> Pace
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Lock size={10} /> Turnover: Restricted
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight">
                    ₹{stats.month.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-400 bg-saffron-500/10 px-2 py-0.5 rounded-full border border-saffron-500/20">
                      <TrendingUp size={13} /> Pace
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {stats.month.count} transactions closed
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Yearly Billing */}
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.01] border border-white/10 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-sky-500/40 hover:shadow-2xl hover:shadow-sky-500/10"
        >
          <div className="pointer-events-none absolute -top-10 -right-10 w-32 h-32 bg-sky-500/15 rounded-full blur-2xl" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isSubAdmin ? "Cumulative Annual Records" : "Yearly Turnover"}
            </span>
            <div className="p-3 bg-sky-500/15 border border-sky-500/30 text-sky-400 rounded-2xl shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          {loadingStats ? (
            <div className="space-y-2 mt-2">
              <div className="h-8 w-32 bg-white/10 rounded-xl animate-pulse" />
              <div className="h-4 w-24 bg-white/5 rounded-lg animate-pulse" />
            </div>
          ) : (
            <div>
              {isSubAdmin ? (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                    {stats.year.count} <span className="text-sm font-semibold text-slate-400">Total Records</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      Total
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <Lock size={10} /> Turnover: Restricted
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-3xl font-black text-white font-mono tracking-tight">
                    ₹{stats.year.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      Total
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {stats.year.count} cumulative records
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

      </div>

      {/* MODERN INTERACTIVE RECHARTS SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 md:p-8 backdrop-blur-xl shadow-2xl no-print">
        
        {/* Top Header & Chart Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-saffron-500/15 text-saffron-400 border border-saffron-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-display">
                Revenue Trajectory ({chartType === "day" ? "Day-wise" : chartType === "week" ? "Week-wise" : chartType === "year" ? "Yearly" : "Month-wise"})
              </h3>
              <p className="text-xs text-slate-400">Interactive live telemetry & trends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle (Area vs Bar) */}
            <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800">
              <MagneticButton>
                <button
                  onClick={() => setViewMode("area")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "area" ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Smooth Area
                </button>
              </MagneticButton>
              <MagneticButton>
                <button
                  onClick={() => setViewMode("bar")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "bar" ? "bg-white/15 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Columns
                </button>
              </MagneticButton>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: "day", label: "Day" },
                { id: "week", label: "Week" },
                { id: "month", label: "Month" },
                { id: "year", label: "Year" }
              ].map((tab) => (
                <MagneticButton key={tab.id}>
                  <button
                    onClick={() => setChartType(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      chartType === tab.id
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-extrabold shadow-md shadow-saffron-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                </MagneticButton>
              ))}
            </div>
          </div>
        </div>
        
        {/* Recharts Canvas */}
        <div className="h-72 w-full relative">
          {loadingStats && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/50 backdrop-blur-sm rounded-2xl">
              <div className="w-9 h-9 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-amber-400 mt-3">Refreshing Chart Data...</p>
            </div>
          )}

          {isSubAdmin ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-amber-500/[0.03] border border-amber-500/20 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="font-bold text-base text-white font-display">Revenue Analytics Restricted</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
                You are logged in with <strong>Sub-Admin</strong> credentials. Financial turnover, sales volume trajectories, and revenue curves are strictly confidential and restricted to the Hotel Administrator.
              </p>
              <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-500/25">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Operational Control Mode Active</span>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "area" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F6B445" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#F6B445" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.06} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#ffffff', strokeOpacity: 0.1 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#ffffff', strokeOpacity: 0.1 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#F6B445" 
                    strokeWidth={3}
                    dot={{ fill: '#F6B445', stroke: '#0A2F2F', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#F6B445', strokeWidth: 3 }}
                    fillOpacity={1} 
                    fill="url(#revenueGlow)" 
                  />
                </AreaChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.06} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#ffffff', strokeOpacity: 0.1 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#ffffff', strokeOpacity: 0.1 }}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="amount" 
                    fill="#F6B445" 
                    radius={[8, 8, 0, 0]} 
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No sales data recorded for this timeframe
            </div>
          )}
        </div>
      </div>

      {/* MODERN GLASSMORPHIC RECENT TRANSACTIONS TABLE */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-xl shadow-2xl no-print">
        
        {/* Table Header */}
        <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-saffron-500/15 text-saffron-400 border border-saffron-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-display">Recent Invoices (Latest 5)</h3>
              <p className="text-xs text-slate-400">Real-time sync across rooms and restaurant tables</p>
            </div>
          </div>
          <MagneticButton>
            <Link
              to="/admin/kot-reports"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-saffron-400 border border-white/10 flex items-center gap-1.5 transition-all shadow-md shadow-saffron-500/10"
            >
              <span>View All Reports</span>
              <span>→</span>
            </Link>
          </MagneticButton>
        </div>

        {/* Invoice Grid/Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-saffron-400 font-bold flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-saffron-400 border-t-transparent rounded-full animate-spin" />
              <span>Fetching latest transactions...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-4 px-6">ID / Room</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Date & Time</th>
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-white/[0.04] text-slate-300 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-white">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                          {inv.transactionType === 'restaurant' ? inv.invoiceNumber : `Room ${inv.room?.roomNumber}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.transactionType === 'restaurant' 
                            ? 'bg-saffron-500/15 text-saffron-400 border border-saffron-500/30' 
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }`}>
                          {inv.transactionType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {new Date(inv.createdAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-white text-sm">
                            {inv.transactionType === 'restaurant' ? inv.customerName : (inv.guests?.[0]?.name || "N/A")}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {inv.transactionType === 'restaurant' ? inv.customerMobile : (inv.guests?.[0]?.phone || "")}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-sm">
                        {isSubAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/25 font-bold">
                            <Lock size={11} /> Confidential
                          </span>
                        ) : (
                          inv.transactionType === 'restaurant' 
                            ? <span className="text-amber-400 font-extrabold">₹{inv.grandTotal.toFixed(2)}</span>
                            : (inv.status === 'Checked-Out' 
                                ? <span className="text-sky-400 font-extrabold">₹{(inv.totalAmount || 0).toFixed(2)}</span> 
                                : <span className="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">Checked-In</span>
                              )
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-500">
                      <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold">No recent transactions found</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* PREMIUM INVOICE MODAL FOR RESTAURANT */}
      {selectedInvoice && (
        <PremiumInvoice
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* PREMIUM INVOICE MODAL FOR ROOM */}
      {selectedRoomInvoice && (
        <PremiumRoomInvoice
          booking={selectedRoomInvoice}
          onClose={() => setSelectedRoomInvoice(null)}
        />
      )}

    </div>
  );
}
