'use client'
import { useState } from 'react'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      // Simulate an API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setStatus('success')
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <div className="relative mx-auto my-12 max-w-6xl rounded-xl border p-7 md:grid md:grid-cols-2 md:rounded-l-xl md:rounded-r-none md:p-12" 
         style={{backgroundColor: 'rgba(64, 64, 64, 0.5)', borderColor: '#C41E3A'}}>
      <div className="max-w-lg">
        <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl">
          Stay in the Fantasy Red Zone
        </h2>
        <p className="text-md mb-6 font-medium leading-7 text-gray-200 md:text-lg">
          Join the ultimate fantasy football insider list! <br /> Get weekly 
          updates on player rankings, waiver wire gems, and expert analysis 
          to dominate your leagues.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email for fantasy insights"
            className="w-full rounded-lg border border-gray-500 bg-gray-800 p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 shadow-sm"
            style={{'--tw-ring-color': '#C41E3A'} as React.CSSProperties}
            required
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`rounded-lg px-6 py-3 font-bold uppercase tracking-wide text-white transition-all transform hover:scale-105 shadow-lg ${
              status === 'loading'
                ? 'bg-gray-500'
                : 'hover:opacity-90'
            }`}
            style={status !== 'loading' ? {backgroundColor: '#C41E3A'} : {}}
          >
            {status === 'loading' ? 'Joining...' : 'Join Red Zone'}
          </button>
        </form>
        {status === 'success' && (
          <p className="mt-4 font-semibold" style={{color: '#C41E3A'}}>
            Welcome to the Red Zone! Please confirm your email to get started.
          </p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-red-400">
            Something went wrong. Please try again.
          </p>
        )}
      </div>
      <div
        className="absolute right-0 hidden h-full w-2/5 md:block"
        style={{
          background: 'linear-gradient(135deg, #C41E3A 0%, #A01729 100%)',
          clipPath: 'polygon(0 0, 10% 100%, 100% 100%, 100% 0)',
        }}
      ></div>
    </div>
  )
}

export default Newsletter
