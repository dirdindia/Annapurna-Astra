import { useState, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Send, CheckCircle2, Sparkles } from 'lucide-react'
import MagneticButton from '../components/MagneticButton'

const Subpage3DCanvas = lazy(() => import('../components/Subpage3DCanvas'))

export default function Contact() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const submit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 600)
  }

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center py-20 bg-gradient-to-b from-lagoon-900 via-[#072424] to-lagoon-900 overflow-hidden">
      
      {/* 3D Background Canvas */}
      <Suspense fallback={null}>
        <Subpage3DCanvas />
      </Suspense>

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-saffron-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-20 bottom-1/4 h-96 w-96 rounded-full bg-lagoon-500/20 blur-[130px]" />

      <div className="container-x relative z-10 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left Side: Contact Info & Value Badges */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="text-white lg:col-span-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron-400/30 bg-saffron-400/10 px-4 py-1.5 text-xs font-semibold text-saffron-300 backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-saffron-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>24/7 Priority Support</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold font-display leading-[1.1] tracking-tight">
            Let's build <br/> something <span className="bg-gradient-to-r from-saffron-400 to-amber-300 bg-clip-text text-transparent">great.</span>
          </h1>
          
          <p className="mt-5 text-lg text-lagoon-100/80 leading-relaxed font-sans max-w-md">
            Hotel manage karna ab complex nahi raha. Hamare team se baat karke 15 minute ka live demo book karein.
          </p>

          <div className="mt-10 space-y-5">
            <motion.div 
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-md transition-all hover:border-saffron-400/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-500/15 text-saffron-400 border border-saffron-400/20">
                <Phone size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-lagoon-100/60">Call Directly</p>
                <p className="text-base font-semibold text-white">+91 98765 43210</p>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-md transition-all hover:border-saffron-400/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-500/15 text-saffron-400 border border-saffron-400/20">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-lagoon-100/60">Email Support</p>
                <p className="text-base font-semibold text-white">contact@annapurnaastra.com</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ x: 6 }}
              className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 backdrop-blur-md transition-all hover:border-saffron-400/40"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-500/15 text-saffron-400 border border-saffron-400/20">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-lagoon-100/60">Office</p>
                <p className="text-base font-semibold text-white">Connaught Place, New Delhi</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side: Modern Glassmorphic Form with Active Focus Effects */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="lg:col-span-7"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-8 sm:p-12 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-white/25">
            
            {/* Top decorative accent glow */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-saffron-500/20 blur-2xl" />

            <div className="mb-8">
              <h3 className="text-2xl font-bold font-display text-white">Send a Message</h3>
              <p className="mt-1 text-sm text-lagoon-100/70 font-sans">
                Aapka sawaal ya demo request yahan submit karein, hum 1 ghante ke andar reply karenge.
              </p>
            </div>
            
            {sent ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
                  <CheckCircle2 size={32} />
                </div>
                <p className="font-display text-2xl font-bold text-white">Thank you!</p>
                <p className="mt-2 text-sm text-lagoon-100/90 font-sans">
                  Aapka message receive ho gaya hai. Hamare hospitality expert jaldi hi aapse connect karenge.
                </p>
                <button 
                  onClick={() => setSent(false)} 
                  className="mt-6 text-xs font-bold text-saffron-400 hover:underline tracking-wider uppercase"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="grid gap-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-lagoon-100/70 mb-2 block">Full Name</label>
                  <input 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] p-3.5 text-white placeholder:text-white/30 backdrop-blur-md outline-none transition-all duration-200 focus:scale-[1.01] focus:border-saffron-400 focus:bg-white/[0.09] focus:ring-4 focus:ring-saffron-400/10" 
                    placeholder="e.g. Vikramaditya Singh" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-lagoon-100/70 mb-2 block">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] p-3.5 text-white placeholder:text-white/30 backdrop-blur-md outline-none transition-all duration-200 focus:scale-[1.01] focus:border-saffron-400 focus:bg-white/[0.09] focus:ring-4 focus:ring-saffron-400/10" 
                    placeholder="hotelowner@domain.com" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-lagoon-100/70 mb-2 block">Your Message</label>
                  <textarea 
                    required 
                    rows="4" 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.05] p-3.5 text-white placeholder:text-white/30 backdrop-blur-md outline-none transition-all duration-200 focus:scale-[1.01] focus:border-saffron-400 focus:bg-white/[0.09] focus:ring-4 focus:ring-saffron-400/10" 
                    placeholder="Mujhe apne hotel ke liye pricing aur demo chahiye..." 
                  />
                </div>

                <MagneticButton className="w-full">
                  <button 
                    disabled={loading}
                    className="w-full rounded-xl bg-saffron-500 py-4 text-base font-bold text-lagoon-900 shadow-xl shadow-saffron-500/25 transition-all hover:bg-saffron-400 hover:shadow-saffron-500/40 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? 'Sending message...' : 'Send Message'}
                    {!loading && <Send size={18} />}
                  </button>
                </MagneticButton>
              </form>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
