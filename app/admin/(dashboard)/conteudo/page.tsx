import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CONTEUDO_ADMIN_SECOES } from '@/lib/conteudoAdmin'

async function getUltimasAtualizacoes() {
  try {
    const supabase = await createClient()
    const ids = CONTEUDO_ADMIN_SECOES.map((s) => s.id)
    const { data } = await supabase
      .from('conteudo_site')
      .select('id, atualizado_em')
      .in('id', ids)
    return data ?? []
  } catch {
    return []
  }
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function ConteudoIndexPage() {
  const atualizacoes = await getUltimasAtualizacoes()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-carvao">Conteúdo do site</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Edite os textos e imagens das páginas públicas do menu principal.
        </p>
      </div>

      <div className="grid gap-4">
        {CONTEUDO_ADMIN_SECOES.map((s) => {
          const ult = atualizacoes.find((a) => a.id === s.id)
          return (
            <Link
              key={s.id}
              href={s.href}
              className="bg-white border border-pedra p-6 flex items-start gap-5 hover:border-terracota transition-colors group"
            >
              <div className="w-12 h-12 bg-areia flex items-center justify-center font-serif text-2xl text-terracota flex-shrink-0 group-hover:bg-terracota/10 transition-colors">
                {s.icone}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p className="font-sans text-sm font-medium text-carvao">{s.titulo}</p>
                  {ult?.atualizado_em && (
                    <p className="font-sans text-[10px] text-muted">
                      Atualizado em {formatData(ult.atualizado_em)}
                    </p>
                  )}
                </div>
                <p className="font-sans text-xs text-muted mt-1 leading-relaxed">{s.descricao}</p>
              </div>
              <span className="font-sans text-xs text-terracota opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
                Editar →
              </span>
            </Link>
          )
        })}
      </div>

      <div className="mt-8 bg-areia border border-pedra p-5 space-y-3">
        <p className="font-sans text-xs text-carvao/70 leading-relaxed">
          <strong className="text-carvao">Dica:</strong> Os textos e imagens editados aqui aparecem imediatamente no site. Para cadastrar peças (nome, preço, fotos), acesse{' '}
          <Link href="/admin/pecas" className="text-terracota underline">Peças & Estoque</Link>.
        </p>
        <p className="font-sans text-xs text-carvao/70 leading-relaxed">
          A seção &ldquo;A história desta peça&rdquo; nas páginas de produto pode ser editada em{' '}
          <Link href="/admin/conteudo/produto-historia" className="text-terracota underline">História do Produto</Link>.
        </p>
      </div>
    </div>
  )
}
