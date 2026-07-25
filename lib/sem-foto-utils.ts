export const PUBLICACAO_SEM_FOTO_MSG =
  'Não é possível publicar uma peça no site sem foto.'

export function temFotos(urls: string[] | null | undefined): boolean {
  return Array.isArray(urls) && urls.some((url) => url.trim().length > 0)
}

/** Foto já salva ou pendente de upload (cadastro/modal). */
export function temFotoParaPublicar(
  fotos: string[] | null | undefined,
  fotosNovasCount = 0,
): boolean {
  return temFotos(fotos) || fotosNovasCount > 0
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
