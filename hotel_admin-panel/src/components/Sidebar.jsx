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
} from "lucide-react";

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();

  // Top-level independent menu items
  const primaryMenuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Scan & Order (QR)",
      path: "/admin/qr-orders",
      icon: QrCode,
      show: true,
    },
    {
      name: "KOT Billing",
      path: "/admin/kot-reports",
      icon: UtensilsCrossed,
      show: true,
    },
    {
      name: "Print Pending KOT",
      path: "/admin/kot-print",
      icon: FileText,
      show: true,
    },
    {
      name: "Room Bookings",
      path: "/admin/room-reports",
      icon: BookOpen,
      show: true,
    },
  ];

  // Manage submenu items
  const manageSubItems = [
    {
      name: "Staff",
      path: "/admin/staff",
      icon: Users,
    },
    {
      name: "Dishes",
      path: "/admin/dishes",
      icon: UtensilsCrossed,
    },
    {
      name: "Rooms",
      path: "/admin/rooms",
      icon: BedDouble,
    },
    {
      name: "Tables",
      path: "/admin/tables",
      icon: Grid,
    },
    {
      name: "Inventory",
      path: "/admin/inventory",
      icon: FileText,
    },
  ];

  // Bottom items
  const secondaryMenuItems = [
    {
      name: "Subscription",
      path: "/admin/subscription",
      icon: Crown,
      show: true,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
      show: true,
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden top-[73px]"
          onClick={closeSidebar}
        />
      )}
      <aside className={`w-64 glass border-r border-lagoon-700/25 min-h-[calc(100vh-80px)] p-4 flex flex-col gap-2 no-print shrink-0 
        fixed md:static top-[73px] md:top-0 bottom-0 left-0 z-50 md:z-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        bg-slate-950 md:bg-transparent overflow-y-auto custom-scrollbar
      `}>
        <div className="px-3 py-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-saffron-500/80">
            Admin Control Center
          </p>
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
                onClick={() => closeSidebar && closeSidebar()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-saffron-500/20 via-saffron-500/10 to-transparent border border-saffron-500/35 text-saffron-400 font-bold shadow-sm shadow-saffron-500/5"
                    : "hover:bg-lagoon-800/40 hover:text-lagoon-100 text-slate-400 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-saffron-400" : "text-slate-400 group-hover:text-lagoon-200"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Collapsible MANAGE Menu with Submenu */}
          <div className="flex flex-col mt-1">
            <button
              type="button"
              onClick={() => setIsManageOpen(!isManageOpen)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 group text-sm font-bold ${
                isManageActive
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm shadow-amber-500/10"
                  : "bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 text-amber-300 hover:text-amber-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1 rounded-lg ${isManageActive ? "bg-amber-500/30 text-amber-300" : "bg-amber-500/15 text-amber-400 group-hover:bg-amber-500/25"}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <span className="tracking-wide">Manage</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isManageOpen ? "rotate-180 text-amber-400" : "text-amber-400/70 group-hover:text-amber-300"
                }`}
              />
            </button>

            {/* Submenu Items */}
            {isManageOpen && (
              <div className="flex flex-col gap-1 mt-1 ml-4 pl-3 border-l border-slate-800/80">
                {manageSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const isSubActive = location.pathname === sub.path;

                  return (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      onClick={() => closeSidebar && closeSidebar()}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-sm ${
                        isSubActive
                          ? "bg-saffron-500/20 text-saffron-400 font-bold border border-saffron-500/30"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                      }`}
                    >
                      <SubIcon className={`w-4 h-4 ${isSubActive ? "text-saffron-400" : "text-slate-400"}`} />
                      <span>{sub.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary Menus (Subscription, Settings) */}
          {secondaryMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => closeSidebar && closeSidebar()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-saffron-500/20 via-saffron-500/10 to-transparent border border-saffron-500/35 text-saffron-400 font-bold shadow-sm shadow-saffron-500/5"
                    : "hover:bg-lagoon-800/40 hover:text-lagoon-100 text-slate-400 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-saffron-400" : "text-slate-400 group-hover:text-lagoon-200"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
