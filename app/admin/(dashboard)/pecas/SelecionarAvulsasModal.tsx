'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface AvulsaPickerItem {
  id: string
  codigo: string
  nome: string
  photoSrc: string | null
}

interface Props {
  title: string
  subtitle?: string
  items: AvulsaPickerItem[]
  multiSelect?: boolean
  confirmLabel?: string
  showCreateBlank?: boolean
  createBlankLabel?: string
  onConfirm: (ids: string[]) => void
  onCreateBlank?: () => void
  onCancel: () => void
}

function PickerThumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="w-12 h-12 bg-areia border border-pedra/50 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className="w-12 h-12 object-cover border border-pedra/50 shrink-0" />
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-12 h-12 object-cover border border-pedra/50 shrink-0" />
}

export function SelecionarAvulsasModal({
  title,
  subtitle,
  items,
  multiSelect = true,
  confirmLabel,
  showCreateBlank = false,
  createBlankLabel = 'Cadastrar peça nova em branco',
  onConfirm,
  onCreateBlank,
  onCancel,
}: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.codigo.toLowerCase().includes(q) ||
        item.nome.toLowerCase().includes(q),
    )
  }, [items, query])

  function toggle(id: string) {
    setSelected((prev) => {
      if (!multiSelect) return new Set([id])
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    if (selected.size === 0) return
    onConfirm(Array.from(selected))
  }

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white border border-pedra shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-pedra/40 shrink-0">
          <h2 className="font-serif text-xl text-carvao mb-1">{title}</h2>
          {subtitle && <p className="font-sans text-sm text-muted">{subtitle}</p>}
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código ou nome…"
            className="mt-4 w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota bg-white"
            autoFocus
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 font-sans text-sm text-muted text-center">
              {items.length === 0
                ? 'Nenhuma peça avulsa disponível.'
                : 'Nenhum resultado para a busca.'}
            </p>
          ) : (
            <ul className="divide-y divide-pedra/30">
              {filtered.map((item) => {
                const isSelected = selected.has(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                        isSelected ? 'bg-terracota/10' : 'hover:bg-areia/50'
                      }`}
                    >
                      {multiSelect && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 accent-carvao shrink-0 pointer-events-none"
                        />
                      )}
                      <PickerThumb src={item.photoSrc} alt={item.nome || item.codigo || 'Peça'} />
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-semibold text-carvao">{item.codigo || '—'}</p>
                        <p className="font-sans text-sm text-muted truncate">{item.nome || 'Sem nome'}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="p-5 border-t border-pedra/40 shrink-0 flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
          {showCreateBlank && onCreateBlank && (
            <button
              type="button"
              onClick={onCreateBlank}
              className="font-sans text-xs text-terracota hover:text-carvao border border-dashed border-terracota/50 px-4 py-2 hover:bg-areia/40 transition-colors"
            >
              {createBlankLabel}
            </button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:flex-1">
            <button
              type="button"
              onClick={onCancel}
              className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {confirmLabel ?? (multiSelect ? `Adicionar (${selected.size})` : 'Selecionar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
