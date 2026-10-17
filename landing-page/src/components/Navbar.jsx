import { useState, useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, ChevronDown, Hotel, Users, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { navLinks } from '../data/content'

// Login options matching hotel architecture
const loginOptions = [
  {
    title: 'Hotel Login',
    desc: 'Hotel Admin, Front Desk & Property Management',
    icon: Hotel,
    href: 'http://localhost:5174/login',
    internal: false,
    badge: 'Popular',
    color: 'from-amber-500/20 to-saffron-500/20 text-saffron-600',
  },
  {
    title: 'Staff Login',
    desc: 'Housekeeping, Waiters, Kitchen & Captains',
    icon: Users,
    href: 'http://localhost:5175/login',
    internal: false,
    badge: 'Staff App',
    color: 'from-sky-500/20 to-blue-500/20 text-sky-600',
  },
  {
    title: 'Admin Login',
    desc: 'Super Admin, Multi-Property & Global System',
    icon: ShieldAlert,
    href: 'http://localhost:5176/login',
    internal: false,
    badge: 'System',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600',
  },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold transition hover:text-lagoon-500 ${isActive ? 'text-lagoon-500' : ''}`

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-linen/80 shadow-md shadow-lagoon-950/5 backdrop-blur-xl border-b border-lagoon-900/10' : 'bg-transparent'}`}>
      <div className="container-x flex h-20 items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/dird-logo.webp" alt="DIRD Logo" className="h-9 w-auto transition-transform duration-300 group-hover:scale-105" />
          <span className="font-display text-2xl font-bold tracking-tight">
            Annapurna <span className="text-saffron-600">Astra</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>

        {/* Desktop Actions with Sign-in Dropdown */}
        <div className="hidden items-center gap-4 md:flex">
          
          {/* Sign In Dropdown Wrapper */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`btn btn-ghost !py-2.5 flex items-center gap-2 transition-all ${dropdownOpen ? 'bg-lagoon-900 text-white' : ''}`}
            >
              <span>Sign in</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-80 rounded-2xl border border-lagoon-900/10 bg-white/95 p-3 shadow-2xl backdrop-blur-xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-lagoon-900/5 mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-lagoon-900/50">Choose Portal</p>
                  </div>

                  <div className="space-y-1">
                    {loginOptions.map((opt) => {
                      const Icon = opt.icon
                      return (
                        <a
                          key={opt.title}
                          href={opt.href}
                          onClick={() => setDropdownOpen(false)}
                          className="group flex items-center gap-3.5 rounded-xl p-3 transition-all duration-200 hover:bg-lagoon-50/80 hover:shadow-sm"
                        >
                          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${opt.color} group-hover:scale-110 transition-transform`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-lagoon-900 group-hover:text-saffron-600 transition-colors">
                                {opt.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lagoon-900/5 text-lagoon-700">
                                {opt.badge}
                              </span>
                            </div>
                            <p className="text-xs text-lagoon-900/60 line-clamp-1 mt-0.5">
                              {opt.desc}
                            </p>
                          </div>
                        </a>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/register" className="btn btn-primary !py-2.5 font-bold shadow-md shadow-saffron-500/20">
            Get started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="container-x flex flex-col gap-4 bg-linen pb-6 md:hidden border-b border-lagoon-900/10">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>
          ))}

          {/* Mobile 3 Login Portals */}
          <div className="pt-2 border-t border-lagoon-900/10">
            <p className="text-xs font-bold uppercase tracking-wider text-lagoon-900/60 mb-3 px-1">Sign in as:</p>
            <div className="grid gap-2">
              {loginOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <a
                    key={opt.title}
                    href={opt.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-white p-3 border border-lagoon-900/10 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${opt.color}`}>
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-bold text-lagoon-900">{opt.title}</span>
                    </div>
                    <span className="text-xs font-semibold text-lagoon-600">→</span>
                  </a>
                )
              })}
            </div>
          </div>

          <Link to="/register" className="btn btn-primary mt-2" onClick={() => setOpen(false)}>Get started</Link>
        </div>
      )}
    </header>
  )
}
