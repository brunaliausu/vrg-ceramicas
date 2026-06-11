import { createClient } from '@/lib/supabase/server'
import type { HomeConteudo, SobreConteudo, ProdutoHistoriaConteudo } from '@/types'

// ─── Defaults ────────────────────────────────────────────────
// Valores exibidos enquanto o admin ainda não tiver salvo conteúdo.

export const HOME_DEFAULTS: HomeConteudo = {
  hero_eyebrow: 'Cerâmica autoral feita à mão · Brasil',
  hero_linha1: 'Do barro',
  hero_linha2: 'nasce uma',
  hero_linha3: 'memória.',
  hero_texto:
    'Peças únicas, moldadas devagar, marcadas pelo gesto da mão. Cada objeto carrega a luz de uma manhã no ateliê.',
  hero_imagem: '',
  artista_lead: 'A artista por trás de cada peça',
  artista_quote:
    'Eu não faço duas peças iguais. Cada uma guarda o dia em que foi feita — a luz, o tempo, o pulso da mão.',
  artista_bio:
    'Formada em artes e ceramista há mais de uma década, dedico-me a uma produção lenta e atenta, onde a imperfeição é assinatura e não defeito.',
  artista_assinatura: 'Valéria R. Gonçalves',
  artista_cargo: 'Fundadora · VRG Cerâmicas',
  artista_imagem: '',
  colecao_lead: 'Coleção de lançamento',
  colecao_titulo: 'Flor de Lis',
  colecao_texto:
    'Uma série inspirada na delicadeza das formas que florescem devagar. Texturas cruas, silhuetas orgânicas, edição limitada.',
  colecao_imagem: '',
  marquee_termos: 'peça única · feito à mão · barro & fogo · edição limitada · gesto e matéria',
  instagram_lead: 'Diário do ateliê',
  instagram_titulo: 'Bastidores da criação',
  instagram_texto:
    'Aqui não existem moldes ou pressa, só a terra, o fogo, o tempo. A inspiração vem do cotidiano, do regional, da minha terra.',
  instagram_handle: '@vrg.ceramicas',
  instagram_img1: '',
  instagram_img2: '',
  instagram_img3: '',
  instagram_img4: '',
}

export const SOBRE_DEFAULTS: SobreConteudo = {
  hero_lead: 'A artista',
  hero_titulo1: 'Mãos que',
  hero_titulo2: 'escutam',
  hero_titulo3: 'o barro',
  hero_subtitulo:
    'Há mais de dez anos transformo terra, água e fogo em objetos para o dia a dia e para a alma.',
  hero_imagem: '',
  carta_p1:
    'Comecei com as mãos sujas de barro num pequeno ateliê emprestado. O torno girava e, com ele, uma certeza silenciosa: era ali que eu queria viver.',
  carta_p2:
    'Cada peça que faço carrega uma intenção e um tempo. Não busco a perfeição da máquina — busco a verdade da mão. As pequenas variações, as marcas dos dedos, a textura crua: são elas que tornam cada objeto único e impossível de repetir.',
  carta_p3:
    'O barro me ensinou que beleza e utilidade não são opostos. Que uma caneca pode ser obra de arte. Que um vaso pode carregar a memória de quem o fez.',
  carta_quote: 'O barro me ensinou a ter paciência. E a paciência virou a minha assinatura.',
  carta_assinatura: 'Valéria R. Gonçalves',
  carta_cargo: 'Ceramista · Fundadora da VRG',
  processo_titulo: 'Como nasce cada peça',
  processo_p1_titulo: 'Centrar',
  processo_p1_texto: 'O barro é centrado no torno e erguido lentamente com as mãos.',
  processo_p1_imagem: '',
  processo_p2_titulo: 'Modelar',
  processo_p2_texto: 'A forma ganha corpo; cada gesto deixa sua marca na superfície.',
  processo_p2_imagem: '',
  processo_p3_titulo: 'Secar & esmaltar',
  processo_p3_texto: 'Após dias de descanso, a peça recebe esmalte ou fica crua.',
  processo_p3_imagem: '',
  processo_p4_titulo: 'Queimar',
  processo_p4_texto: 'O fogo a mais de 1200 °C transforma terra em cerâmica para a vida toda.',
  processo_p4_imagem: '',
  valores_1_titulo: 'Peça única',
  valores_1_texto:
    'Nada é produzido em série. Você leva para casa um objeto que não existe em nenhum outro lugar.',
  valores_2_titulo: 'Feito devagar',
  valores_2_texto: 'Produção lenta e atenta, no ritmo do barro — não no ritmo da pressa.',
  valores_3_titulo: 'Honestidade material',
  valores_3_texto: 'Sem disfarces: a textura, a cor e a imperfeição são parte da beleza.',
  cta_titulo: 'Quer uma peça feita especialmente para você?',
  cta_imagem: '',
}

export const PRODUTO_HISTORIA_DEFAULTS: ProdutoHistoriaConteudo = {
  lead: 'A história desta peça',
  titulo: 'Nascida no ateliê, com intenção',
  texto:
    'Cada peça VRG passa por semanas de processo — do bloco de barro bruto à queima final. Um tempo propositalmente lento, que garante qualidade e singularidade em cada objeto.',
  assinatura: '— Valéria',
  imagem: '',
}

// ─── Fetchers ────────────────────────────────────────────────

export async function getHomeConteudo(): Promise<HomeConteudo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conteudo_site')
      .select('dados')
      .eq('id', 'home')
      .single()
    return { ...HOME_DEFAULTS, ...(data?.dados ?? {}) }
  } catch {
    return HOME_DEFAULTS
  }
}

export async function getSobreConteudo(): Promise<SobreConteudo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conteudo_site')
      .select('dados')
      .eq('id', 'sobre')
      .single()
    return { ...SOBRE_DEFAULTS, ...(data?.dados ?? {}) }
  } catch {
    return SOBRE_DEFAULTS
  }
}

export async function getProdutoHistoriaConteudo(): Promise<ProdutoHistoriaConteudo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conteudo_site')
      .select('dados')
      .eq('id', 'produto_historia')
      .single()
    return { ...PRODUTO_HISTORIA_DEFAULTS, ...(data?.dados ?? {}) }
  } catch {
    return PRODUTO_HISTORIA_DEFAULTS
  }
}
