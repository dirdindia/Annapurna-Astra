import React, { useState } from "react";
import { LogOut, User, Sun, Moon, Menu, X, Utensils, BedDouble, FileText, Tv, ChefHat } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import MagneticButton from "./MagneticButton";

export default function Navbar({ currentUser, onLogout, theme, toggleTheme, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isStaffMenuOpen, setIsStaffMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`border-b px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40 no-print transition-colors duration-200 ${
      theme === "light"
        ? "bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-sm"
        : "glass border-lagoon-700/25"
    }`}>
      {/* Brand / Logo */}
      <div className="flex items-center gap-3">
        {currentUser && currentUser.role === "admin" && (
          <MagneticButton>
            <button 
              onClick={toggleSidebar} 
              className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer ${
                theme === "light"
                  ? "text-slate-700 hover:text-saffron-600 hover:bg-slate-100"
                  : "text-slate-300 hover:text-saffron-500 hover:bg-lagoon-800/40"
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </MagneticButton>
        )}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/staff")}>
          {Boolean(currentUser?.hotelLogo && currentUser.hotelLogo.trim()) ? (
            <div className={`w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center p-1 shadow-md shrink-0 ${
              theme === "light" ? "bg-white border-slate-200" : "bg-slate-900 border-slate-700/60"
            }`}>
              <img src={currentUser.hotelLogo} alt={currentUser?.hotelName || "Hotel Logo"} className="w-full h-full object-contain rounded-lg" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-saffron-500/20 border border-saffron-500/40 flex items-center justify-center shadow-md shrink-0">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-6 h-6 rounded-lg" />
            </div>
          )}
          <div>
            <h1 className={`text-xl font-bold font-display tracking-tight leading-none uppercase group-hover:text-amber-500 transition-colors ${
              theme === "light" ? "text-slate-900" : "text-white"
            }`}>
              {currentUser?.hotelName || "Annapurna Astra"}
            </h1>
            <p className={`text-[10px] font-bold tracking-widest uppercase hidden sm:block mt-1 ${
              theme === "light" ? "text-saffron-700" : "text-saffron-400"
            }`}>
              Staff Operations Desk
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Links & User Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden md:flex items-center gap-3">
          {currentUser && currentUser.role === "staff" && (
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${
              theme === "light"
                ? "bg-slate-100/90 border-slate-200"
                : "bg-slate-900/60 border-slate-800/80"
            }`}>
              <MagneticButton>
                <button
                  onClick={() => navigate("/staff")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive("/staff")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Dashboard
                </button>
              </MagneticButton>

              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <MagneticButton>
                  <button
                    onClick={() => navigate("/staff/rooms")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive("/staff/rooms")
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                        : theme === "light"
                        ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Room Booking
                  </button>
                </MagneticButton>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <MagneticButton>
                  <button
                    onClick={() => navigate("/staff/kot")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive("/staff/kot")
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                        : theme === "light"
                        ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    KOT Billing
                  </button>
                </MagneticButton>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <MagneticButton>
                  <button
                    onClick={() => navigate("/staff/grc")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive("/staff/grc")
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                        : theme === "light"
                        ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Print GRC
                  </button>
                </MagneticButton>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <MagneticButton>
                  <button
                    onClick={() => navigate("/staff/kds")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive("/staff/kds")
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                        : theme === "light"
                        ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    KDS (Kitchen)
                  </button>
                </MagneticButton>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <MagneticButton>
                  <button
                    onClick={() => navigate("/staff/hall-display")}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive("/staff/hall-display")
                        ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md shadow-saffron-500/20"
                        : theme === "light"
                        ? "text-slate-700 hover:text-slate-950 hover:bg-slate-200/70"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Hall Display
                  </button>
                </MagneticButton>
              )}
            </div>
          )}

          {/* User Badge - Light & Dark Mode High-Contrast Optimized */}
          {currentUser && (
            <div className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all ${
              theme === "light"
                ? "bg-slate-100/90 border-slate-200/90 shadow-sm"
                : "bg-slate-900/70 border-slate-800"
            }`}>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold shrink-0 ${
                theme === "light"
                  ? "bg-saffron-500/15 border-saffron-500/30 text-saffron-700"
                  : "bg-saffron-500/20 border-saffron-500/40 text-saffron-400"
              }`}>
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left flex flex-col">
                <p className={`text-xs font-black leading-tight ${
                  theme === "light" ? "text-slate-900" : "text-white"
                }`}>
                  {currentUser.name}
                </p>
                <p className={`text-[10px] uppercase font-black tracking-wider leading-tight ${
                  theme === "light" ? "text-saffron-700" : "text-saffron-400"
                }`}>
                  {currentUser.role}
                </p>
              </div>
            </div>
          )}

          {/* Theme Toggle with Magnetic Effect */}
          <MagneticButton>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center active:scale-95 no-print cursor-pointer ${
                theme === "light"
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                  : "bg-slate-900/70 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-400/30"
              }`}
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4 text-lagoon-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </MagneticButton>

          {/* Logout Button with Magnetic Effect */}
          <MagneticButton>
            <button
              onClick={onLogout}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm cursor-pointer active:scale-95 border ${
                theme === "light"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-red-500/40 shadow-red-500/10"
                  : "bg-gradient-to-r from-red-950 to-red-900 border-red-800/40 hover:from-red-900 hover:to-red-800 text-red-200"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </MagneticButton>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        {currentUser && (
          <MagneticButton>
            <button 
              onClick={() => setIsStaffMenuOpen(!isStaffMenuOpen)} 
              className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer ${
                theme === "light"
                  ? "text-slate-700 hover:text-saffron-600 hover:bg-slate-100"
                  : "text-slate-300 hover:text-saffron-500 hover:bg-slate-800/50"
              }`}
            >
              {isStaffMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </MagneticButton>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isStaffMenuOpen && currentUser && (
        <div className={`absolute top-[64px] left-0 right-0 border-b p-4 flex flex-col gap-3 z-50 md:hidden shadow-2xl animate-fade-in backdrop-blur-2xl ${
          theme === "light"
            ? "bg-white/95 border-slate-200 text-slate-900"
            : "glass border-saffron-500/20 text-white"
        }`}>
          {/* User Info inside mobile menu */}
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-1 border ${
            theme === "light"
              ? "bg-slate-100/90 border-slate-200/90 shadow-sm"
              : "bg-slate-900/70 border-slate-800"
          }`}>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              theme === "light"
                ? "bg-saffron-500/15 border-saffron-500/30 text-saffron-700"
                : "bg-saffron-500/20 border-saffron-500/40 text-saffron-400"
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div className="text-left flex flex-col">
              <p className={`text-sm font-black ${
                theme === "light" ? "text-slate-900" : "text-white"
              }`}>
                {currentUser.name}
              </p>
              <p className={`text-[10px] uppercase font-black tracking-wider ${
                theme === "light" ? "text-saffron-700" : "text-saffron-400"
              }`}>
                {currentUser.role}
              </p>
            </div>
          </div>

          {/* Staff Nav Links */}
          {currentUser.role === "staff" && (
            <div className={`flex flex-col gap-2 mb-1 pb-4 mt-2 border-b ${
              theme === "light" ? "border-slate-200" : "border-slate-800/50"
            }`}>
              <button
                onClick={() => { navigate("/staff"); setIsStaffMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                  isActive("/staff")
                    ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                    : theme === "light"
                    ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                }`}
              >
                <FileText className="w-4 h-4" />
                Staff Dashboard
              </button>
              {(!currentUser.staffPermissions || currentUser.staffPermissions.roomBooking) && (
                <button
                  onClick={() => { navigate("/staff/rooms"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                    isActive("/staff/rooms")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <BedDouble className="w-4 h-4" />
                  Room Booking
                </button>
              )}
              {(!currentUser.staffPermissions || currentUser.staffPermissions.kot) && (
                <button
                  onClick={() => { navigate("/staff/kot"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                    isActive("/staff/kot")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  KOT Billing
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.grc) && (
                <button
                  onClick={() => { navigate("/staff/grc"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                    isActive("/staff/grc")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Print GRC
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => { navigate("/staff/kds"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                    isActive("/staff/kds")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  KDS (Kitchen)
                </button>
              )}

              {(!currentUser.staffPermissions || currentUser.staffPermissions.restaurant) && (
                <button
                  onClick={() => { navigate("/staff/hall-display"); setIsStaffMenuOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-xs font-bold ${
                    isActive("/staff/hall-display")
                      ? "bg-gradient-to-r from-saffron-500 to-amber-500 text-slate-950 font-black shadow-md"
                      : theme === "light"
                      ? "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-slate-900/60"
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  Hall Display
                </button>
              )}
            </div>
          )}

          {/* Theme & Logout on mobile with Magnetic Effect */}
          <div className="flex items-center gap-3 mt-2">
            <MagneticButton className="flex-1">
              <button
                onClick={toggleTheme}
                className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  theme === "light"
                    ? "bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200"
                    : "bg-slate-900/70 border-slate-800 text-slate-300 hover:text-amber-400"
                }`}
              >
                {theme === "light" ? <Moon className="w-4 h-4 text-lagoon-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </MagneticButton>
            
            <MagneticButton className="flex-1">
              <button
                onClick={onLogout}
                className={`w-full flex items-center justify-center gap-2 p-3 font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer border ${
                  theme === "light"
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500/40"
                    : "bg-gradient-to-r from-red-950 to-red-900 border-red-800/40 text-red-200"
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </MagneticButton>
          </div>
        </div>
      )}
    </nav>
  );
}
