import React, { useState, useEffect } from "react";
import api from "../../api";
import {
  Sparkles,
  ChefHat,
  Calendar,
  Printer,
  CheckCircle2,
  TrendingUp,
  Utensils,
  Flame,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  ListPlus,
  ClipboardList,
  CheckSquare,
  Square,
  CookingPot,
  Tag
} from "lucide-react";
import MagneticButton from "../../components/MagneticButton";
import { showConfirm, showSuccess, showError } from "../../utils/alerts";

export default function StaffPrepForecast({ currentUser, theme }) {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState("items"); // "items" | "checklist"
  const [checklist, setChecklist] = useState([]);
  const [filterState, setFilterState] = useState("all"); // "all" | "pending" | "done"
  const [newCustomTask, setNewCustomTask] = useState("");
  const [newCustomWeight, setNewCustomWeight] = useState("");
  const [newCustomCategory, setNewCustomCategory] = useState("General Prep");
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch forecast data from backend
  const fetchForecast = async (dateStr) => {
    try {
      setIsRefreshing(true);
      const queryDate = dateStr || selectedDate;
      const res = await api.get(`/api/inventory/ai-forecast?date=${queryDate}`);

      if (res.data?.success && res.data.data) {
        setForecastData(res.data.data);

        // Use clean manual storage key so legacy automated test data from previous runs is ignored
        const storageKey = `chef_manual_checklist_v1_${queryDate}`;
        const savedChecklist = localStorage.getItem(storageKey);

        // Clean up any old automated cache keys from earlier versions
        try {
          localStorage.removeItem(`chef_prep_checklist_${queryDate}`);
        } catch {}

        if (savedChecklist) {
          try {
            const parsed = JSON.parse(savedChecklist);
            setChecklist(Array.isArray(parsed) ? parsed : []);
          } catch {
            setChecklist([]);
          }
        } else {
          // By default completely empty: chef will manually add or click "+ Auto-Add Top 10"
          setChecklist([]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch prep forecast:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedDate);
  }, [selectedDate]);

  // Persist checklist helper
  const persistChecklist = (updated) => {
    setChecklist(updated);
    localStorage.setItem(`chef_manual_checklist_v1_${selectedDate}`, JSON.stringify(updated));
  };

  // Toggle checklist item done/undone
  const toggleChecklistItem = (id) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    persistChecklist(updated);
  };

  // Add a manual task
  const handleAddManualTask = (e) => {
    if (e) e.preventDefault();
    if (!newCustomTask.trim()) return;

    const finalCategory = newCustomCategory === "Other"
      ? (otherCategoryText.trim() || "Other")
      : newCustomCategory;

    const newTask = {
      id: `task_${Date.now()}`,
      task: newCustomTask.trim(),
      weight: newCustomWeight.trim(),
      category: finalCategory || "General Prep",
      done: false,
      createdAt: new Date().toISOString(),
    };

    persistChecklist([...checklist, newTask]);
    setNewCustomTask("");
    setNewCustomWeight("");
    if (newCustomCategory === "Other") {
      setOtherCategoryText("");
    }
  };

  // Remove a task
  const removeTask = (id) => {
    const updated = checklist.filter((item) => item.id !== id);
    persistChecklist(updated);
  };

  // Clear all tasks for current date using custom project Swal alert
  const clearChecklist = async () => {
    if (checklist.length === 0) return;
    const res = await showConfirm(
      "Clear Morning Checklist?",
      "Kya aap aaj ki poori checklist ko clear (empty) karna chahte hain? Sabhi tasks hat jayenge.",
      "Yes, Clear All"
    );
    if (res?.isConfirmed) {
      persistChecklist([]);
      showSuccess("Checklist Cleared", "Aaj ki morning checklist successfully clear ho gayi hai.");
    }
  };

  // Auto-add all Top 10 dishes to checklist
  const handleAutoAddTop10 = () => {
    const topDishes = forecastData?.topSellingItems || [];
    if (topDishes.length === 0) return;

    const existingNames = new Set(checklist.map((c) => c.task.toLowerCase()));
    const newItems = [];

    topDishes.forEach((dish) => {
      const taskText = `Prep ${dish.dishName}`;
      if (!existingNames.has(taskText.toLowerCase()) && !existingNames.has(dish.dishName.toLowerCase())) {
        newItems.push({
          id: `top_${dish.rank}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          task: taskText,
          weight: `${dish.recommendedPrep} Portions`,
          category: dish.category || "Main Menu",
          done: false,
          createdAt: new Date().toISOString(),
        });
      }
    });

    if (newItems.length > 0) {
      persistChecklist([...checklist, ...newItems]);
      showSuccess("Dishes Added", `${newItems.length} Top selling dishes checklist me add ho gaye hain.`);
    } else {
      showSuccess("Already Added", "Sabhi Top 10 dishes pehle se checklist me maujood hain.");
    }
  };

  // Add individual dish from Top 10 card to checklist
  const handleAddSingleDishToChecklist = (dish) => {
    const taskText = `Prep ${dish.dishName}`;
    const alreadyAdded = checklist.some(
      (c) => c.task.toLowerCase() === taskText.toLowerCase() || c.task.toLowerCase() === dish.dishName.toLowerCase()
    );

    if (alreadyAdded) return;

    const newTask = {
      id: `top_${dish.rank}_${Date.now()}`,
      task: taskText,
      weight: `${dish.recommendedPrep} Portions`,
      category: dish.category || "Main Menu",
      done: false,
      createdAt: new Date().toISOString(),
    };

    persistChecklist([...checklist, newTask]);
    showSuccess("Added", `'${dish.dishName}' checklist me add ho gaya.`);
  };

  // Quick fill input from Top 10 pill in checklist tab
  const handleSelectPill = (dish) => {
    setNewCustomTask(`Prep ${dish.dishName}`);
    setNewCustomWeight(`${dish.recommendedPrep} Portions`);
    setNewCustomCategory(dish.category || "Main Menu");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-saffron-500 animate-spin" />
        <p className="text-sm font-bold text-slate-400">Loading Kitchen Prep Forecast...</p>
      </div>
    );
  }

  const topItems = forecastData?.topSellingItems || [];
  const top1 = topItems[0];
  const top2 = topItems[1];
  const completedCount = checklist.filter((item) => item.done).length;
  const pendingCount = checklist.length - completedCount;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const filteredChecklist = checklist.filter((item) => {
    if (filterState === "pending") return !item.done;
    if (filterState === "done") return item.done;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase border bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Past 30 Days Order Trends • Smart Kitchen Prep</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold font-display tracking-tight flex items-center gap-3 ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>
            <span className="p-2 rounded-2xl bg-saffron-500/20 text-saffron-600 dark:text-saffron-400 border border-saffron-500/30">
              🥦
            </span>
            AI Daily Wastage & Raw Material Forecaster
          </h1>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${
            theme === "light" ? "text-slate-600" : "text-slate-300"
          }`}>
            Aapke hotel ke pichhle 30 din ke real orders ke hisaab se Top 10 selling dishes ka daily forecast aur chef morning mise-en-place checklist.
          </p>
        </div>

        {/* Date Selector, Refresh & Print */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
          }`}>
            <Calendar className="w-4 h-4 text-saffron-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none cursor-pointer text-slate-800 dark:text-slate-200"
            />
          </div>

          <MagneticButton>
            <button
              onClick={() => fetchForecast(selectedDate)}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                theme === "light" ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
              title="Refresh Forecast"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-saffron-500" : ""}`} />
            </button>
          </MagneticButton>

          <MagneticButton>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-saffron-500/20 transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Morning Sheet</span>
            </button>
          </MagneticButton>
        </div>
      </div>

      {/* Hero Guidance Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all relative overflow-hidden shadow-xl ${
        forecastData?.isWeekend
          ? "bg-gradient-to-br from-amber-500/10 via-saffron-500/5 to-slate-900/60 border-saffron-500/40"
          : theme === "light"
          ? "bg-gradient-to-br from-lagoon-50 via-white to-amber-50/40 border-slate-200 text-slate-900"
          : "glass-card text-white border-lagoon-700/30"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                {forecastData?.dayName} {forecastData?.isWeekend ? "• Weekend Rush" : "• Regular Flow"}
              </span>

              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-lagoon-500/20 text-lagoon-700 dark:text-lagoon-300 border border-lagoon-500/30">
                Peak Lunch: {forecastData?.rushHours?.lunch}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                Peak Dinner: {forecastData?.rushHours?.dinner}
              </span>
            </div>

            {/* Practical Chef Advice */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 dark:bg-slate-950/80 border border-saffron-500/30 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-saffron-500 text-slate-950 shrink-0 mt-0.5 shadow-md">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold font-display text-saffron-400">
                    "{forecastData?.prepAdvice}"
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 font-medium">
                    {forecastData?.aiHeadline}
                  </p>
                </div>
              </div>
            </div>

            {/* Wastage Mitigation Tip */}
            <div className="flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-black uppercase tracking-wider text-[11px] block">Wastage Prevention Tip:</span>
                <span className="leading-relaxed">{forecastData?.wastageTip}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px]">
            {top1 && (
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">🔥 #1 Top Seller</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                  {top1.dishName}
                </p>
                <p className="text-xl font-black text-saffron-600 dark:text-saffron-400 font-display mt-0.5">
                  {top1.expectedToday} <span className="text-[11px] font-normal text-slate-500">Orders Today</span>
                </p>
              </div>
            )}

            {top2 && (
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">⭐ #2 High Demand</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-0.5">
                  {top2.dishName}
                </p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-display mt-0.5">
                  {top2.expectedToday} <span className="text-[11px] font-normal text-slate-500">Orders Today</span>
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-[10px] font-bold uppercase text-slate-500">Past Orders Analyzed</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-display mt-0.5">
                {forecastData?.totalOrdersAnalyzed || 0}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Last 30 Days</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
              <p className="text-[10px] font-bold uppercase text-slate-500">Tracked Top Dishes</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-display mt-0.5">
                {topItems.length}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">Highest Volume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 no-print border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "items"
              ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>🔥 Top 10 High Demand Dishes ({topItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === "checklist"
              ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>👨‍🍳 Chef Morning Checklist ({completedCount}/{checklist.length})</span>
        </button>
      </div>

      {/* TAB 1: TOP 10 HIGH DEMAND DISHES FORECAST */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className={`text-base font-bold flex items-center gap-2 ${
                theme === "light" ? "text-slate-800" : "text-slate-200"
              }`}>
                <TrendingUp className="w-4 h-4 text-saffron-500" />
                <span>Top 10 Highest Selling Items (Last 30 Days Sales Trend)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                In quantities ko dekh kar chef morning preparation aur batches plan karein.
              </p>
            </div>

            {/* Quick Auto-Add All */}
            <button
              onClick={handleAutoAddTop10}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saffron-500/10 hover:bg-saffron-500/20 text-saffron-700 dark:text-saffron-300 border border-saffron-500/30 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <ListPlus className="w-4 h-4" />
              <span>+ Auto-Add All Top 10 to Checklist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topItems.map((dish, idx) => {
              const taskText = `Prep ${dish.dishName}`;
              const isAlreadyInChecklist = checklist.some(
                (c) => c.task.toLowerCase() === taskText.toLowerCase() || c.task.toLowerCase() === dish.dishName.toLowerCase()
              );

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 shadow-md flex flex-col justify-between ${
                    dish.rank === 1
                      ? "border-rose-500/40 bg-gradient-to-br from-rose-500/5 to-slate-900/60"
                      : theme === "light"
                      ? "bg-white border-slate-200 text-slate-900"
                      : "bg-slate-900/70 border-slate-800 text-white"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                            dish.rank === 1
                              ? "bg-rose-500/20 text-rose-500 border-rose-500/30"
                              : dish.rank <= 3
                              ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                          }`}>
                            {dish.demandBadge}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">{dish.category}</span>
                        </div>

                        <h4 className="text-base font-bold mt-2 text-slate-900 dark:text-white leading-tight">
                          {dish.dishName}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold uppercase text-slate-500 block">Est. Today</span>
                        <span className="text-2xl font-black font-display text-saffron-600 dark:text-saffron-400">
                          {dish.expectedToday}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 block">portions</span>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">30-Day Sold</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {dish.totalSold30Days} Sold
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase">Recommended Prep</span>
                        <span className="text-sm font-black text-saffron-600 dark:text-saffron-400">
                          {dish.recommendedPrep} Portions
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Safety Buffer: +10%</span>
                      {dish.dowSales > 0 && (
                        <span className="text-emerald-500 font-semibold">
                          Past {forecastData?.dayName}s: {dish.dowSales} sold
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Checklist Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleAddSingleDishToChecklist(dish)}
                      disabled={isAlreadyInChecklist}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isAlreadyInChecklist
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-default"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-saffron-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isAlreadyInChecklist ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Added in Chef Checklist</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add to Checklist ({dish.recommendedPrep} Portions)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CHEF MORNING CHECKLIST */}
      {activeTab === "checklist" && (
        <div className="space-y-5">
          {/* Quick Reference Strip: Top 10 Dishes & Quantities */}
          {topItems.length > 0 && (
            <div className={`p-4 rounded-2xl border ${
              theme === "light" ? "bg-amber-50/60 border-amber-200/70" : "bg-amber-500/5 border-amber-500/20"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <CookingPot className="w-4 h-4 text-saffron-600 dark:text-saffron-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-saffron-800 dark:text-saffron-300">
                    Today's Top 10 Demand Reference (Click to fill form):
                  </span>
                </div>
                <button
                  onClick={handleAutoAddTop10}
                  className="text-xs font-extrabold text-saffron-700 dark:text-saffron-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>+ Auto-Add All Top 10 Dishes</span>
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                {topItems.map((dish) => (
                  <button
                    key={dish.rank}
                    onClick={() => handleSelectPill(dish)}
                    title={`Click to fill form for ${dish.dishName}`}
                    className={`shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm"
                        : "bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-200"
                    }`}
                  >
                    <span className="font-bold">#{dish.rank} {dish.dishName}</span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-saffron-500/20 text-saffron-600 dark:text-saffron-400">
                      {dish.recommendedPrep} Prep
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Checklist Card */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            theme === "light" ? "bg-white border-slate-200" : "bg-slate-900/70 border-slate-800"
          }`}>
            {/* Header with Title and Progress */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>Chef Morning Mise-en-place Checklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top 10 dishes ke mutabik chef apna raw material chopping, boiling aur batches list karein aur tick karte jayein.
                </p>
              </div>

              {/* Progress and Clear Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-28 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-saffron-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {progressPercent}% Done
                  </span>
                </div>

                {/* Prominent Clear Checklist Button */}
                <button
                  onClick={clearChecklist}
                  disabled={checklist.length === 0}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    checklist.length === 0
                      ? "opacity-35 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                      : "bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white dark:hover:text-white border border-rose-500/30 hover:border-rose-600 active:scale-95"
                  }`}
                  title={checklist.length === 0 ? "Checklist already empty" : "Poori checklist empty/clear karein"}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Checklist</span>
                </button>
              </div>
            </div>

            {/* Manual Task Creator Input Form */}
            <form onSubmit={handleAddManualTask} className="mt-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                ✍️ Add New Mise-en-place Task / Raw Material:
              </span>
              <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Task / Dish / Raw Material (e.g. Boil Potatoes, Chop Onions, Veg Thali Curries)..."
                  value={newCustomTask}
                  onChange={(e) => setNewCustomTask(e.target.value)}
                  className={`flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-xs sm:text-sm border outline-none font-medium ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-900 focus:border-saffron-500"
                      : "bg-slate-900 border-slate-800 text-slate-100 focus:border-saffron-500"
                  }`}
                />

                <input
                  type="text"
                  placeholder="Qty / Weight (e.g. 5 kg, 4 Portions, 500 g)"
                  value={newCustomWeight}
                  onChange={(e) => setNewCustomWeight(e.target.value)}
                  className={`sm:w-44 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm border outline-none font-medium ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-900 focus:border-saffron-500"
                      : "bg-slate-900 border-slate-800 text-slate-100 focus:border-saffron-500"
                  }`}
                />

                <select
                  value={newCustomCategory}
                  onChange={(e) => setNewCustomCategory(e.target.value)}
                  className={`sm:w-48 px-3 py-2.5 rounded-xl text-xs font-semibold border outline-none cursor-pointer ${
                    theme === "light"
                      ? "bg-white border-slate-200 text-slate-800"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}
                >
                  <option value="General Prep">General Prep</option>
                  <option value="Gravy / Curry">Gravy / Curry</option>
                  <option value="Chopping / Cut">Chopping / Cut</option>
                  <option value="Boiling / Rice / Dal">Boiling / Rice / Dal</option>
                  <option value="Tandoor / Roti / Dough">Tandoor / Roti / Dough</option>
                  <option value="Chinese / Snacks">Chinese / Snacks</option>
                  <option value="Fry / Starters">Fry / Starters</option>
                  <option value="Dessert / Sweets">Dessert / Sweets</option>
                  <option value="Beverage / Bar">Beverage / Bar</option>
                  <option value="Sauce / Chutney / Dips">Sauce / Chutney / Dips</option>
                  <option value="Salad / Raita">Salad / Raita</option>
                  <option value="Store / Raw Material">Store / Raw Material</option>
                  <option value="Cleaning / Setup">Cleaning / Setup</option>
                  <option value="Other">Other (Special / Custom)</option>
                </select>

                {newCustomCategory === "Other" && (
                  <input
                    type="text"
                    placeholder="Type custom category name..."
                    value={otherCategoryText}
                    onChange={(e) => setOtherCategoryText(e.target.value)}
                    className={`sm:w-44 px-3.5 py-2.5 rounded-xl text-xs border outline-none font-medium animate-fadeIn ${
                      theme === "light"
                        ? "bg-white border-saffron-400 text-slate-900 focus:border-saffron-500"
                        : "bg-slate-900 border-saffron-500/50 text-slate-100 focus:border-saffron-500"
                    }`}
                  />
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-saffron-500/20 cursor-pointer transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Task</span>
                </button>
              </div>
            </form>

            {/* Filter Chips: All, Pending, Done */}
            {checklist.length > 0 && (
              <div className="flex items-center justify-between gap-2 mt-4 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setFilterState("all")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      filterState === "all"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    All ({checklist.length})
                  </button>
                  <button
                    onClick={() => setFilterState("pending")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      filterState === "pending"
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    onClick={() => setFilterState("done")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      filterState === "done"
                        ? "bg-emerald-500 text-slate-950 font-black"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    Done ({completedCount})
                  </button>
                </div>

                <span className="text-[11px] text-slate-400">
                  Click card to tick/untick
                </span>
              </div>
            )}

            {/* Empty State */}
            {checklist.length === 0 ? (
              <div className="mt-8 py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <ClipboardList className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Aaj ki morning checklist abhi khali hai
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Upar diye gaye Top 10 dishes aur expected portions ko dekh kar apni daily prep list likhein, ya 1-click me saare Top 10 dishes add karein.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={handleAutoAddTop10}
                    className="px-4 py-2 bg-saffron-500 hover:bg-saffron-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ListPlus className="w-4 h-4" />
                    <span>+ Auto-Add All Top 10 Dishes</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Checklist Items List */
              <div className="space-y-2 mt-3">
                {filteredChecklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklistItem(item.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      item.done
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 opacity-80"
                        : theme === "light"
                        ? "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-white"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          item.done
                            ? "bg-emerald-500 border-emerald-500 text-slate-950"
                            : "border-slate-400 dark:border-slate-600"
                        }`}
                      >
                        {item.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      {/* Weight / Qty badge */}
                      {item.weight && (
                        <span
                          className={`shrink-0 px-2.5 py-0.5 rounded-lg font-mono font-bold text-xs border ${
                            item.done
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 line-through"
                              : "bg-saffron-500/10 text-saffron-700 dark:text-saffron-300 border-saffron-500/30"
                          }`}
                        >
                          {item.weight}
                        </span>
                      )}

                      {/* Task Name */}
                      <span className={`text-xs sm:text-sm font-bold truncate ${
                        item.done ? "line-through text-slate-400 dark:text-slate-500" : ""
                      }`}>
                        {item.task}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {item.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hidden sm:inline-block">
                          {item.category}
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTask(item.id);
                        }}
                        className="p-1 rounded text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bottom bar with total count and another Clear button */}
                <div className="pt-3.5 mt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 font-medium">
                    Total: <strong className="text-slate-700 dark:text-slate-300">{checklist.length} items</strong> ({completedCount} Done, {pendingCount} Pending)
                  </span>
                  <button
                    onClick={clearChecklist}
                    className="text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline font-bold flex items-center gap-1.5 cursor-pointer py-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Checklist ({checklist.length} items)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print-Only Kitchen Briefing Sheet */}
      <div className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="border-b-2 border-black pb-4 mb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {currentUser?.hotelName || "E-Annapurna"} • Chef Morning Prep Sheet
          </h1>
          <p className="text-sm font-semibold mt-1">
            Date: {new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="text-xs italic mt-0.5">
            Top 10 High Demand Dishes & Chef Morning Mise-en-place Checklist
          </p>
        </div>

        {/* Guidance Box */}
        <div className="border border-black p-3 mb-4 rounded text-xs bg-slate-50">
          <p className="font-bold text-sm">Chef Guidance:</p>
          <p className="mt-1">"{forecastData?.prepAdvice}"</p>
          <p className="mt-1 text-[11px] font-semibold text-gray-700">Wastage Rule: {forecastData?.wastageTip}</p>
        </div>

        {/* Top Dishes Table */}
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
          Top 10 Selling Dishes & Today's Target
        </h2>
        <table className="w-full text-xs border border-black mb-6">
          <thead>
            <tr className="bg-gray-100 border-b border-black">
              <th className="p-2 text-center border-r border-black w-12">Rank</th>
              <th className="p-2 text-left border-r border-black">Dish Name</th>
              <th className="p-2 text-center border-r border-black">30-Day Total Sold</th>
              <th className="p-2 text-center border-r border-black">Expected Today</th>
              <th className="p-2 text-left">Recommended Prep Batch</th>
            </tr>
          </thead>
          <tbody>
            {topItems.map((dish, idx) => (
              <tr key={idx} className="border-b border-black">
                <td className="p-2 border-r border-black text-center font-bold">#{dish.rank}</td>
                <td className="p-2 border-r border-black font-bold">{dish.dishName}</td>
                <td className="p-2 border-r border-black text-center">{dish.totalSold30Days} Sold</td>
                <td className="p-2 border-r border-black text-center font-black">{dish.expectedToday} portions</td>
                <td className="p-2 font-medium">{dish.recommendedPrep} portions (+10% safety buffer)</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Checklist */}
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">
          Chef Morning Mise-en-place Checklist ({checklist.length} items)
        </h2>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 border border-black p-2 rounded">
              <div className="w-4 h-4 border border-black shrink-0"></div>
              <span className="font-bold">{item.task}</span>
              {item.weight && <span className="font-mono">({item.weight})</span>}
              {item.category && <span className="text-[10px] italic">[{item.category}]</span>}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-black flex justify-between text-xs">
          <div>Head Chef Signature: _______________________</div>
          <div>Kitchen Manager Approval: _______________________</div>
        </div>
      </div>
    </div>
  );
}
