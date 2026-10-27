import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  Utensils,
  BellRing,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Users,
  Clock,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Tv,
  ArrowRight,
  Flame,
  ChefHat,
  Columns,
  Radio,
} from "lucide-react";
import api, { waitlistAPI, publicAPI } from "../../api";

// Sound synthesis helper using Web Audio API (No external file download required)
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

    // Melodic airport / lobby chime: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz)
    playNote(523.25, 0.0, 0.4);
    playNote(659.25, 0.18, 0.4);
    playNote(783.99, 0.36, 0.7);
  } catch (e) {
    console.warn("Audio chime play error:", e);
  }
};

// Voice announcement helper using Web Speech API
const speakAnnouncement = (text) => {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // cancel any active queue
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error:", e);
  }
};

export default function AdminHallDisplay({ currentUser }) {
  const { hotelId: paramHotelId } = useParams();
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get("mode"); // 'waitlist' | 'kitchen' | 'split'

  const resolvedHotelId = paramHotelId || currentUser?.hotelId || currentUser?._id;

  // View mode: 'waitlist' | 'kitchen' | 'split'
  const [viewMode, setViewMode] = useState(queryMode || "waitlist");

  // Waitlist data state
  const [waitlistData, setWaitlistData] = useState({
    active: [],
    called: [],
    waiting: [],
    completed: [],
    waitingCount: 0,
    calledCount: 0,
    totalTables: 0,
    occupiedTables: 0,
    availableTables: 0,
    hotel: null,
  });

  // Kitchen orders state
  const [kitchenOrders, setKitchenOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCalledNotice, setLastCalledNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch waitlist data
  const fetchWaitlist = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      // If user has token, use protected admin endpoint or public display endpoint
      let res;
      if (resolvedHotelId) {
        res = await publicAPI.getWaitlistDisplay(resolvedHotelId).catch(() => null);
      }
      if (!res?.data?.success) {
        res = await waitlistAPI.getAdminWaitlist().catch(() => null);
      }

      if (res?.data?.success) {
        const raw = res.data.data;
        const active = raw.active || [];
        setWaitlistData({
          active,
          called: raw.called || active.filter((w) => w.status === "called"),
          waiting: raw.waiting || active.filter((w) => w.status === "waiting"),
          completed: raw.completed || [],
          waitingCount: raw.waitingCount ?? active.filter((w) => w.status === "waiting").length,
          calledCount: raw.calledCount ?? active.filter((w) => w.status === "called").length,
          totalTables: raw.totalTables || 0,
          occupiedTables: raw.occupiedTables || 0,
          availableTables: raw.availableTables || 0,
          hotel: raw.hotel || currentUser,
        });
      }
    } catch (err) {
      console.error("Waitlist fetch error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch Kitchen KDS orders
  const fetchKitchenOrders = async () => {
    try {
      const res = await api.get("/api/kds/orders", { showLoader: false }).catch(() => null);
      if (res?.data?.success) {
        setKitchenOrders(res.data.data || []);
      }
    } catch (e) {
      console.error("KDS fetch error:", e);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWaitlist();
    fetchKitchenOrders();

    // Auto-poll safety interval (every 8s)
    const interval = setInterval(() => {
      fetchWaitlist(true);
      if (viewMode === "kitchen" || viewMode === "split") {
        fetchKitchenOrders();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [resolvedHotelId, viewMode]);

  // Real-time SSE Stream Listener
  useEffect(() => {
    const baseUrl = api.defaults.baseURL || "http://localhost:5000/";
    const token = localStorage.getItem("token");

    // Connect to waitlist stream (either hotel-specific or KDS stream)
    let sseUrl;
    if (resolvedHotelId) {
      sseUrl = new URL(`/api/public/waitlist-stream/${resolvedHotelId}`, baseUrl);
    } else {
      sseUrl = new URL("/api/kds/stream", baseUrl);
      if (token) sseUrl.searchParams.append("token", token);
    }

    const eventSource = new EventSource(sseUrl.toString());

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Waitlist update event
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

        // KDS Kitchen Order update
        if (data.type === "new_order" || data.type === "kds_status_update" || data.type === "order_cancelled") {
          fetchKitchenOrders();
        }
      } catch (err) {
        console.error("SSE parse error in Hall Display:", err);
      }
    };

    eventSource.onerror = () => {
      // Auto reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [resolvedHotelId, soundEnabled]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const hotelInfo = waitlistData.hotel || currentUser || {};
  const hotelDisplayName = hotelInfo.hotelName || hotelInfo.name || "Annapurna Dining";

  return (
    <div className="min-h-screen bg-[#041212] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* TOP TV HEADER */}
      <header className="bg-[#061C1C]/95 border-b border-amber-500/25 px-6 py-4 backdrop-blur-xl shrink-0 flex items-center justify-between gap-4 shadow-2xl relative z-20">
        {/* Left: Branding & Clock */}
        <div className="flex items-center gap-4">
          {hotelInfo.logo || hotelInfo.hotelLogo ? (
            <img
              src={hotelInfo.logo || hotelInfo.hotelLogo}
              alt="Logo"
              className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40 bg-slate-900 shadow-lg"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              {hotelDisplayName.charAt(0) || "A"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white font-display">
                {hotelDisplayName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live SSE Sync
              </span>
            </div>
            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-0.5">
              <span>Lobby &amp; Dining Hall Display</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">
                {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </p>
          </div>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden lg:flex flex-col items-center justify-center bg-slate-950/80 px-5 py-2 rounded-2xl border border-white/10 shadow-inner">
          <span className="text-2xl font-black font-mono tracking-wider text-amber-300">
            {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Digital Clock</span>
        </div>

        {/* Right: Mode Switcher & Audio/Fullscreen Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher Tabs */}
          <div className="hidden md:flex items-center p-1 bg-slate-950/80 border border-white/15 rounded-2xl">
            <button
              onClick={() => setViewMode("waitlist")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "waitlist"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Waitlist Queue</span>
            </button>
            <button
              onClick={() => setViewMode("kitchen")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "kitchen"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen KDS</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "split"
                  ? "bg-amber-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Sound Announcement Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) playChimeTone();
            }}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
            }`}
            title={soundEnabled ? "Sound announcement is ON" : "Sound announcement is MUTED"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? "Chime ON" : "Muted"}</span>
          </button>

          {/* Manual Sound Test */}
          <button
            onClick={() => {
              playChimeTone();
              speakAnnouncement("Welcome to Annapurna Astra. Digital queue display sound test.");
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer hidden sm:flex items-center gap-1.5"
            title="Test announcement audio chime & voice"
          >
            <Radio className="w-4 h-4 text-amber-400" />
            <span>Test Sound</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen (TV Mode)"}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* QUICK STATS METRICS BAR */}
      <div className="bg-[#061C1C]/70 border-b border-white/10 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto text-xs shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold">In Live Queue:</span>
            <span className="font-mono font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg text-sm">
              {waitlistData.waitingCount} {waitlistData.waitingCount === 1 ? "Party" : "Parties"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Now Calling:</span>
            <span className="font-mono font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-sm animate-pulse">
              {waitlistData.calledCount} {waitlistData.calledCount === 1 ? "Table" : "Tables"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-slate-400 uppercase text-[10px] font-bold">Avg Wait Time:</span>
            <span className="font-mono font-bold text-cyan-300">~12 Mins / Group</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchWaitlist(true)}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* POPUP CALL NOTIFICATION BANNER (When admin calls a guest) */}
      <AnimatePresence>
        {lastCalledNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-slate-950 px-6 py-3.5 shadow-2xl flex items-center justify-between gap-4 border-b-2 border-emerald-300 shrink-0"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-white/20 text-white animate-bounce">
                <BellRing className="w-6 h-6 stroke-[2.5]" />
              </span>
              <div>
                <p className="text-xs uppercase font-black tracking-widest text-emerald-950">
                  🔊 TABLE READY ANNOUNCEMENT
                </p>
                <h3 className="text-lg md:text-xl font-black text-white">
                  Token #{lastCalledNotice.tokenNo} • {lastCalledNotice.customerName || "Guest"} — Please proceed to{" "}
                  <span className="underline decoration-white decoration-2 font-mono">
                    {lastCalledNotice.tableNo ? `Table ${lastCalledNotice.tableNo}` : "Dining Host Desk"}
                  </span>
                  !
                </h3>
              </div>
            </div>

            <button
              onClick={() => setLastCalledNotice(null)}
              className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN BODY CONTAINER */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
        {viewMode === "waitlist" ? (
          /* =========================================================
             VIEW 1: DEDICATED FULL WAITLIST DISPLAY
             ========================================================= */
          <div className="flex flex-col gap-6 flex-1">
            {/* ROW 1: NOW CALLING / TABLE READY (HERO HIGHLIGHT) */}
            <div className="bg-[#0A2F2F]/80 backdrop-blur-2xl border-2 border-emerald-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg">
                    <BellRing className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white font-display flex items-center gap-2">
                      <span>Now Calling · Table Ready</span>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                        Proceed to Table
                      </span>
                    </h2>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      Guests whose names or tokens appear here have their tables prepared!
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-400">
                  {waitlistData.called.length} {waitlistData.called.length === 1 ? "Party Ready" : "Parties Ready"}
                </span>
              </div>

              {waitlistData.called.length === 0 ? (
                <div className="py-10 text-center text-slate-400 border border-dashed border-white/10 rounded-2xl bg-black/20">
                  <Utensils className="w-10 h-10 text-slate-500 mx-auto mb-2 opacity-50" />
                  <p className="text-base font-bold text-slate-300">Tables are currently being set up</p>
                  <p className="text-xs text-slate-500 mt-1">
                    When your token is called by our host, it will appear here in bold and an audio chime will play.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {waitlistData.called.map((entry) => (
                    <motion.div
                      key={entry._id}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-5 rounded-2xl bg-gradient-to-br from-[#061C1C] to-[#0A2F2F] border-2 border-emerald-400/60 shadow-xl relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-0.5">
                            DINING PASS
                          </span>
                          <h3 className="text-3xl font-black text-white font-mono">{entry.tokenNo}</h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/30 animate-pulse">
                          <BellRing className="w-3.5 h-3.5" />
                          Ready!
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="text-lg font-black text-white truncate">{entry.customerName}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.guestsCount} Guests</span>
                          {entry.notes && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 italic truncate">"{entry.notes}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-bold uppercase">Please Proceed To:</span>
                        <span className="px-3 py-1 rounded-xl bg-emerald-400 text-slate-950 font-black text-sm font-mono shadow-md">
                          {entry.assignedTableNo ? `Table ${entry.assignedTableNo}` : "Host Desk"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ROW 2: LIVE WAITING QUEUE (UPCOMING PARTIES) */}
            <div className="bg-[#0A2F2F]/60 backdrop-blur-xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white font-display">
                      Waiting in Line · Next Up
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Sequential digital turn order for walk-ins and QR registered guests
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl">
                    {waitlistData.waiting.length} Parties in Queue
                  </span>
                </div>
              </div>

              {waitlistData.waiting.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-base font-bold text-white">No guests waiting in queue!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Walk-in guests can scan the QR code to join the queue, or front desk can issue tokens.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 flex-1">
                  {waitlistData.waiting.map((entry, index) => {
                    const minutesWaiting = Math.max(
                      1,
                      Math.round((new Date() - new Date(entry.createdAt)) / 60000)
                    );

                    return (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          index === 0
                            ? "bg-gradient-to-br from-[#061C1C] to-[#0A2F2F] border-amber-500/50 shadow-lg shadow-amber-500/10"
                            : "bg-[#061C1C]/70 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              index === 0
                                ? "bg-amber-500 text-slate-950 font-black animate-pulse"
                                : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {index === 0 ? "🔥 Next in Line" : `#${index + 1} in Line`}
                          </span>

                          <span className="font-mono text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            ~{Math.max(5, (index + 1) * 8)}m wait
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-2xl font-black font-mono text-cyan-300">{entry.tokenNo}</h4>
                          <span className="text-xs font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {entry.guestsCount}P
                          </span>
                        </div>

                        <p className="text-sm font-bold text-white truncate">{entry.customerName}</p>

                        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                          <span>Waiting for {minutesWaiting}m</span>
                          {entry.assignedTableNo ? (
                            <span className="text-emerald-400 font-bold">Pref: T-{entry.assignedTableNo}</span>
                          ) : (
                            <span className="italic text-slate-500">Any Table</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ROW 3: TODAY'S RECENTLY SEATED TICKER */}
            {waitlistData.completed.length > 0 && (
              <div className="bg-[#061C1C]/80 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 overflow-x-auto shrink-0 text-xs">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Recently Welcomed:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                  {waitlistData.completed.slice(0, 8).map((c) => (
                    <span
                      key={c._id}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono shrink-0 flex items-center gap-1.5"
                    >
                      <span className="font-bold text-white">{c.tokenNo}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400 font-bold">Table {c.assignedTableNo || "Done"}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : viewMode === "kitchen" ? (
          /* =========================================================
             VIEW 2: DEDICATED KITCHEN KDS DISPLAY
             ========================================================= */
          <div className="bg-[#0A2F2F]/70 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white font-display">
                    Kitchen · Live Food Queue
                  </h2>
                  <p className="text-xs text-slate-300">
                    Active kitchen orders preparing for dining tables and takeaway
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                {kitchenOrders.filter((o) => ["new", "preparing", "ready"].includes(o.kdsStatus)).length} Active Orders
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
              {kitchenOrders
                .filter((o) => ["new", "preparing", "ready"].includes(o.kdsStatus))
                .map((order) => {
                  const stageBadge =
                    order.kdsStatus === "ready"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 animate-pulse"
                      : order.kdsStatus === "preparing"
                      ? "bg-amber-500 text-slate-950 font-black"
                      : "bg-slate-800 text-slate-300";

                  return (
                    <div
                      key={order._id}
                      className="p-5 rounded-2xl bg-[#061C1C] border border-white/15 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                          <h3 className="text-lg font-black font-display text-white">
                            {order.orderType === "Table" && order.table
                              ? `Table ${order.table.tableNo}`
                              : `Order #${order.orderDisplayId}`}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs uppercase font-bold ${stageBadge}`}>
                            {order.kdsStatus}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-300 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-0.5">
                              <span>
                                <span className="font-bold text-amber-400 font-mono">{item.quantity}x</span>{" "}
                                {item.name}
                              </span>
                              {item.isAddon && (
                                <span className="text-[10px] font-black uppercase text-amber-400">+Addon</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-slate-400">
                        <span>{order.items?.length || 0} Dishes</span>
                        <span className="font-mono text-white font-bold">₹{order.grandTotal}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          /* =========================================================
             VIEW 3: SPLIT SCREEN (WAITLIST + KITCHEN QUEUE SIDE BY SIDE)
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
            {/* Left Col: Waitlist Live Queue */}
            <div className="bg-[#0A2F2F]/70 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Ticket className="w-5 h-5" />
                  <h3 className="text-lg font-black text-white">Waitlist Live Queue</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {waitlistData.calledCount} Ready • {waitlistData.waitingCount} Waiting
                </span>
              </div>

              {/* Called Highlight in Split View */}
              {waitlistData.called.length > 0 && (
                <div className="mb-4 space-y-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block">
                    Now Calling Table Ready:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {waitlistData.called.map((entry) => (
                      <div
                        key={entry._id}
                        className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950 to-teal-900 border border-emerald-400 shadow-md flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs uppercase font-extrabold text-emerald-400">Token</p>
                          <h4 className="text-xl font-black text-white font-mono">{entry.tokenNo}</h4>
                          <p className="text-xs text-slate-200 truncate font-semibold">{entry.customerName}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-xs font-mono">
                          Table {entry.assignedTableNo || "Desk"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Waiting List in Split View */}
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">
                  Upcoming Queue:
                </span>
                {waitlistData.waiting.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">No waiting guests in line</p>
                ) : (
                  waitlistData.waiting.map((entry, idx) => (
                    <div
                      key={entry._id}
                      className="p-3 rounded-xl bg-[#061C1C] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-black text-white text-sm">{entry.tokenNo}</span>
                        <span className="font-semibold text-slate-200 truncate max-w-[140px]">
                          {entry.customerName}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono">{entry.guestsCount} Guests</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Col: Kitchen KDS Orders */}
            <div className="bg-[#0A2F2F]/70 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-5 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ChefHat className="w-5 h-5" />
                  <h3 className="text-lg font-black text-white">Kitchen Food Orders</h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {kitchenOrders.filter((o) => ["new", "preparing", "ready"].includes(o.kdsStatus)).length} Active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar">
                {kitchenOrders
                  .filter((o) => ["new", "preparing", "ready"].includes(o.kdsStatus))
                  .map((order) => (
                    <div
                      key={order._id}
                      className="p-3.5 rounded-xl bg-[#061C1C] border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-sm">
                            {order.orderType === "Table" && order.table
                              ? `Table ${order.table.tableNo}`
                              : `Order #${order.orderDisplayId}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              order.kdsStatus === "ready"
                                ? "bg-emerald-500 text-slate-950 font-black animate-pulse"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {order.kdsStatus}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1 truncate max-w-xs">
                          {order.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                        </p>
                      </div>
                      <span className="text-amber-400 font-bold font-mono">₹{order.grandTotal}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER BRANDING */}
      <footer className="bg-[#061C1C] border-t border-white/10 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span className="font-semibold">
          Annapurna Astra · Intelligent Restaurant Queue &amp; Kitchen Management System
        </span>
        <span className="font-mono text-slate-500">Auto-Refreshes Realtime via SSE</span>
      </footer>
    </div>
  );
}
