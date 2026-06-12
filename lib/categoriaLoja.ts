import { CATEGORIAS, type Categoria } from '@/types'

const DEFAULT_CATEGORIA: Categoria = 'Utilitários'

/** Categorias legadas ainda presentes em bancos antigos. */
const LEGACY_TO_CATEGORIA: Record<string, Categoria> = {
  'Para a Mesa': 'Utilitários',
  'Para a Casa': 'Decorativos',
  Esculturais: 'Decorativos',
}

export function normalizeCategoriaLoja(categoria: string | null | undefined): Categoria {
  const trimmed = (categoria ?? '').trim()
  if (CATEGORIAS.includes(trimmed as Categoria)) return trimmed as Categoria
  if (trimmed in LEGACY_TO_CATEGORIA) return LEGACY_TO_CATEGORIA[trimmed]
  return DEFAULT_CATEGORIA
}
