import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  ChefHat, 
  Zap, 
  Eye, 
  EyeOff, 
  KeyRound,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import StaffLogin3DCanvas from '../components/StaffLogin3DCanvas';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post("api/auth/login", { email, password });
      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        onLoginSuccess(user);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page min-h-screen flex bg-[#FAFAF6] font-sans selection:bg-amber-400 selection:text-slate-900">
      
      {/* Left side - 3D Visual Experience (Central Order Halo, Orbiting Service Gems, Ambient Stardust) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A2F2F] via-[#072424] to-[#0A2F2F] items-center justify-center p-12 text-white border-r border-teal-500/10">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-teal-500/20 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 3D WebGL Scene */}
        <StaffLogin3DCanvas />

        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            {/* Frosted glass logo container */}
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl mb-8 shadow-2xl border border-white/15 flex items-center justify-center">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-24 h-24 rounded-2xl drop-shadow-md" />
            </div>

            {/* Pure white brand title */}
            <h1 
              style={{ color: '#FFFFFF' }} 
              className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight font-display !text-white"
            >
              Annapurna Astra
            </h1>
            
            <p className="text-base text-teal-100/80 leading-relaxed font-light mb-8 max-w-md mx-auto">
              Kitchen Display (KDS), High-speed KOT billing, table orders aur shift operations ka real-time staff command desk.
            </p>

            {/* Quick trust metrics */}
            <div className="flex items-center justify-center gap-6 text-xs text-teal-100/70 border-t border-white/10 pt-6 w-full max-w-sm">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span>Instant KDS</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Ultra-Fast KOT</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Role Security</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Modern Glassmorphic Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        
        {/* Subtle background ambient blur for right side */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-400/10 blur-[100px]" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-md bg-white/95 rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl backdrop-blur-xl relative"
        >
          {/* Top Amber-Saffron Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-t-3xl" />

          <div className="mb-8 text-center sm:text-left">
            <div className="lg:hidden mx-auto mb-5 flex justify-center">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-16 h-16 shadow-xl rounded-2xl" />
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              <Users size={14} />
              <span>Staff & Operations Desk</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Staff Sign In</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Apne registered staff email aur password se login karein</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }} 
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm flex items-center gap-2 border border-red-100 shadow-sm overflow-hidden"
              >
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Staff Work Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="login-input block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all !text-slate-900 placeholder:text-slate-400 font-medium focus:scale-[1.01]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="waiter@hotel.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-xs text-slate-400">Shift security pin</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="login-input block w-full pl-11 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all !text-slate-900 placeholder:text-slate-400 font-medium focus:scale-[1.01]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-400/20 shadow-xl shadow-amber-400/25 transition-all disabled:opacity-70 gap-2 cursor-pointer"
              >
                {loading ? "Signing in..." : "Access Operations Desk"} 
                {!loading && <ArrowRight className="w-4 h-4 transition-transform" />}
              </motion.button>
            </div>
          </form>

          {/* Quick link to Hotel Admin & Registration */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-2 text-center text-xs text-slate-500">
            <p>
              Hotel Owner or Front Office?{' '}
              <a href="http://localhost:5174/login" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                Hotel Admin Login
              </a>
            </p>
            <p>
              Need a new account?{' '}
              <a href="http://localhost:5173/register" className="font-medium text-slate-600 hover:text-amber-600 hover:underline">
                Register property on Annapurna Astra
              </a>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
