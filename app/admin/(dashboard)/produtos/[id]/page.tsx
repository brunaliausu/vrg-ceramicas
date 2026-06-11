import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/admin/ProductForm'
import type { Produto } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

async function getProduto(id: string): Promise<Produto | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('produtos').select('*').eq('id', id).single()
  return data as Produto | null
}

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params
  const produto = await getProduto(id)

  if (!produto) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="font-sans text-xs text-muted hover:text-carvao transition-colors">
          ← Voltar
        </Link>
        <h1 className="font-serif text-3xl font-light text-carvao">Editar produto</h1>
      </div>

      <div className="mb-4 px-4 py-3 bg-areia border border-pedra">
        <p className="font-sans text-xs text-carvao/60">
          Produto: <span className="font-medium text-carvao">{produto.nome}</span>
          {' · '}
          <a
            href={`/produtos/${produto.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-terracota hover:underline"
          >
            Ver no site →
          </a>
        </p>
      </div>

      <ProductForm produto={produto} modo="editar" />
    </div>
  )
}
