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

/** Aceita códigos legados com sufixo (ex.: U57A → prefixo U, número 57). */
export function parsePecaCodigoLoose(raw: string): { prefix: PecaCodigoPrefix; number: number } | null {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(ud|u|d|c)(\d+)/i)
  if (!match) return null
  const prefix = match[1].toLowerCase() as PecaCodigoPrefix
  const number = parseInt(match[2], 10)
  if (!Number.isFinite(number) || number < 1) return null
  return { prefix, number }
}

export function getMaxPecaCodigoNumber(prefix: PecaCodigoPrefix, allCodigos: string[]): number {
  let max = 0
  for (const raw of allCodigos) {
    const parsed = parsePecaCodigoLoose(raw)
    if (parsed && parsed.prefix === prefix) max = Math.max(max, parsed.number)
  }
  return max
}

export function normalizeCodigoKey(raw: string): string {
  const parsed = parsePecaCodigo(raw)
  if (parsed) return parsed.canonical.toLowerCase()
  const familia = parseCodigoFamilia(raw)
  return familia.canonical.toLowerCase()
}

/** Código mãe e variante (-01, -02…) para peças da mesma família. */
export interface ParsedCodigoFamilia {
  mother: string
  variant: number | null
  canonical: string
}

export function parseCodigoFamilia(raw: string): ParsedCodigoFamilia {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(.+)-(\d{2})$/i)
  if (match) {
    const variant = parseInt(match[2], 10)
    const mother = match[1].toUpperCase()
    return {
      mother,
      variant: Number.isFinite(variant) ? variant : null,
      canonical: `${mother}-${match[2]}`,
    }
  }
  return { mother: trimmed.toUpperCase(), variant: null, canonical: trimmed.toUpperCase() }
}

export function getCodigoMae(raw: string): string {
  return parseCodigoFamilia(raw).mother
}

/** Próximo sufixo -01, -02… para a família do código informado. */
export function suggestNextVariantCodigo(sourceCodigo: string, allCodigos: string[]): string {
  const mother = getCodigoMae(sourceCodigo)
  const used = new Set(allCodigos.map((c) => normalizeCodigoKey(c)))

  if (!mother) {
    let n = 1
    let candidate = `-${String(n).padStart(2, '0')}`
    while (used.has(normalizeCodigoKey(candidate))) {
      n++
      candidate = `-${String(n).padStart(2, '0')}`
    }
    return candidate
  }

  let maxVariant = 0
  for (const raw of allCodigos) {
    const f = parseCodigoFamilia(raw)
    if (f.mother !== mother) continue
    if (f.variant != null) maxVariant = Math.max(maxVariant, f.variant)
  }
  if (used.has(normalizeCodigoKey(mother))) {
    maxVariant = Math.max(maxVariant, 0)
  }

  let next = maxVariant + 1
  let candidate = `${mother}-${String(next).padStart(2, '0')}`
  while (used.has(normalizeCodigoKey(candidate))) {
    next++
    candidate = `${mother}-${String(next).padStart(2, '0')}`
  }
  return candidate
}

/** Variantes -01, -02… para várias peças duplicadas de uma vez (ex.: conjunto). */
export function suggestVariantCodigosForDuplicateBatch(
  sourceCodigos: string[],
  allCodigos: string[],
): string[] {
  const working = [...allCodigos]
  return sourceCodigos.map((source) => {
    const next = suggestNextVariantCodigo(source, working)
    working.push(next)
    return next
  })
}

/** Próximo sufixo a partir de um mínimo (ex.: -02 para cópias, mantendo o original sem sufixo). */
export function suggestNextVariantCodigoFromMin(
  sourceCodigo: string,
  allCodigos: string[],
  minVariant = 2,
): string {
  const mother = getCodigoMae(sourceCodigo)
  const used = new Set(allCodigos.map((c) => normalizeCodigoKey(c)))

  if (!mother) {
    let n = minVariant
    let candidate = `-${String(n).padStart(2, '0')}`
    while (used.has(normalizeCodigoKey(candidate))) {
      n++
      candidate = `-${String(n).padStart(2, '0')}`
    }
    return candidate
  }

  let maxVariant = 0
  for (const raw of allCodigos) {
    const f = parseCodigoFamilia(raw)
    if (f.mother !== mother) continue
    if (f.variant != null) maxVariant = Math.max(maxVariant, f.variant)
  }
  if (used.has(normalizeCodigoKey(mother))) {
    maxVariant = Math.max(maxVariant, 0)
  }

  let next = Math.max(maxVariant + 1, minVariant)
  let candidate = `${mother}-${String(next).padStart(2, '0')}`
  while (used.has(normalizeCodigoKey(candidate))) {
    next++
    candidate = `${mother}-${String(next).padStart(2, '0')}`
  }
  return candidate
}

/** Variantes -02, -03… para cópias (original mantém o código mãe sem sufixo). */
export function assignVariantCodigosForSameCodeCopy(
  sourceCodigos: string[],
  allCodigos: string[],
  minVariant = 2,
): string[] {
  const working = [...allCodigos]
  return sourceCodigos.map((source) => {
    const next = suggestNextVariantCodigoFromMin(source, working, minVariant)
    working.push(next)
    return next
  })
}

