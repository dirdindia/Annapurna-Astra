import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import PremiumInvoice from "../../components/PremiumInvoice";
import PremiumRoomInvoice from "../../components/PremiumRoomInvoice";
import { 
  TrendingUp, Calendar, Clock, Landmark, Eye, Printer, AlertCircle, Building2, Utensils, LayoutDashboard
} from "lucide-react";

export default function AdminDashboard() {
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
        setChartData(res.data.chartData);
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

  // Find max chart amount for scaling SVG bar graph
  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount)) : 0;

  return (
    <div className="flex-1 p-6 space-y-8 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-saffron-500" />
            Financial Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-sm font-medium">
            Realtime hotel sales & room booking intelligence
          </p>
        </div>
        
        {/* DATA SOURCE FILTER */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shrink-0 shadow-inner">
          <button
            onClick={() => setDataSource('all')}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              dataSource === 'all'
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-lagoon-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Data
          </button>
          <button
            onClick={() => setDataSource('restaurant')}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
              dataSource === 'restaurant'
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-lagoon-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Restaurant
          </button>
          <button
            onClick={() => setDataSource('room')}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 ${
              dataSource === 'room'
                ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-lagoon-950 shadow-md shadow-saffron-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Room
          </button>
        </div>
      </div>

      {/* STATS TILES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 no-print">
        
        {/* Today Billing */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 border border-gold-800/15">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl"></div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Today Billing</p>
            {loadingStats ? (
              <div className="space-y-2 mt-2">
                <div className="h-7 w-24 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-200 font-mono mt-1">₹{stats.today.amount.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{stats.today.count} bills generated</p>
              </>
            )}
          </div>
        </div>

        {/* Monthly Billing */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 border border-saffron-500/20">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-saffron-500/10 rounded-full blur-2xl"></div>
          <div className="p-3 bg-saffron-500/15 border border-saffron-500/30 text-saffron-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Month Billing</p>
            {loadingStats ? (
              <div className="space-y-2 mt-2">
                <div className="h-7 w-24 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-200 font-mono mt-1">₹{stats.month.amount.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{stats.month.count} bills generated</p>
              </>
            )}
          </div>
        </div>

        {/* Yearly Billing */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 border border-lagoon-500/20">
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-lagoon-500/10 rounded-full blur-2xl"></div>
          <div className="p-3 bg-lagoon-500/15 border border-lagoon-500/30 text-lagoon-300 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Yearly Billing</p>
            {loadingStats ? (
              <div className="space-y-2 mt-2">
                <div className="h-7 w-24 bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-slate-800/50 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-slate-200 font-mono mt-1">₹{stats.year.amount.toFixed(2)}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{stats.year.count} bills generated</p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* GRAPH CHART SECTION */}
      {chartData.length > 0 && (
        <div className="glass-card rounded-2xl p-6 no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-saffron-500" />
              <h3 className="font-bold text-sm text-slate-200">
                Sales Chart ({chartType === "day" ? "Day-wise" : chartType === "week" ? "Week-wise" : chartType === "year" ? "Yearly-wise" : "Month-wise"})
              </h3>
            </div>
            
            {/* Chart Type Selector Tabs */}
            <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
              {[
                { id: "day", label: "Day" },
                { id: "week", label: "Week" },
                { id: "month", label: "Month" },
                { id: "year", label: "Year" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    chartType === tab.id
                      ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-lagoon-950 shadow-md shadow-saffron-500/20 font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom SVG-based Interactive Chart */}
          <div className="h-64 flex items-end justify-between gap-2.5 pt-8 px-2 overflow-x-auto relative">
            {loadingStats && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm rounded-lg">
                <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                <p className="text-xs font-semibold text-amber-500 mt-2">Aggregating Data...</p>
              </div>
            )}
            
            {chartData.map((data, idx) => {
              const heightPercentage = maxAmount > 0 ? (data.amount / maxAmount) * 80 : 0; // max height 80% to keep spacing for amount labels
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end group min-w-[40px] h-full">
                  {/* Amount label on hover */}
                  <span className="text-[9px] font-bold text-amber-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-1.5 -translate-y-1">
                    ₹{Math.round(data.amount)}
                  </span>
                  
                  {/* Bar */}
                  <div className="w-full relative rounded-t-lg bg-slate-800 group-hover:bg-gradient-to-t group-hover:from-amber-600 group-hover:to-yellow-500 transition-all duration-500 flex items-end" style={{ height: `${Math.max(heightPercentage, 5)}%` }}>
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-transparent rounded-t-lg"></div>
                  </div>

                  {/* Label */}
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3">
                    {data.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLE DATA LISTING (LATEST 5) */}
      <div className="glass-card rounded-2xl overflow-hidden no-print">
        
        {/* Table Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/20 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-saffron-500" />
            <h3 className="font-bold text-sm text-slate-200">Recent Invoices (Latest 5)</h3>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-saffron-500 hover:text-saffron-400 flex items-center gap-1 transition-colors"
          >
            View All Reports
          </Link>
        </div>

        {/* Invoice Grid/Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-saffron-500 font-bold">
              Loading recent invoices...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/10 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID / Room</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.length > 0 ? (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-900/30 text-slate-350 transition-colors">
                      <td className="py-4 px-6 font-bold font-mono text-slate-200">
                        {inv.transactionType === 'restaurant' ? inv.invoiceNumber : `Room ${inv.room?.roomNumber}`}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                          inv.transactionType === 'restaurant' 
                            ? 'bg-saffron-500/15 text-saffron-500 border border-saffron-500/30' 
                            : 'bg-lagoon-500/20 text-lagoon-300 border border-lagoon-500/30'
                        }`}>
                          {inv.transactionType}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {new Date(inv.createdAt).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-slate-200">
                            {inv.transactionType === 'restaurant' ? inv.customerName : (inv.guests?.[0]?.name || "N/A")}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {inv.transactionType === 'restaurant' ? inv.customerMobile : (inv.guests?.[0]?.phone || "")}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-black font-mono text-sm">
                        {inv.transactionType === 'restaurant' 
                          ? <span className="text-amber-500">₹{inv.grandTotal.toFixed(2)}</span>
                          : (inv.status === 'Checked-Out' 
                              ? <span className="text-blue-400">₹{(inv.totalAmount || 0).toFixed(2)}</span> 
                              : <span className="text-slate-500 font-medium text-xs">Checked-In</span>
                            )
                        }
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-550">
                      <div className="inline-flex items-center justify-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-slate-650" />
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
