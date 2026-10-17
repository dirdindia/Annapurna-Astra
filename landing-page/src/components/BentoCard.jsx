import { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Bento3DIcon from './Bento3DIcon'

export default function BentoCard({ 
  title, 
  tag, 
  desc, 
  icon: Icon, 
  index = 0,
  span = 'col-span-1', 
  badgeColor = 'bg-saffron-500/15 text-saffron-700' 
}) {
  const cardRef = useRef(null)
  const [hovered, setHovered] = useState(false)

  // Clean 3D Spring tilt (single unified effect - no conflicting hover jitter)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 25 })
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 25 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg'])

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    x.set(mouseX / width - 0.5)
    y.set(mouseY / height - 0.5)
  }

  const handleMouseEnter = () => setHovered(true)
  const handleMouseLeave = () => {
    setHovered(false)
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className={`group relative overflow-hidden rounded-3xl border border-lagoon-900/10 bg-white/95 p-8 backdrop-blur-xl shadow-md transition-shadow duration-300 hover:border-saffron-500/40 hover:shadow-xl hover:shadow-saffron-500/10 ${span}`}
    >
      <div style={{ transform: 'translateZ(25px)' }} className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {/* Header with 3D Object + Tag */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-linen border border-lagoon-900/5 p-1 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Bento3DIcon index={index} hovered={hovered} />
              </div>
            </div>
            {tag && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeColor}`}>
                {tag}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-lagoon-900 group-hover:text-saffron-600 transition-colors">
            {title}
          </h3>
          <p className="mt-3 text-sm text-lagoon-900/75 leading-relaxed font-sans">
            {desc}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs font-bold text-saffron-600 opacity-90 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
          <span>Explore feature</span>
          <span>→</span>
        </div>
      </div>
    </motion.div>
  )
}
