import FeatureCard from '../components/FeatureCard'
import { features } from '../data/content'
import { motion } from 'framer-motion'

export default function Features() {
  return (
    <section className="min-h-[calc(100vh-80px)] pb-24">
      {/* Premium Header */}
      <div className="bg-lagoon-900 text-white py-24 mb-20 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-saffron-500/20 rounded-full blur-[120px]"></div>
         <div className="container-x relative z-10 text-center">
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
              className="mt-6 text-xl text-lagoon-100/80 max-w-2xl mx-auto"
            >
              Hotel ke har department ke liye alag software kyu? StayFlow mein sab kuch connected hai, seamless aur fast.
            </motion.p>
         </div>
      </div>

      <div className="container-x">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div 
               key={f.title}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-50px" }}
               transition={{ delay: i * 0.1, duration: 0.5 }}
            >
               <FeatureCard {...f} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
