import React, { useState, useEffect, useRef } from "react";
import api from "../../api";
import { Bell } from "lucide-react";

export default function StaffKDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/api/kds/orders");
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching KDS orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const token = localStorage.getItem("token");
    const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
    const url = new URL("/api/kds/stream", baseUrl);
    url.searchParams.append("token", token);
    
    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "new_order" || data.type === "kds_status_update" || data.type === "order_cancelled" || data.type === "addon_acknowledged") {
        fetchOrders(); // Refresh orders on update
        if (audioRef.current && data.type === "new_order") {
          audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const acknowledgeAddon = async (orderId, itemId) => {
    try {
      const { data } = await api.put(`/api/kds/order/${orderId}/items/${itemId}/acknowledge-addon`);
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error acknowledging addon:", error);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const { data } = await api.put(`/api/kds/order/${orderId}/status`, { status });
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating KDS status:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new": return "bg-red-500/20 text-red-500 border-red-500/50";
      case "preparing": return "bg-amber-500/20 text-amber-500 border-amber-500/50";
      case "ready": return "bg-green-500/20 text-green-500 border-green-500/50";
      default: return "bg-slate-800 text-slate-300";
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-300 font-bold">Loading KDS...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-lagoon-700/25 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-saffron-400" /> 
            <span>Kitchen Display System (KDS)</span>
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 font-medium">Real-time live kitchen tickets and order preparation station</p>
        </div>
        <button 
          onClick={() => audioRef.current?.play()}
          className="px-4 py-2.5 bg-saffron-500/15 border border-saffron-500/30 text-saffron-300 text-xs md:text-sm font-bold rounded-xl hover:bg-saffron-500/25 transition-all cursor-pointer"
        >
          🔔 Enable Sound Notification
        </button>
      </div>

      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400 glass rounded-3xl p-8 border border-white/10">
            <p className="text-lg font-bold text-slate-200">No active orders in kitchen.</p>
            <p className="text-xs text-slate-400 mt-1">New incoming orders from tables and rooms will appear here automatically.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className={`p-5 rounded-2xl border-2 shadow-xl backdrop-blur-md flex flex-col justify-between ${getStatusColor(order.kdsStatus)}`}>
              <div className="flex justify-between items-start mb-4 border-b border-white/15 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-xl text-white font-mono">
                      {order.orderType === "Table" && order.table ? `Table ${order.table.tableNo}` : order.orderDisplayId}
                    </h3>
                    {order.items?.some((it) => it.isAddon) && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                        ⚡ ADD-ON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <span className="uppercase text-[11px] font-black tracking-wider px-2.5 py-1 rounded-full bg-white/15 text-white border border-white/20">
                  {order.kdsStatus}
                </span>
              </div>
              
              <ul className="mb-5 space-y-2.5 flex-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm gap-2">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="font-black font-mono text-saffron-300 text-base">{item.quantity}x</span> 
                      <span className="font-bold text-white">{item.name}</span>
                      {item.isAddon && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase">
                          +ADD-ON
                        </span>
                      )}
                    </span>
                    {item.isAddon && (
                      <button
                        type="button"
                        onClick={() => acknowledgeAddon(order._id, item._id)}
                        title="Click to remove New Add-on mark once prepared/acknowledged"
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                      >
                        ✓ Clear
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 mt-auto pt-2 border-t border-white/10">
                {order.kdsStatus === "new" && (
                  <button 
                    onClick={() => updateStatus(order._id, "preparing")}
                    className="flex-1 bg-gradient-to-r from-saffron-400 to-saffron-500 hover:from-saffron-300 hover:to-saffron-400 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md shadow-saffron-500/20 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Start Preparing
                  </button>
                )}
                {order.kdsStatus === "preparing" && (
                  <button 
                    onClick={() => updateStatus(order._id, "ready")}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Mark Ready
                  </button>
                )}
                {order.kdsStatus === "ready" && (
                  <button 
                    onClick={() => updateStatus(order._id, "delivered")}
                    className="flex-1 bg-lagoon-600 hover:bg-lagoon-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-md cursor-pointer text-xs uppercase tracking-wider"
                  >
                    Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
