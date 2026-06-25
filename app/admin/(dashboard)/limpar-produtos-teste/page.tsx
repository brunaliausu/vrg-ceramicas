import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PRODUTOS_TESTE_LEGADO } from '@/lib/produtos-teste-legado'
import { LimparProdutosTesteClient } from './LimparProdutosTesteClient'

export default async function LimparProdutosTestePage() {
  const supabase = await createClient()
  const ids = PRODUTOS_TESTE_LEGADO.map((p) => p.id)

  const { data: rows } = await supabase
    .from('produtos')
    .select('id, nome, categoria, status')
    .in('id', ids)
    .order('nome')

  const metaById = new Map(PRODUTOS_TESTE_LEGADO.map((p) => [p.id, p]))
  const produtos = (rows ?? []).map((row) => {
    const meta = metaById.get(row.id)
    return {
      id: row.id,
      nome: row.nome,
      categoria: row.categoria,
      status: row.status,
      lojaLabel: meta?.lojaLabel ?? row.categoria,
    }
  })

  const missing = PRODUTOS_TESTE_LEGADO.filter(
    (expected) => !produtos.some((p) => p.id === expected.id),
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/pecas" className="font-sans text-xs text-muted hover:text-carvao transition-colors">
          ← Voltar
        </Link>
        <h1 className="font-serif text-3xl font-light text-carvao">Remover peças de teste</h1>
      </div>

      <p className="font-sans text-sm text-carvao/70 mb-6 max-w-2xl">
        Exclusão segura das 6 peças cadastradas em testes (identificadas por ID e nome no banco).
        Outras peças com nomes parecidos não serão afetadas.
      </p>

      {produtos.length > 0 ? (
        <div className="border border-pedra mb-6">
          <table className="w-full font-sans text-sm">
            <thead className="bg-areia text-left text-xs text-carvao/60">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Categoria (loja)</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id} className="border-t border-pedra">
                  <td className="px-4 py-3">{p.nome.trim() || p.nome}</td>
                  <td className="px-4 py-3">{p.lojaLabel}</td>
                  <td className="px-4 py-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-sm text-carvao/60 mb-6">
          Nenhuma das peças de teste está mais na loja.
        </p>
      )}

      {missing.length > 0 && (
        <p className="font-sans text-xs text-carvao/50 mb-4">
          Já removidas ou ausentes: {missing.map((p) => p.nome.trim()).join(', ')}
        </p>
      )}

      <LimparProdutosTesteClient produtos={produtos} />
    </div>
  )
}
