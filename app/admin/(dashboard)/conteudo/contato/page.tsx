import Link from 'next/link'
import { getContatoConteudo } from '@/lib/conteudo'
import { ContatoForm } from './ContatoForm'

export default async function ConteudoContatoPage() {
  const conteudo = await getContatoConteudo()

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
        <h1 className="font-serif text-3xl font-light text-carvao">Contato</h1>
      </div>
      <ContatoForm inicial={conteudo} />
    </div>
  )
}
