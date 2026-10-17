// Har section ka heading + chhota description
export default function SectionTitle({ title, text, center = false }) {
  return (
    <div className={`mb-12 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <h2 className="text-3xl font-extrabold sm:text-4xl text-lagoon-900 tracking-tight font-display">{title}</h2>
      {text && <p className="mt-3 text-base text-lagoon-900/80 font-sans leading-relaxed">{text}</p>}
    </div>
  )
}
