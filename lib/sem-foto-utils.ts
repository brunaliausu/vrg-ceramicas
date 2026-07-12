export function temFotos(urls: string[] | null | undefined): boolean {
  return Array.isArray(urls) && urls.some((url) => url.trim().length > 0)
}

export interface ItemSemFoto {
  id: string
  tipo: 'peca' | 'conjunto'
  codigo: string
  nome: string
  exibirNoSite: boolean
  naLoja: boolean
}

export function filtrarSemFoto<T extends { fotos?: string[] | null }>(rows: T[]): T[] {
  return rows.filter((row) => !temFotos(row.fotos))
}
