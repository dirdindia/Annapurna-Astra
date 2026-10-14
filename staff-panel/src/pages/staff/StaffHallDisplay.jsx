import React, { useState, useEffect, useRef } from "react";
import api from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Maximize, Minimize } from "lucide-react";

const stages = {
  new: { label: 'New', cls: 'hall-stage-new' },
  preparing: { label: 'Cooking', cls: 'hall-stage-preparing' },
  ready: { label: 'Ready', cls: 'hall-stage-ready' },
};

export default function StaffHallDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/api/kds/orders", { showLoader: false });
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
      if (data.type === "new_order" || data.type === "kds_status_update" || data.type === "order_cancelled") {
        fetchOrders();
        // Play sound when an order is updated
        if (audioRef.current && (data.type === "new_order" || data.kdsStatus === "ready")) {
          audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      eventSource.close();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  const renderOrderTitle = (order) => {
    const title = order.orderType === "Table" && order.table ? `Table ${order.table.tableNo}` : order.orderDisplayId;
    return title;
  };

  const renderOrderDish = (order) => {
    if (!order.items || order.items.length === 0) return "Empty order";
    const itemsStr = order.items.map(item => `${item.quantity} ${item.name}${item.isAddon ? ' (+ADD-ON)' : ''}`).join(', ');
    return itemsStr.length > 55 ? itemsStr.substring(0, 52) + '...' : itemsStr;
  };

  if (loading) {
    return (
      <div className="hall-display-wrapper min-h-[calc(100vh-80px)] md:min-h-screen w-full flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-saffron-500/30 border-t-saffron-500 rounded-full animate-spin"></div>
        <div className="text-saffron-500 font-bold font-display text-xl">Loading Display...</div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ["new", "preparing", "ready"].includes(o.kdsStatus));

  return (
    <div className="hall-display-wrapper min-h-[calc(100vh-80px)] md:min-h-screen w-full flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Main Board Container taking up maximum available screen space */}
      <div className="hall-display-board w-full h-full md:rounded-[2rem] p-6 md:p-10 flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl">
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-saffron-500/20 pb-4 gap-4">
          <div>
            <p className="font-display text-2xl md:text-3xl font-black hall-display-title">Kitchen · Live Queue</p>
            <p className="text-xs text-saffron-500 font-bold uppercase tracking-widest mt-0.5">Hall Display Board</p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-center">
            <button 
              onClick={() => audioRef.current?.play()}
              className="px-4 py-2 bg-saffron-500/10 border border-saffron-500/30 text-xs md:text-sm font-bold text-saffron-500 hover:text-saffron-400 rounded-xl hover:bg-saffron-500/20 transition-all flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4" />
              <span>Sound Test</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-saffron-500/10 border border-saffron-500/30 text-saffron-500 hover:text-saffron-400 rounded-xl hover:bg-saffron-500/20 transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <span className="hall-display-badge flex items-center gap-2 text-sm md:text-base font-bold px-3.5 py-1.5 rounded-xl">
              <span className="h-2 w-2 md:h-2.5 md:w-2.5 animate-pulse rounded-full bg-emerald-400" />
              {activeOrders.length} {activeOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4 md:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {activeOrders.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-20 hall-empty-text font-medium text-lg md:text-xl"
              >
                No active orders at the moment.
              </motion.div>
            ) : (
              activeOrders.map((order) => {
                const stage = stages[order.kdsStatus] || { label: order.kdsStatus, cls: 'hall-stage-new' };
                
                return (
                  <motion.div
                    key={order._id}
                    layout
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ delay: 0.1, type: "spring", bounce: 0.3 }}
                    className="hall-order-card flex items-center justify-between rounded-3xl p-5 md:p-6 transition-all duration-300"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-xl md:text-2xl font-black font-display hall-order-title">{renderOrderTitle(order)}</p>
                      <p className="text-sm md:text-base font-medium hall-order-items mt-1.5">{renderOrderDish(order)}</p>
                    </div>
                    <span className={`rounded-full px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-bold tracking-wide transition-all duration-300 shadow-md ${stage.cls}`}>
                      {stage.label}
                    </span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
