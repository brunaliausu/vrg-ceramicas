'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatPreco } from '@/lib/utils'
import { linkCompra, linkCompraPecaDoConjunto } from '@/lib/whatsapp'

export interface ConjuntoPecaSite {
  id: string
  codigo: string | null
  nome: string | null
  dimensoes: string | null
  fotos: string[] | null
  status: string | null
  preco_venda: number | null
}

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível',
  vendido: 'Vendido',
  sob_encomenda: 'Sob encomenda',
  acervo: 'Acervo',
}

interface Props {
  conjuntoNome: string
  conjuntoSlug: string
  conjuntoPreco: number | null
  vendaModo: string
  pieces: ConjuntoPecaSite[]
}

export function ConjuntoPurchaseOptions({
  conjuntoNome,
  conjuntoSlug,
  conjuntoPreco,
  vendaModo,
  pieces,
}: Props) {
  const [mostrarPecas, setMostrarPecas] = useState(false)
  const permiteAvulsa = vendaModo === 'conjunto_e_pecas'
  const conjuntoDisponivel = conjuntoPreco != null && conjuntoPreco > 0

  return (
    <div className="space-y-3">
      {conjuntoDisponivel && (
        <a
          href={linkCompra(conjuntoNome, conjuntoPreco!, conjuntoSlug)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-carvao text-cru font-sans text-sm tracking-wide py-4 hover:bg-carvao/85 transition-colors"
        >
          Comprar conjunto completo pelo WhatsApp →
        </a>
      )}

      {permiteAvulsa && pieces.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setMostrarPecas((v) => !v)}
            className="flex items-center justify-between w-full border border-carvao/30 px-6 py-3 font-sans text-sm text-carvao/80 hover:border-carvao hover:bg-areia/40 transition-colors"
          >
            <span>Comprar apenas uma peça do conjunto</span>
            <span className="text-muted transition-transform" style={{ transform: mostrarPecas ? 'rotate(45deg)' : undefined }}>+</span>
          </button>

          {mostrarPecas && (
            <div className="border border-t-0 border-carvao/30 divide-y divide-pedra/40">
              <p className="px-4 py-3 font-sans text-xs text-muted bg-areia/30">
                Selecione a peça que deseja. O preço é referente à peça avulsa.
              </p>
              {pieces.map((peca) => {
                const foto = peca.fotos?.[0]
                const nome = peca.nome || peca.codigo || 'Peça'
                const codigo = peca.codigo ?? ''
                const status = peca.status ?? ''
                const statusLabel = STATUS_LABEL[status] ?? status
                const disponivel = status === 'disponivel'
                const preco = peca.preco_venda

                return (
                  <div key={peca.id} className="flex gap-4 px-4 py-4 items-center">
                    <div className="relative w-14 h-14 shrink-0 bg-areia border border-pedra overflow-hidden">
                      {foto ? (
                        <Image src={foto} alt={nome} fill sizes="56px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted/40 text-xs">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-carvao/60">{codigo || '—'}</p>
                      <p className="font-sans text-sm text-carvao font-medium truncate">{nome}</p>
                      {peca.dimensoes && (
                        <p className="font-sans text-xs text-muted mt-0.5">{peca.dimensoes}</p>
                      )}
                      <p className="font-sans text-[10px] uppercase tracking-wide text-muted mt-1">{statusLabel}</p>
                      {disponivel && preco != null && preco > 0 && (
                        <p className="font-sans text-sm text-carvao mt-1">{formatPreco(preco)}</p>
                      )}
                    </div>
                    {disponivel ? (
                      <a
                        href={linkCompraPecaDoConjunto(conjuntoNome, conjuntoSlug, nome, codigo, preco)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 font-sans text-xs text-terracota border border-terracota/40 px-3 py-2 hover:bg-terracota hover:text-cru transition-colors whitespace-nowrap"
                      >
                        WhatsApp →
                      </a>
                    ) : (
                      <span className="shrink-0 font-sans text-[10px] text-muted uppercase tracking-wide">
                        {status === 'vendido' ? 'Vendida' : 'Consultar'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {permiteAvulsa && pieces.length > 0 && (
        <p className="font-sans text-[10px] text-muted/70 leading-relaxed">
          Este conjunto pode ser vendido completo ou com peças avulsas, conforme disponibilidade de cada item.
        </p>
      )}
    </div>
  )
}
