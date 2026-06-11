import Image from 'next/image'
import type { SobreConteudo } from '@/types'

interface Momento {
  tag: string
  titulo: string
  texto: string
  imagem: string
}

function buildMomentos(c: SobreConteudo): Momento[] {
  return [
    { tag: c.historia1_tag, titulo: c.historia1_titulo, texto: c.historia1_texto, imagem: c.historia1_imagem },
    { tag: c.historia2_tag, titulo: c.historia2_titulo, texto: c.historia2_texto, imagem: c.historia2_imagem },
    { tag: c.historia3_tag, titulo: c.historia3_titulo, texto: c.historia3_texto, imagem: c.historia3_imagem },
  ].filter((m) => m.titulo.trim() || m.texto.trim() || m.imagem.trim())
}

function MomentoImagem({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-areia/80">
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted/50 text-center px-6">
          Foto — {alt}
        </p>
      </div>
    )
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
      sizes="(max-width:1024px) 100vw, 45vw"
    />
  )
}

export function ArtistaHistorias({ conteudo }: { conteudo: SobreConteudo }) {
  const momentos = buildMomentos(conteudo)
  const showSection =
    conteudo.historias_titulo.trim() ||
    conteudo.historias_texto.trim() ||
    momentos.length > 0

  if (!showSection) return null

  return (
    <section className="relative bg-areia/60 py-24 md:py-32 overflow-hidden">
      {/* faixa decorativa */}
      <div
        className="pointer-events-none absolute top-0 right-0 w-1/3 h-full opacity-[0.07]"
        style={{
          backgroundImage: 'repeating-linear-gradient(-12deg, transparent, transparent 28px, #8B5A3C 28px, #8B5A3C 29px)',
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* cabeçalho editorial */}
        <div className="max-w-2xl mb-20 md:mb-28">
          {conteudo.historias_lead && (
            <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-terracota mb-4">
              {conteudo.historias_lead}
            </p>
          )}
          {conteudo.historias_titulo && (
            <h2
              className="font-serif font-light text-carvao leading-[1.05] mb-6"
              style={{ fontSize: 'clamp(32px, 4.8vw, 52px)' }}
            >
              {conteudo.historias_titulo}
            </h2>
          )}
          {conteudo.historias_texto && (
            <p className="font-sans text-sm md:text-base text-carvao/65 leading-relaxed max-w-xl">
              {conteudo.historias_texto}
            </p>
          )}
        </div>

        {/* capítulos alternados */}
        <div className="space-y-24 md:space-y-32">
          {momentos.map((m, i) => {
            const reversed = i % 2 === 1
            return (
              <article
                key={`${m.tag}-${i}`}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center ${reversed ? 'lg:[direction:rtl]' : ''}`}
              >
                {/* imagem */}
                <div className={`lg:col-span-6 ${reversed ? 'lg:[direction:ltr]' : ''}`}>
                  <div className="group relative">
                    <div className="relative aspect-[4/5] overflow-hidden bg-cru shadow-[0_24px_48px_-12px_rgba(43,41,38,0.18)]">
                      <MomentoImagem src={m.imagem} alt={m.titulo || m.tag} />
                    </div>
                    {/* moldura deslocada */}
                    <div
                      className={`absolute -z-10 w-full h-full border border-terracota/25 ${reversed ? '-left-4 -bottom-4' : '-right-4 -bottom-4'}`}
                      aria-hidden
                    />
                    {m.tag && (
                      <span className="absolute top-4 left-4 bg-cru/90 backdrop-blur-sm font-sans text-[9px] tracking-[0.22em] uppercase text-terracota px-3 py-1.5">
                        {m.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* texto */}
                <div className={`lg:col-span-6 ${reversed ? 'lg:[direction:ltr]' : ''}`}>
                  <div className={`max-w-md ${reversed ? 'lg:ml-auto lg:text-right' : ''}`}>
                    <span className="font-serif italic text-terracota/80 text-lg leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {m.titulo && (
                      <h3
                        className="font-serif font-light text-carvao mt-3 mb-5 leading-snug"
                        style={{ fontSize: 'clamp(24px, 2.8vw, 34px)' }}
                      >
                        {m.titulo}
                      </h3>
                    )}
                    {m.texto && (
                      <p className="font-sans text-sm text-carvao/60 leading-[1.75]">
                        {m.texto}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
