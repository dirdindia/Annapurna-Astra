import React, { useState } from "react";
import { LogOut, User, Coffee, Sun, Moon, Menu, X, Utensils, BedDouble, FileText, CalendarClock, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentUser, onLogout, theme, toggleTheme, toggleSidebar }) {
  const navigate = useNavigate();
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  console.log(currentUser);
  
  return (
    <nav className="glass border-b border-lagoon-700/25 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 no-print transition-colors">
      <div className="flex items-center gap-3">
        {currentUser && currentUser.role === "hotel_admin" && (
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-2 text-slate-300 hover:text-saffron-500 hover:bg-lagoon-800/40 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lagoon-700 to-lagoon-900 border border-lagoon-500/30 flex items-center justify-center p-1.5 shadow-md shadow-lagoon-950/20">
            <img src="/favicon.svg" alt="StayFlow Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-white leading-none">
              {currentUser?.hotelName || "StayFlow Admin"}
            </h1>
            <p className="text-[10px] text-saffron-500 font-semibold tracking-wider uppercase hidden sm:block mt-0.5">
              Hotel Operations & Billing
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center text-saffron-500 font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left flex flex-col">
                <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] text-saffron-500 uppercase font-extrabold tracking-wider">
                    {currentUser.role?.replace("_", " ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentUser && currentUser.role === "staff" && (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-xl mr-2">
              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => navigate("/staff")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Restaurant
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <button
                  onClick={() => navigate("/staff/rooms")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/rooms"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Room Booking
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <button
                  onClick={() => navigate("/staff/kot")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/kot"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  KOT Billing
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <button
                  onClick={() => navigate("/staff/grc")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/grc"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Print GRC
                </button>
              )}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-saffron-500 hover:bg-lagoon-800/40 transition-all flex items-center justify-center active:scale-95 no-print"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-lagoon-700" /> : <Sun className="w-4 h-4 text-saffron-400" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-red-950/80 to-red-900/80 border border-red-800/40 hover:from-red-900 hover:to-red-800 text-red-200 text-xs font-semibold rounded-xl transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        {currentUser && (
          <button 
            onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-saffron-500 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isStaffMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isStaffMenuOpen && currentUser && (
        <div className="absolute top-[72px] left-0 right-0 bg-slate-950 border-b border-lagoon-700/25 p-4 flex flex-col gap-3 z-50 md:hidden shadow-2xl animate-fade-in">
          {/* User Info inside menu */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl mb-1">
            <div className="w-10 h-10 rounded-lg bg-saffron-500/20 border border-saffron-500/40 flex items-center justify-center text-saffron-500 shrink-0 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left flex flex-col">
              <p className="text-base font-semibold text-slate-200">{currentUser.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-saffron-500 uppercase font-bold tracking-wider">
                  {currentUser.role?.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Nav Links */}
          {currentUser.role === "staff" && (
            <div className="flex flex-col gap-2 mb-1 border-b border-slate-800/50 pb-4 mt-2">
              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => { navigate("/staff"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  Restaurant Billing
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <button
                  onClick={() => { navigate("/staff/rooms"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/rooms"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <BedDouble className="w-5 h-5" />
                  Room Booking
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <button
                  onClick={() => { navigate("/staff/kot"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/kot"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                  KOT Billing
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <button
                  onClick={() => { navigate("/staff/grc"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/grc"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Print GRC
                </button>
              )}
            </div>
          )}

          {/* Theme & Logout */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-amber-500 transition-all"
            >
              {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <span className="font-medium text-sm">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 hover:from-red-900 text-red-200 font-medium rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
