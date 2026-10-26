import { useState, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Sparkles, Building2, ShieldCheck, Clock, ArrowRight, Gift } from 'lucide-react'
import { api, showToast } from '../api'

const Register3DScene = lazy(() => import('../components/Register3DScene'))

const initial = { hotel: '', owner: '', email: '', phone: '', city: '', type: 'Hotel', password: '' }

export default function Register() {
  const [searchParams] = useSearchParams()
  const requestedPlan = searchParams.get('plan') || 'Trial'
  const isTrial = requestedPlan === 'Trial' || requestedPlan === '7-Day Free Trial'

  const [form, setForm] = useState(initial)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        plan: requestedPlan,
        claimTrial: isTrial,
      }
      const res = await api.post('/auth/register-hotel', payload);
      if (res.data.success) {
        showToast(isTrial ? '7-Day Free Trial activated successfully!' : 'Hotel registered successfully!');
        setDone(true);
      } else {
        showToast(res.data.message || 'Error registering hotel', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Network error', 'error');
    } finally {
      setLoading(false)
    }
  }

  if (done)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center bg-linen">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border border-lagoon-900/10 bg-white p-10 shadow-2xl max-w-md"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-extrabold text-lagoon-900 font-display">{form.hotel} register ho gaya!</h1>
          <p className="mt-3 text-lagoon-900/70 font-sans">
            Aapka hotel account create ho gaya hai. Ab portal mein sign in karke apna <b className="text-emerald-700">7-din ka Free Trial claim karein</b> aur software chalana shuru karein.
          </p>
          <a href="http://localhost:5174/login" className="btn btn-primary mt-8 w-full py-3.5 text-base font-bold shadow-lg shadow-saffron-500/30 flex items-center justify-center gap-2">
            Sign in to Hotel Portal <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>
    )

  return (
    <div className="grid min-h-screen lg:grid-cols-12 bg-linen">
      
      {/* LEFT SECTION (Interactive 3D Scene + Glowing Aesthetics) */}
      <aside className="relative hidden bg-gradient-to-br from-lagoon-900 via-[#072424] to-lagoon-900 p-12 text-white lg:col-span-5 lg:flex lg:flex-col lg:justify-between overflow-hidden shadow-2xl">
        
        {/* Background Glowing Orbs */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-saffron-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-lagoon-500/20 blur-3xl" />

        {/* 3D Interactive Hotel Keycard Canvas */}
        <Suspense fallback={null}>
          <Register3DScene />
        </Suspense>

        {/* Brand Header */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <img src="/e-annapurna-logo.jpeg" alt="E-Annapurna Logo" className="h-9 w-auto object-contain rounded-lg transition-transform group-hover:scale-105" />
            <span className="font-display text-2xl font-bold tracking-tight">
              E-<span className="text-saffron-500">Annapurna</span>
            </span>
          </Link>
        </div>

        {/* Middle Value Proposition */}
        <div className="relative z-10 my-auto py-12 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-saffron-400/30 bg-saffron-400/10 px-3.5 py-1 text-xs font-semibold text-saffron-300 backdrop-blur-md mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-saffron-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Instant Access</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-extrabold leading-tight font-display"
          >
            7 din free trial. <br />
            <span className="text-saffron-400">Card ki zaroorat nahi.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lagoon-100/80 leading-relaxed font-sans text-base"
          >
            Apna hotel register karo aur aaj hi check-in, restaurant POS aur automated KOT chalana shuru karo.
          </motion.p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-lagoon-100/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-saffron-400 border border-white/10">
                <Clock size={16} />
              </div>
              <span>Setup takes only 2 minutes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-lagoon-100/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-400 border border-white/10">
                <ShieldCheck size={16} />
              </div>
              <span>No credit card or payment upfront</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-lagoon-100/90">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sky-400 border border-white/10">
                <Building2 size={16} />
              </div>
              <span>Built for hotels, resorts & restaurants</span>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-lagoon-100/50">© E-Annapurna · All rights reserved</p>
      </aside>

      {/* RIGHT SECTION: MODERN INTERACTIVE FORM WITH MICRO-EFFECTS */}
      <div className="flex items-center justify-center px-5 py-12 lg:col-span-7 sm:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl rounded-3xl border border-lagoon-900/10 bg-white/95 p-8 sm:p-10 shadow-xl backdrop-blur-xl relative overflow-hidden"
        >
          {/* Subtle top saffron accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-saffron-400 via-amber-400 to-saffron-500" />

          <div className="mb-8">
            {isTrial ? (
              <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold">
                <Gift className="w-4 h-4 text-emerald-600" />
                <span>🎁 7 Din Ka Free Trial Plan Included (₹0 Cost)</span>
              </div>
            ) : (
              <div className="mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-saffron-500/10 border border-saffron-500/30 text-saffron-800 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-saffron-600" />
                <span>Selected Plan: {requestedPlan}</span>
              </div>
            )}
            <h1 className="text-3xl font-extrabold text-lagoon-900 font-display">Hotel registration</h1>
            <p className="mt-1 text-sm text-lagoon-900/70 font-sans">
              {isTrial 
                ? 'Apne hotel ki basic details bharein aur 7 din ka free trial shuru karein.'
                : 'Apne hotel ki basic details bharein aur setup shuru karein.'}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            
            {/* Hotel Name */}
            <div className="group">
              <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Hotel Name</label>
              <input 
                required 
                name="hotel" 
                value={form.hotel} 
                onChange={change} 
                className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                placeholder="e.g. Grand Heritage Palace" 
              />
            </div>

            {/* Owner & Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Owner Name</label>
                <input 
                  required 
                  name="owner" 
                  value={form.owner} 
                  onChange={change} 
                  className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                  placeholder="e.g. Rajesh Kumar" 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Mobile Number</label>
                <input 
                  required 
                  name="phone" 
                  value={form.phone} 
                  onChange={change} 
                  className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                  placeholder="+91 98765 43210" 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Work Email</label>
              <input 
                required 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={change} 
                className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                placeholder="manager@yourhotel.com" 
              />
            </div>

            {/* City & Property Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">City</label>
                <input 
                  required 
                  name="city" 
                  value={form.city} 
                  onChange={change} 
                  className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                  placeholder="e.g. Jaipur, Manali" 
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Property Type</label>
                <select 
                  name="type" 
                  value={form.type} 
                  onChange={change} 
                  className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40 bg-white"
                >
                  {['Hotel', 'Resort', 'Guest house', 'Restaurant only'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-lagoon-900/70 mb-1.5 block">Account Password</label>
              <input 
                required 
                type="password" 
                minLength="6" 
                name="password" 
                value={form.password} 
                onChange={change} 
                className="input transition-all duration-200 focus:scale-[1.01] hover:border-lagoon-500/40" 
                placeholder="Kam se kam 6 akshar" 
              />
            </div>

            {/* Submit Button with Hover Lift & Glow */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="btn btn-primary mt-3 py-3.5 text-base font-bold shadow-xl shadow-saffron-500/25 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating hotel account...' : 'Create free account'}
              {!loading && <ArrowRight size={18} />}
            </motion.button>

            <p className="mt-2 text-center text-sm text-lagoon-900/70">
              Pehle se account hai?{' '}
              <a href="http://localhost:5174/login" className="font-bold text-saffron-600 hover:text-saffron-700 underline underline-offset-4">
                Hotel Portal me Sign in karein
              </a>
            </p>
          </form>
        </motion.div>
      </div>

    </div>
  )
}
