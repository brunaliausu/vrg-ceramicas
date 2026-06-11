'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home' },
  { href: '/loja', label: 'Loja' },
  { href: '/sobre', label: 'A Artista' },
  { href: '/processo', label: 'Processo' },
  { href: '/contato', label: 'Contato' },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cru/95 backdrop-blur-sm border-b border-pedra/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-xl font-light tracking-[0.15em] text-carvao hover:text-terracota transition-colors"
        >
          VRG
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-sans text-xs tracking-[0.12em] uppercase transition-colors',
                (link.href === '/' ? pathname === '/' : pathname === link.href || pathname.startsWith(link.href.split('?')[0]))
                  ? 'text-terracota'
                  : 'text-carvao/70 hover:text-carvao'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-carvao"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className="block w-5 h-px bg-carvao mb-1.5 transition-all" />
          <span className="block w-5 h-px bg-carvao mb-1.5 transition-all" />
          <span className="block w-5 h-px bg-carvao transition-all" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden absolute inset-x-0 top-16 bg-cru border-b border-pedra">
          <nav className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-serif text-2xl font-light text-carvao hover:text-terracota transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
