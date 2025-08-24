interface SectionHeadingProps {
  title: string[]
  subtitle: string
}

export default function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
        {title.map((part, index) => (
          <span key={index}>
            {index > 0 && ' '}
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              {part}
            </span>
          </span>
        ))}
      </h2>
      <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  )
}
