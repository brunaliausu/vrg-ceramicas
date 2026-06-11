/** Seções editáveis no admin — alinhadas às páginas públicas do menu principal. */
export const CONTEUDO_ADMIN_SECOES = [
  {
    id: 'home',
    href: '/admin/conteudo/home',
    titulo: 'Home',
    descricao: 'Hero, faixa marquee, apresentação da artista e coleção em destaque.',
    icone: '⌂',
  },
  {
    id: 'sobre',
    href: '/admin/conteudo/sobre',
    titulo: 'A Artista',
    descricao: 'Hero, carta da artista, trajetória artística com fotos, valores e chamada para ação.',
    icone: '◌',
  },
  {
    id: 'processo',
    href: '/admin/conteudo/processo',
    titulo: 'Processo',
    descricao: 'Introdução e as seis etapas do processo artesanal, com textos e fotos.',
    icone: '◈',
  },
  {
    id: 'contato',
    href: '/admin/conteudo/contato',
    titulo: 'Contato',
    descricao: 'Textos da página de contato, encomendas, envios e links de WhatsApp e Instagram.',
    icone: '✉',
  },
] as const

export type ConteudoAdminSecaoId = (typeof CONTEUDO_ADMIN_SECOES)[number]['id']
