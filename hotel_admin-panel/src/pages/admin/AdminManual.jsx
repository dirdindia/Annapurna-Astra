import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Compass, ExternalLink, Sparkles, Building2, BedDouble, 
  UtensilsCrossed, FileText, CheckCircle2, AlertCircle, Users, QrCode, 
  CreditCard, ShieldCheck, ChevronRight, ArrowRight, Printer, Camera, Eye, ChefHat, Tv
} from "lucide-react";

export default function AdminManual() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const MANUAL_CHAPTERS = [
    {
      id: "hotel-setup",
      category: "setup",
      icon: Building2,
      badge: "Core Setup",
      title: "1. Hotel Setup, Profile & GST Configuration",
      description: "Hotel ka naam, branding logo, official address, GSTIN number, aur print templates configure karein.",
      directUrl: "/admin/settings",
      urlLabel: "Go to Settings (/admin/settings)",
      steps: [
        {
          title: "Hotel Branding & Logo",
          detail: "Settings page par jakar apna official Hotel Name, Phone, Email aur logo image upload karein. Ye logo har thermal bill aur GRC registration card par print hoga."
        },
        {
          title: "GSTIN & Tax Configuration",
          detail: "Apna 15-digit GSTIN number aur billing address enter karein. Isse customer bills par automatic CGST (2.5%) aur SGST (2.5%) calculate ho jayega."
        },
        {
          title: "Bank & UPI Details for Digital Payments",
          detail: "Apna Bank Account Number, IFSC Code aur UPI ID configure karein taaki bill print hone par customer ke liye automatic payment QR code generate ho."
        }
      ],
      tip: "Settings me update kiye gaye details sabhi Staff Panels me instant sync ho jate hain bina restart kiye."
    },
    {
      id: "rooms-management",
      category: "hotel",
      icon: BedDouble,
      badge: "Hotel Module",
      title: "2. Room Inventory & Tariff Setup",
      description: "Rooms add karein, room categories (Deluxe, Suite, Standard) banayein aur per-night base tariff set karein.",
      directUrl: "/admin/rooms",
      urlLabel: "Go to Manage Rooms (/admin/rooms)",
      steps: [
        {
          title: "Naya Room Add Karein",
          detail: "Top-right corner me '+ Add Room' button dabayein. Room Number (jaise 101, 102, Suite-01), Floor aur Bed Type (Single/Double/Triple) select karein."
        },
        {
          title: "Base Tariff (Price per Night)",
          detail: "Room ka standard per-night charge enter karein. Check-in karte waqt ye price automatic load ho jata hai, jise receptionist chahe to discount de sakta hai."
        },
        {
          title: "Visual Color-Coded Room Grid",
          detail: "🟢 Green = Available (Khali hai), 🔴 Red = Occupied (Guest stay kar raha hai), 🟡 Yellow = Advance Booked (Aane wala guest)."
        }
      ],
      tip: "Agar kisi room me renovation ya deep cleaning chal rahi ho, toh room ko 'Maintenance' status mark kar sakte hain."
    },
    {
      id: "guest-checkin-kyc",
      category: "hotel",
      icon: Camera,
      badge: "Front Desk",
      title: "3. Guest Check-In with Live Webcam KYC & GRC Card",
      description: "Front desk staff guest ka check-in kaise kare, live photo capture aur digital GRC card kaise print kare.",
      directUrl: "/admin/room-reports",
      urlLabel: "View Room Bookings (/admin/room-reports)",
      steps: [
        {
          title: "Available Green Room Select Karein",
          detail: "Receptionist available room card par click karta hai. Primary guest ka Full Name, Mobile Number, aur Pax count enter karein."
        },
        {
          title: "Live Webcam Photo & ID Card",
          detail: "Computer/Laptop ke webcam se guest ki live instant photo capture hoti hai. ID proof type (Aadhar, Passport, DL) select karke ID number enter karein."
        },
        {
          title: "Advance Deposit & GST",
          detail: "Guest dwara diya gaya token advance amount (Cash/UPI) lock karein jo checkout billing me automatic deduct ho jayega."
        },
        {
          title: "Automated GRC (Guest Registration Card) Printing",
          detail: "Local police aur hotel compliance ke liye system instant serial number ke sath GRC generate karta hai. 1-click me A4 GRC slip print karke guest se sign karwayein."
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
      tip: "Corporate guests ke liye 'Apply GST' toggle on karke unki company ka GST number enter karein taaki B2B tax invoice ban sake."
    },
    {
      id: "qr-orders-management",
      category: "restaurant",
      icon: QrCode,
      badge: "Digital QR & Queue",
      title: "4. Scan & Order (QR Menu, Standees, Advance Bookings & Live Waitlist)",
      description: "Dining tables aur hotel rooms ke liye customer self-ordering QR codes, incoming approvals, table reservations, aur live queue.",
      directUrl: "/admin/qr-orders",
      urlLabel: "Open QR Orders (/admin/qr-orders)",
      steps: [
        {
          title: "Download Table QR Standees (Tab: Generator)",
          detail: "'QR Generator' tab me jakar har table (T1, T2) ya Room ke liye hotel branding aur logo ke sath high-res print-ready Standee QR PDF/Image download karein aur tables par lagayein."
        },
        {
          title: "Incoming QR Orders Approval (Tab: Approvals)",
          detail: "Jab customer table par baith kar apne mobile se QR scan karke order submit karta hai, screen par audio alert bajta hai. Admin 'Accept' karta hai toh instant KOT kitchen me dispatch ho jata hai."
        },
        {
          title: "Table Reservations & 15-Min Slots (Tab: Bookings)",
          detail: "Customers ki online table booking requests with date aur 15-minute slot time. Guest count aur contact details verify karke table confirm karein."
        },
        {
          title: "Live Digital Waitlist Queue (Tab: Waitlist)",
          detail: "Peak hours me jab sabhi tables occupied hon, customers ko digital waitlist tokens allot karein. Table khali hote hi live SMS/WhatsApp notification trigger hota hai."
        }
      ],
      fieldReference: [
        { name: "Table / Room Standee QR", req: true, desc: "Customer mobile self-ordering ke liye printable QR acrylic standee printout." },
        { name: "Order Approval (Accept / Reject)", req: true, desc: "Customer dwara cart se bheje gaye items ko review karke kitchen me pass karna." },
        { name: "Customer Contact Mobile", req: true, desc: "Order confirmation SMS, kitchen updates aur final WhatsApp invoice bhejne ke liye." },
        { name: "Table Reservation 15-Min Slot", req: false, desc: "Advance customer booking ka exact aane ka samay (e.g. 01:15 PM, 08:30 PM)." },
        { name: "Live Queue Waitlist Token", req: false, desc: "Rush hours me customer waiting number aur estimated wait time calculate karne ke liye." },
        { name: "Customer Special Cooking Notes", req: false, desc: "Khane me mirch kam, bina pyaaz lasun, ya allergy details jo chef ko slip par print hoti hain." }
      ],
      tip: "Tables par QR lagane se waiters ka manual order taking time 70% bach jata hai aur order punching errors zero ho jati hain."
    },
    {
      id: "print-pending-kot",
      category: "restaurant",
      icon: Printer,
      badge: "Kitchen Routing",
      title: "5. Print Pending KOT (Kitchen Tickets & Thermal Routing)",
      description: "Running occupied tables aur takeaway parcels ke unprinted dishes ka 3-inch/2-inch thermal KOT slip kitchen chef ke liye print karein.",
      directUrl: "/admin/kot-print",
      urlLabel: "Open Print Pending KOT (/admin/kot-print)",
      steps: [
        {
          title: "Occupied Tables Grid Selection",
          detail: "'/admin/kot-print' page par currently active occupied dining tables aur takeaway cards dikhte hain. Jis table ka KOT nikalna ho uspar click karein."
        },
        {
          title: "Pending Dishes Auto-Checklist",
          detail: "Table open hote hi us table ke sabhi ordered items display hote hain. Jo items abhi kitchen me nahi gaye unka checkbox auto-checked rehta hai; specific dish uncheck kar sakte hain."
        },
        {
          title: "1-Click Thermal Slip Print",
          detail: "'Print KOT' button dabate hi thermal printer se slip nikal jati hai jisme Table Number, Captain Name, Timestamp aur Dish Qty clear printed hoti hai."
        },
        {
          title: "Anti-Duplicate Printing Safety Lock",
          detail: "Print hote hi system me 'printedQuantity' save ho jati hai taaki dubara click karne par purane dishes ka duplicate ticket chef ko na jaye."
        }
      ],
      fieldReference: [
        { name: "Occupied Table / Display No", req: true, desc: "Kis table ya parcel order ka ticket hai (jaise Table T-4 ya Order #104)." },
        { name: "Pending Dishes Checkbox", req: true, desc: "Kitchen me cook karne ke liye bheje jane wale dishes ki list." },
        { name: "Print Quantity", req: true, desc: "Kitni plate ya portion cook karna hai (Half ya Full portion)." },
        { name: "Captain / Waiter Name", req: true, desc: "Order punch karne wale staff ka naam jo KOT ticket ke top par print hota hai." },
        { name: "Special Preparation Remarks", req: false, desc: "Customer instructions jaise 'Crispy Naan', 'Extra Spicy', 'No Butter'." }
      ],
      tip: "Agar kitchen me KDS screen lagi ho toh paper KOT print ki zaroorat nahi padti, lekin traditional kitchens ke liye thermal KOT ticket sabse reliable rehta hai."
    },
    {
      id: "restaurant-tables",
      category: "restaurant",
      icon: UtensilsCrossed,
      badge: "Restaurant POS",
      title: "6. Restaurant Floor, Tables & Menu Setup",
      description: "Dining area ke tables aur restaurant menu dishes, categories aur pricing configure karein.",
      directUrl: "/admin/tables",
      urlLabel: "Manage Tables (/admin/tables)",
      steps: [
        {
          title: "Floor Table Grid Setup",
          detail: "'Manage Tables' me jakar Table Numbers (T1, T2, Family-1) banayein. Capacity (2-seater, 4-seater, 6-seater) define karein."
        },
        {
          title: "Menu Dishes & Categories",
          detail: "'Manage Dishes' (/admin/dishes) par jakar items add karein (Paneer Butter Masala, Butter Naan, Veg Thali). Half/Full pricing aur Veg/Non-Veg tag lagayein."
        },
        {
          title: "Standee QR Codes",
          detail: "Har table ke liye custom QR Code print karke table standee par lagayein taaki guest apne mobile se direct menu dekh kar order kar sake."
        }
      ],
      tip: "Dishes me high-quality food image lagane se QR menu par food presentation bahut attractive dikhti hai."
    },
    {
      id: "kot-billing",
      category: "restaurant",
      icon: Printer,
      badge: "Kitchen Operations",
      title: "7. KOT Billing Reports & Instant Settlement",
      description: "Table se order kaise lein, kitchen me instant KOT kaise bhejein aur final bill settlement kaise karein.",
      directUrl: "/admin/kot-reports",
      urlLabel: "View KOT Reports (/admin/kot-reports)",
      steps: [
        {
          title: "Table Select & Item Cart",
          detail: "Table card par click karein, menu search karke items add karein, aur customer ki custom requirement note karein."
        },
        {
          title: "Punch KOT to Kitchen",
          detail: "'Punch KOT' dabate hi kitchen printer aur chef ke Kitchen Display (KDS) par slip chali jayegi, aur table status instant Red (Occupied) ban jayega."
        },
        {
          title: "Running Table Add-ons",
          detail: "Agar guest extra roti ya drink mangta hai, usi table par naya item add karke 'Punch Add-on KOT' karein. Kitchen ko sirf naya item jayega, purana dubara print nahi hoga!"
        },
        {
          title: "Settle & 3-Inch Thermal Bill",
          detail: "Dinner complete hone par 'Settle & Print Bill' dabayein. Cash, UPI ya Card select karte hi GST ke sath 3-inch receipt print ho jayegi."
        }
      ],
      tip: "Restaurant KOT panel par shortcut keys se rapid order search possible hai."
    },
    {
      id: "kitchen-display-kds",
      category: "restaurant",
      icon: Eye,
      badge: "Kitchen Live Screen",
      title: "8. Kitchen Display System (KDS) & Hall Display",
      description: "Kitchen me chefs ke liye live orders screen aur dining hall me waiters ke liye order dispatch TV display.",
      directUrl: "/admin/hall-display",
      urlLabel: "Open Hall Display (/admin/hall-display)",
      steps: [
        {
          title: "KDS Wall Screen",
          detail: "Kitchen me lage tablet ya LED monitor par naye orders loud alert sound ke sath blink karte hain."
        },
        {
          title: "Cooking Timer Color Codes",
          detail: "Order aane ke baad timer start hota hai: 🟢 Green (<10 min), 🟡 Yellow (10-20 min), 🔴 Red (>20 min late)."
        },
        {
          title: "Dining Hall Ready Notification",
          detail: "Chef jab 'Order Ready' mark karta hai, dining hall display par table number chamakne lagta hai taaki waiter turant khana serve kar sake."
        }
      ],
      tip: "KDS screen se paper KOT ki zaroorat khatam ho jati hai aur 100% paperless kitchen chalta hai."
    },
    {
      id: "inventory-stock",
      category: "inventory",
      icon: FileText,
      badge: "Stock Control",
      title: "9. Inventory & Stock Management",
      description: "Kitchen raw materials (Paneer, Rice, Oil, Spices) aur Hotel supplies (Soap, Linen, Water) ka hisaab rakhein.",
      directUrl: "/admin/inventory",
      urlLabel: "Go to Inventory (/admin/inventory)",
      steps: [
        {
          title: "Item Master Creation",
          detail: "Item name, Unit of measurement (Kg, Litre, Packets) aur minimum alert threshold set karein."
        },
        {
          title: "Stock In / Purchase Entry",
          detail: "Vendor se maal aane par purchase quantity aur purchase rate enter karein, stock instant update ho jayega."
        },
        {
          title: "Low Stock Alert Notifications",
          detail: "Jab bhi kisi item ka stock minimum level se kam hoga, system dashboard par warning notification dikhayega."
        }
      ],
      tip: "Monthly wastage aur consumption audit karne ke liye inventory reports export karein."
    },
    {
      id: "staff-roles",
      category: "setup",
      icon: Users,
      badge: "Staff & Security",
      title: "10. Staff Accounts & Role-Based Permissions",
      description: "Front desk staff, restaurant cashiers, waiters aur sub-admins ke separate logins aur rights manage karein.",
      directUrl: "/admin/staff",
      urlLabel: "Manage Staff (/admin/staff)",
      steps: [
        {
          title: "New Staff Login Account",
          detail: "Staff ka Naam, Mobile Number, Role (Receptionist / Cashier / Sub-Admin) aur secure Password banayein."
        },
        {
          title: "Sub-Admin Permission Locking",
          detail: "Sub-admins hotel ke operations chala sakte hain lekin unhe sensitive financial revenue reports aur deletion rights nahi milte."
        },
        {
          title: "Deactivate / Edit Access",
          detail: "Agar koi staff resign karta hai, toh 1-click me unka access deactivate kiya ja sakta hai."
        }
      ],
      tip: "Har staff ko alag password dein taaki audits me pata chale kis staff ne kaun sa bill generate kiya."
    },
    {
      id: "reports-analytics",
      category: "reports",
      icon: CreditCard,
      badge: "Financial Audit",
      title: "11. Reports, Invoicing & GST Tax Audits",
      description: "Daily sales collections, room stay history, KOT summary aur GST tax reports export karein.",
      directUrl: "/admin",
      urlLabel: "View Dashboard Reports (/admin)",
      steps: [
        {
          title: "Daily Collection Breakdown",
          detail: "Dashboard par Today, Month aur Year ka total sales amount aur payment mode split (Cash vs Online UPI) check karein."
        },
        {
          title: "Invoice Reprint & WhatsApp Bill",
          detail: "Purane kisi bhi customer ka bill dhundhkar dubara thermal print nikal sakte hain ya digital HTML bill link share kar sakte hain."
        },
        {
          title: "Room Occupancy Ratio",
          detail: "Kaun se rooms sabse zyada book hote hain aur kis mahine revenue peak par tha, iska interactive chart dekhein."
        }
      ],
      tip: "CA aur GST return filing ke liye monthly sales summary reports use karein."
    }
  ];

  const filteredChapters = MANUAL_CHAPTERS.filter((chap) => {
    const matchesSearch = 
      chap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chap.steps.some(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.detail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategory === "all" || chap.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* TOP HERO BANNER */}
      <div className="manual-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-[#0B2A2A] via-[#071F1F] to-[#041414] border border-saffron-500/30 shadow-2xl text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 bg-saffron-500/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-500/15 border border-saffron-500/30 text-saffron-300 text-xs font-bold tracking-wider uppercase">
              <BookOpen size={14} /> Official Client Documentation
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
              Annapurna Astra <span className="text-saffron-400">User Manual & Tour Guide</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Hotel operations, front desk room bookings, restaurant POS, QR self-ordering, KOT kitchen routing, aur automated GST billing ka complete step-by-step documentation with direct links.
            </p>
          </div>

          {/* Interactive Tour Trigger Button */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.startAnnapurnaTour) {
                  window.startAnnapurnaTour(0);
                } else {
                  navigate("/admin");
                }
              }}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-saffron-500/25 hover:scale-[1.02] active:scale-[0.98] transition group cursor-pointer"
            >
              <Compass className="w-5 h-5 text-slate-950 group-hover:rotate-45 transition-transform duration-300" />
              <span>Launch Interactive Tour</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Topic search karein (e.g. QR, KOT Print, Room, KYC, Staff)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.07] border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-saffron-400 focus:bg-white/[0.1] transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 custom-scrollbar">
            {[
              { id: "all", label: "All Topics" },
              { id: "hotel", label: "🛏️ Rooms & Hotel" },
              { id: "restaurant", label: "🍽️ Restaurant & QR/KOT" },
              { id: "inventory", label: "📦 Inventory" },
              { id: "setup", label: "⚙️ Setup & Staff" },
              { id: "reports", label: "📊 Reports" }
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

      {/* QUICK JUMP LINKS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Dashboard", url: "/admin", icon: Building2 },
          { label: "Scan & Order (QR)", url: "/admin/qr-orders", icon: QrCode },
          { label: "Print Pending KOT", url: "/admin/kot-print", icon: Printer },
          { label: "Manage Rooms", url: "/admin/rooms", icon: BedDouble },
          { label: "Restaurant Tables", url: "/admin/tables", icon: UtensilsCrossed },
          { label: "Menu Dishes", url: "/admin/dishes", icon: UtensilsCrossed },
          { label: "KOT Reports", url: "/admin/kot-reports", icon: Printer },
          { label: "Staff & Roles", url: "/admin/staff", icon: Users },
          { label: "Inventory", url: "/admin/inventory", icon: FileText },
          { label: "Settings", url: "/admin/settings", icon: ShieldCheck },
        ].map((link, idx) => (
          <Link
            key={idx}
            to={link.url}
            className="manual-quick-link p-3 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-saffron-500/40 text-slate-300 hover:text-white hover:bg-white/[0.06] transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2 text-xs font-bold truncate">
              <link.icon className="w-4 h-4 text-saffron-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">{link.label}</span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 text-saffron-400 transition shrink-0 ml-1" />
          </Link>
        ))}
      </div>

      {/* CHAPTERS ACCORDION / CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <span>Documentation Chapters</span>
            <span className="text-xs font-mono font-normal text-slate-400 bg-white/10 px-2 py-0.5 rounded-full">
              {filteredChapters.length} guides
            </span>
          </h2>
        </div>

        {filteredChapters.length === 0 ? (
          <div className="manual-card p-12 text-center rounded-3xl bg-slate-900/40 border border-white/10 text-slate-400">
            <Search className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-white">Koi topic nahi mila</h3>
            <p className="text-xs mt-1">Apna search term change karein ya 'All Topics' select karein.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredChapters.map((chap) => {
              const Icon = chap.icon;
              return (
                <motion.div
                  key={chap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="manual-card rounded-3xl bg-slate-900/60 border border-white/10 p-6 md:p-8 backdrop-blur-xl hover:border-saffron-500/30 transition-all duration-300 shadow-xl"
                >
                  {/* Chapter Header */}
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

                    {/* Direct Action Link Button */}
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

                  {/* Step-by-Step Instructions */}
                  <div className="mt-6 space-y-4">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Step-by-Step Operating Instructions:
                    </h4>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {chap.steps.map((st, i) => (
                        <div 
                          key={i}
                          className="manual-step p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition space-y-1.5"
                        >
                          <div className="flex items-center gap-2 text-saffron-400 font-bold text-xs">
                            <span className="flex h-5 w-5 rounded-full bg-saffron-500/20 items-center justify-center text-[10px] text-saffron-300 shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-white font-semibold">{st.title}</span>
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

                  {/* Pro Tip Box */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-saffron-500/10 border border-saffron-500/25 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-saffron-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-saffron-200/90 leading-relaxed">
                      <strong className="text-saffron-400 font-bold">Pro Tip: </strong>
                      {chap.tip}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
