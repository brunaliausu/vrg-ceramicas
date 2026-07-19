import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isAdminUser } from '@/lib/auth/admin'
import { LogoutButton } from './LogoutButton'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')
  if (!isAdminUser(user)) redirect('/admin/login?error=nao_autorizado')

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="bg-carvao text-cru px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/pecas" className="font-serif text-lg font-light tracking-[0.15em]">
            VRG Admin
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/admin/pecas"
              className="font-sans text-xs text-cru/60 hover:text-cru transition-colors"
            >
              Peças & Estoque
            </Link>
            <Link
              href="/admin/vendas"
              className="font-sans text-xs text-cru/60 hover:text-cru transition-colors"
            >
              Vendas
            </Link>
            <Link
              href="/admin/custos"
              className="font-sans text-xs text-cru/60 hover:text-cru transition-colors"
            >
              Custos
            </Link>
            <Link
              href="/admin/colecoes"
              className="font-sans text-xs text-cru/60 hover:text-cru transition-colors"
            >
              Coleções
            </Link>
            <Link
              href="/admin/conteudo"
              className="font-sans text-xs text-cru/60 hover:text-cru transition-colors"
            >
              Conteúdo do site
            </Link>
            <Link
              href="/"
              target="_blank"
              className="font-sans text-xs text-cru/40 hover:text-cru/60 transition-colors"
            >
              Ver site →
            </Link>
          </nav>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
