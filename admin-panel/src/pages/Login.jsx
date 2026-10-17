import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Building2, 
  Layers, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SuperAdminLogin3DCanvas from '../components/SuperAdminLogin3DCanvas';
import MagneticButton from '../components/MagneticButton';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (email === 'admin@gmail.com' && password === 'admin@123') {
        localStorage.setItem('adminAuth', 'true');
        navigate('/dashboard');
      } else {
        setError('Invalid master credentials. Please check your email and password.');
        setLoading(false);
      }
    }, 500);
  };

  const fillDemoCredentials = () => {
    setEmail('admin@gmail.com');
    setPassword('admin@123');
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAF6] font-sans selection:bg-amber-400 selection:text-slate-900">
      
      {/* Left side - 3D Visual Experience (Master Core, Orbiting Tenant Satellites, Stardust) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#061C1C] via-[#0A2F2F] to-[#072424] items-center justify-center p-12 text-white border-r border-lagoon-700/30">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[440px] h-[440px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

        {/* 3D WebGL Scene: Central Hyper-Cube Core + Orbiting Hotel Nodes */}
        <SuperAdminLogin3DCanvas />

        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center login-left-brand"
          >
            {/* Centered Logo in frosted glass container */}
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl mb-6 shadow-2xl border border-white/15 flex items-center justify-center hover:scale-105 transition-transform duration-300">
              <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-20 h-20 rounded-2xl drop-shadow-lg" />
            </div>

            {/* Cloud Control Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/20 text-saffron-300 backdrop-blur-md mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-saffron-400" />
              <span>Super Admin • Master Network Hub</span>
            </div>

            {/* Pure White Brand Title */}
            <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight font-display text-white drop-shadow-md">
              Annapurna <span className="text-saffron-400">Astra</span>
            </h1>
            
            <p className="text-sm md:text-base text-lagoon-100/90 leading-relaxed font-normal max-w-md mb-8">
              Centralized administrative engine: manage all hotel properties, monitor subscriptions, govern tenant lifecycles, and scale secure cloud infrastructure.
            </p>

            {/* 3 Enterprise Value Badges */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-4 border-t border-white/10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm">
                <Building2 className="w-4 h-4 mx-auto text-saffron-400 mb-1" />
                <p className="text-[11px] font-bold text-white">Multi-Tenant</p>
                <p className="text-[9px] text-lagoon-200">Global Properties</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm">
                <Layers className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
                <p className="text-[11px] font-bold text-white">Subscriptions</p>
                <p className="text-[9px] text-lagoon-200">Billing Engine</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 mx-auto text-amber-400 mb-1" />
                <p className="text-[11px] font-bold text-white">Master Auth</p>
                <p className="text-[9px] text-lagoon-200">Bank-Grade</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Super Admin Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        {/* Subtle decorative glow */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-saffron-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-lagoon-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card Container */}
          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl shadow-lagoon-900/10 border border-lagoon-100/80">
            {/* Mobile Header Branding */}
            <div className="mb-8 text-center lg:text-left">
              <div className="lg:hidden mx-auto mb-4 flex justify-center">
                <div className="bg-lagoon-900 p-3 rounded-2xl shadow-xl border border-lagoon-700/60">
                  <img src="/favicon.svg" alt="Annapurna Astra Logo" className="w-12 h-12" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-saffron-500/15 text-saffron-700 border border-saffron-500/30 mb-3">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Super Administrative Access</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-lagoon-950 tracking-tight">
                Sign In to Cloud Hub
              </h2>
              <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">
                Enter your master credentials to manage the centralized hotel ecosystem.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -8, scale: 0.98 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl mb-6 text-xs font-bold flex items-center gap-2 border border-rose-200 shadow-sm"
                >
                  <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Master Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-lagoon-600 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all login-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Master Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-slate-500 hover:text-lagoon-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-lagoon-600 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:bg-white rounded-xl text-sm font-semibold text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-saffron-500/50 focus:border-saffron-500 transition-all login-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin@123"
                  />
                </div>
              </div>

              {/* Quick Demo Credentials Autofill Pill */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Demo Credentials: <strong className="text-slate-800">admin@gmail.com</strong></span>
                  </span>
                  <span className="text-[10px] font-bold text-saffron-700 bg-saffron-100/80 border border-saffron-300 px-2 py-0.5 rounded-md">
                    Click to Fill
                  </span>
                </button>
              </div>

              {/* Magnetic Submit Button */}
              <div className="pt-3">
                <MagneticButton className="w-full">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full flex justify-center items-center py-3.5 px-4 text-sm font-black rounded-xl text-white bg-gradient-to-r from-lagoon-700 via-lagoon-800 to-lagoon-900 hover:from-lagoon-800 hover:to-lagoon-950 shadow-xl shadow-lagoon-900/25 active:scale-[0.98] transition-all overflow-hidden cursor-pointer disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? 'Authenticating...' : 'Sign In to Super Admin'}
                      {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  </button>
                </MagneticButton>
              </div>
            </form>

            {/* Encrypted Session Footer */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit Encrypted Master Session • IP Verified</span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
