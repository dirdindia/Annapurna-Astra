import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, ArrowRight, ArrowLeft, X, ExternalLink, CheckCircle2, Compass, BookOpen, AlertCircle, FileText 
} from "lucide-react";

export const STAFF_TOUR_STEPS = [
  {
    target: "nav-staff-dashboard",
    title: "👨‍💼 Welcome to Staff Operations Desk",
    badge: "Staff Overview",
    description: "Ye aapka main Staff Desk hai. Yahan se aap Room Booking, KOT Punching, GRC printing aur kitchen status instant access kar sakte hain.",
    url: "/staff",
    urlLabel: "Staff Dashboard (/staff)",
    position: "bottom"
  },
  {
    target: "nav-staff-rooms",
    title: "🛏️ Front Desk Room Booking & Check-In",
    badge: "Field-by-Field Guide",
    description: "Green room par click karte hi Check-In form khulta hai. Har field ki complete jankari (Required vs Optional) niche dekhein:",
    url: "/staff/rooms",
    urlLabel: "Room Booking (/staff/rooms)",
    position: "bottom",
    fields: [
      {
        name: "Number of Persons",
        req: true,
        desc: "Total rukne wale logon ki sankhya (1-10). Isse utne guest rows open hote hain."
      },
      {
        name: "Primary Guest Name (Person 1)",
        req: true,
        desc: "Main guest ka official naam. Police GRC aur Tax Invoice par yahi naam print hoga."
      },
      {
        name: "Additional Guest Names (Person 2+)",
        req: false,
        desc: "Sath me rukne wale family members ya friends ke naam. (Optional lekin police record ke liye recommended)."
      },
      {
        name: "Age",
        req: false,
        desc: "Guest ki umar (saal me). Adults vs Children pax count ke liye."
      },
      {
        name: "Mobile Number (Person 1)",
        req: true,
        desc: "10-digit phone number. Booking SMS, WhatsApp digital bill aur repeat guest history auto-load karne ke liye zaroori hai."
      },
      {
        name: "ID Type (Dropdown)",
        req: true,
        desc: "Government Proof: Aadhar Card, PAN, Passport, ya Driving License."
      },
      {
        name: "ID Number",
        req: true,
        desc: "Selected ID ka number (jaise 12-digit Aadhar). Local police compliance ke liye mandatory hai."
      },
      {
        name: "Upload ID Document",
        req: false,
        desc: "ID proof ka photo ya PDF scan upload karein. Cloud server par secure store hota hai."
      },
      {
        name: "Live Webcam Photo",
        req: false,
        desc: "Laptop/PC webcam se guest ka live face capture karein. Security verification aur GRC card par print hota hai."
      },
      {
        name: "Advance Amount Paid (₹)",
        req: true,
        desc: "Check-in ke waqt liya gaya advance amount. Agar advance nahi liya toh '0' dalein. Checkout ke final bill se ye automatic minus ho jayega."
      },
      {
        name: "Advance Payment Mode",
        req: true,
        desc: "Advance kis mode me liya gaya: Cash, UPI, Card, ya Credit Bill."
      },
      {
        name: "Expected Check-Out Date & Time",
        req: true,
        desc: "Guest kab room vacate karega. Isse stay duration aur daily tariff auto-calculate hota hai."
      },
      {
        name: "Expected Check-In Date (Advance Only)",
        req: true,
        desc: "Agar guest aane wale kisi din ke liye book kar raha hai, toh aane ki date/time select karein."
      },
      {
        name: "Add GST Details (Checkbox)",
        req: false,
        desc: "Corporate B2B company trips ke liye checkbox on karein aur 15-digit GSTIN daalkar 'Verify' karein."
      },
      {
        name: "Direct Check-In vs Advance Booking Toggle",
        req: true,
        desc: "Direct Check-In se room instant Red (Occupied) hota hai; Advance Booking se room Blue/Yellow (Reserved) hota hai."
      }
    ]
  },
  {
    target: "nav-staff-grc",
    title: "📋 Print GRC (Guest Registration Card)",
    badge: "Police Compliance",
    description: "Check-in hote hi continuous serial number ke sath pre-filled GRC card print karein aur guest se signature lein.",
    url: "/staff/grc",
    urlLabel: "Print GRC (/staff/grc)",
    position: "bottom",
    fields: [
      {
        name: "GRC Serial Number",
        req: true,
        desc: "System auto-generates GRC-001, GRC-002... Har print par counter automatically 1 step aage badhta hai."
      },
      {
        name: "Pre-filled Guest Details",
        req: true,
        desc: "Hotel logo, guest name, photo, room tariff, arriving from aur signature block automatic loaded rehta hai."
      },
      {
        name: "Print A4 GRC",
        req: true,
        desc: "Desk receptionist A4 slip print nikal kar guest se physical signature karwata hai."
      }
    ]
  },
  {
    target: "nav-staff-kot",
    title: "🍽️ Restaurant POS & KOT Billing",
    badge: "Restaurant Orders",
    description: "Dining table number choose karke dishes punch karein. KOT seedhe kitchen printer par jayega aur table Red (Occupied) ban jayega.",
    url: "/staff/kot",
    urlLabel: "KOT Billing (/staff/kot)",
    position: "bottom",
    fields: [
      {
        name: "Table Floor Selection",
        req: true,
        desc: "Green Table par click karein. Takeaway ke liye 'Parcel' mode select karein."
      },
      {
        name: "Menu Search & Quantity",
        req: true,
        desc: "Item ka naam type karein, Half/Full portion choose karein aur '+' '-' se quantity set karein."
      },
      {
        name: "Special Cooking Notes",
        req: false,
        desc: "Customer ki requirement (jaise 'Less Spicy', 'No Onion/Garlic') kitchen slip par print karne ke liye."
      },
      {
        name: "Punch Add-on KOT (Running Tables)",
        req: false,
        desc: "Guest agar beech me extra roti mangta hai, toh 'Punch Add-on' dabayein. Kitchen ko sirf naya item jayega!"
      },
      {
        name: "Settle & Print Thermal Bill",
        req: true,
        desc: "Cash, UPI ya Card select karte hi CGST/SGST ke sath 3-inch POS receipt print ho jayegi aur table free ho jayega."
      }
    ]
  },
  {
    target: "nav-staff-kds",
    title: "👨‍🍳 Kitchen Display System (KDS)",
    badge: "Kitchen Chefs",
    description: "Kitchen me live running orders aur preparation timers. Chef jaise hi 'Mark Ready' karega, waiters ko instant signal mil jayega.",
    url: "/staff/kds",
    urlLabel: "KDS Screen (/staff/kds)",
    position: "bottom"
  },
  {
    target: "nav-staff-hall",
    title: "📺 Dining Hall LED Display",
    badge: "Ready Order Board",
    description: "Dining hall LED screen par ready table numbers chamakne lagte hain taaki waiters turant garam khana serve kar sakein.",
    url: "/staff/hall-display",
    urlLabel: "Hall Display (/staff/hall-display)",
    position: "bottom"
  },
  {
    target: "nav-staff-manual",
    title: "📖 Staff Operating Manual",
    badge: "Documentation",
    description: "Check-in, KOT ya GRC se judi kisi bhi step-by-step jankari ke liye Staff Manual open karein.",
    url: "/staff/manual",
    urlLabel: "Staff Manual (/staff/manual)",
    position: "bottom"
  }
];

