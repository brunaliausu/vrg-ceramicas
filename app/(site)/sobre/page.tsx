import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getSobreConteudo } from '@/lib/conteudo'
import { ArtistaHistorias } from '@/components/sections/ArtistaHistorias'

export const metadata: Metadata = {
  title: 'A Artista',
  description:
    'Conheça a história da VRG Cerâmicas Artesanais — a ceramista, o ateliê e a paixão pelo feito à mão.',
}

function CmsImage({
  src,
  alt,
  fill,
  className,
  sizes,
}: {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
}) {
  if (!src) return null
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className ?? 'object-cover'}
        sizes={sizes ?? '(max-width:768px) 100vw, 50vw'}
      />
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={900}
      height={1200}
      className={className ?? 'w-full h-full object-cover'}
    />
  )
}

export default async function SobrePage() {
  const c = await getSobreConteudo()

  const valores = [
    { titulo: c.valores_1_titulo, texto: c.valores_1_texto },
    { titulo: c.valores_2_titulo, texto: c.valores_2_texto },
    { titulo: c.valores_3_titulo, texto: c.valores_3_texto },
  ]

  return (
    <div className="grain-overlay">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-screen pt-16">
        {/* Copy */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-24 order-2 lg:order-1">
          <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-terracota mb-6">
            {c.hero_lead}
          </p>
          <h1
            className="font-serif font-light text-carvao leading-[0.96]"
            style={{ fontSize: 'clamp(46px, 7vw, 88px)' }}
          >
            <span className="block">{c.hero_titulo1}</span>
            <span className="block italic text-terracota">{c.hero_titulo2}</span>
            <span className="block">{c.hero_titulo3}</span>
          </h1>
          <p className="font-serif italic font-light text-muted mt-7 max-w-md" style={{ fontSize: 'clamp(18px, 2.2vw, 24px)' }}>
            {c.hero_subtitulo}
          </p>
        </div>

        {/* Image */}
        <div className="relative min-h-[56vh] lg:min-h-full order-1 lg:order-2 overflow-hidden bg-areia">
          {c.hero_imagem ? (
            <CmsImage src={c.hero_imagem} alt={c.carta_assinatura} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-sans text-xs text-muted/40">[ Foto da artista ]</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CARTA ─────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 py-28 text-center">
        <p
          className="font-serif font-light text-carvao leading-[1.55] [&>p+p]:mt-7"
          style={{ fontSize: 'clamp(19px, 2.4vw, 26px)' }}
        >
          {/* dropcap para o primeiro parágrafo */}
          <p className="before-dropcap">{c.carta_p1}</p>
          <p>{c.carta_p2}</p>
          {c.carta_p3 && <p>{c.carta_p3}</p>}
        </p>
        {c.carta_quote && (
          <p className="font-serif italic text-terracota mt-10 mb-2" style={{ fontSize: 'clamp(17px, 2vw, 22px)' }}>
            &ldquo;{c.carta_quote}&rdquo;
          </p>
        )}
        <p className="font-caveat text-4xl text-carvao mt-8">{c.carta_assinatura}</p>
        <p className="font-sans text-[10px] tracking-[0.2em] uppercase text-muted mt-2">
          {c.carta_cargo}
        </p>
      </section>

      <ArtistaHistorias conteudo={c} />

      {/* ── VALORES ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-pedra pt-16">
          {valores.map((v) => (
            <div key={v.titulo}>
              <h3
                className="font-serif font-light text-carvao mb-3"
                style={{ fontSize: 'clamp(22px, 2.4vw, 30px)' }}
              >
                {v.titulo}
              </h3>
              <p className="font-sans text-sm text-muted leading-relaxed">{v.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="relative rounded-2xl overflow-hidden min-h-[380px] flex items-center justify-center text-center text-cru">
          {c.cta_imagem ? (
            <CmsImage src={c.cta_imagem} alt={c.cta_titulo} fill className="object-cover" sizes="100vw" />
          ) : (
            <div className="absolute inset-0 bg-carvao" />
          )}
          <div className="absolute inset-0 bg-carvao/55" />
          <div className="relative z-10 px-8 max-w-xl">
            <h2 className="font-serif font-light leading-snug mb-7" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
              {c.cta_titulo}
            </h2>
            <Link
              href="/contato"
              className="inline-flex items-center gap-3 border border-cru text-cru font-sans text-xs tracking-[0.14em] uppercase px-8 py-4 rounded-full hover:bg-cru hover:text-carvao transition-colors"
            >
              Solicitar uma encomenda
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
