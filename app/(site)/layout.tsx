import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/layout/WhatsAppButton'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-cru">
      <Header />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
