import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { api, showToast } from '../api'

const initial = { hotel: '', owner: '', email: '', phone: '', city: '', type: 'Hotel', password: '' }

export default function Register() {
  const [form, setForm] = useState(initial)
  const [done, setDone] = useState(false)

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/register-hotel', form);
      if (res.data.success) {
        showToast('Hotel registered successfully!');
        setDone(true);
      } else {
        showToast(res.data.message || 'Error registering hotel', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Network error', 'error');
    }
  }

  if (done)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div>
          <CheckCircle2 className="mx-auto text-emerald-500" size={56} />
          <h1 className="mt-4 text-3xl font-bold">{form.hotel} register ho gaya</h1>
          <p className="mt-2 text-lagoon-900/70">Ab sign in karke setup shuru karo.</p>
          <Link to="/signin" className="btn btn-primary mt-6">Sign in</Link>
        </div>
      </div>
    )

  return (
    <div className="grid min-h-screen lg:grid-cols-5">
      <aside className="hidden bg-lagoon-900 p-12 text-white lg:col-span-2 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="font-display text-2xl font-bold">Annapurna <span className="text-saffron-500">Astra</span></Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">14 din free. Card ki zaroorat nahi.</h2>
          <p className="mt-3 text-lagoon-100/80">Apna hotel register karo aur aaj hi bookings shuru karo.</p>
        </div>
        <p className="text-xs text-lagoon-100/50">© Annapurna Astra</p>
      </aside>

      <form onSubmit={submit} className="mx-auto flex w-full max-w-xl flex-col justify-center gap-4 px-5 py-12 lg:col-span-3 sm:px-10">
        <h1 className="text-3xl font-bold">Hotel registration</h1>
        <input required name="hotel" value={form.hotel} onChange={change} className="input" placeholder="Hotel ka naam" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input required name="owner" value={form.owner} onChange={change} className="input" placeholder="Owner ka naam" />
          <input required name="phone" value={form.phone} onChange={change} className="input" placeholder="Mobile number" />
        </div>
        <input required type="email" name="email" value={form.email} onChange={change} className="input" placeholder="Email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <input required name="city" value={form.city} onChange={change} className="input" placeholder="City" />
          <select name="type" value={form.type} onChange={change} className="input">
            {['Hotel', 'Resort', 'Guest house', 'Restaurant only'].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <input required type="password" minLength="6" name="password" value={form.password} onChange={change} className="input" placeholder="Password (kam se kam 6 akshar)" />
        <button className="btn btn-primary">Create account</button>
        <p className="text-sm text-lagoon-900/70">Pehle se account hai? <Link to="/signin" className="font-semibold text-lagoon-500">Sign in</Link></p>
      </form>
    </div>
  )
}
