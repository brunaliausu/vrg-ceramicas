import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter, Caveat } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VRG Cerâmicas Artesanais',
    template: '%s | VRG Cerâmicas',
  },
  description:
    'Cerâmica feita à mão, com alma e propósito. Peças únicas e autorais para mesa e decoração.',
  keywords: [
    'cerâmica artesanal',
    'louça artesanal',
    'cerâmica feita à mão',
    'peças de cerâmica autoral',
    'decoração artesanal',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'VRG Cerâmicas Artesanais',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable} ${caveat.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
