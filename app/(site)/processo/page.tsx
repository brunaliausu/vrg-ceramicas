import type { Metadata } from 'next'
import Image from 'next/image'
import { getProcessoConteudo } from '@/lib/conteudo'

export const metadata: Metadata = {
  title: 'O Processo',
  description: 'Do barro à obra — conheça o processo artesanal por trás de cada peça da VRG Cerâmicas.',
}

function EtapaImagem({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="mt-6 bg-areia aspect-video flex items-center justify-center">
        <p className="font-sans text-xs text-muted/40">[ Foto — {alt} ]</p>
      </div>
    )
  }
  return (
    <div className="relative mt-6 aspect-video overflow-hidden bg-areia">
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 768px" />
    </div>
  )
}

export default async function ProcessoPage() {
  const c = await getProcessoConteudo()

  const etapas = [
    { numero: '01', titulo: c.etapa1_titulo, descricao: c.etapa1_texto, imagem: c.etapa1_imagem },
    { numero: '02', titulo: c.etapa2_titulo, descricao: c.etapa2_texto, imagem: c.etapa2_imagem },
    { numero: '03', titulo: c.etapa3_titulo, descricao: c.etapa3_texto, imagem: c.etapa3_imagem },
    { numero: '04', titulo: c.etapa4_titulo, descricao: c.etapa4_texto, imagem: c.etapa4_imagem },
    { numero: '05', titulo: c.etapa5_titulo, descricao: c.etapa5_texto, imagem: c.etapa5_imagem },
    { numero: '06', titulo: c.etapa6_titulo, descricao: c.etapa6_texto, imagem: c.etapa6_imagem },
  ]

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-4">
        {c.hero_lead}
      </p>
      <h1 className="font-serif text-5xl md:text-6xl font-light text-carvao mb-6 leading-tight">
        {c.hero_titulo}
      </h1>
      <p className="font-sans text-sm text-carvao/60 leading-relaxed max-w-lg mb-20">
        {c.hero_texto}
      </p>

      <div className="space-y-0">
        {etapas.map((etapa, i) => (
          <div key={etapa.numero} className={`grid grid-cols-12 gap-8 py-12 ${i < etapas.length - 1 ? 'border-b border-pedra' : ''}`}>
            <div className="col-span-2">
              <span className="font-serif text-5xl font-light text-pedra">{etapa.numero}</span>
            </div>
            <div className="col-span-10">
              <h2 className="font-serif text-2xl font-light text-carvao mb-3">{etapa.titulo}</h2>
              <p className="font-sans text-sm text-carvao/60 leading-relaxed">{etapa.descricao}</p>
              <EtapaImagem src={etapa.imagem} alt={etapa.titulo} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-areia px-8 py-10">
        <p className="font-serif text-2xl font-light text-carvao mb-4">
          &ldquo;{c.nota_quote}&rdquo;
        </p>
        <p className="font-sans text-xs text-carvao/60">
          {c.nota_texto}
        </p>
      </div>
    </div>
  )
}
