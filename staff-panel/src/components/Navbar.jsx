import React, { useState } from "react";
import { LogOut, User, Sun, Moon, Menu, X, Utensils, BedDouble, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ currentUser, onLogout, theme, toggleTheme, toggleSidebar }) {
  const navigate = useNavigate();
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  return (
    <nav className="glass border-b border-saffron-500/20 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 no-print transition-colors">
      <div className="flex items-center gap-3">
        {currentUser && currentUser.role === "admin" && (
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-2 text-slate-300 hover:text-saffron-500 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/staff")}>
          {Boolean(currentUser?.hotelLogo && currentUser.hotelLogo.trim()) && (
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 overflow-hidden flex items-center justify-center p-1 shadow-md shrink-0">
              <img src={currentUser.hotelLogo} alt={currentUser?.hotelName || "Hotel Logo"} className="w-full h-full object-contain rounded-lg" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold font-display tracking-tight text-slate-100 leading-none uppercase">
              {currentUser?.hotelName?.replace("Zoox", "Sapphire Inn") || "Sapphire Inn"}
            </h1>
            <p className="text-[10px] text-saffron-500 font-bold tracking-widest uppercase hidden sm:block mt-0.5">
              Staff Operations Desk
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-saffron-500/10 border border-saffron-500/30 flex items-center justify-center text-saffron-500">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left flex flex-col">
                <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-saffron-500 uppercase font-bold tracking-wider">
                    {currentUser.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentUser && currentUser.role === "staff" && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-xl mr-2">
              <button
                onClick={() => navigate("/staff")}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  window.location.pathname === "/staff"
                    ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Dashboard
              </button>
              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <button
                  onClick={() => navigate("/staff/rooms")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/rooms"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Room Booking
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <button
                  onClick={() => navigate("/staff/kot")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/kot"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  KOT Billing
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <button
                  onClick={() => navigate("/staff/grc")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/grc"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Print GRC
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => navigate("/staff/kds")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/kds"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  KDS
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => navigate("/staff/hall-display")}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    window.location.pathname === "/staff/hall-display"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Hall Display
                </button>
              )}
            </div>
          )}

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-saffron-500 hover:border-saffron-500/30 transition-all flex items-center justify-center active:scale-95 no-print"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-lagoon-700" /> : <Sun className="w-4 h-4 text-saffron-400" />}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 hover:from-red-900 hover:to-red-800 text-red-200 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        {currentUser && (
          <button 
            onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)} 
            className="md:hidden p-2 text-slate-300 hover:text-saffron-500 hover:bg-slate-800/50 rounded-xl transition-colors"
          >
            {isStaffMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isStaffMenuOpen && currentUser && (
        <div className="absolute top-[68px] left-0 right-0 glass border-b border-saffron-500/20 p-4 flex flex-col gap-3 z-50 md:hidden shadow-2xl animate-fade-in backdrop-blur-2xl">
          {/* User Info inside menu */}
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-xl mb-1">
            <div className="w-10 h-10 rounded-lg bg-saffron-500/10 border border-saffron-500/30 flex items-center justify-center text-saffron-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left flex flex-col">
              <p className="text-base font-semibold text-slate-200">{currentUser.name}</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-saffron-500 uppercase font-bold tracking-wider">
                  {currentUser.role}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Nav Links */}
          {currentUser.role === "staff" && (
            <div className="flex flex-col gap-2 mb-1 border-b border-slate-800/50 pb-4 mt-2">
              <button
                onClick={() => { navigate("/staff"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  window.location.pathname === "/staff"
                    ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <FileText className="w-5 h-5 text-saffron-400" />
                Staff Dashboard
              </button>
              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <button
                  onClick={() => { navigate("/staff/rooms"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/rooms"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <BedDouble className="w-5 h-5 text-saffron-400" />
                  Room Booking
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <button
                  onClick={() => { navigate("/staff/kot"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/kot"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Utensils className="w-5 h-5 text-saffron-400" />
                  KOT Billing
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <button
                  onClick={() => { navigate("/staff/grc"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/grc"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <FileText className="w-5 h-5 text-saffron-400" />
                  Print GRC
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => { navigate("/staff/kds"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/kds"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Utensils className="w-5 h-5 text-saffron-400" />
                  KDS (Kitchen)
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => { navigate("/staff/hall-display"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    window.location.pathname === "/staff/hall-display"
                      ? "bg-saffron-500/20 text-saffron-400 border border-saffron-500/30 font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Utensils className="w-5 h-5 text-saffron-400" />
                  Hall Display
                </button>
              )}
            </div>
          )}

          {/* Theme & Logout */}
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:text-saffron-500 transition-all"
            >
              {theme === "light" ? <Moon className="w-5 h-5 text-lagoon-700" /> : <Sun className="w-5 h-5 text-saffron-400" />}
              <span className="font-medium text-sm">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-950 to-red-900 border border-red-800/40 hover:from-red-900 text-red-200 font-medium rounded-xl transition-all shadow-sm"
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