export default function StaffTourGuide() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    window.startStaffTour = (startFrom = 0) => {
      setStepIndex(startFrom);
      setIsOpen(true);
      if (startFrom === 0 && window.location.pathname !== "/staff") {
        navigate("/staff");
      }
    };

    return () => {
      delete window.startStaffTour;
    };
  }, [navigate]);

  const currentStep = STAFF_TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen || !currentStep) return;

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
    if (stepIndex < STAFF_TOUR_STEPS.length - 1) {
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

    const estimatedHeight = popoverRef.current ? popoverRef.current.offsetHeight : 520;
    
    // Staff panel targets are in top navbar
    let idealTop = targetRect.bottom + 14;
    const maxTop = window.innerHeight - estimatedHeight - padding;
    const minTop = topBarHeight;
    const top = Math.max(minTop, Math.min(idealTop, Math.max(minTop, maxTop)));

    let idealLeft = targetRect.left;
    if (targetRect.right > window.innerWidth / 2) {
      idealLeft = targetRect.right - cardWidth;
    }
    const left = Math.max(padding, Math.min(idealLeft, window.innerWidth - cardWidth - padding));

    return {
      width: `${cardWidth}px`,
      maxWidth: "92vw",
      maxHeight: `calc(100vh - ${top + padding}px)`,
      top: `${top}px`,
      left: `${left}px`,
      transform: "none",
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

      {/* Target Element Glowing Ring */}
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
                  {stepIndex + 1} / {STAFF_TOUR_STEPS.length}
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

            {/* FIELD-BY-FIELD DETAILED ACCORDION LIST */}
            {currentStep.fields && (
              <div className="tour-fields-container border border-white/10 rounded-2xl p-2.5 bg-black/40 space-y-2">
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-saffron-400">
                    Form Field Breakdown:
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

            {/* Direct Link */}
            {currentStep.url && (
              <div className="tour-link-box p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-300 min-w-0">
                  <span className="text-saffron-400 font-bold block text-[10px] uppercase tracking-wider">Direct Page Link:</span>
                  <span className="font-mono text-slate-200 text-[11px] truncate block">{currentStep.url}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateToUrl(currentStep.url)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-saffron-500/20 hover:bg-saffron-500/30 text-saffron-300 text-xs font-bold transition border border-saffron-500/30 cursor-pointer"
                >
                  Go to Page <ExternalLink size={12} />
                </button>
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
              {STAFF_TOUR_STEPS.map((_, i) => (
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
              {stepIndex === STAFF_TOUR_STEPS.length - 1 ? (
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
