import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getHomeConteudo } from '@/lib/conteudo'
import { ProductCard } from '@/components/product/ProductCard'
import type { Produto } from '@/types'

async function getProdutosDestaque(): Promise<Produto[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('destaque_home', true)
      .in('status', ['Disponível', 'Sob Encomenda'])
      .order('ordem_exibicao', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: false })
      .limit(6)
    return (data as Produto[]) ?? []
  } catch {
    return []
  }
}

async function getProdutosColecao(colecao: string): Promise<Produto[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('colecao', colecao)
      .in('status', ['Disponível', 'Sob Encomenda'])
      .order('ordem_exibicao', { ascending: true, nullsFirst: false })
      .limit(3)
    return (data as Produto[]) ?? []
  } catch {
    return []
  }
}

function CmsImage({
  src,
  alt,
  className,
  fill = false,
}: {
  src: string
  alt: string
  className?: string
  fill?: boolean
}) {
  if (!src) return null
  if (fill) {
    return <Image src={src} alt={alt} fill className={className ?? 'object-cover'} sizes="(max-width:768px) 100vw, 50vw" />
  }
  return <Image src={src} alt={alt} width={900} height={1200} className={className ?? 'w-full h-full object-cover'} />
}

export default async function HomePage() {
  const [c, destaques, florDeLis] = await Promise.all([
    getHomeConteudo(),
    getProdutosDestaque(),
    getProdutosColecao('Flor de Lis'),
  ])

  return (
    <div className="grain-overlay">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[680px] overflow-hidden flex items-center bg-carvao">
        {/* Imagem full-bleed cobrindo toda a seção */}
        <div className="absolute inset-0">
          {c.hero_imagem ? (
            <CmsImage src={c.hero_imagem} alt="VRG Cerâmicas" fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-areia" />
          )}
        </div>

        {/* Gradiente escuro da esquerda para garantir legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-carvao/75 via-carvao/40 to-transparent z-10 pointer-events-none" />
        {/* Gradiente suave no topo (header) */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-carvao/40 to-transparent z-10 pointer-events-none" />

        {/* Conteúdo sobre a imagem */}
        <div className="relative z-20 px-8 sm:px-12 lg:px-20 max-w-[580px] pt-16">
          {/* Eyebrow com linha antes */}
          <div className="flex items-center gap-4 mb-8">
            <span className="block w-11 h-px bg-cru/50 shrink-0" />
            <p className="font-sans text-[11px] tracking-[0.3em] uppercase text-cru/70">
              {c.hero_eyebrow}
            </p>
          </div>

          <h1
            className="font-serif font-light text-cru leading-[0.92] tracking-[-0.01em]"
            style={{ fontSize: 'clamp(52px, 7.5vw, 108px)' }}
          >
            <span className="block">{c.hero_linha1}</span>
            <span className="block">{c.hero_linha2}</span>
            <span className="block italic text-argila">{c.hero_linha3}</span>
          </h1>

          <p className="font-sans text-[15px] text-cru/70 leading-relaxed mt-8 mb-10 max-w-[380px]">
            {c.hero_texto}
          </p>

          <Link
            href="/loja"
            className="inline-flex items-center gap-4 bg-cru text-carvao font-sans text-xs tracking-[0.18em] uppercase px-9 py-5 hover:bg-argila transition-colors"
          >
            Conhecer as peças
          </Link>
        </div>

        {/* Legenda inferior direita */}
        {c.hero_imagem && (
          <p
            className="absolute right-10 bottom-8 z-20 text-cru/60 font-sans text-[10px] tracking-[0.22em] uppercase text-right hidden lg:block"
          >
            Cerâmica autoral · feita à mão
          </p>
        )}
      </section>

      {/* ── ARTISTA ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-28 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Image */}
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-areia">
          {c.artista_imagem ? (
            <CmsImage src={c.artista_imagem} alt={c.artista_assinatura} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-sans text-xs text-muted/40">[ Foto da artista ]</p>
            </div>
          )}
        </div>

        {/* Copy */}
        <div>
          <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-terracota mb-5">
            {c.artista_lead}
          </p>
          <blockquote
            className="font-serif font-light italic text-carvao leading-snug mb-7 border-l-2 border-argila pl-5"
            style={{ fontSize: 'clamp(22px, 3vw, 34px)' }}
          >
            &ldquo;{c.artista_quote}&rdquo;
          </blockquote>
          <p className="font-sans text-sm text-muted leading-relaxed max-w-md mb-8">
            {c.artista_bio}
          </p>
          <div>
            <p className="font-caveat text-3xl text-carvao">{c.artista_assinatura}</p>
            <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted mt-1">
              {c.artista_cargo}
            </p>
          </div>
        </div>
      </section>

      {/* ── PEÇAS EM DESTAQUE ─────────────────────────────── */}
      {destaques.length > 0 && (
        <section className="bg-areia py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-14 flex-wrap gap-4">
              <div>
                <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-terracota mb-2">
                  Disponíveis agora
                </p>
                <h2 className="font-serif font-light text-carvao" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)' }}>
                  Peças do momento
                </h2>
              </div>
              <Link
                href="/loja"
                className="inline-flex items-center gap-3 font-sans text-xs tracking-[0.16em] uppercase border border-carvao text-carvao px-7 py-3 rounded-full hover:bg-carvao hover:text-cru transition-colors"
              >
                Ver toda a loja
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {destaques.map((p) => (
                <div key={p.id}>
                  <ProductCard produto={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── COLEÇÃO ───────────────────────────────────────── */}
      {(c.colecao_imagem || florDeLis.length > 0) && (
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="relative rounded-2xl overflow-hidden min-h-[480px] flex items-center">
            {c.colecao_imagem ? (
              <CmsImage src={c.colecao_imagem} alt={c.colecao_titulo} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-carvao" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-carvao/80 to-carvao/20" />
            <div className="relative z-10 px-16 py-12 max-w-lg text-cru">
              <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-argila mb-4">
                {c.colecao_lead}
              </p>
              <h2 className="font-serif font-light leading-tight mb-5" style={{ fontSize: 'clamp(40px, 5vw, 66px)' }}>
                {c.colecao_titulo}
              </h2>
              <p className="font-sans text-sm leading-relaxed text-cru/80 mb-8 max-w-sm">
                {c.colecao_texto}
              </p>
              <Link
                href="/loja?colecao=flor-de-lis"
                className="inline-flex items-center gap-3 border border-cru text-cru font-sans text-xs tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-cru hover:text-carvao transition-colors"
              >
                Descobrir a coleção
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── INSTAGRAM / GALERIA ───────────────────────────── */}
      {(c.instagram_img1 || c.instagram_img2 || c.instagram_img3 || c.instagram_img4) && (
        <section className="max-w-6xl mx-auto px-6 pb-28">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-terracota mb-2">
                {c.instagram_lead}
              </p>
              <h2 className="font-serif font-light text-carvao" style={{ fontSize: 'clamp(28px, 3.8vw, 44px)' }}>
                {c.instagram_titulo}
              </h2>
            </div>
            <a
              href={`https://instagram.com/${c.instagram_handle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-carvao text-carvao font-sans text-xs tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-carvao hover:text-cru transition-colors"
            >
              {c.instagram_handle}
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[c.instagram_img1, c.instagram_img2, c.instagram_img3, c.instagram_img4]
              .filter(Boolean)
              .map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-areia group">
                  <Image
                    src={img}
                    alt={`Galeria ${i + 1}`}
                    fill
                    sizes="25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      {/* ── CTA INSTAGRAM fallback (sem imagens) ─────────── */}
      {!c.instagram_img1 && !c.instagram_img2 && (
        <section className="bg-carvao py-20 text-center">
          <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-4">
            {c.instagram_lead}
          </p>
          <h2 className="font-serif font-light text-cru mb-4" style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>
            {c.instagram_handle}
          </h2>
          <p className="font-sans text-sm text-cru/50 mb-8">
            Processo, novidades e peças exclusivas no Instagram.
          </p>
          <a
            href={`https://instagram.com/${c.instagram_handle.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-sans text-xs tracking-wide text-cru/70 border border-cru/20 px-6 py-3 rounded-full hover:border-cru/50 transition-colors"
          >
            Seguir no Instagram
          </a>
        </section>
      )}
    </div>
  )
}
