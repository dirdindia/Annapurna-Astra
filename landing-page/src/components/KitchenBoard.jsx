// Hero ka live KDS demo – tickets khud New -> Cooking -> Ready hote rehte hain
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const initial = [
  { id: 'T4', dish: '2 Paneer Tikka, 1 Dal Makhani', where: 'Table 4', stage: 0 },
  { id: 'R305', dish: 'Veg Club Sandwich', where: 'Room 305', stage: 1 },
  { id: 'T9', dish: '1 Butter Naan x4', where: 'Table 9', stage: 2 },
]
const stages = [
  { label: 'New', cls: 'bg-lagoon-100 text-lagoon-700' },
  { label: 'Cooking', cls: 'bg-saffron-400 text-lagoon-900' },
  { label: 'Ready', cls: 'bg-emerald-500 text-white' },
]

export default function KitchenBoard() {
  const [tickets, setTickets] = useState(initial)

  useEffect(() => {
    const t = setInterval(() => {
      setTickets((list) => list.map((x, i) => ({ ...x, stage: (x.stage + (i === Math.floor(Date.now() / 3000) % 3 ? 1 : 0)) % 3 })))
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="animate-float rounded-3xl bg-lagoon-900 p-5 shadow-2xl shadow-lagoon-900/30">
      <div className="mb-4 flex items-center justify-between text-white">
        <p className="font-display text-lg">Kitchen · Live</p>
        <span className="flex items-center gap-2 text-xs text-lagoon-100">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 3 orders
        </span>
      </div>
      <div className="space-y-3">
        {tickets.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.25 }}
            className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-white"
          >
            <div>
              <p className="text-sm font-bold">{t.where}</p>
              <p className="text-xs text-lagoon-100/80">{t.dish}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold transition-colors duration-500 ${stages[t.stage].cls}`}>
              {stages[t.stage].label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
