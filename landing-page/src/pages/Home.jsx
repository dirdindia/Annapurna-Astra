import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import KitchenBoard from '../components/KitchenBoard'
import SectionTitle from '../components/SectionTitle'
import FeatureCard from '../components/FeatureCard'
import { features, steps, plans } from '../data/content'

const tags = ['Rooms', 'Restaurant', 'KOT', 'KDS', 'Staff app', 'QR order', 'Billing', 'Reports']

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-lagoon-900 text-white">
        <div className="absolute inset-0 z-0">
          <img src="/images/hotel-reception.jpg" alt="Luxury Hotel Reception" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-lagoon-900 via-lagoon-900/80 to-lagoon-900/40"></div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-saffron-400/20 blur-3xl z-0" />
        <div className="container-x relative z-10 grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl text-white"
            >
              Reception se rasoi tak, poora hotel ek screen par.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-5 max-w-lg text-lg text-lagoon-100/90"
            >
              Room booking, restaurant billing, KOT, kitchen display aur staff app – sab ek saath, bina alag-alag software ke.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link to="/register" className="btn btn-primary">Register your hotel <ArrowRight size={16} /></Link>
              <Link to="/features" className="btn bg-white/10 hover:bg-white/20 text-white border-transparent">See features</Link>
            </motion.div>
          </div>
          <KitchenBoard />
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden border-y border-lagoon-900/10 bg-white py-4">
        <div className="flex w-max animate-marquee gap-12 font-display text-xl text-lagoon-700">
          {[...tags, ...tags, ...tags, ...tags].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      {/* FEATURES */}
      <section className="container-x pt-24">
        <SectionTitle title="Hotel chalane ke liye jo kuch chahiye" text="Har module alag se bhi chalta hai, aur saath mein bhi." />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* STEPS – ye sach mein sequence hai, isliye numbers */}
      <section className="container-x pt-24">
        <SectionTitle title="Shuru karna aasaan hai" />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-lagoon-50 p-6">
              <span className="font-display text-4xl text-saffron-600">{i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-lagoon-900/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="container-x pt-24 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-lagoon-900 px-6 py-16 text-center text-white sm:px-12 shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img src="/images/dashboard.jpg" alt="Software Dashboard" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-lagoon-900 via-lagoon-900/80 to-lagoon-900/40"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold sm:text-5xl">Pehle 14 din free chalao</h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-lagoon-100/90">Plans ₹{plans[0].monthly}/month se shuru. Card ki zaroorat nahi.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-3">Get started</Link>
              <Link to="/pricing" className="btn border border-white/30 hover:bg-white/10 text-lg px-8 py-3">View pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
