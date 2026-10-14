export default function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="group h-full rounded-3xl border border-lagoon-900/5 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-lagoon-900/5">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lagoon-50 text-lagoon-700 transition-colors group-hover:bg-saffron-500 group-hover:text-lagoon-900 shadow-sm">
        <Icon size={28} />
      </div>
      <h3 className="mt-6 text-xl font-bold text-lagoon-900">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-lagoon-900/60">{text}</p>
    </div>
  )
}
