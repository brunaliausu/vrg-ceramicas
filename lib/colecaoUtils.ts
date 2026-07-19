export const MAX_COLECOES_NO_SITE = 3

export interface ColecaoDB {
  id: string
  nome: string
  slug: string
  exibir_no_site: boolean
  site_lead: string
  site_titulo: string
  site_texto: string
  site_imagem: string
  ordem: number
}

export interface ColecaoPayload {
  id?: string
  nome: string
  exibir_no_site: boolean
  site_lead: string
  site_titulo: string
  site_texto: string
  site_imagem: string
  ordem?: number
}

export function slugifyColecao(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'colecao'
}

export function colecaoHref(slug: string): string {
  return `/loja?colecao=${encodeURIComponent(slug)}`
}

export function defaultColecaoSiteFields(nome: string) {
  return {
    site_lead: 'Coleção',
    site_titulo: nome,
    site_texto: '',
    site_imagem: '',
  }
}
