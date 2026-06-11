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
  /** Texto breve acima da galeria de fotos */
  instagram_texto: string
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
  /** Seção: trajetória artística além da cerâmica */
  historias_lead: string
  historias_titulo: string
  historias_texto: string
  historia1_tag: string
  historia1_titulo: string
  historia1_texto: string
  historia1_imagem: string
  historia2_tag: string
  historia2_titulo: string
  historia2_texto: string
  historia2_imagem: string
  historia3_tag: string
  historia3_titulo: string
  historia3_texto: string
  historia3_imagem: string
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

export interface ProcessoConteudo {
  hero_lead: string
  hero_titulo: string
  hero_texto: string
  etapa1_titulo: string
  etapa1_texto: string
  etapa1_imagem: string
  etapa2_titulo: string
  etapa2_texto: string
  etapa2_imagem: string
  etapa3_titulo: string
  etapa3_texto: string
  etapa3_imagem: string
  etapa4_titulo: string
  etapa4_texto: string
  etapa4_imagem: string
  etapa5_titulo: string
  etapa5_texto: string
  etapa5_imagem: string
  etapa6_titulo: string
  etapa6_texto: string
  etapa6_imagem: string
  nota_quote: string
  nota_texto: string
}

export interface ContatoConteudo {
  hero_lead: string
  hero_titulo: string
  hero_texto: string
  form_titulo: string
  whatsapp_rotulo: string
  whatsapp_texto: string
  instagram_rotulo: string
  instagram_handle: string
  envios_titulo: string
  envios_texto: string
  encomendas_titulo: string
  encomendas_texto: string
}

export interface ConteudoSite {
  id: string
  dados: HomeConteudo | SobreConteudo | ProdutoHistoriaConteudo | ProcessoConteudo | ContatoConteudo
  atualizado_em: string
}
