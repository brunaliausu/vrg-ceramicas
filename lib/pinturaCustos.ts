import type { CustoItem } from '@/app/admin/(dashboard)/pecas/page'

function nv(s: string) {
  return s !== '' ? parseFloat(s) || 0 : 0
}

export function getPrecoUnitario(items: CustoItem[]): number {
  return items[0]?.valor ?? 0
}

export function getRelacaoGrM2(items: CustoItem[]): number {
  const item = items.find((i) => i.nome.includes('Relação gr/m²'))
  return item?.valor ?? items[1]?.valor ?? 0
}

export function getRelacaoMlM2(items: CustoItem[]): number {
  const item = items.find((i) => i.nome.includes('Relação ml/m²'))
  return item?.valor ?? items[1]?.valor ?? 0
}

export function calcQtdGr(areaM2: number, relacaoGrM2: number): number {
  if (areaM2 <= 0 || relacaoGrM2 <= 0) return 0
  return areaM2 * relacaoGrM2
}

export function calcQtdMl(areaM2: number, relacaoMlM2: number): number {
  if (areaM2 <= 0 || relacaoMlM2 <= 0) return 0
  return areaM2 * relacaoMlM2
}

export interface PinturaAplicavelRow {
  area_pintura: string
  esmalte_aplicavel: boolean
  engobe_aplicavel: boolean
  tinta_aplicavel: boolean
}

export function calcEsmalteQtdGr(row: PinturaAplicavelRow, esmalteItems: CustoItem[]): number {
  if (!row.esmalte_aplicavel) return 0
  return calcQtdGr(nv(row.area_pintura), getRelacaoGrM2(esmalteItems))
}

export function calcEngobeQtdGr(row: PinturaAplicavelRow, engobeItems: CustoItem[]): number {
  if (!row.engobe_aplicavel) return 0
  return calcQtdGr(nv(row.area_pintura), getRelacaoGrM2(engobeItems))
}

export function calcTintaQtdMl(row: PinturaAplicavelRow, tintaItems: CustoItem[]): number {
  if (!row.tinta_aplicavel) return 0
  return calcQtdMl(nv(row.area_pintura), getRelacaoMlM2(tintaItems))
}

export function calcEsmalteCusto(row: PinturaAplicavelRow, esmalteItems: CustoItem[]): number | null {
  if (!row.esmalte_aplicavel) return null
  const qtd = calcEsmalteQtdGr(row, esmalteItems)
  return qtd * getPrecoUnitario(esmalteItems)
}

export function calcEngobeCusto(row: PinturaAplicavelRow, engobeItems: CustoItem[]): number | null {
  if (!row.engobe_aplicavel) return null
  const qtd = calcEngobeQtdGr(row, engobeItems)
  return qtd * getPrecoUnitario(engobeItems)
}

export function calcTintaCusto(row: PinturaAplicavelRow, tintaItems: CustoItem[]): number | null {
  if (!row.tinta_aplicavel) return null
  const qtd = calcTintaQtdMl(row, tintaItems)
  return qtd * getPrecoUnitario(tintaItems)
}

export function syncPinturaQuantities(
  row: PinturaAplicavelRow,
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
): { esmalte_qnt_gr: string; engobe_qnt_gr: string; tinta_qnt_gr: string } {
  return {
    esmalte_qnt_gr: row.esmalte_aplicavel ? String(calcEsmalteQtdGr(row, esmalteItems)) : '',
    engobe_qnt_gr: row.engobe_aplicavel ? String(calcEngobeQtdGr(row, engobeItems)) : '',
    tinta_qnt_gr: row.tinta_aplicavel ? String(calcTintaQtdMl(row, tintaItems)) : '',
  }
}

export function resolvePinturaQuantitiesForSave(
  row: PinturaAplicavelRow,
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
): { esmalte_qnt_gr: number | null; engobe_qnt_gr: number | null; tinta_qnt_gr: number | null } {
  const synced = syncPinturaQuantities(row, esmalteItems, engobeItems, tintaItems)
  return {
    esmalte_qnt_gr: row.esmalte_aplicavel ? parseFloat(synced.esmalte_qnt_gr) || 0 : null,
    engobe_qnt_gr: row.engobe_aplicavel ? parseFloat(synced.engobe_qnt_gr) || 0 : null,
    tinta_qnt_gr: row.tinta_aplicavel ? parseFloat(synced.tinta_qnt_gr) || 0 : null,
  }
}

export function inferPinturaAplicavelFromDb(qnt: number | null | undefined): boolean {
  return qnt != null
}
