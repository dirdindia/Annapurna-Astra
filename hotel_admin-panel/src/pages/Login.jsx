import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Sparkles, ShieldCheck, Hotel, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import HotelLogin3DCanvas from '../components/HotelLogin3DCanvas';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      
      {/* Left side - Hotel 3D Experience (Reception Bell, Cloche, Stars) with Pure White Title */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A2F2F] via-[#072424] to-[#0A2F2F] items-center justify-center p-12 text-white">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 3D WebGL Scene: Floating Reception Bell + Chef Cloche + Orbiting Stars (NO Card) */}
        <HotelLogin3DCanvas />

        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            {/* Centered Logo in frosted glass container */}
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl mb-8 shadow-2xl border border-white/15 flex items-center justify-center">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-24 h-24 rounded-2xl drop-shadow-md" />
            </div>

            {/* Annapurna Astra in clean pure white (immune to CSS theme overrides) */}
            <h1 
              style={{ color: '#FFFFFF' }} 
              className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight font-display !text-white"
            >
              Annapurna Astra
            </h1>
            
            <p className="text-base text-teal-100/80 leading-relaxed font-light mb-8 max-w-md mx-auto">
              Reception se rasoi tak, front desk, room reservations aur restaurant POS ka real-time command center.
            </p>

            {/* Quick trust metrics */}
            <div className="flex items-center justify-center gap-6 text-xs text-teal-100/70 border-t border-white/10 pt-6 w-full max-w-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-bit Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <Hotel className="w-4 h-4 text-amber-400" />
                <span>Multi-Room Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Modern Glassmorphic Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        
        {/* Subtle background ambient blur for right side */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-amber-400/10 blur-[100px]" />

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-md bg-white/95 rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl backdrop-blur-xl relative"
        >
          {/* Top Amber Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-t-3xl" />

          <div className="mb-8 text-center sm:text-left">
            <div className="lg:hidden mx-auto mb-5 flex justify-center">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-16 h-16 shadow-xl rounded-2xl" />
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              <KeyRound size={14} />
              <span>Hotel Administrator</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Welcome Back</h2>
            <p className="text-slate-500 mt-1.5 text-sm">Apne registered hotel email aur password se login karein</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm flex items-center gap-2 border border-red-100 shadow-sm"
            >
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Work Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="login-input block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all !text-slate-900 placeholder:text-slate-400 font-medium focus:scale-[1.01]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourhotel.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  className="login-input block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all !text-slate-900 placeholder:text-slate-400 font-medium focus:scale-[1.01]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
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
                {loading ? "Signing in..." : "Sign In to Dashboard"} 
                {!loading && <ArrowRight className="w-4 h-4 transition-transform" />}
              </motion.button>
            </div>
          </form>

          {/* Quick link to main landing website */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New property?{' '}
              <a href="http://localhost:5173/register" className="font-bold text-amber-600 hover:text-amber-700 hover:underline">
                Register hotel for 14 days free
              </a>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
