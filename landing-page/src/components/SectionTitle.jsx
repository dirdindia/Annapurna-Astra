// Har section ka heading + chhota description
export default function SectionTitle({ title, text, center = false }) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-lagoon-900/70">{text}</p>}
    </div>
  )
}
