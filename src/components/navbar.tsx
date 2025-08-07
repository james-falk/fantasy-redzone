'use client'
import { MenuIcon, XIcon, PlayCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const navLinks = [
  { title: 'ANALYSIS', link: '#' },
  { title: 'RANKINGS', link: '#' },
  { title: 'TOOLS', link: '#' },
  { title: 'VIDEOS', link: '#' },
]

const Navbar = () => {
  const [showNav, setShowNav] = useState(false)

  const handleShowNav = () => {
    setShowNav(!showNav)
  }

  return (
    <nav className="relative z-50 redzone-card border-b border-red-600/20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 sm:gap-10">
          {/* hamburger menu or cross icon */}
          <button
            onClick={handleShowNav}
            aria-label="Toggle Menu"
            className="md:hidden text-white hover:text-red-400 transition-colors"
          >
            {showNav ? (
              <XIcon strokeWidth={3} size={25} />
            ) : (
              <MenuIcon strokeWidth={3} size={25} />
            )}
          </button>
          
          {/* logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-lg redzone-gradient-intense flex items-center justify-center text-white font-black text-lg shadow-lg redzone-glow group-hover:scale-105 transition-transform duration-300">
              FRZ
            </div>
            <span className="self-center whitespace-nowrap text-xl font-bold text-white md:text-2xl tracking-wide group-hover:text-red-400 transition-colors duration-300">
              FANTASY RED ZONE
            </span>
          </Link>
          
          {/* nav links */}
          <div
            className={`absolute left-0 right-0 -z-10 flex w-full flex-col gap-3 redzone-card p-4 shadow-2xl border-t border-red-600/20 transition-all duration-300 ease-in-out md:relative md:left-0 md:right-auto md:top-auto md:z-auto md:flex-row md:shadow-none md:border-none md:p-0 md:bg-transparent ${
              showNav ? 'top-[70px]' : 'top-[-200px]'
            }`}
          >
            {navLinks.map(({ title, link }, index) => (
              <Link
                key={index}
                href={link}
                className="rounded-md px-4 py-2 text-gray-300 font-semibold tracking-wide transition-all duration-200 ease-linear hover:bg-red-600/20 hover:text-white hover:scale-105 border border-transparent hover:border-red-600/30"
              >
                {title}
              </Link>
            ))}
          </div>
        </div>
        
        {/* CTA button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="hidden sm:flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-105 border border-white/20 hover:border-white/40"
          >
            <PlayCircle size={16} />
            <span>WATCH LIVE</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg redzone-gradient-intense hover:scale-105 transform transition-all duration-300 px-4 py-2 text-sm font-bold text-white tracking-wide shadow-lg redzone-glow"
          >
            <TrendingUp size={16} />
            <span>GET PREMIUM</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
