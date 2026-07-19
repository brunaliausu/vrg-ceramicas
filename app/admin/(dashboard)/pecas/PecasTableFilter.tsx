'use client'

import { useEffect, useRef, useState } from 'react'

export type TableViewFilter = 'all' | 'feira' | 'site' | `status:${string}`

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'sob_encomenda', label: 'Sob encomenda' },
  { value: 'acervo', label: 'Acervo' },
]

export function tableViewFilterLabel(filter: TableViewFilter): string {
  if (filter === 'all') return 'Todas as peças'
  if (filter === 'feira') return 'Apenas feira'
  if (filter === 'site') return 'Publicadas no site'
  if (filter.startsWith('status:')) {
    const value = filter.slice('status:'.length)
    return STATUS_FILTERS.find((s) => s.value === value)?.label ?? value
  }
  return 'Filtrar'
}

interface Props {
  value: TableViewFilter
  onChange: (filter: TableViewFilter) => void
  visibleCount: number
}

export function PecasTableFilter({ value, onChange, visibleCount }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function pick(filter: TableViewFilter) {
    onChange(filter)
    setOpen(false)
  }

  const active = value !== 'all'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 font-sans text-[11px] border px-2 py-1 transition-colors ${
          active
            ? 'border-terracota/60 bg-terracota/10 text-carvao'
            : 'border-pedra text-carvao hover:bg-areia/50'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="max-w-[9rem] truncate">{tableViewFilterLabel(value)}</span>
        <svg className={`w-3 h-3 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 z-50 min-w-[13rem] border border-pedra bg-white shadow-lg py-1"
        >
          <div className="px-3 py-1.5 font-sans text-[8px] tracking-widest uppercase text-muted">
            Visualização
          </div>
          {([
            { id: 'all' as const, label: 'Todas as peças' },
            { id: 'feira' as const, label: 'Apenas feira' },
            { id: 'site' as const, label: 'Publicadas no site' },
          ]).map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={value === opt.id}
              onClick={() => pick(opt.id)}
              className={`w-full text-left px-3 py-1.5 font-sans text-[11px] transition-colors ${
                value === opt.id ? 'bg-terracota/10 text-carvao font-medium' : 'text-carvao hover:bg-areia/60'
              }`}
            >
              {opt.label}
            </button>
          ))}

          <div className="my-1 border-t border-pedra/50" />

          <div className="px-3 py-1.5 font-sans text-[8px] tracking-widest uppercase text-muted">
            Por status
          </div>
          {STATUS_FILTERS.map((opt) => {
            const id = `status:${opt.value}` as TableViewFilter
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={value === id}
                onClick={() => pick(id)}
                className={`w-full text-left px-3 py-1.5 font-sans text-[11px] transition-colors ${
                  value === id ? 'bg-terracota/10 text-carvao font-medium' : 'text-carvao hover:bg-areia/60'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      <span className="sr-only">{visibleCount} itens visíveis com o filtro atual</span>
    </div>
  )
}
