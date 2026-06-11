'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  PDF_COLUMN_DEFS,
  type PdfColumnId,
  DEFAULT_PDF_COLUMNS,
} from './generatePecasPdf'

interface Props {
  totalSelectedCount: number
  feiraSelectedCount: number
  onConfirm: (columns: PdfColumnId[], filterFeira: boolean) => void | Promise<void>
  onCancel: () => void
}

const LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1'

export function PecasPdfModal({ totalSelectedCount, feiraSelectedCount, onConfirm, onCancel }: Props) {
  const [columns, setColumns] = useState<Set<PdfColumnId>>(() => new Set(DEFAULT_PDF_COLUMNS))
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const filterFeira = columns.has('fenearte')
  const exportCount = useMemo(
    () => (filterFeira ? feiraSelectedCount : totalSelectedCount),
    [filterFeira, feiraSelectedCount, totalSelectedCount],
  )

  function toggleColumn(id: PdfColumnId) {
    setColumns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setError(null)
  }

  function selectAllColumns() {
    setColumns(new Set(PDF_COLUMN_DEFS.map((c) => c.id)))
    setError(null)
  }

  async function handleConfirm() {
    if (columns.size === 0) {
      setError('Selecione ao menos uma coluna.')
      return
    }
    if (filterFeira && feiraSelectedCount === 0) {
      setError('Nenhum item selecionado está marcado para exibição em feira.')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      await onConfirm(Array.from(columns), filterFeira)
    } catch {
      setError('Erro ao gerar o PDF. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white border border-pedra shadow-2xl w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl text-carvao mb-1">Gerar PDF</h2>
        <p className="font-sans text-sm text-muted mb-1">
          {exportCount} item(ns) selecionado(s). Marque as colunas que deseja incluir no arquivo.
        </p>
        <p className="font-sans text-xs text-muted mb-4">
          A foto principal de cada item é incluída automaticamente na primeira coluna.
        </p>
        {filterFeira && (
          <p className="font-sans text-xs text-amber-700 mb-4">
            Com a coluna Feira ativa, apenas itens com exibição em feira marcada como Sim entram no PDF.
          </p>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className={LBL}>Colunas do PDF</label>
            <button
              type="button"
              onClick={selectAllColumns}
              className="font-sans text-[10px] text-terracota hover:text-carvao transition-colors"
            >
              Marcar todas
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 border border-pedra/60 p-3 bg-cru/30">
            {PDF_COLUMN_DEFS.map((col) => (
              <label
                key={col.id}
                className="flex items-center gap-2 font-sans text-sm text-carvao cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={columns.has(col.id)}
                  onChange={() => toggleColumn(col.id)}
                  className="w-4 h-4 accent-carvao shrink-0"
                />
                {col.label}
                {col.id === 'fenearte' && (
                  <span className="font-sans text-[10px] text-muted">(filtra Sim)</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="font-sans text-xs text-red-600 mb-3">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={generating}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={exportCount === 0 || generating}
            className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? 'Gerando PDF…' : 'Gerar PDF'}
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
