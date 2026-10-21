import { Link } from 'react-router-dom'
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-24 bg-lagoon-900 text-lagoon-100 pt-16">
      <div className="container-x grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Column 1: Brand */}
        <div className="md:col-span-1">
          <p className="font-display text-2xl font-bold text-white">E-<span className="text-saffron-500">Annapurna</span></p>
          <p className="mt-4 text-sm text-lagoon-100/70 leading-relaxed">Rooms, restaurant aur staff – ek hi software mein.</p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Quick Links</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link to="/features" className="hover:text-saffron-400 transition-colors">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-saffron-400 transition-colors">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-saffron-400 transition-colors">Contact Us</Link></li>
            <li><Link to="/about" className="hover:text-saffron-400 transition-colors">About Us</Link></li>
          </ul>
        </div>

        {/* Column 3: Legal */}
        <div>
          <h4 className="text-white font-semibold mb-4">Legal</h4>
          <ul className="flex flex-col gap-2 text-sm">
            <li><Link to="/terms" className="hover:text-saffron-400 transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-saffron-400 transition-colors">Privacy Policy</Link></li>
            <li><Link to="/refund" className="hover:text-saffron-400 transition-colors">Cancellation Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Social */}
        <div>
          <h4 className="text-white font-semibold mb-4">Follow Us</h4>
          <div className="flex items-center gap-4">
            <a href="#" className="text-lagoon-100/70 hover:text-saffron-400 transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-lagoon-100/70 hover:text-saffron-400 transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-lagoon-100/70 hover:text-saffron-400 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-lagoon-100/70 hover:text-saffron-400 transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="border-t border-white/10 py-5">
        <div className="container-x flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-lagoon-100/60">© {new Date().getFullYear()} E-Annapurna. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-lagoon-100/60">Powered by</span>
            <a href="https://dird.co.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
               <img src="/dird-logo.webp" alt="DIRD Logo" className="h-6 w-auto" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
