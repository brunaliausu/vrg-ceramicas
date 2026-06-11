import Link from 'next/link'
import { getProdutoHistoriaConteudo } from '@/lib/conteudo'
import { ProdutoHistoriaForm } from './ProdutoHistoriaForm'

export default async function ConteudoProdutoHistoriaPage() {
  const conteudo = await getProdutoHistoriaConteudo()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/conteudo"
          className="font-sans text-xs text-muted hover:text-carvao transition-colors"
        >
          ← Conteúdo do site
        </Link>
        <span className="text-pedra">/</span>
        <h1 className="font-serif text-3xl font-light text-carvao">História do Produto</h1>
      </div>
      <ProdutoHistoriaForm inicial={conteudo} />
    </div>
  )
}
