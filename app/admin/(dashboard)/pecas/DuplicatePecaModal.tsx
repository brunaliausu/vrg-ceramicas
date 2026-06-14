'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/** new-code = próximo código livre; same-code = variante -01, -02 do código mãe */
export type DuplicatePecaMode = 'new-code' | 'same-code'

interface Props {
  codigo: string
  nome: string
  kind?: 'peca' | 'conjunto'
  detail?: string
  onConfirm: (mode: DuplicatePecaMode) => void
  onCancel: () => void
}

export function DuplicatePecaModal({ codigo, nome, kind = 'peca', detail, onConfirm, onCancel }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const titulo = [codigo, nome].filter(Boolean).join(' — ') || (kind === 'conjunto' ? 'Conjunto' : 'Peça')
  const heading = kind === 'conjunto' ? 'Duplicar conjunto' : 'Duplicar peça'
  const exemploVariante = codigo ? `${codigo.replace(/-\d{2}$/, '')}-01` : 'U1-01'

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-carvao/40" onClick={onCancel}>
      <div
        className="bg-cru border border-pedra w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="duplicate-peca-title"
      >
        <div className="px-6 py-5 border-b border-pedra/50">
          <p id="duplicate-peca-title" className="font-sans text-[10px] tracking-widest uppercase text-terracota mb-1">
            {heading}
          </p>
          <h2 className="font-serif text-xl text-carvao">{titulo}</h2>
          {detail && <p className="font-sans text-xs text-muted mt-1">{detail}</p>}
          <p className="font-sans text-sm text-muted mt-2 leading-relaxed">
            {kind === 'conjunto'
              ? 'Como deseja tratar o código das peças do conjunto?'
              : 'Como deseja tratar o código da cópia?'}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">
          <button
            type="button"
            onClick={() => onConfirm('new-code')}
            className="w-full text-left border border-pedra px-4 py-3 hover:border-terracota hover:bg-areia/40 transition-colors"
          >
            <p className="font-sans text-sm font-medium text-carvao">Criar um novo código</p>
            <p className="font-sans text-xs text-muted mt-1">
              {kind === 'conjunto'
                ? 'Gera o próximo código disponível para cada peça (ex.: U5, U6…).'
                : 'Gera o próximo código disponível na sequência da categoria.'}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onConfirm('same-code')}
            className="w-full text-left border border-pedra px-4 py-3 hover:border-terracota hover:bg-areia/40 transition-colors"
          >
            <p className="font-sans text-sm font-medium text-carvao">Manter o mesmo código</p>
            <p className="font-sans text-xs text-muted mt-1">
              {kind === 'conjunto'
                ? <>O original mantém o código. A cópia recebe sufixo <span className="font-mono">-02</span>, <span className="font-mono">-03</span>… (conjunto e peças) e só é criada ao salvar.</>
                : <>O original mantém o código. A cópia recebe sufixo <span className="font-mono">-02</span>, <span className="font-mono">-03</span>… e só é criada ao salvar.</>}
            </p>
          </button>
        </div>

        <div className="px-6 py-3 border-t border-pedra/50 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
