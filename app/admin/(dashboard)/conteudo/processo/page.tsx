import Link from 'next/link'
import { getProcessoConteudo } from '@/lib/conteudo'
import { ProcessoForm } from './ProcessoForm'

export default async function ConteudoProcessoPage() {
  const conteudo = await getProcessoConteudo()

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
        <h1 className="font-serif text-3xl font-light text-carvao">Processo</h1>
      </div>
      <ProcessoForm inicial={conteudo} />
    </div>
  )
}
