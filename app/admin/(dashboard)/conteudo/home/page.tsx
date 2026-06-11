import Link from 'next/link'
import { getHomeConteudo } from '@/lib/conteudo'
import { HomeForm } from './HomeForm'

export default async function ConteudoHomePage() {
  const conteudo = await getHomeConteudo()

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
        <h1 className="font-serif text-3xl font-light text-carvao">Página Inicial</h1>
      </div>
      <HomeForm inicial={conteudo} />
    </div>
  )
}
