import { compareCodigoDisplay } from './codigoUtils'

export interface ConjuntoPecaLink {
  conjunto_id: string
  peca_id: string
  ordem: number
  /** Unidades desta peça neste conjunto (padrão 1). */
  quantidade?: number
}

export interface PecaConjuntoRowLike {
  id: string
  codigo?: string
  conjunto_id: string | null
  conjunto_codigo: string
  conjunto_nome: string
  ordem: number | null
}

export function buildLinksFromRows(rows: PecaConjuntoRowLike[]): ConjuntoPecaLink[] {
  const links: ConjuntoPecaLink[] = []
  const seen = new Set<string>()
  for (const row of rows) {
    if (!row.conjunto_id) continue
    const key = `${row.conjunto_id}:${row.id}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      conjunto_id: row.conjunto_id,
      peca_id: row.id,
      ordem: row.ordem ?? 0,
      quantidade: 1,
    })
  }
  return links
}

export function mergeLinksWithRows(
  dbLinks: ConjuntoPecaLink[],
  rows: PecaConjuntoRowLike[],
): ConjuntoPecaLink[] {
  const map = new Map<string, ConjuntoPecaLink>()
  for (const link of dbLinks) {
    map.set(`${link.conjunto_id}:${link.peca_id}`, link)
  }
  for (const link of buildLinksFromRows(rows)) {
    const key = `${link.conjunto_id}:${link.peca_id}`
    if (!map.has(key)) map.set(key, link)
  }
  return [...map.values()]
}

export function pecaConjuntoIds(
  pecaId: string,
  row: PecaConjuntoRowLike,
  links: ConjuntoPecaLink[],
): string[] {
  const ids = new Set<string>()
  if (row.conjunto_id) ids.add(row.conjunto_id)
  for (const link of links) {
    if (link.peca_id === pecaId) ids.add(link.conjunto_id)
  }
  return [...ids]
}

export function pecaInConjunto(
  pecaId: string,
  conjuntoId: string,
  row: PecaConjuntoRowLike,
  links: ConjuntoPecaLink[],
): boolean {
  if (row.conjunto_id === conjuntoId) return true
  return links.some((l) => l.conjunto_id === conjuntoId && l.peca_id === pecaId)
}

export function pecaHasAnyConjunto(
  pecaId: string,
  row: PecaConjuntoRowLike,
  links: ConjuntoPecaLink[],
): boolean {
  return pecaConjuntoIds(pecaId, row, links).length > 0
}

export function getConjuntoMeta(
  conjuntoId: string,
  rows: PecaConjuntoRowLike[],
): { codigo: string; nome: string } {
  const ref = rows.find((r) => r.conjunto_id === conjuntoId)
  if (ref) return { codigo: ref.conjunto_codigo, nome: ref.conjunto_nome }
  return { codigo: '', nome: '' }
}

export function linkOrdemForPeca(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
  pecaId: string,
  rowOrdem: number | null,
): number {
  const link = links.find((l) => l.conjunto_id === conjuntoId && l.peca_id === pecaId)
  if (link) return link.ordem
  return rowOrdem ?? 0
}

export function getConjuntoPiecesFromRows<T extends PecaConjuntoRowLike>(
  rows: T[],
  conjuntoId: string,
  links: ConjuntoPecaLink[],
): T[] {
  return rows
    .filter((r) => pecaInConjunto(r.id, conjuntoId, r, links))
    .sort(
      (a, b) =>
        linkOrdemForPeca(links, conjuntoId, a.id, a.ordem ?? null)
        - linkOrdemForPeca(links, conjuntoId, b.id, b.ordem ?? null)
        || compareCodigoDisplay(a.codigo ?? '', b.codigo ?? ''),
    )
}

export function linkQuantidade(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
  pecaId: string,
): number {
  const link = links.find((l) => l.conjunto_id === conjuntoId && l.peca_id === pecaId)
  return Math.max(1, link?.quantidade ?? 1)
}

export function quantidadeMapForConjunto(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const link of links) {
    if (link.conjunto_id === conjuntoId) {
      map.set(link.peca_id, Math.max(1, link.quantidade ?? 1))
    }
  }
  return map
}

export function updateLinkQuantidade(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
  pecaId: string,
  quantidade: number,
): ConjuntoPecaLink[] {
  const q = Math.max(1, Math.floor(quantidade) || 1)
  return links.map((l) =>
    l.conjunto_id === conjuntoId && l.peca_id === pecaId
      ? { ...l, quantidade: q }
      : l,
  )
}

export function linkRowsForConjunto(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
): { peca_id: string; ordem: number; quantidade: number }[] {
  return links
    .filter((l) => l.conjunto_id === conjuntoId)
    .sort((a, b) => a.ordem - b.ordem)
    .map((l) => ({
      peca_id: l.peca_id,
      ordem: l.ordem,
      quantidade: Math.max(1, l.quantidade ?? 1),
    }))
}

export function collectConjuntoIds(
  rows: PecaConjuntoRowLike[],
  links: ConjuntoPecaLink[],
): string[] {
  const ids = new Set<string>()
  for (const row of rows) {
    if (row.conjunto_id) ids.add(row.conjunto_id)
  }
  for (const link of links) ids.add(link.conjunto_id)
  return [...ids]
}

export function addLink(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
  pecaId: string,
  ordem: number,
  quantidade = 1,
): ConjuntoPecaLink[] {
  if (links.some((l) => l.conjunto_id === conjuntoId && l.peca_id === pecaId)) {
    return links
  }
  return [...links, {
    conjunto_id: conjuntoId,
    peca_id: pecaId,
    ordem,
    quantidade: Math.max(1, quantidade),
  }]
}

export function removeLink(
  links: ConjuntoPecaLink[],
  conjuntoId: string,
  pecaId: string,
): ConjuntoPecaLink[] {
  return links.filter((l) => !(l.conjunto_id === conjuntoId && l.peca_id === pecaId))
}

export function linksForConjunto(links: ConjuntoPecaLink[], conjuntoId: string): ConjuntoPecaLink[] {
  return links.filter((l) => l.conjunto_id === conjuntoId)
}
