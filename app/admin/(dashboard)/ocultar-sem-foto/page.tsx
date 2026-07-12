import Link from 'next/link'
import { listarPublicadosSemFoto } from './actions'
import { OcultarSemFotoClient } from './OcultarSemFotoClient'

export default async function OcultarSemFotoPage() {
  const items = await listarPublicadosSemFoto()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/pecas" className="font-sans text-xs text-muted hover:text-carvao transition-colors">
          ← Voltar
        </Link>
        <h1 className="font-serif text-3xl font-light text-carvao">Ocultar peças sem foto</h1>
      </div>

      <p className="font-sans text-sm text-carvao/70 mb-6 max-w-2xl">
        Desmarca <strong>Exibir no site</strong> para peças avulsas e conjuntos publicados sem nenhuma foto.
        Os itens permanecem no estoque (admin) — somente saem da loja pública.
      </p>

      <p className="font-sans text-xs text-carvao/55 mb-6 max-w-2xl">
        Preferiu rodar no Supabase? Use o arquivo{' '}
        <code className="bg-areia px-1 py-0.5">supabase-ocultar-sem-foto.sql</code>{' '}
        (SQL Editor → colar → Run). Não exclui nada do estoque.
      </p>

      {items.length > 0 ? (
        <div className="border border-pedra mb-6 max-h-[28rem] overflow-auto">
          <table className="w-full font-sans text-sm">
            <thead className="bg-areia text-left text-xs text-carvao/60 sticky top-0">
              <tr>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Na loja</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.tipo}:${item.id}`} className="border-t border-pedra">
                  <td className="px-4 py-3 capitalize">{item.tipo === 'conjunto' ? 'Conjunto' : 'Peça'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.codigo || '—'}</td>
                  <td className="px-4 py-3">{item.nome.trim() || 'Sem nome'}</td>
                  <td className="px-4 py-3">{item.naLoja ? 'Sim' : 'Não'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="font-sans text-sm text-carvao/60 mb-6">
          Nenhum item publicado sem foto encontrado.
        </p>
      )}

      <OcultarSemFotoClient items={items} />
    </div>
  )
}
