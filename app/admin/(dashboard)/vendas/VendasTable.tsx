'use client'

import NextImage from 'next/image'

export interface VendaRow {
  id: string
  codigo: string | null
  nome: string | null
  status: string | null
  fotos: string[] | null
  valor_venda: number | null
  local_venda: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  conjunto_codigo: string | null
  conjunto_nome: string | null
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Thumb({ src, alt }: { src: string; alt: string }) {
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
  }
  return <NextImage src={src} alt={alt} fill sizes="56px" className="object-cover" />
}

const TH = 'font-sans text-[10px] tracking-widest uppercase text-muted py-3 px-3 whitespace-nowrap'

export function VendasTable({ rows }: { rows: VendaRow[] }) {
  const total = rows.reduce((s, r) => s + (r.valor_venda ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex-1 min-h-0 border border-pedra bg-white overflow-auto max-h-[calc(100vh-14rem)]">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F3F0EB] border-b border-pedra">
              <th className={`${TH} text-left w-[72px]`}>Foto</th>
              <th className={`${TH} text-left`}>Código</th>
              <th className={`${TH} text-left`}>Nome</th>
              <th className={`${TH} text-left border-l border-pedra/60`}>Status</th>
              <th className={`${TH} text-right border-l border-pedra/60`}>Preço de venda</th>
              <th className={`${TH} text-left`}>Local</th>
              <th className={`${TH} text-left`}>Cliente</th>
              <th className={`${TH} text-left`}>Telefone</th>
              <th className={`${TH} text-left`}>E-mail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pedra/40">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center font-sans text-sm text-muted">
                  Nenhuma venda registrada ainda.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const foto = row.fotos?.[0]
                const nome = row.nome || row.codigo || '—'
                const conjuntoHint = row.conjunto_codigo
                  ? `Conjunto ${row.conjunto_codigo}${row.conjunto_nome ? ` — ${row.conjunto_nome}` : ''}`
                  : null
                return (
                  <tr key={row.id} className="hover:bg-cru/30 transition-colors">
                    <td className="px-3 py-2">
                      <div className="relative w-14 h-14 bg-areia border border-pedra overflow-hidden">
                        {foto ? <Thumb src={foto} alt={nome} /> : (
                          <div className="w-full h-full flex items-center justify-center text-muted/30 text-xs">—</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-sm text-carvao">{row.codigo || '—'}</td>
                    <td className="px-3 py-2">
                      <p className="font-sans text-sm text-carvao">{row.nome || '—'}</p>
                      {conjuntoHint && (
                        <p className="font-sans text-[10px] text-terracota/80 mt-0.5">{conjuntoHint}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 border-l border-pedra/30">
                      <span className="font-sans text-xs text-carvao/80 uppercase tracking-wide">Vendido</span>
                    </td>
                    <td className="px-3 py-2 text-right border-l border-pedra/30">
                      {row.valor_venda != null && row.valor_venda > 0 ? (
                        <span className="font-sans text-sm font-bold text-terracota tabular-nums">
                          R$ {fmt(row.valor_venda)}
                        </span>
                      ) : (
                        <span className="font-sans text-sm text-muted/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-sans text-sm text-carvao/80">{row.local_venda || '—'}</td>
                    <td className="px-3 py-2 font-sans text-sm text-carvao/80">{row.cliente_nome || '—'}</td>
                    <td className="px-3 py-2 font-sans text-sm text-carvao/80 tabular-nums">{row.cliente_telefone || '—'}</td>
                    <td className="px-3 py-2 font-sans text-sm text-carvao/80">{row.cliente_email || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex justify-end items-center gap-3 px-4 py-4 bg-[#F3F0EB] border border-pedra">
          <span className="font-sans text-xs tracking-widest uppercase text-muted">Total vendido</span>
          <span className="font-serif text-2xl font-light text-carvao tabular-nums">R$ {fmt(total)}</span>
          <span className="font-sans text-xs text-muted">({rows.length} {rows.length === 1 ? 'peça' : 'peças'})</span>
        </div>
      )}
    </div>
  )
}
