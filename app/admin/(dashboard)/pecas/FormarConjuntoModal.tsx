'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  pieceCount: number
  externalError?: string | null
  onConfirm: (codigo: string, nome: string) => void
  onCancel: () => void
}

const INP =
  'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota bg-white'
const LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1'

export function FormarConjuntoModal({ pieceCount, externalError, onConfirm, onCancel }: Props) {
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSubmit() {
    if (!codigo.trim()) {
      setError('Informe o código do conjunto.')
      return
    }
    setError(null)
    onConfirm(codigo.trim(), nome.trim())
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white border border-pedra shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl text-carvao mb-1">Formar conjunto</h2>
        <p className="font-sans text-sm text-muted mb-5">
          {pieceCount} peça(s) avulsa(s) selecionada(s) serão agrupadas neste conjunto.
        </p>

        <div className="space-y-4">
          <div>
            <label className={LBL}>Código do conjunto *</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setError(null) }}
              placeholder="Ex: CJ-001"
              className={`${INP} font-mono`}
              autoFocus
            />
          </div>
          <div>
            <label className={LBL}>Nome do conjunto</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome (opcional)"
              className={INP}
            />
          </div>
        </div>

        {(error || externalError) && <p className="font-sans text-xs text-red-600 mt-3">{error ?? externalError}</p>}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors"
          >
            Formar conjunto
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
