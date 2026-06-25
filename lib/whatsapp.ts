const NUMERO = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'

export function linkCompraPecaDoConjunto(
  conjuntoNome: string,
  conjuntoSlug: string,
  pecaNome: string,
  pecaCodigo: string,
  preco?: number | null,
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vrgceramicas.com.br'
  const linkConjunto = `${siteUrl}/produtos/${conjuntoSlug}`
  const precoTxt = preco != null && preco > 0 ? `\nPreço da peça: R$ ${preco.toFixed(2).replace('.', ',')}` : ''
  const msg = encodeURIComponent(
    `Olá! Gostaria de comprar apenas uma peça do conjunto *${conjuntoNome}*.\n\n` +
    `*Peça:* ${pecaNome}${pecaCodigo ? ` (cód. ${pecaCodigo})` : ''}${precoTxt}\n\n` +
    `Conjunto: ${linkConjunto}`,
  )
  return `https://wa.me/${NUMERO}?text=${msg}`
}

/** Link wa.me para compra — `nomePeca` é o nome exato do produto/conjunto exibido na página. */
export function linkCompra(nomePeca: string, _preco: number, _slug: string): string {
  const msg = encodeURIComponent(
    `Olá! Encontrei a peça *${nomePeca}* no site e tenho interesse em realizar a compra. Poderia me informar os detalhes e como posso prosseguir com o pedido?\n\nObrigado(a)!`,
  )
  return `https://wa.me/${NUMERO}?text=${msg}`
}

export function linkEncomenda(pecaNome?: string): string {
  const base = pecaNome
    ? `Olá! Vi a peça *${pecaNome}* e gostaria de solicitar uma encomenda personalizada.`
    : `Olá! Gostaria de solicitar uma encomenda personalizada.`
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(base)}`
}

export function linkEncomendaForm(dados: {
  nome: string
  whatsapp: string
  descricao: string
  quantidade: number
}): string {
  const msg =
    `Olá! Gostaria de solicitar uma encomenda.\n\n` +
    `*Nome:* ${dados.nome}\n` +
    `*Contato:* ${dados.whatsapp}\n` +
    `*Descrição:* ${dados.descricao}\n` +
    `*Quantidade:* ${dados.quantidade}\n\n` +
    `_Encomendas iniciam com sinal de 50%. Por ser artesanal, pode haver pequenas variações._`
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(msg)}`
}

export function linkContato(): string {
  const msg = encodeURIComponent(`Olá! Gostaria de entrar em contato com a VRG Cerâmicas.`)
  return `https://wa.me/${NUMERO}?text=${msg}`
}
