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
  { name: 'Starter', monthly: 3499, desc: '10 rooms tak ke chhote hotel/guest house ke liye', perks: ['Room booking', 'Billing & GST invoice', '2 staff logins', 'Email support'] },
  { name: 'Growth', monthly: 3999, popular: true, desc: 'Restaurant wale hotels ke liye poora setup', perks: ['Starter ka sab kuch', 'Restaurant POS + KOT', 'KDS aur QR scan & order', 'Staff app (10 logins)', 'WhatsApp support'] },
  { name: 'Enterprise', monthly: 9999, desc: 'Chain aur bade resorts ke liye', perks: ['Growth ka sab kuch', 'Multi-property', 'Unlimited staff', 'Custom reports & API', 'Dedicated manager'] },
]

export const steps = [
  { title: 'Hotel register karo', text: '2 minute ka form – property ka naam, rooms aur city.' },
  { title: 'Rooms aur menu add karo', text: 'Excel se import karo ya ek-ek karke bharo.' },
  { title: 'Staff ko add karo', text: 'Form fill kre, role chuno, aur kaam shuru.' },
]
