'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  deleting?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = 'Excluir',
  deleting = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, deleting])

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-carvao/40" onClick={() => !deleting && onCancel()}>
      <div
        className="bg-cru border border-pedra w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="confirm-delete-title"
      >
        <div className="px-6 py-5 border-b border-pedra/50">
          <p className="font-sans text-[10px] tracking-widest uppercase text-red-600 mb-1">Confirmação</p>
          <h2 id="confirm-delete-title" className="font-serif text-xl text-carvao">{title}</h2>
          <p className="font-sans text-sm text-muted mt-2 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="font-sans text-xs bg-red-600 text-white px-5 py-2 hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {deleting ? 'Excluindo…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
