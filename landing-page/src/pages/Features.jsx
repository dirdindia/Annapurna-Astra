import { lazy, Suspense } from 'react'
import FeatureCard from '../components/FeatureCard'
import { features } from '../data/content'
import { motion } from 'framer-motion'
import BentoCard from '../components/BentoCard'

const Subpage3DCanvas = lazy(() => import('../components/Subpage3DCanvas'))

export default function Features() {
  return (
    <section className="min-h-[calc(100vh-80px)] pb-24 bg-linen">
      {/* Premium Header with 3D Hotel Canvas */}
      <div className="bg-lagoon-900 text-white py-24 mb-20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-saffron-500/20 rounded-full blur-[120px]"></div>
         <Suspense fallback={null}>
           <Subpage3DCanvas />
         </Suspense>
         <div className="container-x relative z-10 text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 rounded-full bg-saffron-400/10 border border-saffron-400/30 text-saffron-300 text-xs font-bold uppercase tracking-wider mb-6"
            >
              All-In-One Hotel Suite
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold font-display"
            >
              Sab kuch ek jagah.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-xl text-lagoon-100/80 max-w-2xl mx-auto font-sans leading-relaxed"
            >
              Hotel ke har department ke liye alag software kyu? E-Annapurna mein sab kuch connected hai, seamless aur fast.
            </motion.p>
         </div>
      </div>

      <div className="container-x">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <BentoCard
              key={f.title}
              title={f.title}
              desc={f.text}
              icon={f.icon}
              tag={`Module 0${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

