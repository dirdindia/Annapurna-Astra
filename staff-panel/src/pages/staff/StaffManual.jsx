import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Compass, ExternalLink, Sparkles, Building2, BedDouble, 
  UtensilsCrossed, FileText, CheckCircle2, AlertCircle, Camera, Printer, 
  Tv, ChefHat, ArrowRight, Clock, ShieldCheck
} from "lucide-react";

export default function StaffManual() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const STAFF_CHAPTERS = [
    {
      id: "room-checkin",
      category: "frontdesk",
      icon: BedDouble,
      badge: "Front Desk Core",
      title: "1. Guest Check-In with Live Webcam Photo & KYC",
      description: "Front desk par aane wale guest ka room check-in kaise karein, live photo aur ID proof kaise record karein.",
      directUrl: "/staff/rooms",
      urlLabel: "Go to Room Booking (/staff/rooms)",
      steps: [
        {
          title: "Available Green Room Select Karein",
          detail: "Screen par khali (Green) room card par click karein. Check-in window open ho jayegi."
        },
        {
          title: "Guest Details & Extra Pax",
          detail: "Primary guest ka Name, Age, Mobile Number dalein. Agar sath me aur log hain toh '+ Add Guest' dabayein."
        },
        {
          title: "Live Webcam Photo Click Karein",
          detail: "Laptop/computer ke webcam ke samne guest ko khada karke 'Capture Photo' dabayein. Police verification ke liye ye photo zaroori hai."
        },
        {
          title: "ID Proof & Advance Token Deposit",
          detail: "Aadhar/Passport/DL number enter karein aur guest dwara diya gaya advance payment (Cash/UPI) lock karein."
        },
        {
          title: "Confirm Check-In",
          detail: "'Complete Check-in' dabate hi room status Red (Occupied) ban jayega aur guest stay start ho jayega."
        }
      ],
      fieldReference: [
        { name: "Number of Persons", req: true, desc: "Stay karne wale kul logon ki sankhya (1-10). Isse utne guest rows open hote hain." },
        { name: "Primary Guest Name (Person 1)", req: true, desc: "Main guest ka legal naam. Police GRC aur Final Bill par yahi naam print hoga." },
        { name: "Additional Guest Names (Person 2+)", req: false, desc: "Sath me stay karne wale family/friends ke naam. Police verification ke liye recommended." },
        { name: "Age", req: false, desc: "Umar (saal me). Adults vs Children count ke liye." },
        { name: "Mobile Number (Person 1)", req: true, desc: "10-digit number. Booking SMS, WhatsApp digital bill aur repeat guest history auto-load ke liye." },
        { name: "ID Type (Dropdown)", req: true, desc: "Aadhar, PAN, Passport, ya Driving License." },
        { name: "ID Number", req: true, desc: "Selected ID ka number. Police compliance ke liye mandatory." },
        { name: "Upload ID Document", req: false, desc: "ID proof photo/scan upload (Cloud me secure save hota hai)." },
        { name: "Live Webcam Photo", req: false, desc: "Laptop/PC webcam se instant face snapshot (GRC aur police records ke liye)." },
        { name: "Advance Amount (₹)", req: true, desc: "Check-in deposit token. Checkout ke waqt final bill se auto deduct ho jayega (ya 0 dalein)." },
        { name: "Advance Payment Mode", req: true, desc: "Cash, UPI, Card, Net Banking, Credit." },
        { name: "Expected Check-Out Date & Time", req: true, desc: "Stay duration aur automatic daily tariff calculate karne ke liye zaroori." },
        { name: "Expected Check-In Date", req: true, desc: "Sirf Advance Booking ke case me zaroori; arrival date/time." },
        { name: "Add GST Details (Checkbox)", req: false, desc: "Corporate business trips ke liye on karein aur 15-digit GSTIN verify karein." },
        { name: "Direct Check-In vs Advance Booking", req: true, desc: "Direct Check-In = Red (Occupied); Advance Booking = Blue/Yellow (Reserved)." }
      ],
      tip: "Corporate trip par aaye guest ke liye 'Apply GST' toggle on karke unka Company GST number enter karein."
    },
    {
      id: "grc-printing",
      category: "frontdesk",
      icon: FileText,
      badge: "Police Compliance",
      title: "2. GRC (Guest Registration Card) Printing",
      description: "Guest se check-in ke time sign karwane ke liye official GRC form print karna.",
      directUrl: "/staff/grc",
      urlLabel: "Go to Print GRC (/staff/grc)",
      steps: [
        {
          title: "Auto-Generated Serial Counter",
          detail: "System har guest ke liye automatic continuous serial number (GRC-001, GRC-002...) generate karta hai."
        },
        {
          title: "Pre-Filled Guest Details Verify Karein",
          detail: "GRC sheet par Hotel Logo, Guest Name, Room No, Tariff, Check-in Date/Time aur photo pehle se loaded rehti hai."
        },
        {
          title: "1-Click Print & Counter Increment",
          detail: "'Print GRC' button dabayein. Print command execute hote hi serial number agle number par jump ho jayega. Print nikal kar guest se sign karwayein."
        }
      ],
      tip: "GRC slips hotel inspection aur local police rules ke liye mandatory hoti hain, ise file me maintain karein."
    },
    {
      id: "restaurant-kot",
      category: "restaurant",
      icon: UtensilsCrossed,
      badge: "Restaurant Orders",
      title: "3. Table Order Punching & Instant KOT Generation",
      description: "Dining table par baithe customer ka order lena aur kitchen printer/chef screen par KOT bhejna.",
      directUrl: "/staff/kot",
      urlLabel: "Go to KOT Billing (/staff/kot)",
      steps: [
        {
          title: "Green Table Select Karein",
          detail: "Floor layout se customer ka Table Number (jaise T1, T2) select karein."
        },
        {
          title: "Rapid Dish Search & Portions",
          detail: "Menu me se dish ka naam type karein. Half ya Full portion select karke cart me add karein. Special instruction (jaise 'Less Oil') note karein."
        },
        {
          title: "Punch KOT Button Dabayein",
          detail: "'Punch KOT' click karte hi instant Kitchen slip print hogi aur chef ke screen par order jayega. Table status Red (Occupied) ban jayega."
        }
      ],
      tip: "Takeaway parcels ke liye top toggle me 'Parcel/Takeaway' mode select karein jisme customer ka phone number record hota hai."
    },
    {
      id: "kot-addons",
      category: "restaurant",
      icon: Sparkles,
      badge: "Re-Ordering Flow",
      title: "4. Extra Items Order (Add-on KOT)",
      description: "Guest jab khane ke beech me extra roti, cold drink ya dessert order karta hai.",
      directUrl: "/staff/kot",
      urlLabel: "Open KOT Floor Plan (/staff/kot)",
      steps: [
        {
          title: "Occupied Red Table Par Click Karein",
          detail: "Pehle se chal rahe running table par click karein. Purane items locked state me dikhenge (Already in Kitchen)."
        },
        {
          title: "Naya Item Cart Me Add Karein",
          detail: "Guest dwara manga gaya naya item menu se add karein."
        },
        {
          title: "Punch Add-on KOT",
          detail: "'Punch Add-on KOT' dabate hi kitchen ko sirf aur sirf NAYA item print hokar jayega, jabki table ka bill ek sath juda rahega!"
        }
      ],
      tip: "Isse kitchen chef ko koi confusion nahi hota aur purana item dubara nahi banta."
    },
    {
      id: "final-billing",
      category: "billing",
      icon: Printer,
      badge: "Cashier Desk",
      title: "5. Bill Settlement, Discounts & 3-Inch Thermal Receipt",
      description: "Table ya Room ka final payment lena, discount lagana aur GST tax invoice print karna.",
      directUrl: "/staff/kot",
      urlLabel: "Open POS Settlement (/staff/kot)",
      steps: [
        {
          title: "Settle & Print Dabayein",
          detail: "Table card par 'Settle Bill' click karein. Subtotal, CGST (2.5%) aur SGST (2.5%) automatic calculate hoga."
        },
        {
          title: "Discounts & Split Payment",
          detail: "Zaroorat padne par flat discount ya percentage discount lagayein. Mode select karein: Cash, UPI, ya Card."
        },
        {
          title: "3-Inch Thermal Printout",
          detail: "Print click karte hi POS thermal receipt print ho jayegi aur table floor par wapas Green (Available) ho jayega."
        }
      ],
      tip: "Customer ko receipt par UPI QR code bhi print hokar milta hai jise wo phone se scan karke pay kar sakte hain."
    },
    {
      id: "kds-kitchen",
      category: "kitchen",
      icon: ChefHat,
      badge: "Chef Screen",
      title: "6. Kitchen Display System (KDS) Screen",
      description: "Kitchen chefs ke liye live orders ki screen jahan se khana prepare aur ready mark hota hai.",
      directUrl: "/staff/kds",
      urlLabel: "Open KDS Screen (/staff/kds)",
      steps: [
        {
          title: "Loud Chime Alert",
          detail: "Jaise hi waiter KOT punch karta hai, kitchen screen par loud sound ke sath naya ticket blink karta hai."
        },
        {
          title: "Cooking Timer Color Code",
          detail: "Har ticket par timer chalta hai: 🟢 Green (<10 mins), 🟡 Yellow (10-20 mins), 🔴 Red (20+ mins delay)."
        },
        {
          title: "Mark as Ready",
          detail: "Khana banne par chef 'Mark Ready' click karta hai. Waiters ke Hall Display par notification chali jati hai."
        }
      ],
      tip: "KDS screen kitchen me tablet ya wall LED TV par full-screen mode me lagayein."
    },
    {
      id: "hall-display",
      category: "kitchen",
      icon: Tv,
      badge: "Dining Hall TV",
      title: "7. Dining Hall Display for Waiters & Captains",
      description: "Dining hall me lagi TV screen jo batati hai kaun sa order tayyar hai aur kis table par serve karna hai.",
      directUrl: "/staff/hall-display",
      urlLabel: "Open Hall Display (/staff/hall-display)",
      steps: [
        {
          title: "Ready Table Numbers",
          detail: "Screen par large font me Table Numbers aur parcel tags chamakne lagte hain."
        },
        {
          title: "Audio Bell Ping",
          detail: "Naya order ready hote hi bell ring hoti hai taaki hall captain turant kitchen se pickup karke guest ko serve karein."
        }
      ],
      tip: "Is system se kitchen se hall me chillane ki zaroorat nahi padti aur service ultra-fast hoti hai."
    }
  ];

  const filtered = STAFF_CHAPTERS.filter((chap) => {
    const matchesSearch = 
      chap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.steps.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.detail.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = activeCategory === "all" || chap.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* HERO BANNER */}
      <div className="manual-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#0B2A2A] via-[#071F1F] to-[#041414] border border-saffron-500/30 shadow-2xl text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 bg-saffron-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/15 border border-saffron-500/30 text-saffron-300 text-xs font-bold tracking-wider uppercase">
              <BookOpen size={14} /> Staff Operations Guide
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              Annapurna Astra <span className="text-saffron-400">Staff Operating Manual</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Front desk receptionists, restaurant captains, cashiers aur chefs ke liye daily operations ka step-by-step operating guide with direct links.
            </p>
          </div>

          {/* Interactive Tour Trigger Button */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.startStaffTour) {
                  window.startStaffTour(0);
                } else {
                  navigate("/staff");
                }
              }}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-saffron-500/25 hover:scale-[1.02] active:scale-[0.98] transition group cursor-pointer"
            >
              <Compass className="w-5 h-5 text-slate-950 group-hover:rotate-45 transition-transform duration-300" />
              <span>Launch Staff Tour</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guide (e.g. Check-in, KYC, GRC, KOT, KDS, Bill)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-saffron-400 focus:bg-white/[0.1] transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white">
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
            {[
              { id: "all", label: "All Guides" },
              { id: "frontdesk", label: "🛏️ Front Desk & GRC" },
              { id: "restaurant", label: "🍽️ Restaurant & KOT" },
              { id: "billing", label: "🧾 Cashier Billing" },
              { id: "kitchen", label: "👨‍🍳 Kitchen KDS" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  activeCategory === cat.id
                    ? "bg-saffron-500 text-slate-950 shadow-md shadow-saffron-500/20"
                    : "bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK JUMP LINKS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Staff Dashboard", url: "/staff", icon: Building2 },
          { label: "Room Check-In", url: "/staff/rooms", icon: BedDouble },
          { label: "Print GRC", url: "/staff/grc", icon: FileText },
          { label: "KOT Floor Plan", url: "/staff/kot", icon: UtensilsCrossed },
          { label: "KDS Screen", url: "/staff/kds", icon: ChefHat },
          { label: "Hall Display", url: "/staff/hall-display", icon: Tv },
        ].map((link, idx) => (
          <Link
            key={idx}
            to={link.url}
            className="manual-quick-link p-3 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-saffron-500/40 text-slate-300 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <link.icon className="w-4 h-4 text-saffron-400 group-hover:scale-110 transition-transform" />
              <span>{link.label}</span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 text-saffron-400 transition" />
          </Link>
        ))}
      </div>

      {/* CHAPTER CARDS */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
          <span>Operating Modules</span>
          <span className="text-xs font-mono font-normal text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
            {filtered.length} guides
          </span>
        </h2>

        <div className="grid gap-6">
          {filtered.map((chap) => {
            const Icon = chap.icon;
            return (
              <motion.div
                key={chap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="manual-card rounded-3xl bg-slate-900/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl hover:border-saffron-500/30 transition-all duration-300 shadow-xl"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-saffron-500/15 border border-saffron-500/30 text-saffron-400 shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-saffron-400 bg-saffron-500/10 border border-saffron-500/25 px-2 py-0.5 rounded-full">
                          {chap.badge}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-white">
                        {chap.title}
                      </h3>
                      <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                        {chap.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      to={chap.directUrl}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-saffron-500/15 hover:bg-saffron-500/25 border border-saffron-500/30 text-saffron-300 text-xs font-bold transition group"
                    >
                      <span>{chap.urlLabel}</span>
                      <ExternalLink size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    Step-by-Step Instructions:
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {chap.steps.map((st, i) => (
                      <div 
                        key={i}
                        className="manual-step p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition space-y-1.5"
                      >
                        <div className="flex items-center gap-2 text-saffron-400 font-bold text-xs">
                          <span className="flex h-5 w-5 rounded-full bg-saffron-500/20 items-center justify-center text-[10px] text-saffron-300">
                            {i + 1}
                          </span>
                          <span className="text-white">{st.title}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-7">
                          {st.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Field-by-Field Reference Table */}
                {chap.fieldReference && (
                  <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-saffron-400 flex items-center gap-2">
                      <FileText size={14} /> Form Fields: Required vs Optional Breakdown
                    </h4>
                    <div className="manual-table-box overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-white/[0.06] text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-white/10">
                          <tr>
                            <th className="py-2.5 px-4">Field Name</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-4">Kya Kaam Ka Hai? (Detailed Purpose)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {chap.fieldReference.map((f, fi) => (
                            <tr key={fi} className="hover:bg-white/[0.03] transition">
                              <td className="py-3 px-4 font-bold text-white whitespace-nowrap flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-saffron-400 shrink-0" />
                                {f.name}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  f.req 
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  {f.req ? '🔴 Required' : '🟡 Optional'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300 text-xs leading-relaxed">
                                {f.desc}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {chap.tip && (
                  <div className="mt-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><b>Pro Tip:</b> {chap.tip}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

