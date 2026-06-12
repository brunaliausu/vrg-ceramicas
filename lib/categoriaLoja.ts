import { CATEGORIAS, type Categoria } from '@/types'

const DEFAULT_CATEGORIA: Categoria = 'Utilitários'

/** Categorias legadas ainda presentes em bancos antigos. */
const LEGACY_TO_CATEGORIA: Record<string, Categoria> = {
  'Para a Mesa': 'Utilitários',
  'Para a Casa': 'Decorativos',
  Esculturais: 'Decorativos',
}

/** Mapeamento inverso: admin → constraint antiga da tabela produtos. */
const CATEGORIA_TO_LEGACY_PRODUTOS: Record<Categoria, string> = {
  'Utilitários': 'Para a Mesa',
  'Decorativos': 'Esculturais',
  'Conjuntos': 'Para a Casa',
  'Utilitário/Decorativo': 'Para a Mesa',
}

export function normalizeCategoriaLoja(categoria: string | null | undefined): Categoria {
  const trimmed = (categoria ?? '').trim()
  if (CATEGORIAS.includes(trimmed as Categoria)) return trimmed as Categoria
  if (trimmed in LEGACY_TO_CATEGORIA) return LEGACY_TO_CATEGORIA[trimmed]
  return DEFAULT_CATEGORIA
}

/** Exibição no site — sempre usa os nomes atuais do admin. */
export function formatCategoriaDisplay(categoria: string | null | undefined): string {
  return normalizeCategoriaLoja(categoria)
}

/**
 * Valor gravado na tabela produtos.
 * Enquanto PRODUTOS_CATEGORIA_MIGRATED não estiver true, usa categorias legadas
 * compatíveis com a constraint antiga do banco.
 * Após executar supabase-fix-categoria-produtos.sql, defina PRODUTOS_CATEGORIA_MIGRATED=true.
 */
export function categoriaParaTabelaProdutos(categoria: string | null | undefined): string {
  const normalized = normalizeCategoriaLoja(categoria)
  if (process.env.PRODUTOS_CATEGORIA_MIGRATED === 'true') {
    return normalized
  }
  return CATEGORIA_TO_LEGACY_PRODUTOS[normalized] ?? normalized
}

/** Filtros da loja — inclui nomes legados até a migração do banco. */
export function categoriasParaFiltroLoja(categoria: Categoria): string[] {
  if (process.env.PRODUTOS_CATEGORIA_MIGRATED === 'true') {
    return [categoria]
  }
  const legacy = CATEGORIA_TO_LEGACY_PRODUTOS[categoria]
  return legacy && legacy !== categoria ? [categoria, legacy] : [categoria]
}
