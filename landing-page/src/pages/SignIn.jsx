import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function SignIn() {
  const [form, setForm] = useState({ email: '', password: '' })
  const submit = (e) => {
    e.preventDefault()
    console.log('Login data:', form) // TODO: login API yahan lagao
  }

  return (
    <div className="grid min-h-screen place-items-center px-5">
      <form onSubmit={submit} className="grid w-full max-w-sm gap-4">
        <Link to="/" className="font-display text-2xl font-bold">Stay<span className="text-saffron-600">Flow</span></Link>
        <h1 className="text-3xl font-bold">Wapas aaiye</h1>
        <input required type="email" className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" className="input" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn btn-primary">Sign in</button>
        <p className="text-sm text-lagoon-900/70">Naya hotel? <Link to="/register" className="font-semibold text-lagoon-500">Register karo</Link></p>
      </form>
    </div>
  )
}
