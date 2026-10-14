import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UtensilsCrossed, FileText, BedDouble, BookOpen, Settings, CreditCard, Grid, Database, Crown, QrCode } from "lucide-react";

export default function Sidebar({ isOpen, closeSidebar }) {
  const location = useLocation();
  // Sidebar is only used by AdminRoute, so they should see all menus
  const menuItems = [
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
      name: "Restaurant Billing",
      path: "/admin/reports",
      icon: CreditCard,
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


    {
      name: "Manage Staff",
      path: "/admin/staff",
      icon: Users,
      show: true,
    },
    {
      name: "Manage Dishes",
      path: "/admin/dishes",
      icon: UtensilsCrossed,
      show: true,
    },
    {
      name: "Manage Rooms",
      path: "/admin/rooms",
      icon: BedDouble,
      show: true,
    },
    {
      name: "Manage Tables",
      path: "/admin/tables",
      icon: Grid,
      show: true,
    },
    {
      name: "Manage Inventory",
      path: "/admin/inventory",
      icon: FileText,
      show: true,
    },
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

  const visibleMenuItems = menuItems.filter(item => item.show);

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
        bg-slate-950 md:bg-transparent overflow-y-auto
      `}>
        <div className="px-3 py-2">
          <p className="text-[10px] uppercase font-bold tracking-widest text-saffron-500/80">
            Admin Control Center
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => closeSidebar && closeSidebar()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
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
