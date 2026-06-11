import type { Metadata } from 'next'
import { EncomendaForm } from '@/components/sections/EncomendaForm'
import { linkContato } from '@/lib/whatsapp'
import { getContatoConteudo } from '@/lib/conteudo'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a VRG Cerâmicas — encomendas, dúvidas e parcerias.',
}

export default async function ContatoPage() {
  const c = await getContatoConteudo()
  const instagramUrl = `https://instagram.com/${c.instagram_handle.replace('@', '')}`

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-4">{c.hero_lead}</p>
      <h1 className="font-serif text-5xl font-light text-carvao mb-6">{c.hero_titulo}</h1>
      <p className="font-sans text-sm text-carvao/60 mb-16 max-w-md leading-relaxed">
        {c.hero_texto}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h2 className="font-serif text-2xl font-light text-carvao mb-6">{c.form_titulo}</h2>
          <EncomendaForm />
        </div>

        <div className="space-y-8">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-3">{c.whatsapp_rotulo}</p>
            <a
              href={linkContato()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-carvao hover:text-terracota transition-colors"
            >
              {c.whatsapp_texto}
            </a>
          </div>
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-3">{c.instagram_rotulo}</p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-carvao hover:text-terracota transition-colors"
            >
              {c.instagram_handle} →
            </a>
          </div>
          <div className="bg-areia px-6 py-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-2">{c.envios_titulo}</p>
            <p className="font-sans text-xs text-carvao/60 leading-relaxed">
              {c.envios_texto}
            </p>
          </div>
          <div className="bg-areia px-6 py-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-2">{c.encomendas_titulo}</p>
            <p className="font-sans text-xs text-carvao/60 leading-relaxed">
              {c.encomendas_texto}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
