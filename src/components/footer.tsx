'use client'
import {
  ArrowUp,
  EarthIcon,
  FacebookIcon,
  LinkedinIcon,
  TwitterIcon,
} from 'lucide-react'

const socialLinks = [
  {
    name: 'LinkedIn',
    link: '/',
    icon: <LinkedinIcon className="size-6" />,
  },
  {
    name: 'X',
    link: '/',
    icon: <TwitterIcon className="size-6" />,
  },
  {
    name: 'Facebook',
    link: '/',
    icon: <FacebookIcon className="size-6" />,
  },
  {
    name: 'Website',
    link: '/',
    icon: <EarthIcon className="size-6" />,
  },
]

const support = {
  title: 'Support',
  items: [
    { label: 'Contact', href: '' },
    { label: 'FAQs', href: '' },
    { label: 'Help Center', href: '' },
    { label: 'Feedback', href: '' },
  ],
}

const quickLinks = {
  title: 'Content',
  items: [
    { label: 'Latest Videos', href: '' },
    { label: 'Articles', href: '' },
    { label: 'Rankings', href: '' },
    { label: 'Analysis', href: '' },
  ],
}

const category = {
  title: 'Fantasy Types',
  items: [
    { label: 'Dynasty', href: '' },
    { label: 'Redraft', href: '' },
    { label: 'Best Ball', href: '' },
    { label: 'DFS', href: '' },
  ],
}

const contact = {
  address: 'Your ultimate fantasy football destination',
  phone: 'Dominate your leagues with expert insights',
  email: 'info@fantasyredzone.com',
}

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative redzone-card border-t border-red-600/20">
      {/* Top red accent */}
      <div className="absolute top-0 left-0 w-full h-1 redzone-gradient"></div>
      
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 py-16 sm:grid-cols-[40fr_30fr_30fr] md:grid-cols-[40fr_30fr_30fr_30fr]">
          <div>
            <a href="/" className="mb-8 flex items-center gap-4 text-white group">
              <div className="h-12 w-12 rounded-lg redzone-gradient-intense flex items-center justify-center text-white font-black text-xl shadow-lg redzone-glow group-hover:scale-105 transition-transform duration-300">
                FRZ
              </div>
              <h6 className="text-3xl font-bold tracking-wider">FANTASY RED ZONE</h6>
            </a>
            <address className="mt-4 text-base font-normal text-gray-300 space-y-3">
              <p className="max-w-80 text-lg font-medium text-white">Your ultimate fantasy football destination</p>
              <p className="text-red-400 font-semibold">Dominate your leagues with expert insights</p>
              <div className="mt-4 p-4 rounded-lg bg-red-600/10 border border-red-600/20">
                <p className="text-white font-semibold">📧 info@fantasyredzone.com</p>
              </div>
            </address>
          </div>
          
          <div>
            <h6 className="mb-7 text-xl font-bold text-white tracking-wide uppercase">{support.title}</h6>
            <ul className="space-y-3">
              {support.items.map(({ label, href }) => (
                <li key={label}>
                  <a 
                    href={href}
                    className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-200 ease-out font-medium tracking-wide flex items-center gap-2 hover:text-red-400"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h6 className="mb-7 text-xl font-bold text-white tracking-wide uppercase">{quickLinks.title}</h6>
            <ul className="space-y-3">
              {quickLinks.items.map(({ label, href }) => (
                <li key={label}>
                  <a 
                    href={href}
                    className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-200 ease-out font-medium tracking-wide flex items-center gap-2 hover:text-red-400"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h6 className="mb-7 text-xl font-bold text-white tracking-wide uppercase">{category.title}</h6>
            <ul className="space-y-3">
              {category.items.map(({ label, href }) => (
                <li key={label}>
                  <a 
                    href={href}
                    className="text-gray-300 hover:text-white hover:translate-x-2 transition-all duration-200 ease-out font-medium tracking-wide flex items-center gap-2 hover:text-red-400"
                  >
                    <span className="w-1 h-1 bg-red-600 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom section */}
      <div className="relative bg-black/40 backdrop-blur border-t border-red-600/20">
        <button
          onClick={scrollToTop}
          className="absolute -top-7 right-8 flex size-14 items-center justify-center rounded-full border-4 border-black/60 redzone-gradient-intense hover:scale-110 transition-all duration-300 shadow-xl redzone-glow md:right-16"
        >
          <ArrowUp color="#fff" size={22} strokeWidth={3} />
        </button>
        
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-gray-300 font-semibold">
              Fantasy Red Zone © 2024. Your ultimate fantasy football destination.
            </p>
            <p className="text-red-400 font-bold tracking-wide mt-1">
              BUILT FOR CHAMPIONS
            </p>
          </div>
          
          <ul className="flex items-center gap-4">
            {socialLinks.map(({ name, icon, link }) => (
              <li key={name}>
                <a
                  href={link}
                  title={name}
                  className="text-gray-400 hover:text-red-400 hover:scale-110 transition-all duration-300 p-2 rounded-lg hover:bg-red-600/10"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {icon}
                </a>
                <span className="sr-only">{name} account</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
