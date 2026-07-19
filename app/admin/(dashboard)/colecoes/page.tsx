import Link from 'next/link'
import { getAllColecoesAdmin } from '@/lib/colecoesSite'
import { ColecoesClient } from './ColecoesClient'

export default async function ColecoesPage() {
  const colecoes = await getAllColecoesAdmin()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/pecas" className="font-sans text-xs text-muted hover:text-carvao transition-colors">
          ← Voltar
        </Link>
        <h1 className="font-serif text-3xl font-light text-carvao">Coleções</h1>
      </div>
      <ColecoesClient colecoes={colecoes} />
    </div>
  )
}
