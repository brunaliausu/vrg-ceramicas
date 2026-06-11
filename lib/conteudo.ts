import { createClient } from '@/lib/supabase/server'
import type {
  HomeConteudo,
  SobreConteudo,
  ProdutoHistoriaConteudo,
  ProcessoConteudo,
  ContatoConteudo,
} from '@/types'

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
  historias_lead: 'Antes e além da cerâmica',
  historias_titulo: 'A arte em outras formas',
  historias_texto:
    'Minha trajetória passou por arquitetura, pintura e outras linguagens visuais — experiências que hoje aparecem no gesto, na forma e no olhar de cada peça.',
  historia1_tag: 'Arquitetura',
  historia1_titulo: 'Espaço, proporção e luz',
  historia1_texto:
    'Estudar arquitetura me ensinou a pensar em volume, escala e habitar. Cada peça carrega esse olhar: como ocupa a mesa, como dialoga com a luz da manhã, como encontra seu lugar no cotidiano.',
  historia1_imagem: '',
  historia2_tag: 'Pintura',
  historia2_titulo: 'Cor, camada e intenção',
  historia2_texto:
    'Na pintura aprendi a construir superfícies em camadas — transparentes, opacas, accidentadas. O esmalte e o engobe na cerâmica conversam com essa memória de cor aplicada devagar, gesto após gesto.',
  historia2_imagem: '',
  historia3_tag: 'Cerâmica',
  historia3_titulo: 'O encontro com o barro',
  historia3_texto:
    'Quando o barro entrou de vez na minha vida, tudo convergiu: forma, material, tempo e fogo. Hoje é nele que reuno arquitetura, pintura e a escuta do fazer manual.',
  historia3_imagem: '',
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

export const PROCESSO_DEFAULTS: ProcessoConteudo = {
  hero_lead: 'O Processo',
  hero_titulo: 'Do barro à obra',
  hero_texto:
    'Conheça o caminho que cada peça percorre antes de chegar até você. Cada etapa é feita à mão, com tempo, cuidado e intenção.',
  etapa1_titulo: 'Modelagem',
  etapa1_texto:
    'Cada peça começa nas mãos. Sem moldes industriais — o barro é trabalhado à mão, respondendo à pressão, à velocidade e à intenção de quem o modela.',
  etapa1_imagem: '',
  etapa2_titulo: 'Secagem',
  etapa2_texto:
    'Após a modelagem, a peça seca lentamente ao ar livre. Pressa não faz parte do processo. Esse tempo é essencial para que a estrutura ganhe consistência sem rachar.',
  etapa2_imagem: '',
  etapa3_titulo: 'Primeira queima',
  etapa3_texto:
    'A peça vai ao forno pela primeira vez — a queima biscoito. O calor transforma a argila frágil em cerâmica, preparando-a para receber o esmalte.',
  etapa3_imagem: '',
  etapa4_titulo: 'Esmaltagem',
  etapa4_texto:
    'Os esmaltes são aplicados à mão, camada a camada. É aqui que nascem as cores, as texturas e os efeitos únicos de cada peça.',
  etapa4_imagem: '',
  etapa5_titulo: 'Queima final',
  etapa5_texto:
    'A segunda queima, em alta temperatura, vitrifica o esmalte e revela o resultado final. É o momento de descoberta — cada peça sai diferente, e isso é proposital.',
  etapa5_imagem: '',
  etapa6_titulo: 'Acabamento',
  etapa6_texto:
    'Após a queima, a base da peça é lixada e a cerâmica passa por uma última inspeção antes de estar pronta para encontrar o seu lugar no mundo.',
  etapa6_imagem: '',
  nota_quote: 'A imperfeição é a assinatura do artesanal.',
  nota_texto:
    'Cada variação de cor, cada marca de mão, cada detalhe que foge à simetria perfeita — esses são os traços que tornam uma peça artesanal verdadeiramente única.',
}

export const CONTATO_DEFAULTS: ContatoConteudo = {
  hero_lead: 'Contato',
  hero_titulo: 'Fale conosco',
  hero_texto:
    'Para encomendas, dúvidas sobre envio ou parcerias, use o formulário abaixo ou entre em contato direto pelo WhatsApp.',
  form_titulo: 'Solicitar Encomenda',
  whatsapp_rotulo: 'WhatsApp',
  whatsapp_texto: 'Clique para conversar →',
  instagram_rotulo: 'Instagram',
  instagram_handle: '@vrg.ceramicas',
  envios_titulo: 'Envios',
  envios_texto:
    'Enviamos para todo o Brasil via Correios ou transportadora. O frete é calculado e combinado no WhatsApp após a confirmação do pedido.',
  encomendas_titulo: 'Encomendas',
  encomendas_texto:
    'Todas as encomendas iniciam com sinal de 50%. O prazo de produção é combinado no momento do pedido, de acordo com a peça e a fila do ateliê.',
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

export async function getProcessoConteudo(): Promise<ProcessoConteudo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conteudo_site')
      .select('dados')
      .eq('id', 'processo')
      .single()
    return { ...PROCESSO_DEFAULTS, ...(data?.dados ?? {}) }
  } catch {
    return PROCESSO_DEFAULTS
  }
}

export async function getContatoConteudo(): Promise<ContatoConteudo> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('conteudo_site')
      .select('dados')
      .eq('id', 'contato')
      .single()
    return { ...CONTATO_DEFAULTS, ...(data?.dados ?? {}) }
  } catch {
    return CONTATO_DEFAULTS
  }
}
