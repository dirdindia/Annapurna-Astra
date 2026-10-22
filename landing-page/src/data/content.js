// Saara text/content yahan hai – design chhedhe bina yahin se badlo.
import { BedDouble, UtensilsCrossed, Receipt, ChefHat, Smartphone, QrCode, BarChart3, Users, Package } from 'lucide-react'

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
]

export const features = [
  { icon: BedDouble, title: 'Room booking', text: 'Calendar view, check-in/out, room status aur advance payment ek screen par.' },
  { icon: UtensilsCrossed, title: 'Restaurant POS', text: 'Table map, split bill, GST invoice aur room par charge post karo.' },
  { icon: Receipt, title: 'KOT', text: 'Order lete hi kitchen order ticket auto print ya screen par pahunch jata hai.' },
  { icon: ChefHat, title: 'Kitchen display (KDS)', text: 'Har station ka apna live board – new, cooking aur ready ke timer ke saath.' },
  { icon: QrCode, title: 'Scan & order', text: 'Guest room ya table ka QR scan karke seedha menu se order kare.' },
  { icon: Smartphone, title: 'Staff app', text: 'Housekeeping, waiter aur front desk ke liye phone par simple tasks.' },
  { icon: BarChart3, title: 'Reports', text: 'Occupancy, revenue aur best-selling dishes roz ki report mein.' },
  { icon: Users, title: 'Multi-property', text: 'Ek login se kai hotels. Har branch ke roles aur access alag.' },
  { icon: Package, title: 'Inventory', text: 'Kitchen aur room supplies ka stock tracking aur re-order alerts ek jagah.' },
]

export const plans = [
  { 
    name: 'Hotel Only', 
    monthly: 2499, 
    badge: 'Hotel Management',
    desc: 'Sirf hotel & room booking manage karne ke liye', 
    perks: [
      'Room booking & Front desk',
      'Guest Check-in / Check-out & GRC',
      'Billing & GST invoice generation',
      'Advance room booking calendar',
      'Daily occupancy & revenue reports',
      'Staff logins & role permissions',
      'Standard support'
    ] 
  },
  { 
    name: 'Restaurant Only', 
    monthly: 2499, 
    badge: 'Restaurant POS',
    desc: 'Standalone restaurant, café, dhaba ya bar ke liye', 
    perks: [
      'Restaurant POS & Table management',
      'Instant Kitchen Order Ticket (KOT)',
      'Live Kitchen Display System (KDS)',
      'QR code scan & order for tables',
      'Menu management & Food items',
      'Daily food sales & revenue analytics',
      'Standard support'
    ] 
  },
  { 
    name: 'Combo (Hotel + Restaurant)', 
    monthly: 3499, 
    popular: true, 
    badge: 'Best Value',
    desc: 'Hotel aur Restaurant dono ka complete all-in-one setup', 
    perks: [
      'Hotel + Restaurant ke saare features',
      'Room booking + Restaurant POS + KOT',
      'Room Service Food Billing (Transfer to Room)',
      'Live KDS & Guest QR Scan & Order',
      'Inventory, Stock & Re-order alerts',
      'Unlimited staff logins & permissions',
      'Priority WhatsApp & Phone support'
    ] 
  },
]

export const steps = [
  { title: 'Hotel register karo', text: '2 minute ka form – property ka naam, rooms aur city.' },
  { title: 'Rooms aur menu add karo', text: 'Excel se import karo ya ek-ek karke bharo.' },
  { title: 'Staff ko add karo', text: 'Form fill kre, role chuno, aur kaam shuru.' },
]
