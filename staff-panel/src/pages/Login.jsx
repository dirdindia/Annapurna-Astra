import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';

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
    <div className="min-h-screen flex font-sans">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="login-left-brand hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-lagoon-950 via-lagoon-900 to-lagoon-950 items-center justify-center border-r border-saffron-500/10">
        {/* Abstract shapes & glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30 pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-lagoon-600 blur-[130px]"></div>
          <div className="absolute top-[60%] left-[50%] w-[50%] h-[50%] rounded-full bg-saffron-500 blur-[110px]"></div>
        </div>
        
        <div className="relative z-10 p-12 text-center text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="bg-saffron-500/10 p-3 rounded-3xl backdrop-blur-md inline-block mb-8 shadow-2xl border border-saffron-500/20">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-20 h-20 rounded-2xl" />
            </div>
            <h1 className="text-5xl font-black mb-4 tracking-tight font-display !text-white" style={{ color: '#ffffff !important' }}>
              Annapurna Astra
            </h1>
            <p className="text-xs uppercase tracking-widest text-saffron-400 font-bold mb-6">Staff Operations Desk</p>
            <p className="text-base text-white/90 leading-relaxed font-normal" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              High-speed billing, KOT routing, digital room bookings, and operational efficiency for modern hoteliers.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden mx-auto mb-6 flex justify-center">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-16 h-16 shadow-2xl rounded-2xl" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-100 tracking-tight">Staff Sign In</h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">Access your shift orders, KOT & booking desks</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-red-500/10 text-red-300 p-4 rounded-xl mb-6 text-sm flex border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Staff Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-saffron-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-saffron-500/60 transition-all placeholder:text-slate-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hotel.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-saffron-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:border-saffron-500/60 transition-all placeholder:text-slate-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-lagoon-950 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 focus:outline-none shadow-lg shadow-saffron-500/20 active:scale-95 transition-all overflow-hidden disabled:opacity-70"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? "Signing in..." : "Access Operations Desk"} 
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
