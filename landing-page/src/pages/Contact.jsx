import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail } from 'lucide-react'

export default function Contact() {
  const [sent, setSent] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center py-24">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src="/images/contact.jpg" alt="Contact Support" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-lagoon-900/70 backdrop-blur-sm"></div>
      </div>

      <div className="container-x relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left Side: Contact Info & Typography */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="text-white"
        >
          <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight">
            Let's build <br/> something <span className="text-saffron-400">great.</span>
          </h1>
          <p className="mt-6 text-lg text-lagoon-100/80 max-w-md">
            Hotel manage karna aasaan nahi hai, par humaare saath ho sakta hai. Aaj hi demo book karein.
          </p>

          <div className="mt-12 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Phone className="text-saffron-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-lagoon-100/60">Call Us</p>
                <p className="text-lg font-medium">+91 98765 43210</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Mail className="text-saffron-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-lagoon-100/60">Email Us</p>
                <p className="text-lg font-medium">hello@stayflow.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <MapPin className="text-saffron-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-lagoon-100/60">Visit Us</p>
                <p className="text-lg font-medium">Connaught Place, New Delhi</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Glassmorphism Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 lg:p-12 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Send a Message</h3>
            
            {sent ? (
              <div className="bg-saffron-400/20 border border-saffron-400/30 text-saffron-100 rounded-2xl p-6 text-center">
                <p className="font-semibold text-lg">Thank you!</p>
                <p className="mt-2 text-sm">Aapka message mil gaya hai. Hum jaldi hi aapse sampark karenge.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5">
                <div>
                  <label className="text-sm text-lagoon-100 mb-1 block">Full Name</label>
                  <input required className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/30 focus:border-saffron-400 focus:outline-none transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm text-lagoon-100 mb-1 block">Email Address</label>
                  <input required type="email" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/30 focus:border-saffron-400 focus:outline-none transition-colors" placeholder="john@hotel.com" />
                </div>
                <div>
                  <label className="text-sm text-lagoon-100 mb-1 block">Your Message</label>
                  <textarea required rows="4" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white placeholder:text-white/30 focus:border-saffron-400 focus:outline-none transition-colors" placeholder="I want a demo..." />
                </div>
                <button className="w-full bg-saffron-500 hover:bg-saffron-400 text-lagoon-900 font-bold py-3 rounded-xl transition-colors mt-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </motion.div>

      </div>
    </section>
  )
}
