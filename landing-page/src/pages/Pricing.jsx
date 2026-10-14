import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { plans } from '../data/content'

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const price = (p) => (yearly ? Math.round((p.monthly * 10) / 12) : p.monthly)

  return (
    <section className="relative min-h-[calc(100vh-80px)] py-24 bg-lagoon-900 overflow-hidden flex items-center">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-saffron-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container-x relative z-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold font-display text-white mb-6"
          >
            Simple pricing, no surprises.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-lagoon-100/70"
          >
            Scale your hotel management software as you grow. Switch plans anytime.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-16 flex w-fit rounded-full bg-white/10 p-1 text-sm font-semibold backdrop-blur-md border border-white/20 shadow-lg"
        >
          {['Monthly', 'Yearly (2 mahine free)'].map((label, i) => (
            <button
              key={label}
              onClick={() => setYearly(i === 1)}
              className={`rounded-full px-6 py-2.5 transition-all duration-300 ${yearly === (i === 1) ? 'bg-saffron-500 text-lagoon-900 shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 'text-white hover:bg-white/10'}`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        <div className="grid items-start gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((p, index) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
              key={p.name}
              className={`relative rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-2 ${p.popular ? 'bg-white/10 border border-saffron-500 shadow-[0_0_30px_rgba(251,191,36,0.2)] md:-mt-6 backdrop-blur-xl' : 'bg-white/5 border border-white/10 backdrop-blur-md'}`}
            >
              {p.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-saffron-500 px-4 py-1 text-xs font-bold text-lagoon-900 shadow-[0_0_10px_rgba(251,191,36,0.5)] tracking-wide">MOST POPULAR</span>}
              <h3 className="mt-3 text-2xl font-bold text-white">{p.name}</h3>
              <p className="mt-2 text-sm text-lagoon-100/70 h-10">{p.desc}</p>
              <div className="mt-6 flex items-end">
                <span className="font-display text-5xl font-bold text-white">₹{price(p)}</span>
                <span className="text-lg font-normal text-lagoon-100/50 mb-1 ml-1">/mo</span>
              </div>
              <ul className="mt-8 space-y-4 text-sm text-lagoon-100/90">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex gap-3 items-center"><Check size={18} className="shrink-0 text-saffron-400" />{perk}</li>
                ))}
              </ul>
              <Link to="/register" className={`block text-center rounded-xl py-3 mt-10 font-bold transition-all ${p.popular ? 'bg-saffron-500 text-lagoon-900 hover:bg-saffron-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>Get started</Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
