import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  FileText,
  BedDouble,
  BookOpen,
  Settings,
  Grid,
  Crown,
  QrCode,
  Layers,
  ChevronDown,
  ShieldCheck,
  Compass,
} from "lucide-react";

export default function Sidebar({ isOpen, closeSidebar, currentUser }) {
  const location = useLocation();

  const user = currentUser || (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const isSubAdmin = user?.role === "sub_admin";

  // Top-level independent menu items
  const primaryMenuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      show: true,
      tourId: "sidebar-dashboard",
    },
    {
      name: "Scan & Order (QR)",
      path: "/admin/qr-orders",
      icon: QrCode,
      show: true,
      tourId: "sidebar-qr-orders",
    },
    {
      name: "KOT Billing",
      path: "/admin/kot-reports",
      icon: UtensilsCrossed,
      show: true,
      tourId: "sidebar-kot-billing",
    },
    {
      name: "Print Pending KOT",
      path: "/admin/kot-print",
      icon: FileText,
      show: true,
      tourId: "sidebar-kot-print",
    },
    {
      name: "Room Bookings",
      path: "/admin/room-reports",
      icon: BookOpen,
      show: true,
      tourId: "sidebar-room-bookings",
    },
  ];

  // Manage submenu items - Staff is restricted to primary hotel_admin
  const manageSubItems = [
    ...(isSubAdmin ? [] : [
      {
        name: "Staff & Sub-Admins",
        path: "/admin/staff",
        icon: Users,
        tourId: "sidebar-staff",
      }
    ]),
    {
      name: "Dishes",
      path: "/admin/dishes",
      icon: UtensilsCrossed,
      tourId: "sidebar-dishes",
    },
    {
      name: "Rooms",
      path: "/admin/rooms",
      icon: BedDouble,
      tourId: "sidebar-rooms",
    },
    {
      name: "Tables",
      path: "/admin/tables",
      icon: Grid,
      tourId: "sidebar-tables",
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      icon: FileText,
      tourId: "sidebar-inventory",
    },
  ];

  // Bottom items - Subscription is restricted to primary hotel_admin
  const secondaryMenuItems = [
    {
      name: "User Manual",
      path: "/admin/manual",
      icon: BookOpen,
      show: true,
      tourId: "sidebar-manual",
    },
    ...(isSubAdmin ? [] : [
      {
        name: "Subscription",
        path: "/admin/subscription",
        icon: Crown,
        show: true,
      }
    ]),
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
      show: true,
      tourId: "sidebar-settings",
    },
  ];

  // Auto-expand Manage dropdown if the active route is any manage sub-route
  const isManageActive = manageSubItems.some((sub) => location.pathname === sub.path);
  const [isManageOpen, setIsManageOpen] = useState(isManageActive);

  useEffect(() => {
    if (isManageActive) {
      setIsManageOpen(true);
    }
  }, [location.pathname, isManageActive]);

  // Expand manage submenu during tour if targeting any sidebar sub-item
  useEffect(() => {
    const handleTourTarget = (e) => {
      const target = e.detail?.target;
      if (
        target === "sidebar-rooms" ||
        target === "sidebar-tables" ||
        target === "sidebar-dishes" ||
        target === "sidebar-staff" ||
        target === "sidebar-inventory"
      ) {
        setIsManageOpen(true);
      }
    };
    window.addEventListener("annapurna-tour-target", handleTourTarget);
    return () => window.removeEventListener("annapurna-tour-target", handleTourTarget);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 md:hidden top-[73px]"
          onClick={closeSidebar}
        />
      )}
      <aside className={`w-64 glass border-r border-lagoon-700/30 min-h-[calc(100vh-80px)] p-4 flex flex-col gap-3 no-print shrink-0 
        fixed md:static top-[73px] md:top-0 bottom-0 left-0 z-50 md:z-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        bg-[#061C1C]/95 md:bg-transparent overflow-y-auto custom-scrollbar
      `}>
        {/* Navigation Category Label */}
        <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/[0.06] pb-2">
          <p className="text-[11px] uppercase font-black tracking-widest text-saffron-400 drop-shadow-sm">
            Menu Navigation
          </p>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {/* Primary Menus */}
          {primaryMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={item.tourId || undefined}
                onClick={() => closeSidebar && closeSidebar()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 group text-sm font-semibold ${
                  isActive
                    ? "bg-gradient-to-r from-saffron-500/25 via-saffron-500/15 to-transparent border border-saffron-400/50 text-white font-bold shadow-lg shadow-saffron-500/15 translate-x-1"
                    : "text-slate-100 hover:text-white hover:bg-white/[0.07] border border-transparent hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? "bg-saffron-500 text-slate-950 font-black shadow-md shadow-saffron-500/30 ring-2 ring-saffron-400/30" 
                      : "bg-white/[0.06] text-saffron-300 group-hover:bg-saffron-500/20 group-hover:text-saffron-300 group-hover:scale-105"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`tracking-wide ${isActive ? "text-white drop-shadow-sm" : "text-slate-100 group-hover:text-white"}`}>
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-4 rounded-full bg-saffron-400 shadow-[0_0_8px_rgba(246,180,69,0.8)]" />
                )}
              </Link>
            );
          })}

          {/* Collapsible MANAGE Menu with Submenu */}
          <div className="flex flex-col mt-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setIsManageOpen(!isManageOpen)}
              className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl transition-all duration-300 group text-sm font-bold ${
                isManageActive
                  ? "bg-gradient-to-r from-amber-500/25 to-amber-500/10 border border-amber-400/50 text-white shadow-md shadow-amber-500/15"
                  : "bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-amber-400/30 text-slate-100 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isManageActive 
                    ? "bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/30 ring-2 ring-amber-400/30" 
                    : "bg-amber-500/15 text-amber-300 group-hover:bg-amber-500/25 group-hover:scale-105"
                }`}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="tracking-wide text-white drop-shadow-sm">Manage Hotel</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  isManageOpen ? "rotate-180 text-amber-300" : "text-slate-300 group-hover:text-amber-300"
                }`}
              />
            </button>

            {/* Submenu Items */}
            {isManageOpen && (
              <div className="flex flex-col gap-1 mt-1.5 ml-3 pl-3 border-l-2 border-amber-400/30">
                {manageSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.path;

                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      data-tour={sub.tourId || undefined}
                      onClick={() => closeSidebar && closeSidebar()}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-xs font-semibold ${
                        isSubActive
                          ? "bg-saffron-500/20 text-white font-bold border border-saffron-400/40 shadow-sm shadow-saffron-500/10 translate-x-1"
                          : "text-slate-200 hover:text-white hover:bg-white/[0.07]"
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-saffron-400" : "text-slate-300 group-hover:text-white"}`} />
                      <span className={isSubActive ? "text-white" : "text-slate-200"}>{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Section Header */}
          <div className="px-3 pt-3 pb-1 flex items-center justify-between border-t border-white/[0.06] mt-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
              Settings & Account
            </p>
          </div>

          {/* Secondary Menus (Subscription, Settings) */}
          {secondaryMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={item.tourId || undefined}
                onClick={() => closeSidebar && closeSidebar()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-300 group text-sm font-semibold ${
                  isActive
                    ? "bg-gradient-to-r from-saffron-500/25 via-saffron-500/15 to-transparent border border-saffron-400/50 text-white font-bold shadow-md shadow-saffron-500/15 translate-x-1"
                    : "text-slate-100 hover:text-white hover:bg-white/[0.07] border border-transparent hover:border-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? "bg-saffron-500 text-slate-950 font-black shadow-md shadow-saffron-500/30" 
                      : "bg-white/[0.06] text-saffron-300 group-hover:bg-saffron-500/20 group-hover:text-saffron-300 group-hover:scale-105"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`tracking-wide ${isActive ? "text-white drop-shadow-sm" : "text-slate-100 group-hover:text-white"}`}>
                    {item.name}
                  </span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-4 rounded-full bg-saffron-400 shadow-[0_0_8px_rgba(246,180,69,0.8)]" />
                )}
              </Link>
            );
          })}

          {/* Interactive Tour Trigger Pill */}
          <button
            type="button"
            onClick={() => {
              if (window.startAnnapurnaTour) {
                window.startAnnapurnaTour(0);
              }
              if (closeSidebar) closeSidebar();
            }}
            className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-saffron-500/20 via-amber-500/15 to-transparent border border-saffron-500/30 text-saffron-300 hover:text-white hover:border-saffron-400 transition group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-saffron-500/20 border border-saffron-500/30 text-saffron-400 group-hover:scale-110 transition-transform">
                <Compass className="w-4 h-4 text-saffron-300 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none">Interactive Tour</p>
                <p className="text-[10px] text-slate-400 mt-1">Explore Key Features</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-saffron-400 uppercase tracking-widest bg-saffron-500/10 px-2 py-0.5 rounded-full border border-saffron-500/25">
              Tour
            </span>
          </button>

          {isSubAdmin && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 font-extrabold text-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Sub-Admin Account</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Financial Revenue Restricted</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