export function compareCodigoFamilia(a: string, b: string): number {
  const fa = parseCodigoFamilia(a)
  const fb = parseCodigoFamilia(b)

  const pa = parsePecaCodigoLoose(fa.mother)
  const pb = parsePecaCodigoLoose(fb.mother)
  if (pa && pb) {
    const motherCmp = comparePecaCodigo(fa.mother, fb.mother)
    if (motherCmp !== 0) return motherCmp
  } else {
    const motherCmp = fa.mother.localeCompare(fb.mother, 'pt-BR', { numeric: true })
    if (motherCmp !== 0) return motherCmp
  }

  const sortVariant = (v: number | null) => (v == null ? -1 : v)
  const va = sortVariant(fa.variant)
  const vb = sortVariant(fb.variant)
  if (va !== vb) return va - vb

  return a.localeCompare(b, 'pt-BR', { numeric: true })
}

export interface CodigoListEntry {
  pecaCodigos: { id: string; codigo: string; conjuntoId?: string | null }[]
  conjuntoCodigos: { conjuntoId: string; codigo: string }[]
}

/** Duplicata entre códigos de conjuntos (conjuntos devem ser únicos entre si). */
export function isConjuntoCodigoDuplicated(
  raw: string,
  lists: CodigoListEntry,
  excludeConjuntoId?: string,
): boolean {
  const key = normalizeCodigoKey(raw)
  if (!key) return false

  for (const c of lists.conjuntoCodigos) {
    if (c.conjuntoId === excludeConjuntoId || !c.codigo.trim()) continue
    if (normalizeCodigoKey(c.codigo) === key) return true
  }
  return false
}

/** Duplicata entre peças avulsas (sem conjunto). Peças vinculadas a conjunto podem repetir código. */
export function isAvulsaPecaCodigoDuplicated(
  raw: string,
  lists: CodigoListEntry,
  excludePecaId?: string,
): boolean {
  const key = normalizeCodigoKey(raw)
  if (!key) return false

  for (const p of lists.pecaCodigos) {
    if (p.id === excludePecaId || !p.codigo.trim() || p.conjuntoId) continue
    if (normalizeCodigoKey(p.codigo) === key) return true
  }
  return false
}

/** @deprecated Use isConjuntoCodigoDuplicated ou isAvulsaPecaCodigoDuplicated */
export function isCodigoDuplicated(
  raw: string,
  lists: CodigoListEntry,
  excludePecaId?: string,
  excludeConjuntoId?: string,
): boolean {
  return isConjuntoCodigoDuplicated(raw, lists, excludeConjuntoId)
}

type ValidateOk = { ok: true; canonical: string }
type ValidateErr = { ok: false; error: string }

export function validatePecaCodigoFormat(raw: string): ValidateOk | ValidateErr {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe o código da peça.' }
  const parsed = parsePecaCodigo(trimmed)
  if (parsed) return { ok: true, canonical: parsed.canonical }
  const familia = parseCodigoFamilia(trimmed)
  if (familia.variant != null && parsePecaCodigoLoose(familia.mother)) {
    return { ok: true, canonical: familia.canonical }
  }
  return {
    ok: false,
    error: 'Use o formato C1, U2, D3, UD4 ou variante D54-01, U12-02.',
  }
}

export interface ValidatePecaCodigoOptions {
  /** Quando false, aceita códigos legados já cadastrados (ex.: U57A, D52). */
  strictFormat?: boolean
  /** Peça vinculada a conjunto — permite códigos iguais entre peças do conjunto. */
  inConjunto?: boolean
}

export function validatePecaCodigoUnique(
  raw: string,
  lists: CodigoListEntry,
  excludePecaId?: string,
  options?: ValidatePecaCodigoOptions,
): ValidateOk | ValidateErr {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe o código da peça.' }

  const checkAvulsaDuplicate = !options?.inConjunto

  if (options?.strictFormat) {
    const format = validatePecaCodigoFormat(raw)
    if (!format.ok) return format
    if (
      checkAvulsaDuplicate &&
      isAvulsaPecaCodigoDuplicated(format.canonical, lists, excludePecaId)
    ) {
      return { ok: false, error: `O código ${format.canonical} já existe em outra peça avulsa.` }
    }
    return format
  }

  if (checkAvulsaDuplicate && isAvulsaPecaCodigoDuplicated(trimmed, lists, excludePecaId)) {
    return { ok: false, error: `O código ${trimmed} já existe em outra peça avulsa.` }
  }
  return { ok: true, canonical: trimmed }
}

export function validateConjuntoCodigoUnique(
  raw: string,
  lists: CodigoListEntry,
  excludeConjuntoId?: string,
): ValidateOk | ValidateErr {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, error: 'Informe o código do conjunto.' }
  if (isConjuntoCodigoDuplicated(trimmed, lists, excludeConjuntoId)) {
    return { ok: false, error: `O código ${trimmed} já existe em outro conjunto.` }
  }
  return { ok: true, canonical: trimmed }
}

export function suggestNextPecaCodigo(prefix: PecaCodigoPrefix, allCodigos: string[]): string {
  return formatPecaCodigo(prefix, getMaxPecaCodigoNumber(prefix, allCodigos) + 1)
}

export function suggestCodigoForCategoria(categoria: string, allCodigos: string[]): string | null {
  const prefix = categoriaToPrefix(categoria)
  if (!prefix) return null
  return suggestNextPecaCodigo(prefix, allCodigos)
}

/** Próximo código de conjunto (prefixo C), considerando peças e conjuntos já cadastrados. */
export function suggestNextConjuntoCodigo(allCodigos: string[]): string {
  return suggestNextPecaCodigo('c', allCodigos)
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
  return compareCodigoFamilia(a, b)
}

export function inferPrefixFromCodigos(codigos: string[]): PecaCodigoPrefix {
  for (const raw of codigos) {
    const parsed = parsePecaCodigoLoose(raw)
    if (parsed) return parsed.prefix
  }
  return 'c'
}
