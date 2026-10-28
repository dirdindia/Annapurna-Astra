import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ArrowRight, ArrowLeft, X, ExternalLink, CheckCircle2, Compass, BookOpen, AlertCircle, Printer, QrCode, BedDouble, UtensilsCrossed, Users
} from "lucide-react";

export const TOUR_STEPS = [
  {
    target: "dashboard-header",
    title: "🏨 Welcome to Annapurna Astra",
    badge: "Control Center",
    description: "Ye aapka main Financial & Operations Dashboard hai. Yahan hotel aur restaurant ke live revenue, occupancy aur metrics real-time update hote hain.",
    url: "/admin",
    urlLabel: "Open Dashboard",
    position: "bottom"
  },
  {
    target: "dashboard-tabs",
    title: "📊 Sales & Source Filter",
    badge: "Quick Switch",
    description: "Aap 1-click me 'All Sales', 'Restaurant Only' ya 'Rooms Only' ke figures aur graphs filter kar sakte hain.",
    url: "/admin",
    urlLabel: "View Sales Filter",
    position: "bottom"
  },
  {
    target: "sidebar-qr-orders",
    title: "📱 Scan & Order (QR) & Live Waitlist",
    badge: "Digital QR & Queue",
    description: "Dining tables aur hotel rooms ke liye customer self-ordering QR codes generate karein, live incoming orders accept karein, aur table reservations manage karein.",
    url: "/admin/qr-orders",
    urlLabel: "Open QR Orders (/admin/qr-orders)",
    position: "right",
    fields: [
      { name: "Live Incoming QR Orders", req: true, desc: "Customer ke phone se scanned order ko Accept ya Reject karein (Accepted order instant kitchen KOT ban jata hai)." },
      { name: "Download Table QR Standees", req: true, desc: "Har table (T-1, T-2) aur Room ke liye hotel logo aur color branding ke sath print-ready Standee QR PDF/Image download karein." },
      { name: "Customer Digital Menu URL", req: false, desc: "Direct browser ordering link jo WhatsApp ya Google Maps par share kiya ja sakta hai." },
      { name: "Table Advance Reservations", req: false, desc: "Customer ki 15-minute time slot table booking requests ko Confirm ya Cancel karein." },
      { name: "Digital Waitlist & Queue", req: false, desc: "Rush hours me waitlist tokens generate karein aur table khali hote hi live SMS/WhatsApp notification bhejein." }
    ]
  },
  {
    target: "sidebar-kot-print",
    title: "🖨️ Print Pending KOT (Kitchen Tickets)",
    badge: "Kitchen Routing",
    description: "Running tables aur takeaway orders ke fresh items ka thermal KOT kitchen me chef ko bhejne ke liye 1-click thermal print karein.",
    url: "/admin/kot-print",
    urlLabel: "Print Pending KOT (/admin/kot-print)",
    position: "right",
    fields: [
      { name: "Active Occupied Tables", req: true, desc: "Jis table par running order chal raha hai uspar click karke currently ordered dishes dekhein." },
      { name: "Pending Items Selection", req: true, desc: "Jo items abhi tak print nahi huye wo auto-checked rehte hain; specific item select/unselect karein." },
      { name: "Print KOT Button", req: true, desc: "80mm/58mm thermal slip print karta hai aur system me 'printedQuantity' update karta hai taaki duplicate print na ho." },
      { name: "Takeaway / Virtual Orders", req: false, desc: "Counter parcels ya QR phone orders ke KOT slips alag se print karein." },
      { name: "Waiter & Table Tagging", req: true, desc: "KOT receipt par table number, captain name, aur order timestamp clear print hota hai." }
    ]
  },
  {
    target: "sidebar-room-bookings",
    title: "🛎️ Guest Check-In & Room Bookings",
    badge: "Front Desk & KYC",
    description: "Front desk room check-in, live webcam photo capture, Govt ID verification aur automated GRC (Guest Registration Card) generation.",
    url: "/admin/room-reports",
    urlLabel: "Room Bookings (/admin/room-reports)",
    position: "right",
    fields: [
      { name: "Guest Full Name", req: true, desc: "Primary guest ka official name jaise Govt ID par darj hai." },
      { name: "Guest Mobile Number", req: true, desc: "10-digit mobile number OTP verification, WhatsApp bill aur invoice ke liye." },
      { name: "Room Selection", req: true, desc: "Available khali room (Green) drop-down se select karein." },
      { name: "Check-in Date & Time", req: true, desc: "Arrival time, auto-fills with current Indian standard time." },
      { name: "Expected Check-out Date", req: true, desc: "Guest kitne din rukega, billing period calculation ke liye." },
      { name: "Identity Proof Type", req: true, desc: "Aadhaar Card, Passport, Driving License, ya Voter ID." },
      { name: "ID Number", req: true, desc: "Selected identity card ka unique serial number." },
      { name: "Total Adults / Children", req: true, desc: "Pax count: 18+ adults aur minors ki sankhya." },
      { name: "Payment Mode", req: true, desc: "Advance payment medium: Cash, UPI, Card, ya Pay at Checkout." },
      { name: "Base Room Tariff (₹)", req: true, desc: "Standard room rate per night; receptionist discount customize kar sakta hai." },
      { name: "Advance Payment Received (₹)", req: false, desc: "Booking confirm karne ke liye liya gaya token ya advance amount." },
      { name: "ID Document Photo", req: false, desc: "Physical ID proof ka webcam live photo ya document scan upload." },
      { name: "Live Guest Webcam Photo", req: false, desc: "Digital Police Verification aur GRC card ke liye webcam photo." },
      { name: "Vehicle Number", req: false, desc: "Hotel parking space aur valet tracking ke liye car/bike registration." },
      { name: "Special Requests / Notes", req: false, desc: "Extra mattress, late check-out, silent room ya specific diet remarks." }
    ]
  },
  {
    target: "sidebar-rooms",
    title: "🛏️ Manage Rooms & Tariffs",
    badge: "Hotel Module",
    description: "Hotel ke sabhi rooms (AC, Deluxe, Suite) add karein, tariff prices set karein aur floor grid par availability monitor karein.",
    url: "/admin/rooms",
    urlLabel: "Manage Rooms (/admin/rooms)",
    position: "right",
    fields: [
      { name: "Room Number", req: true, desc: "Unique identifier jaise 101, 201 ya Deluxe-01." },
      { name: "Room Type", req: true, desc: "Category: AC, Non-AC, Deluxe, Suite, Executive." },
      { name: "Bed Setup", req: true, desc: "Single Bed, Double Bed, Triple ya Family Bed." },
      { name: "Base Price per Night (₹)", req: true, desc: "Standard 24-hr tariff jo check-in me auto-load hota hai." },
      { name: "Room Status", req: true, desc: "🟢 Available (Free), 🔴 Occupied, 🟡 Advance Booked, ⚪ Maintenance." }
    ]
  },
  {
    target: "sidebar-tables",
    title: "🪑 Restaurant Floor & Tables",
    badge: "Restaurant POS",
    description: "Dining area ke tables setup karein. Green tables available hain aur Red tables par live running KOT chal raha hota hai.",
    url: "/admin/tables",
    urlLabel: "Manage Tables (/admin/tables)",
    position: "right",
    fields: [
      { name: "Table Number", req: true, desc: "Floor code jaise T-1, T-2, Garden-01, Rooftop-03." },
      { name: "Seating Capacity", req: true, desc: "Table size: 2-seater, 4-seater, 6-seater, Family." },
      { name: "Standee QR Code", req: false, desc: "Direct customer self-ordering ke liye QR standee printout." }
    ]
  },
  {
    target: "sidebar-dishes",
    title: "🍲 Menu Dishes & Categories",
    badge: "Food Catalog",
    description: "Apne restaurant ke menu items, categories (Starters, Main Course, Breads) aur pricing yahan se manage karein.",
    url: "/admin/dishes",
    urlLabel: "Manage Dishes (/admin/dishes)",
    position: "right",
    fields: [
      { name: "Dish Name", req: true, desc: "Item title jaise Paneer Butter Masala, Butter Naan." },
      { name: "Category", req: true, desc: "Starters, Main Course, Breads, Rice, Beverages, Desserts." },
      { name: "Price (Half / Full)", req: true, desc: "Full portion rate aur Half portion rate (₹)." },
      { name: "Veg / Non-Veg Badge", req: true, desc: "Green veg dot ya Red non-veg symbol." },
      { name: "Dish Photo", req: false, desc: "Digital QR menu presentation ke liye food image." }
    ]
  },
  {
    target: "sidebar-staff",
    title: "👥 Staff & Role Permissions",
    badge: "Security & Access",
    description: "Front desk staff, cashier, captain aur sub-admins ke accounts banayein aur unki permission control karein.",
    url: "/admin/staff",
    urlLabel: "Manage Staff (/admin/staff)",
    position: "right",
    fields: [
      { name: "Staff Full Name", req: true, desc: "Employee official name." },
      { name: "Mobile & Password", req: true, desc: "Staff portal login credentials." },
      { name: "Role Selection", req: true, desc: "Receptionist, Cashier, Captain, Chef, ya Sub-Admin." },
      { name: "Permission Toggles", req: true, desc: "Room Booking on/off, KOT on/off, GRC on/off, Reports on/off." }
    ]
  },
  {
    target: "sidebar-manual",
    title: "📖 Complete User Manual",
    badge: "Documentation",
    description: "Kisi bhi feature ko step-by-step samajhne ke liye complete User Manual padhein jisme direct links aur screenshots diye gaye hain.",
    url: "/admin/manual",
    urlLabel: "Open User Manual (/admin/manual)",
    position: "right"
  }
];

