import { lazy, Suspense, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck, Zap, Layers, ChevronDown } from 'lucide-react'
import KitchenBoard from '../components/KitchenBoard'
import SectionTitle from '../components/SectionTitle'
import BentoCard from '../components/BentoCard'
import MagneticButton from '../components/MagneticButton'
import { features, steps, plans } from '../data/content'

// Lazy load 3D Canvas so initial bundle load remains fast
const HeroScene = lazy(() => import('../components/HeroScene'))

const tags = ['Rooms Management', 'Restaurant POS', 'Automated KOT', 'Realtime KDS', 'Staff Mobile App', 'Guest QR Menu', 'GST Billing', 'Live Analytics']

export default function Home() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  // Scroll driven transforms
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 0.95])
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, 60])

  return (
    <div ref={containerRef} className="relative overflow-hidden bg-linen selection:bg-saffron-500 selection:text-lagoon-900">

      {/* HERO SECTION WITH 3D CANVAS & PARALLAX */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-b from-lagoon-900 via-[#072424] to-lagoon-900 text-white">
        
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-lagoon-500/20 blur-[130px] animate-pulse-glow" />
        <div className="pointer-events-none absolute -right-32 top-1/4 h-[600px] w-[600px] rounded-full bg-saffron-500/15 blur-[150px] animate-pulse-glow" style={{ animationDelay: '3s' }} />

        {/* 3D Interactive WebGL Scene */}
        <Suspense fallback={<div className="absolute inset-0 bg-lagoon-900/60" />}>
          <HeroScene />
        </Suspense>

        {/* Subtle grid pattern overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '32px 32px' }}
        />

        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="container-x relative z-10 grid items-center gap-12 py-20 lg:grid-cols-12 lg:py-28"
        >
          {/* Left Content Column */}
          <div className="lg:col-span-7">
            
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-saffron-400/30 bg-saffron-400/10 px-4 py-1.5 text-xs font-semibold text-saffron-300 backdrop-blur-md mb-6"
            >
              <Sparkles className="h-3.5 w-3.5 text-saffron-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Next-Gen Cloud Hotel Operating System</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl text-white font-display"
            >
              Reception se rasoi tak, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-saffron-400 via-amber-300 to-saffron-500 bg-clip-text text-transparent">
                poora hotel ek screen par.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-6 max-w-xl text-lg text-lagoon-100/90 leading-relaxed font-sans"
            >
              Room booking, restaurant POS, automated KOT, kitchen display board aur staff management – sab ek powerful sync platform par bina kisi extra software jhanjhat ke.
            </motion.p>

            {/* CTAs with Magnetic Effect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <MagneticButton>
                <Link 
                  to="/register" 
                  className="btn btn-primary text-base font-bold px-8 py-3.5 shadow-xl shadow-saffron-500/25 flex items-center gap-2.5"
                >
                  Register your hotel <ArrowRight size={18} />
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link 
                  to="/features" 
                  className="btn bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/20 backdrop-blur-md text-base px-7 py-3.5"
                >
                  Explore features
                </Link>
              </MagneticButton>
            </motion.div>

            {/* Trust highlights */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-wrap items-center gap-6 text-xs text-lagoon-100/70 pt-6 border-t border-white/10"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Zero setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-saffron-400" />
                <span>2-minute instant onboarding</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-400" />
                <span>Real-time POS sync</span>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Live Glassmorphic KDS Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 transition-transform duration-500 hover:scale-[1.02]">
              <KitchenBoard />
            </div>
            
            {/* Ambient Backlight under KitchenBoard */}
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-saffron-500/20 blur-2xl -z-10" />
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-xs">
          <span>Scroll down</span>
          <ChevronDown className="h-4 w-4 animate-bounce text-saffron-400" />
        </div>
      </section>

      {/* MARQUEE STREAM */}
      <div className="relative z-20 overflow-hidden border-y border-lagoon-900/10 bg-white/80 backdrop-blur-md py-4">
        <div className="flex w-max animate-marquee gap-12 font-display text-lg tracking-wide text-lagoon-900">
          {[...tags, ...tags, ...tags, ...tags].map((t, i) => (
            <span key={i} className="flex items-center gap-4">
              <span>{t}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
            </span>
          ))}
        </div>
      </div>

      {/* BENTO GRID FEATURES SECTION (Modern UI & Glassmorphic) */}
      <section className="relative container-x pt-32 pb-16">
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-lagoon-500/10 blur-[140px] -z-10" />
        
        <SectionTitle 
          title="Hotel chalane ke liye jo kuch chahiye" 
          text="Har module alag se bhi chalta hai aur real-time cloud par ek saath seamlessly synchronize hota hai." 
        />

        {/* Modern Bento Grid Structure */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, index) => {
            // Give specific highlights to primary modules
            const isLarge = index === 0 || index === 3
            return (
              <BentoCard
                key={f.title}
                index={index}
                title={f.title}
                desc={f.text}
                icon={f.icon}
                tag={index === 0 ? 'Core PMS' : index === 3 ? 'Live KDS' : index === 1 ? 'Quick POS' : null}
                span={isLarge ? 'md:col-span-2 lg:col-span-1' : 'col-span-1'}
              />
            )
          })}
        </div>
      </section>

      {/* 3-STEP ROADMAP WITH MOTION */}
      <section className="container-x py-24">
        <div className="rounded-3xl border border-lagoon-900/10 bg-white/70 p-8 sm:p-12 backdrop-blur-xl shadow-xl">
          <SectionTitle 
            title="Shuru karna bilkul aasaan hai" 
            text="Bina kisi complex hardware setup ke aapka hotel 5 minute me live ho jata hai."
          />
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.li 
                key={s.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="group relative rounded-2xl bg-linen p-8 border border-lagoon-900/5 transition-all duration-300 hover:shadow-lg hover:border-saffron-400/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-500/10 font-display text-2xl font-bold text-saffron-600 border border-saffron-400/20 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-lagoon-700/60 uppercase">Step 0{i + 1}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-lagoon-900">{s.title}</h3>
                <p className="mt-2 text-sm text-lagoon-900/70 leading-relaxed">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* CONVERTING CTA SECTION WITH GLOW & PARTICLES */}
      <section className="container-x pb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-lagoon-900 via-[#0a3a3a] to-lagoon-900 px-8 py-20 text-center text-white sm:px-16 shadow-2xl border border-white/10"
        >
          {/* Internal ambient radial glow */}
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-saffron-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block rounded-full bg-saffron-500/20 px-4 py-1 text-xs font-semibold text-saffron-300 uppercase tracking-widest border border-saffron-400/30 mb-6">
              Risk-Free Guarantee
            </span>
            <h2 className="text-3xl font-extrabold sm:text-5xl font-display tracking-tight text-white leading-tight">
              Pehle 14 din free chalao, <br />
              <span className="text-saffron-400">fir decide karo.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-lagoon-100/90 leading-relaxed">
              Plans sirf ₹{plans[0].monthly}/month se shuru. Kisi credit card ya technical hardware ki zaroorat nahi.
            </p>
            <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
              <MagneticButton>
                <Link to="/register" className="btn btn-primary text-base font-bold px-9 py-4 shadow-xl shadow-saffron-500/30">
                  Start free trial
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/pricing" className="btn bg-white/10 hover:bg-white/20 border border-white/20 text-white text-base px-8 py-4 backdrop-blur-md">
                  View all pricing plans
                </Link>
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </section>

    </div>
  )
}
