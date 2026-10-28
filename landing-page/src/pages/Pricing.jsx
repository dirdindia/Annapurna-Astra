import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, Building2, UtensilsCrossed, Layers, ShieldCheck, Headphones, Gift, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { plans } from '../data/content'

const Subpage3DCanvas = lazy(() => import('../components/Subpage3DCanvas'))

export default function Pricing() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] py-20 bg-gradient-to-b from-lagoon-900 via-[#072424] to-lagoon-900 overflow-hidden flex flex-col justify-center">
      {/* 3D Canvas Background */}
      <Suspense fallback={null}>
        <Subpage3DCanvas />
      </Suspense>

      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-500/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container-x relative z-10 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-saffron-500/10 border border-saffron-400/30 text-saffron-400 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Sparkles size={14} /> Special Offer: Flat ₹1,000 OFF On All Plans • All Prices With GST
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-display text-white mb-5 tracking-tight"
          >
            Simple pricing, no hidden costs.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-base md:text-lg text-lagoon-100/80 leading-relaxed"
          >
            Pehle 7 din bilkul free chalao, ya limited-time ₹1,000 offer discount ke sath apna perfect monthly plan chunein.
          </motion.p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
          {plans.map((p, index) => {
            const isCombo = p.popular
            const isTrial = p.isTrial
            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + index * 0.1 }}
                key={p.name}
                className={`relative rounded-3xl p-6 lg:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 ${
                  isTrial
                    ? 'bg-gradient-to-b from-emerald-950/40 via-white/[0.08] to-white/[0.03] border-2 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.25)] ring-1 ring-emerald-400/40 backdrop-blur-2xl'
                    : isCombo 
                    ? 'bg-gradient-to-b from-white/[0.12] to-white/[0.04] border-2 border-saffron-400 shadow-[0_0_40px_rgba(251,191,36,0.22)] backdrop-blur-2xl ring-1 ring-saffron-400/40' 
                    : 'bg-white/[0.05] border border-white/10 hover:border-white/20 backdrop-blur-xl shadow-xl'
                }`}
              >
                {/* Ribbons */}
                {isTrial && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-3.5 py-1 text-[11px] font-black text-lagoon-950 shadow-[0_4px_16px_rgba(52,211,153,0.45)] tracking-wider flex items-center gap-1.5 uppercase whitespace-nowrap">
                    <Gift size={13} className="text-lagoon-950" />
                    <span>Free Trial • 7 Days</span>
                  </div>
                )}

                {isCombo && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-saffron-400 to-amber-500 px-3.5 py-1 text-[11px] font-black text-lagoon-950 shadow-[0_4px_16px_rgba(251,191,36,0.45)] tracking-wider flex items-center gap-1.5 uppercase whitespace-nowrap">
                    <Sparkles size={13} className="text-lagoon-950" />
                    <span>Most Popular • Combo</span>
                  </div>
                )}

                <div>
                  {/* Category Pill */}
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      isTrial
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : isCombo 
                        ? 'bg-saffron-500/20 text-saffron-300 border-saffron-400/30' 
                        : 'bg-white/10 text-lagoon-100/90 border-white/10'
                    }`}>
                      {p.badge || 'Plan'}
                    </span>
                    {isTrial && <Gift className="w-4 h-4 text-emerald-400" />}
                    {!isTrial && p.name.includes('Hotel') && !isCombo && <Building2 className="w-4 h-4 text-saffron-400/80" />}
                    {!isTrial && p.name.includes('Restaurant') && <UtensilsCrossed className="w-4 h-4 text-emerald-400/80" />}
                    {isCombo && <Layers className="w-4 h-4 text-saffron-400" />}
                  </div>

                  {/* Plan Name */}
                  <h2 className="text-xl lg:text-2xl font-bold font-display text-white tracking-tight">{p.name}</h2>
                  <p className="mt-2 text-xs text-lagoon-100/70 min-h-[38px] leading-relaxed">{p.desc}</p>

                  {/* Price */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    {p.originalPrice && (
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs text-lagoon-100/50 line-through font-mono">
                          ₹{p.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          🔥 ₹1,000 OFF
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className={`font-display text-3xl lg:text-4xl font-extrabold tracking-tight ${isTrial ? 'text-emerald-400' : 'text-white'}`}>
                        ₹{p.monthly.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-lagoon-100/60">
                        {isTrial ? '/ 7 days free' : '/month'}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {isTrial ? '100% Free' : 'With GST'}
                      </span>
                    </div>
                  </div>

                  {/* Perks List */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-lagoon-100/50 mb-3">Features Included:</p>
                    <ul className="space-y-2.5 text-xs text-lagoon-100/90">
                      {p.perks.map((perk) => (
                        <li key={perk} className="flex gap-2 items-start">
                          <Check size={14} className={`shrink-0 mt-0.5 ${isTrial ? 'text-emerald-400' : isCombo ? 'text-saffron-400' : 'text-emerald-400'}`} />
                          <span className="leading-snug">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* CTA Button */}
                <Link 
                  to={isTrial ? '/register?plan=Trial' : `/register?plan=${encodeURIComponent(p.name)}`} 
                  className={`block text-center rounded-xl py-3 mt-6 font-bold text-xs lg:text-sm transition-all shadow-md active:scale-95 ${
                    isTrial
                      ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:brightness-110 text-lagoon-950 font-black shadow-emerald-500/30'
                      : isCombo 
                      ? 'bg-gradient-to-r from-saffron-400 to-amber-500 hover:from-saffron-300 hover:to-amber-400 text-lagoon-950 font-black shadow-saffron-500/30' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  {isTrial ? 'Claim 7-Day Free Trial' : `Get Started with ${p.name.split(' ')[0]}`}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Badges Footer Strip */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-4xl mx-auto p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-xs md:text-sm text-lagoon-100/80"
        >
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Transparent, With GST • No Hidden Fees</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-saffron-400" />
            <span>Instant Setup & Free Training</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Headphones className="w-4 h-4 text-sky-400" />
            <span>Direct WhatsApp & Call Support</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
