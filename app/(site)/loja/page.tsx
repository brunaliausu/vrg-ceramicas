import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product/ProductCard'
import type { Produto, Categoria } from '@/types'
import { CATEGORIAS } from '@/types'
import { categoriasParaFiltroLoja } from '@/lib/categoriaLoja'
import { getColecoesPublicas } from '@/lib/colecoesSite'
import { colecaoHref } from '@/lib/colecaoUtils'

interface SearchParams {
  categoria?: string
  colecao?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

async function getPublishedConjuntoIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string[]> {
  const { data } = await supabase.from('conjuntos').select('id')
  return (data ?? []).map((c) => c.id)
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
    const conjuntoIds = await getPublishedConjuntoIds(supabase)

    let query = supabase
      .from('produtos')
      .select('*')
      .neq('status', 'Rascunho')

    if (!mostrarVendidos) {
      query = query.neq('status', 'Vendido')
    }

    if (filtros.categoria === 'Conjuntos') {
      if (conjuntoIds.length === 0) return []
      query = query.in('id', conjuntoIds)
    } else if (filtros.categoria) {
      const cats = categoriasParaFiltroLoja(filtros.categoria as Categoria)
      query = cats.length === 1 ? query.eq('categoria', cats[0]) : query.in('categoria', cats)
      if (conjuntoIds.length > 0) {
        query = query.not('id', 'in', `(${conjuntoIds.join(',')})`)
      }
    }

    if (filtros.colecao) {
      const slug = filtros.colecao
      const { data: colMeta } = await supabase
        .from('colecoes')
        .select('nome')
        .eq('slug', slug)
        .maybeSingle()
      const term = colMeta?.nome ?? slug.replace(/-/g, ' ')
      query = query.ilike('colecao', term)
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
  const [produtos, colecoesSite] = await Promise.all([
    getProdutos(params),
    getColecoesPublicas(),
  ])

  const categoriaAtiva = params.categoria as Categoria | undefined
  const colecaoAtiva = params.colecao
  const colecaoAtivaMeta = colecaoAtiva
    ? colecoesSite.find((c) => c.slug === colecaoAtiva) ?? null
    : null

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Cabeçalho */}
      <div className="mb-12">
        <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-2">
          {colecaoAtivaMeta
            ? colecaoAtivaMeta.site_titulo || colecaoAtivaMeta.nome
            : colecaoAtiva
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
              categoriaAtiva === cat && !colecaoAtiva
                ? 'border-carvao bg-carvao text-cru'
                : 'border-pedra text-carvao/60 hover:border-carvao hover:text-carvao'
            }`}
          >
            {cat}
          </a>
        ))}
      </div>

      {colecoesSite.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          <span className="font-sans text-[10px] tracking-widest uppercase text-muted self-center mr-1">Coleções</span>
          {colecoesSite.map((col) => (
            <a
              key={col.id}
              href={colecaoHref(col.slug)}
              className={`font-sans text-xs tracking-wide px-4 py-2 border transition-colors ${
                colecaoAtiva === col.slug
                  ? 'border-terracota bg-terracota text-cru'
                  : 'border-pedra text-carvao/60 hover:border-terracota hover:text-carvao'
              }`}
            >
              {col.nome}
            </a>
          ))}
        </div>
      )}

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
              <ProductCard
                produto={p}
                categoriaExibicao={categoriaAtiva === 'Conjuntos' ? 'Conjuntos' : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
