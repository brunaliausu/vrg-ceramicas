export type Categoria =
  | 'Utilitários'
  | 'Decorativos'
  | 'Conjuntos'
  | 'Utilitário/Decorativo'
export type Status = 'Rascunho' | 'Disponível' | 'Vendido' | 'Sob Encomenda'
export type Cor = 'Neutro / Cru' | 'Branco' | 'Preto' | 'Terracota' | 'Bege / Areia' | 'Verde' | 'Azul' | 'Outro'
export type Material = 'Grés' | 'Faiança' | 'Porcelana'
export type Acabamento = 'Esmaltada' | 'Fosca' | 'Brilhante' | 'Crua'
export type Cuidado =
  | 'Indicada para alimentos'
  | 'Pode ir ao microondas'
  | 'Pode ir à lava-louças'
  | 'Apenas decorativa'
  | 'Impermeável'

export interface Produto {
  id: string
  nome: string
  slug: string
  categoria: Categoria
  colecao: string | null
  descricao: string | null
  preco: number | null
  status: Status
  aceita_encomenda: boolean
  destaque_home: boolean
  destaque_loja: boolean
  ordem_exibicao: number | null
  cor: Cor | null
  material: Material | null
  acabamento: Acabamento | null
  medidas: string | null
  capacidade: string | null
  peso: number | null
  cuidados: Cuidado[]
  imagens: string[]
  criado_em: string
  atualizado_em: string
}

export type ProdutoInsert = Omit<Produto, 'id' | 'criado_em' | 'atualizado_em'>
export type ProdutoUpdate = Partial<ProdutoInsert>

export interface Configuracoes {
  id: number
  mostrar_vendidos: boolean
}

export const CATEGORIAS: Categoria[] = [
  'Utilitários',
  'Decorativos',
  'Conjuntos',
  'Utilitário/Decorativo',
]
export const STATUS_OPTIONS: Status[] = ['Rascunho', 'Disponível', 'Vendido', 'Sob Encomenda']
export const CORES: Cor[] = ['Neutro / Cru', 'Branco', 'Preto', 'Terracota', 'Bege / Areia', 'Verde', 'Azul', 'Outro']
export const MATERIAIS: Material[] = ['Grés', 'Faiança', 'Porcelana']
export const ACABAMENTOS: Acabamento[] = ['Esmaltada', 'Fosca', 'Brilhante', 'Crua']
export const CUIDADOS: Cuidado[] = [
  'Indicada para alimentos',
  'Pode ir ao microondas',
  'Pode ir à lava-louças',
  'Apenas decorativa',
  'Impermeável',
]

// ─── Conteúdo editável do site ──────────────────────────────

export interface HomeConteudo {
  hero_eyebrow: string
  hero_linha1: string
  hero_linha2: string
  hero_linha3: string
  hero_texto: string
  hero_imagem: string
  artista_lead: string
  artista_quote: string
  artista_bio: string
  artista_assinatura: string
  artista_cargo: string
  artista_imagem: string
  colecao_lead: string
  colecao_titulo: string
  colecao_texto: string
  colecao_imagem: string
  /** Termos separados por · para o marquee */
  marquee_termos: string
  instagram_lead: string
  instagram_titulo: string
  instagram_handle: string
  instagram_img1: string
  instagram_img2: string
  instagram_img3: string
  instagram_img4: string
}

export interface SobreConteudo {
  hero_lead: string
  hero_titulo1: string
  hero_titulo2: string
  hero_titulo3: string
  hero_subtitulo: string
  hero_imagem: string
  carta_p1: string
  carta_p2: string
  carta_p3: string
  carta_quote: string
  carta_assinatura: string
  carta_cargo: string
  processo_titulo: string
  processo_p1_titulo: string
  processo_p1_texto: string
  processo_p1_imagem: string
  processo_p2_titulo: string
  processo_p2_texto: string
  processo_p2_imagem: string
  processo_p3_titulo: string
  processo_p3_texto: string
  processo_p3_imagem: string
  processo_p4_titulo: string
  processo_p4_texto: string
  processo_p4_imagem: string
  valores_1_titulo: string
  valores_1_texto: string
  valores_2_titulo: string
  valores_2_texto: string
  valores_3_titulo: string
  valores_3_texto: string
  cta_titulo: string
  cta_imagem: string
}

export interface ProdutoHistoriaConteudo {
  lead: string
  titulo: string
  texto: string
  assinatura: string
  imagem: string
}

export interface ConteudoSite {
  id: string
  dados: HomeConteudo | SobreConteudo | ProdutoHistoriaConteudo
  atualizado_em: string
}
