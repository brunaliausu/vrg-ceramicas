import { cn } from '@/lib/utils'
import type { Status } from '@/types'

const config: Record<Status, { label: string; classes: string }> = {
  Rascunho: {
    label: 'Rascunho',
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  Disponível: {
    label: 'Disponível',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  Vendido: {
    label: 'Peça vendida',
    classes: 'bg-pedra/40 text-muted border-pedra',
  },
  'Sob Encomenda': {
    label: 'Sob Encomenda',
    classes: 'bg-areia text-carvao border-pedra',
  },
}

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const { label, classes } = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center border font-sans font-medium tracking-wide',
        size === 'sm' && 'text-[10px] px-2 py-0.5',
        size === 'md' && 'text-xs px-3 py-1',
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}
