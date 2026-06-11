export type PecaCodigoPrefix = 'c' | 'u' | 'd' | 'ud'

export const PECA_CODIGO_PREFIXES: PecaCodigoPrefix[] = ['c', 'd', 'u', 'ud']

export const CATEGORIAS_PECA = [
  'Utilitários',
  'Decorativos',
  'Conjuntos',
  'Utilitário/Decorativo',
] as const

export type CategoriaPeca = typeof CATEGORIAS_PECA[number]

const CATEGORIA_TO_PREFIX: Record<CategoriaPeca, PecaCodigoPrefix> = {
  Utilitários: 'u',
  Decorativos: 'd',
  Conjuntos: 'c',
  'Utilitário/Decorativo': 'ud',
}

export function categoriaToPrefix(categoria: string): PecaCodigoPrefix | null {
  return CATEGORIA_TO_PREFIX[categoria as CategoriaPeca] ?? null
}

export const PECA_CODIGO_PREFIX_LABELS: Record<PecaCodigoPrefix, string> = {
  c: 'C (cerâmica)',
  d: 'D',
  u: 'U',
  ud: 'UD',
}

export interface ParsedPecaCodigo {
  prefix: PecaCodigoPrefix
  number: number
  canonical: string
}

export function formatPecaCodigo(prefix: PecaCodigoPrefix, number: number): string {
  if (prefix === 'ud') return `UD${number}`
  return `${prefix.toUpperCase()}${number}`
}

export function parsePecaCodigo(raw: string): ParsedPecaCodigo | null {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(ud|u|d|c)(\d+)$/i)
  if (!match) return null
  const prefix = match[1].toLowerCase() as PecaCodigoPrefix
  const number = parseInt(match[2], 10)
  if (!Number.isFinite(number) || number < 1) return null
  return { prefix, number, canonical: formatPecaCodigo(prefix, number) }
}

export function normalizeCodigoKey(raw: string): string {
  const parsed = parsePecaCodigo(raw)
  if (parsed) return parsed.canonical.toLowerCase()
  return raw.trim().toLowerCase()
}

export interface CodigoListEntry {
  pecaCodigos: { id: string; codigo: string }[]
  conjuntoCodigos: { conjuntoId: string; codigo: string }[]
}

export function isCodigoDuplicated(
  raw: string,
  lists: CodigoListEntry,
  excludePecaId?: string,
  excludeConjuntoId?: string,
): boolean {
  const key = normalizeCodigoKey(raw)
  if (!key) return false

  for (const p of lists.pecaCodigos) {
    if (p.id === excludePecaId || !p.codigo.trim()) continue
    if (normalizeCodigoKey(p.codigo) === key) return true
  }
  for (const c of lists.conjuntoCodigos) {
    if (c.conjuntoId === excludeConjuntoId || !c.codigo.trim()) continue
    if (normalizeCodigoKey(c.codigo) === key) return true
  }
  return false
}

type ValidateOk = { ok: true; canonical: string }
type ValidateErr = { ok: false; error: string }

export function validatePecaCodigoFormat(raw: string): ValidateOk | ValidateErr {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe o código da peça.' }
  const parsed = parsePecaCodigo(trimmed)
  if (!parsed) {
    return {
      ok: false,
      error: 'Use o formato C1, U2, D3 ou UD4 (prefixo C, U, D ou UD + número).',
    }
  }
  return { ok: true, canonical: parsed.canonical }
}

export function validatePecaCodigoUnique(
  raw: string,
  lists: CodigoListEntry,
  excludePecaId?: string,
): ValidateOk | ValidateErr {
  const format = validatePecaCodigoFormat(raw)
  if (!format.ok) return format
  if (isCodigoDuplicated(format.canonical, lists, excludePecaId)) {
    return { ok: false, error: `O código ${format.canonical} já existe.` }
  }
  return format
}

export function validateConjuntoCodigoUnique(
  raw: string,
  lists: CodigoListEntry,
  excludeConjuntoId?: string,
): ValidateOk | ValidateErr {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe o código do conjunto.' }
  if (isCodigoDuplicated(trimmed, lists, undefined, excludeConjuntoId)) {
    return { ok: false, error: `O código ${trimmed} já existe.` }
  }
  return { ok: true, canonical: trimmed }
}

export function suggestNextPecaCodigo(prefix: PecaCodigoPrefix, allCodigos: string[]): string {
  let max = 0
  for (const raw of allCodigos) {
    const parsed = parsePecaCodigo(raw)
    if (parsed && parsed.prefix === prefix) max = Math.max(max, parsed.number)
  }
  return formatPecaCodigo(prefix, max + 1)
}

export function suggestCodigoForCategoria(categoria: string, allCodigos: string[]): string | null {
  const prefix = categoriaToPrefix(categoria)
  if (!prefix) return null
  return suggestNextPecaCodigo(prefix, allCodigos)
}

const PREFIX_SORT_ORDER: Record<PecaCodigoPrefix, number> = { c: 0, d: 1, u: 2, ud: 3 }

export function comparePecaCodigo(a: string, b: string): number {
  const pa = parsePecaCodigo(a)
  const pb = parsePecaCodigo(b)
  if (!pa && !pb) return a.localeCompare(b, 'pt-BR', { numeric: true })
  if (!pa) return 1
  if (!pb) return -1
  if (pa.prefix !== pb.prefix) return PREFIX_SORT_ORDER[pa.prefix] - PREFIX_SORT_ORDER[pb.prefix]
  return pa.number - pb.number
}

export function compareCodigoDisplay(a: string, b: string): number {
  const pa = parsePecaCodigo(a)
  const pb = parsePecaCodigo(b)
  if (pa && pb) return comparePecaCodigo(a, b)
  return a.localeCompare(b, 'pt-BR', { numeric: true })
}

export function inferPrefixFromCodigos(codigos: string[]): PecaCodigoPrefix {
  for (const raw of codigos) {
    const parsed = parsePecaCodigo(raw)
    if (parsed) return parsed.prefix
  }
  return 'c'
}
