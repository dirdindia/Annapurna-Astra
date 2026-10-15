import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { navLinks } from '../data/content'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const linkClass = ({ isActive }) =>
    `text-sm font-semibold transition hover:text-lagoon-500 ${isActive ? 'text-lagoon-500' : ''}`

  return (
    <header className={`sticky top-0 z-50 transition ${scrolled ? 'bg-linen/90 shadow-sm backdrop-blur' : 'bg-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/dird-logo.webp" alt="DIRD Logo" className="h-8 w-auto" />
          <span className="font-display text-2xl font-bold">
            Annapurna <span className="text-saffron-600">Astra</span>
          </span>
        </Link>

        {/* Desktop menu */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/signin" className="btn btn-ghost !py-2">Sign in</Link>
          <Link to="/register" className="btn btn-primary !py-2">Get started</Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="container-x flex flex-col gap-4 bg-linen pb-6 md:hidden">
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>
          ))}
          <Link to="/signin" className="btn btn-ghost" onClick={() => setOpen(false)}>Sign in</Link>
          <Link to="/register" className="btn btn-primary" onClick={() => setOpen(false)}>Get started</Link>
        </div>
      )}
    </header>
  )
}
