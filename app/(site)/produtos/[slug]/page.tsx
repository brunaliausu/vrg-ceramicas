import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ConjuntoPurchaseOptions } from '@/components/product/ConjuntoPurchaseOptions'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EncomendaForm } from '@/components/sections/EncomendaForm'
import { formatPreco } from '@/lib/utils'
import { linkCompra } from '@/lib/whatsapp'
import type { Produto, Status } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

interface ConjuntoSite {
  id: string
  venda_modo: string
}

async function getProduto(slug: string): Promise<Produto | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('slug', slug)
      .neq('status', 'Rascunho')
      .single()
    return data as Produto | null
  } catch {
    return null
  }
}

async function getConjunto(produtoId: string): Promise<ConjuntoSite | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conjuntos')
      .select('id, venda_modo')
      .eq('id', produtoId)
      .single()
    return data as ConjuntoSite | null
  } catch {
    return null
  }
}

async function getConjuntoPieces(conjuntoId: string) {
  try {
    const supabase = await createClient()

    const { data: links } = await supabase
      .from('conjunto_pecas')
      .select('peca_id, ordem')
      .eq('conjunto_id', conjuntoId)
      .order('ordem', { ascending: true })

    if (links && links.length > 0) {
      const ids = links.map((l) => l.peca_id)
      const { data: pecas } = await supabase
        .from('pecas_estoque')
        .select('id, codigo, nome, dimensoes, fotos, status, preco_praticado, preco_venda')
        .in('id', ids)
      const orderMap = new Map(links.map((l) => [l.peca_id, l.ordem]))
      return (pecas ?? []).sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
      )
    }

    const { data } = await supabase
      .from('pecas_estoque')
      .select('id, codigo, nome, dimensoes, fotos, status, preco_praticado, preco_venda')
      .eq('conjunto_id', conjuntoId)
      .order('ordem', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params
  const produto = await getProduto(slug)

  if (!produto) notFound()

  const conjunto = await getConjunto(produto.id)
  const conjuntoPieces = conjunto ? await getConjuntoPieces(conjunto.id) : []

  const {
    nome, categoria, colecao, descricao, preco, status,
    aceita_encomenda, material, acabamento, cor, medidas,
    capacidade, peso, cuidados, imagens,
  } = produto

  const disponivel = status === 'Disponível'
  const vendido = status === 'Vendido'
  const sobEncomenda = status === 'Sob Encomenda'
  const isConjunto = !!conjunto
  const knownStatus = status === 'Disponível' || status === 'Vendido' || status === 'Sob Encomenda' || status === 'Rascunho'

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav className="flex gap-2 font-sans text-xs text-carvao/40 mb-10">
        <Link href="/loja" className="hover:text-carvao transition-colors">Loja</Link>
        <span>/</span>
        <Link href={`/loja?categoria=${encodeURIComponent(categoria)}`} className="hover:text-carvao transition-colors">
          {categoria}
        </Link>
        <span>/</span>
        <span className="text-carvao/70">{nome}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Galeria */}
        <ProductGallery imagens={imagens} nome={nome} />

        {/* Detalhes */}
        <div className="space-y-6">
          {/* Coleção e categoria */}
          <div>
            {colecao && (
              <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-1">
                Coleção {colecao}
              </p>
            )}
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted">
              {categoria}
              {isConjunto && <span className="text-terracota/80"> · Conjunto</span>}
            </p>
          </div>

          <div>
            <h1 className="font-serif text-4xl font-light text-carvao mb-2">{nome}</h1>
            {knownStatus ? (
              <StatusBadge status={status as Status} size="md" />
            ) : (
              <span className="inline-flex items-center border font-sans text-xs px-3 py-1 bg-areia text-carvao border-pedra">
                {status}
              </span>
            )}
          </div>

          {/* Preço */}
          {disponivel && preco && (
            <p className="font-serif text-3xl font-light text-carvao">
              {formatPreco(preco)}
              {isConjunto && <span className="font-sans text-sm text-muted ml-2">conjunto completo</span>}
            </p>
          )}
          {sobEncomenda && (
            <p className="font-sans text-sm text-muted">Sob consulta</p>
          )}

          {/* Descrição */}
          {descricao && (
            <p className="font-sans text-sm text-carvao/70 leading-relaxed">{descricao}</p>
          )}

          {/* Atributos */}
          {(material || acabamento || cor || medidas || capacidade) && (
            <div className="border-t border-pedra pt-6 space-y-2">
              {[
                { label: 'Material', value: material },
                { label: 'Acabamento', value: acabamento },
                { label: 'Cor / tom', value: cor },
                { label: 'Medidas', value: medidas },
                { label: 'Capacidade', value: capacidade },
                peso ? { label: 'Peso', value: `${peso} g` } : null,
              ]
                .filter(Boolean)
                .filter((a) => a!.value)
                .map((attr) => (
                  <div key={attr!.label} className="flex gap-4">
                    <span className="font-sans text-xs text-muted w-24 flex-shrink-0">{attr!.label}</span>
                    <span className="font-sans text-xs text-carvao">{attr!.value}</span>
                  </div>
                ))}
            </div>
          )}

          {/* CTAs */}
          <div className="border-t border-pedra pt-6 space-y-3">
            {/* Conjunto — opções de compra */}
            {isConjunto && disponivel && (
              <ConjuntoPurchaseOptions
                conjuntoNome={nome}
                conjuntoSlug={produto.slug}
                conjuntoPreco={preco}
                vendaModo={conjunto.venda_modo}
                pieces={conjuntoPieces}
              />
            )}

            {/* Peça avulsa disponível */}
            {!isConjunto && disponivel && preco && (
              <a
                href={linkCompra(nome, preco, produto.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full bg-carvao text-cru font-sans text-sm tracking-wide py-4 hover:bg-carvao/85 transition-colors"
              >
                Comprar pelo WhatsApp →
              </a>
            )}

            {/* Peça vendida */}
            {vendido && (
              <div className="bg-areia px-6 py-4 text-center">
                <p className="font-sans text-sm text-carvao/60">
                  {isConjunto ? 'Este conjunto já foi vendido.' : 'Esta peça única já foi vendida.'}
                </p>
              </div>
            )}

            {/* Solicitar encomenda */}
            {aceita_encomenda && !sobEncomenda && (
              <details className="group">
                <summary className="flex items-center justify-between w-full border border-carvao/30 px-6 py-3 cursor-pointer font-sans text-sm text-carvao/70 hover:border-carvao transition-colors list-none">
                  <span>Solicitar Encomenda</span>
                  <span className="transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="border border-t-0 border-carvao/30 px-6 py-6">
                  <EncomendaForm pecaNome={nome} />
                </div>
              </details>
            )}

            {/* Status: Sob Encomenda — mostra formulário direto */}
            {sobEncomenda && (
              <div className="border border-pedra px-6 py-6">
                <p className="font-sans text-xs tracking-widest uppercase text-carvao/50 mb-4">
                  Solicitar Encomenda
                </p>
                <EncomendaForm pecaNome={nome} />
              </div>
            )}
          </div>

          {/* Aviso artesanal */}
          <p className="font-sans text-xs text-muted/70 leading-relaxed">
            Por ser uma peça feita à mão, podem existir pequenas variações de forma, cor e textura.
            Essas imperfeições são a marca do processo artesanal.
          </p>

          {/* Cuidados */}
          {cuidados && cuidados.length > 0 && (
            <div className="border-t border-pedra pt-6">
              <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-3">
                Cuidados e uso
              </p>
              <div className="flex flex-wrap gap-2">
                {cuidados.map((c) => (
                  <span
                    key={c}
                    className="font-sans text-xs text-carvao/70 bg-areia px-3 py-1.5"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
