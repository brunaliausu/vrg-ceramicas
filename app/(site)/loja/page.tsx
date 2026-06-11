import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import type { Produto, Categoria } from '@/types'
import { CATEGORIAS } from '@/types'

interface SearchParams {
  categoria?: string
  colecao?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function getProdutos(filtros: SearchParams): Promise<Produto[]> {
  try {
    const supabase = await createClient()

    // Busca configuração global (mostrar vendidos?)
    const { data: config } = await supabase
      .from('configuracoes')
      .select('mostrar_vendidos')
      .single()

    const mostrarVendidos = config?.mostrar_vendidos ?? true

    let query = supabase
      .from('produtos')
      .select('*')
      .neq('status', 'Rascunho')

    if (!mostrarVendidos) {
      query = query.neq('status', 'Vendido')
    }

    if (filtros.categoria) {
      query = query.eq('categoria', filtros.categoria)
    }

    if (filtros.colecao) {
      query = query.ilike('colecao', filtros.colecao.replace(/-/g, ' '))
    }

    const { data } = await query
      .order('status', { ascending: true }) // Vendidos ficam por último
      .order('ordem_exibicao', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: false })

    // Reordenar: vendidos no final
    const ativos = (data as Produto[] ?? []).filter((p) => p.status !== 'Vendido')
    const vendidos = (data as Produto[] ?? []).filter((p) => p.status === 'Vendido')

    return [...ativos, ...vendidos]
  } catch {
    return []
  }
}

export default async function LojaPage({ searchParams }: Props) {
  const params = await searchParams
  const produtos = await getProdutos(params)

  const categoriaAtiva = params.categoria as Categoria | undefined
  const colecaoAtiva = params.colecao

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Cabeçalho */}
      <div className="mb-12">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-2">
          {colecaoAtiva
            ? `Coleção ${colecaoAtiva.replace(/-/g, ' ')}`
            : categoriaAtiva ?? 'Todas as peças'}
        </p>
        <h1 className="font-serif text-5xl font-light text-carvao">Loja</h1>
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2 mb-10">
        <a
          href="/loja"
          className={`font-sans text-xs tracking-wide px-4 py-2 border transition-colors ${
            !categoriaAtiva && !colecaoAtiva
              ? 'border-carvao bg-carvao text-cru'
              : 'border-pedra text-carvao/60 hover:border-carvao hover:text-carvao'
          }`}
        >
          Todos
        </a>
        {CATEGORIAS.map((cat) => (
          <a
            key={cat}
            href={`/loja?categoria=${encodeURIComponent(cat)}`}
            className={`font-sans text-xs tracking-wide px-4 py-2 border transition-colors ${
              categoriaAtiva === cat
                ? 'border-carvao bg-carvao text-cru'
                : 'border-pedra text-carvao/60 hover:border-carvao hover:text-carvao'
            }`}
          >
            {cat}
          </a>
        ))}
        <a
          href="/loja?colecao=flor-de-lis"
          className={`font-sans text-xs tracking-wide px-4 py-2 border transition-colors ${
            colecaoAtiva === 'flor-de-lis'
              ? 'border-terracota bg-terracota text-cru'
              : 'border-pedra text-carvao/60 hover:border-terracota hover:text-terracota'
          }`}
        >
          Flor de Lis
        </a>
      </div>

      {/* Grade de produtos */}
      {produtos.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl font-light text-carvao/40">
            Nenhuma peça encontrada.
          </p>
          <p className="font-sans text-sm text-carvao/30 mt-2">
            Novas peças em breve — acompanhe no Instagram.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {produtos.map((p) => (
            <div key={p.id} className={p.status === 'Vendido' ? 'opacity-55' : ''}>
              <ProductCard produto={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
