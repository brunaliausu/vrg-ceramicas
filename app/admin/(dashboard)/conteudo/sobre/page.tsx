import Link from 'next/link'
import { getSobreConteudo } from '@/lib/conteudo'
import { SobreForm } from './SobreForm'

export default async function ConteudoSobrePage() {
  const conteudo = await getSobreConteudo()

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
        <h1 className="font-serif text-3xl font-light text-carvao">A Artista</h1>
      </div>
      <SobreForm inicial={conteudo} />
    </div>
  )
}
