import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import api, { waitlistAPI } from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Ticket,
  ChefHat,
  Columns,
  BellRing,
  Users,
  Clock,
  CheckCircle2,
  Utensils,
  Radio,
  RefreshCw,
} from "lucide-react";

const stages = {
  new: { label: "New", cls: "hall-stage-new" },
  preparing: { label: "Cooking", cls: "hall-stage-preparing" },
  ready: { label: "Ready", cls: "hall-stage-ready" },
};

// Sound synthesis helper using Web Audio API (melodic chime)
const playChimeTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const playNote = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(523.25, 0.0, 0.4); // C5
    playNote(659.25, 0.18, 0.4); // E5
    playNote(783.99, 0.36, 0.7); // G5
  } catch (e) {
    console.warn("Audio chime play error:", e);
  }
};

// Voice announcement helper using Web Speech API
const speakAnnouncement = (text) => {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
};

export default function StaffHallDisplay() {
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get("mode"); // 'waitlist' | 'kitchen' | 'split'

  // View mode: default to 'waitlist' (or from URL)
  const [viewMode, setViewMode] = useState(queryMode || "waitlist");

  // Kitchen orders state
  const [orders, setOrders] = useState([]);

  // Waitlist data state
  const [waitlistData, setWaitlistData] = useState({
    active: [],
    called: [],
    waiting: [],
    completed: [],
    waitingCount: 0,
    calledCount: 0,
    availableTables: [],
  });

  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCalledNotice, setLastCalledNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const audioRef = useRef(null);

  // Live Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch KDS orders
  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/api/kds/orders", { showLoader: false });
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching KDS orders:", error);
    }
  };

  // Fetch Waitlist data
  const fetchWaitlist = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await waitlistAPI.getAdminWaitlist();
      if (res.data?.success) {
        const raw = res.data.data;
        const active = raw.active || [];
        setWaitlistData({
          active,
          called: raw.called || active.filter((w) => w.status === "called"),
          waiting: raw.waiting || active.filter((w) => w.status === "waiting"),
          completed: raw.completed || [],
          waitingCount: raw.waitingCount ?? active.filter((w) => w.status === "waiting").length,
          calledCount: raw.calledCount ?? active.filter((w) => w.status === "called").length,
          availableTables: raw.availableTables || [],
        });
      }
    } catch (error) {
      console.error("Error fetching waitlist:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load & Polling safety net
  useEffect(() => {
    fetchOrders();
    fetchWaitlist();

    const interval = setInterval(() => {
      fetchOrders();
      fetchWaitlist(true);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Real-time SSE Connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
    const url = new URL("/api/kds/stream", baseUrl);
    if (token) url.searchParams.append("token", token);

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Waitlist Live updates from admin
        if (data.type === "waitlist_updated") {
          fetchWaitlist(true);

          if (data.action === "called") {
            const tokenStr = data.tokenNo || "Guest";
            const nameStr = data.customerName || "";
            const tableStr = data.assignedTableNo ? `Table ${data.assignedTableNo}` : "Dining Table";

            setLastCalledNotice({
              tokenNo: tokenStr,
              customerName: nameStr,
              tableNo: data.assignedTableNo || "",
              timestamp: new Date(),
            });

            if (soundEnabled) {
              playChimeTone();
              setTimeout(() => {
                const speechMsg = `Token number ${tokenStr}${nameStr ? `, ${nameStr}` : ""}, please proceed to ${tableStr}.`;
                speakAnnouncement(speechMsg);
              }, 400);
            }
          }
        }

        // Kitchen KDS updates
        if (data.type === "new_order" || data.type === "kds_status_update" || data.type === "order_cancelled") {
          fetchOrders();
          if (soundEnabled && (data.type === "new_order" || data.kdsStatus === "ready")) {
            playChimeTone();
          }
        }
      } catch (e) {
        console.error("SSE parse error in Hall Display:", e);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      eventSource.close();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [soundEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  const renderOrderTitle = (order) => {
    return order.orderType === "Table" && order.table ? `Table ${order.table.tableNo}` : order.orderDisplayId;
  };

  const renderOrderDish = (order) => {
    if (!order.items || order.items.length === 0) return "Empty order";
    const itemsStr = order.items
      .map((item) => `${item.quantity} ${item.name}${item.isAddon ? " (+ADD-ON)" : ""}`)
      .join(", ");
    return itemsStr.length > 55 ? itemsStr.substring(0, 52) + "..." : itemsStr;
  };

  const activeOrders = orders.filter((o) => ["new", "preparing", "ready"].includes(o.kdsStatus));

  return (
    <div className="hall-display-wrapper min-h-screen w-full flex flex-col items-center justify-start p-0 md:p-6 transition-colors duration-300">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Main Board Container */}
      <div className="hall-display-board w-full h-full md:rounded-[2rem] p-6 md:p-8 flex flex-col flex-1 overflow-hidden transition-all duration-300 backdrop-blur-xl">
        {/* TOP HEADER */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-saffron-500/20 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="font-display text-2xl md:text-3xl font-black hall-display-title">
                {viewMode === "waitlist"
                  ? "Waitlist · Live Queue"
                  : viewMode === "kitchen"
                  ? "Kitchen · Live Queue"
                  : "Dining Hall · Live Command Board"}
              </p>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live SSE Sync
              </span>
            </div>
            <p className="text-xs text-saffron-500 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
              <span>Lobby Display Board</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
              </span>
            </p>
          </div>

          {/* Mode Switcher & Controls */}
          <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-950/70 border border-white/10 rounded-xl">
              <button
                onClick={() => setViewMode("waitlist")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === "waitlist"
                    ? "bg-saffron-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Waitlist</span>
              </button>
              <button
                onClick={() => setViewMode("kitchen")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === "kitchen"
                    ? "bg-saffron-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Kitchen</span>
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === "split"
                    ? "bg-saffron-500 text-slate-950 font-black shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playChimeTone();
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
                soundEnabled
                  ? "bg-saffron-500/20 text-saffron-300 border-saffron-500/40"
                  : "bg-slate-900 text-slate-500 border-slate-800"
              }`}
              title={soundEnabled ? "Voice/Chime is ON" : "Muted"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Sound Test */}
            <button
              onClick={() => {
                playChimeTone();
                speakAnnouncement("Live Queue Hall Display sound test.");
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 cursor-pointer hidden md:flex items-center gap-1"
              title="Test Chime & Voice"
            >
              <Radio className="w-3.5 h-3.5 text-saffron-400" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* STATS STRIP */}
        <div className="mb-4 bg-slate-950/60 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-saffron-400 animate-pulse" />
              <span>In Queue:</span>
              <strong className="text-saffron-400 font-mono text-sm">{waitlistData.waitingCount} Parties</strong>
            </span>

            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Now Calling:</span>
              <strong className="text-emerald-400 font-mono text-sm">{waitlistData.calledCount} Ready</strong>
            </span>

            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Kitchen Orders:</span>
              <strong className="text-cyan-300 font-mono text-sm">{activeOrders.length} Active</strong>
            </span>
          </div>

          <button
            onClick={() => {
              fetchOrders();
              fetchWaitlist(true);
            }}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync</span>
          </button>
        </div>

        {/* POPUP CALL NOTIFICATION BANNER */}
        <AnimatePresence>
          {lastCalledNotice && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 flex items-center justify-between gap-3 shadow-2xl border border-emerald-300"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-white/20 text-white animate-bounce">
                  <BellRing className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-950">
                    NOW CALLING GUEST
                  </p>
                  <h4 className="text-base font-black text-white">
                    Token #{lastCalledNotice.tokenNo} • {lastCalledNotice.customerName || "Guest"} ➔{" "}
                    <span className="underline font-mono">
                      {lastCalledNotice.tableNo ? `Table ${lastCalledNotice.tableNo}` : "Dining Host"}
                    </span>
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setLastCalledNotice(null)}
                className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-1">
          {viewMode === "waitlist" ? (
            /* ================= WAITLIST LIVE QUEUE ================= */
            <div className="space-y-6 flex-1 flex flex-col">
              {/* NOW CALLING SECTION */}
              <div className="bg-[#0A2F2F]/80 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                    <BellRing className="w-5 h-5 animate-pulse" />
                    <h3 className="text-lg font-black text-white">Now Calling · Table Ready</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 font-bold">
                    {waitlistData.called.length} Ready for Seating
                  </span>
                </div>

                {waitlistData.called.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 bg-black/20 rounded-2xl border border-dashed border-white/10">
                    <Utensils className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-bold text-slate-300">All called guests are seated</p>
                    <p className="text-xs text-slate-500 mt-0.5">Tables are being prepared for next parties.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {waitlistData.called.map((entry) => (
                      <div
                        key={entry._id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-[#061C1C] to-[#0A2F2F] border-2 border-emerald-400 shadow-xl flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-3xl font-black text-white font-mono">{entry.tokenNo}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center gap-1 animate-pulse">
                            <BellRing className="w-3 h-3" /> Ready
                          </span>
                        </div>
                        <p className="text-base font-black text-white truncate mb-2">{entry.customerName}</p>
                        <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-semibold">{entry.guestsCount} Guests</span>
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-400 text-slate-950 font-black font-mono">
                            {entry.assignedTableNo ? `Table ${entry.assignedTableNo}` : "Host Desk"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WAITING QUEUE LIST */}
              <div className="bg-[#0A2F2F]/60 border border-white/15 rounded-3xl p-6 shadow-xl flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2.5 text-saffron-400 font-bold">
                    <Ticket className="w-5 h-5" />
                    <h3 className="text-lg font-black text-white">Waiting in Queue · Turn Order</h3>
                  </div>
                  <span className="text-xs font-mono text-saffron-300 font-bold">
                    {waitlistData.waiting.length} Waiting
                  </span>
                </div>

                {waitlistData.waiting.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-white">No guests in queue</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {waitlistData.waiting.map((entry, idx) => (
                      <div
                        key={entry._id}
                        className={`p-3.5 rounded-2xl border ${
                          idx === 0
                            ? "bg-[#061C1C] border-saffron-500/50 shadow-md"
                            : "bg-[#061C1C]/70 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              idx === 0 ? "bg-saffron-500 text-slate-950 animate-pulse" : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {idx === 0 ? "Next in Line" : `#${idx + 1} Turn`}
                          </span>
                          <span className="text-[11px] text-cyan-300 font-mono">
                            ~{Math.max(5, (idx + 1) * 8)}m
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-2xl font-black font-mono text-cyan-300">{entry.tokenNo}</span>
                          <span className="text-xs text-slate-400 font-bold">{entry.guestsCount}P</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{entry.customerName}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === "kitchen" ? (
            /* ================= KITCHEN LIVE QUEUE ================= */
            <div className="space-y-4">
              <AnimatePresence>
                {activeOrders.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20 hall-empty-text font-medium text-lg md:text-xl"
                  >
                    No active kitchen orders at the moment.
                  </motion.div>
                ) : (
                  activeOrders.map((order) => {
                    const stage = stages[order.kdsStatus] || { label: order.kdsStatus, cls: "hall-stage-new" };

                    return (
                      <motion.div
                        key={order._id}
                        layout
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="hall-order-card flex items-center justify-between rounded-3xl p-5 md:p-6 transition-all duration-300"
                      >
                        <div className="flex-1 pr-4">
                          <p className="text-xl md:text-2xl font-black font-display hall-order-title">
                            {renderOrderTitle(order)}
                          </p>
                          <p className="text-sm md:text-base font-medium hall-order-items mt-1.5">
                            {renderOrderDish(order)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-4 py-2 md:px-6 md:py-2.5 text-sm md:text-base font-bold tracking-wide transition-all duration-300 shadow-md ${stage.cls}`}
                        >
                          {stage.label}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ================= SPLIT VIEW (WAITLIST + KITCHEN) ================= */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
              {/* Left: Waitlist */}
              <div className="bg-[#0A2F2F]/70 border border-emerald-500/30 rounded-3xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <span className="font-black text-emerald-400 text-base flex items-center gap-1.5">
                    <Ticket className="w-4 h-4" /> Waitlist Live Queue
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {waitlistData.waitingCount} in line
                  </span>
                </div>

                {waitlistData.called.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Now Calling:</span>
                    {waitlistData.called.map((c) => (
                      <div
                        key={c._id}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-400 flex items-center justify-between text-xs"
                      >
                        <div>
                          <strong className="text-base text-white font-mono">{c.tokenNo}</strong>
                          <span className="ml-2 font-bold text-slate-200">{c.customerName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-black">
                          Table {c.assignedTableNo || "Desk"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                  {waitlistData.waiting.map((w, i) => (
                    <div
                      key={w._id}
                      className="p-2.5 rounded-xl bg-[#061C1C] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-saffron-400 font-mono font-bold">#{i + 1}</span>
                        <span className="font-mono font-black text-white">{w.tokenNo}</span>
                        <span className="font-semibold text-slate-300 truncate max-w-[120px]">
                          {w.customerName}
                        </span>
                      </div>
                      <span className="text-slate-400">{w.guestsCount} Guests</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Kitchen */}
              <div className="bg-[#0A2F2F]/70 border border-saffron-500/30 rounded-3xl p-5 shadow-xl flex flex-col">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                  <span className="font-black text-saffron-400 text-base flex items-center gap-1.5">
                    <ChefHat className="w-4 h-4" /> Kitchen Live Orders
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {activeOrders.length} active
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                  {activeOrders.map((o) => (
                    <div
                      key={o._id}
                      className="p-3 rounded-xl bg-[#061C1C] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-black text-white">
                          {o.orderType === "Table" && o.table ? `Table ${o.table.tableNo}` : `#${o.orderDisplayId}`}
                        </span>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {o.items?.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          o.kdsStatus === "ready"
                            ? "bg-emerald-500 text-slate-950 font-black animate-pulse"
                            : "bg-saffron-500/20 text-saffron-300"
                        }`}
                      >
                        {o.kdsStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
