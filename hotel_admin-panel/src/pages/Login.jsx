import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Hotel, 
  KeyRound, 
  X, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import HotelLogin3DCanvas from '../components/HotelLogin3DCanvas';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP + New Password, 3 = Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for OTP Resend
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

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

  // Open Forgot Modal
  const openForgotModal = (e) => {
    if (e) e.preventDefault();
    setForgotEmail(email || '');
    setForgotStep(1);
    setForgotError('');
    setForgotSuccessMsg('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setShowForgotModal(true);
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await api.post("api/auth/forgot-password", { email: forgotEmail });
      if (res.data.success) {
        setForgotStep(2);
        setResendTimer(60);
        setForgotSuccessMsg(res.data.message || "OTP aapke email par bhej diya gaya hai.");
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || "OTP bhejne me samasya aayi. Kripya apna registered email check karein.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (newPassword.length < 6) {
      setForgotError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords match nahi ho rahe hain. Kripya dono me same password daalein.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post("api/auth/reset-password-with-otp", {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword,
      });

      if (res.data.success) {
        setForgotStep(3);
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || "Failed to reset password. Kripya OTP dobara check karein.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || forgotLoading) return;
    setForgotError('');
    setForgotLoading(true);

    try {
      const res = await api.post("api/auth/forgot-password", { email: forgotEmail });
      if (res.data.success) {
        setResendTimer(60);
        setForgotSuccessMsg("Naya 6-digit OTP email par dobara bhej diya gaya hai.");
      }
    } catch (err) {
      setForgotError(err.response?.data?.message || "OTP resend karne me samasya aayi.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Complete and back to login
  const handleFinishReset = () => {
    setEmail(forgotEmail);
    setPassword('');
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
  };

  return (
    <div className="login-page min-h-screen flex bg-[#FAFAF6] font-sans selection:bg-amber-400 selection:text-slate-900">
      
      {/* Left side - Hotel 3D Experience (Reception Bell, Cloche, Stars) with Pure White Title */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0A2F2F] via-[#072424] to-[#0A2F2F] items-center justify-center p-12 text-white">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 3D WebGL Scene: Floating Reception Bell + Chef Cloche + Orbiting Stars */}
        <HotelLogin3DCanvas />

        <div className="relative z-10 text-center max-w-lg flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-center"
          >
            {/* Centered Logo in frosted glass container */}
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl mb-8 shadow-2xl border border-white/15 flex items-center justify-center overflow-hidden">
              <img src="/e-annapurna-logo.jpeg" alt="E-Annapurna Logo" className="w-24 h-24 rounded-2xl drop-shadow-md object-contain" />
            </div>

            <h1 
              style={{ color: '#FFFFFF' }} 
              className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight font-display !text-white"
            >
              E-Annapurna
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
          <div className="mb-8 text-center sm:text-left">
            <div className="lg:hidden mx-auto mb-5 flex justify-center">
              <img src="/e-annapurna-logo.jpeg" alt="E-Annapurna Logo" className="w-16 h-16 shadow-xl rounded-2xl object-contain bg-white/10 p-2" />
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
              <AlertCircle className="w-4 h-4 shrink-0" />
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
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
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

      {/* ================= FORGOT PASSWORD MODAL (EMAIL OTP VERIFICATION) ================= */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative"
            >
              {/* Modal Top Header */}
              <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/20">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">
                      Reset Password
                    </h3>
                    <p className="text-xs text-slate-500">
                      {forgotStep === 1 && "Step 1 of 2: Registered Email"}
                      {forgotStep === 2 && "Step 2 of 2: Enter OTP & New Password"}
                      {forgotStep === 3 && "Password Successfully Reset"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7">
                {/* Error Banner */}
                {forgotError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {forgotSuccessMsg && forgotStep !== 3 && (
                  <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {/* ----------------- STEP 1: ENTER REGISTERED EMAIL ----------------- */}
                {forgotStep === 1 && (
                  <form onSubmit={handleRequestOtp} className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Apna registered hotel work email enter karein. Hum aapko ek <strong>6-digit verification code (OTP)</strong> bhejenge.
                    </p>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="admin@yourhotel.com"
                          className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending OTP to Mail...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ----------------- STEP 2: ENTER OTP & NEW PASSWORD ----------------- */}
                {forgotStep === 2 && (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                      <span className="truncate">
                        Code sent to: <strong>{forgotEmail}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotError('');
                        }}
                        className="text-amber-700 font-bold hover:underline shrink-0 ml-2"
                      >
                        Change
                      </button>
                    </div>

                    {/* 6-Digit OTP Input */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                          6-Digit OTP Code
                        </label>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendTimer > 0 || forgotLoading}
                          className="text-[11px] font-bold text-amber-600 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                        >
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="block w-full py-3 px-4 text-center tracking-[8px] font-mono text-xl font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter at least 6 characters"
                          className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verify & Reset Password</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ----------------- STEP 3: SUCCESS ----------------- */}
                {forgotStep === 3 && (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        Password Reset Successful!
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        Aapka password safaltapoorvak change ho gaya hai. Ab aap naye password se login kar sakte hain.
                      </p>
                    </div>

                    <button
                      onClick={handleFinishReset}
                      className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-transform active:scale-95 cursor-pointer"
                    >
                      Sign In Now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
