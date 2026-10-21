import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Building2, Zap, ShieldCheck } from 'lucide-react'

const Subpage3DCanvas = lazy(() => import('../components/Subpage3DCanvas'))

const values = [
  { t: 'Hotel walon ne socha', d: 'Hum front desk aur kitchen ke asli kaam ko dekh kar features banate hain.', icon: Building2 },
  { t: 'Seedha aur tez', d: 'Naye staff ko bhi 1 din mein sikhaya ja sake – itna simple aur fast.', icon: Zap },
  { t: 'Aapka data aapka', d: 'Roz ka backup aur role-wise access, taaki sab hamesha surakshit rahe.', icon: ShieldCheck },
]

export default function About() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] flex flex-col justify-center py-24 bg-gradient-to-b from-lagoon-900 via-[#072424] to-lagoon-900 overflow-hidden">
      {/* 3D Background Canvas */}
      <Suspense fallback={null}>
        <Subpage3DCanvas />
      </Suspense>

      {/* Abstract Glowing Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-saffron-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container-x relative z-10">
        
        {/* Top Content */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-saffron-400 text-sm font-semibold mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-saffron-400 animate-pulse"></span>
            10k+ Hotels Trust Us
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display text-white leading-tight"
          >
            Hotels ke liye, <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-600">hotel walon ki tarah</span> socha hua software.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 text-xl text-lagoon-100/70 leading-relaxed max-w-2xl mx-auto"
          >
            E-Annapurna isliye bana ki chhote aur medium hotels ko 4-5 alag software na chalane padein. Hum samajhte hain ki ek hotel chalana kitna mushkil hota hai.
          </motion.p>
        </div>

        {/* Timeline layout for values */}
        <div className="max-w-4xl mx-auto space-y-12 mt-16 relative">
          {/* Vertical line connecting items */}
          <div className="absolute left-[39px] md:left-[3.25rem] top-10 bottom-10 w-px bg-saffron-500/20 hidden md:block"></div>
          
          {values.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div 
                key={v.t} 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center group"
              >
                {/* Number / Icon Bubble */}
                <div className="z-10 w-16 h-16 shrink-0 rounded-full bg-lagoon-900 border border-saffron-500/30 group-hover:border-saffron-500 shadow-[0_0_20px_rgba(251,191,36,0.1)] group-hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center transition-all duration-300 hidden md:flex">
                  <Icon className="text-saffron-400" size={28} />
                </div>
                
                {/* Content Block */}
                <div className="flex-1 p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors duration-300 w-full">
                  <div className="md:hidden w-14 h-14 rounded-full bg-lagoon-900 border border-saffron-500/50 flex items-center justify-center mb-6">
                     <Icon className="text-saffron-400" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{v.t}</h3>
                  <p className="text-lg text-lagoon-100/70 leading-relaxed">{v.d}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