export default function AppTourGuide() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    window.startAnnapurnaTour = (startFrom = 0) => {
      setStepIndex(startFrom);
      setIsOpen(true);
      if (startFrom === 0 && window.location.pathname !== "/admin") {
        navigate("/admin");
      }
    };

    return () => {
      delete window.startAnnapurnaTour;
    };
  }, [navigate]);

  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen || !currentStep) return;

    // Dispatch event to sidebar to auto-expand management dropdown if needed
    window.dispatchEvent(
      new CustomEvent("annapurna-tour-target", {
        detail: { target: currentStep.target }
      })
    );

    const findAndHighlight = () => {
      const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setTargetRect(null);
      }
    };

    findAndHighlight();
    const timer = setTimeout(findAndHighlight, 250);
    window.addEventListener("resize", findAndHighlight);
    window.addEventListener("scroll", findAndHighlight, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", findAndHighlight);
      window.removeEventListener("scroll", findAndHighlight, true);
    };
  }, [isOpen, stepIndex, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleNavigateToUrl = (url) => {
    navigate(url);
    setTimeout(() => {
      handleNext();
    }, 400);
  };

  // Viewport-safe position calculator that guarantees the card NEVER cuts off at the bottom
  const getCardStyle = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const cardWidth = isMobile ? Math.min(480, window.innerWidth - 32) : 480;
    const padding = 16;
    const topBarHeight = 78;

    // Center on mobile or if no target element found
    if (isMobile || !targetRect) {
      return {
        width: `${cardWidth}px`,
        maxWidth: "92vw",
        maxHeight: "calc(100vh - 40px)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed"
      };
    }

    const pos = currentStep?.position || "bottom";

    if (pos === "right") {
      // Step targeting sidebar items on the left side
      // Place card cleanly to the right of the sidebar
      let left = Math.max(265, targetRect.right + 20);
      if (left + cardWidth > window.innerWidth - padding) {
        left = Math.max(padding, window.innerWidth - cardWidth - padding);
      }

      // Vertical calculation: center around target's midpoint, clamped strictly inside viewport
      const targetMidY = targetRect.top + targetRect.height / 2;
      const estimatedHeight = popoverRef.current ? popoverRef.current.offsetHeight : 500;
      
      let idealTop = targetMidY - estimatedHeight / 2;
      const maxTop = window.innerHeight - estimatedHeight - padding;
      const minTop = topBarHeight;
      const top = Math.max(minTop, Math.min(idealTop, Math.max(minTop, maxTop)));

      return {
        width: `${cardWidth}px`,
        maxWidth: "92vw",
        maxHeight: `calc(100vh - ${top + padding}px)`,
        top: `${top}px`,
        left: `${left}px`,
        transform: "none",
        position: "fixed"
      };
    }

    if (pos === "bottom") {
      // Step targeting navbar or top dashboard elements
      const estimatedHeight = popoverRef.current ? popoverRef.current.offsetHeight : 500;
      let idealTop = targetRect.bottom + 14;
      const maxTop = window.innerHeight - estimatedHeight - padding;
      const minTop = topBarHeight;
      const top = Math.max(minTop, Math.min(idealTop, Math.max(minTop, maxTop)));

      let idealLeft = targetRect.left;
      if (targetRect.right > window.innerWidth / 2) {
        idealLeft = targetRect.right - cardWidth;
      }
      const left = Math.max(265, Math.min(idealLeft, window.innerWidth - cardWidth - padding));

      return {
        width: `${cardWidth}px`,
        maxWidth: "92vw",
        maxHeight: `calc(100vh - ${top + padding}px)`,
        top: `${top}px`,
        left: `${left}px`,
        transform: "none",
        position: "fixed"
      };
    }

    return {
      width: `${cardWidth}px`,
      maxWidth: "92vw",
      maxHeight: "calc(100vh - 40px)",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      position: "fixed"
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Target Element Glowing Highlight Ring */}
      {targetRect && (
        <div
          className="absolute border-2 border-saffron-400 rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-all duration-300 pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          ref={popoverRef}
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="tour-popover-card fixed z-[10000] flex flex-col rounded-3xl bg-gradient-to-b from-[#0B2A2A] to-[#041414] border-2 border-saffron-500/50 text-white shadow-2xl backdrop-blur-2xl overflow-hidden"
          style={getCardStyle()}
        >
          {/* PINNED HEADER (Always visible) */}
          <div className="flex-shrink-0 p-5 pb-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron-500"></span>
                </span>
                <span className="text-[11px] font-bold text-saffron-400 uppercase tracking-widest bg-saffron-500/10 border border-saffron-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Compass size={12} /> {currentStep.badge}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="tour-counter text-xs font-semibold text-slate-400 font-mono">
                  {stepIndex + 1} / {TOUR_STEPS.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="tour-close-btn p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Skip Tour"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
              {currentStep.title}
            </h3>
          </div>

          {/* SCROLLABLE CONTENT BODY (Scrolls internally so footer is never clipped) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-1 space-y-3 custom-scrollbar">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentStep.description}
            </p>

            {/* Direct Page Link - Placed right at the top for immediate 1-click access */}
            {currentStep.url && (
              <div className="tour-link-box p-2.5 rounded-2xl bg-white/[0.05] border border-saffron-500/35 flex items-center justify-between gap-2 shadow-sm">
                <div className="text-xs text-slate-300 min-w-0">
                  <span className="text-saffron-400 font-bold block text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <ExternalLink size={11} /> Direct Page Link:
                  </span>
                  <span className="font-mono text-slate-200 text-[11px] truncate block font-bold">{currentStep.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateToUrl(currentStep.url)}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-saffron-500/25 to-amber-500/25 hover:from-saffron-500/35 hover:to-amber-500/35 text-saffron-300 hover:text-white text-xs font-bold transition border border-saffron-500/40 cursor-pointer shadow-sm active:scale-95"
                >
                  <span>{currentStep.urlLabel || "Go to Page"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}

            {/* FIELD-BY-FIELD DETAILED LIST */}
            {currentStep.fields && (
              <div className="tour-fields-container border border-white/10 rounded-2xl p-2.5 bg-black/40 space-y-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-saffron-400">
                    Feature & Option Breakdown:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {currentStep.fields.length} options
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {currentStep.fields.map((f, i) => (
                    <div key={i} className="tour-field-box p-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/15 transition text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 shrink-0" />
                          {f.name}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                          f.req 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {f.req ? '🔴 Required' : '🟡 Optional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-normal pl-3">
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* PINNED FOOTER CONTROLS (Always visible, never cut off) */}
          <div className="tour-footer flex-shrink-0 p-5 pt-3 border-t border-white/10 flex items-center justify-between bg-black/20">
            <button
              type="button"
              onClick={handlePrev}
              disabled={stepIndex === 0}
              className={`tour-back-btn flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                stepIndex === 0 ? "opacity-30 cursor-not-allowed" : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <ArrowLeft size={13} /> Back
            </button>

            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIndex 
                      ? "tour-dot-active w-5 bg-saffron-400 shadow-sm" 
                      : "tour-dot-inactive w-1.5 bg-white/20"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-extrabold text-xs shadow-md shadow-saffron-500/25 hover:scale-[1.02] transition cursor-pointer"
            >
              {stepIndex === TOUR_STEPS.length - 1 ? (
                <>Finish <CheckCircle2 size={13} /></>
              ) : (
                <>Next <ArrowRight size={13} /></>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
