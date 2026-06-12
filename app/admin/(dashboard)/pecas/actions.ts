'use server'

import { createClient } from '@/lib/supabase/server'
import { normalizeCategoriaLoja } from '@/lib/categoriaLoja'
import { revalidatePath } from 'next/cache'

export interface PecaPayload {
  id: string
  codigo: string
  nome: string
  dimensoes: string
  descricao: string | null
  status: string
  exibir_no_site: boolean
  destaque_home: boolean
  fenearte: boolean
  peso: number | null
  categoria: string
  area_pintura: number | null
  execucao_h: number | null
  fotos: string[]
  tipo_embalagem: string
  tipo_argila: string
  qnt_argila_kg: number | null
  esmalte_qnt_gr: number | null
  engobe_qnt_gr: number | null
  tinta_qnt_gr: number | null
  tipo_biscoito: string
  tipo_queima: string
  custo_extra: number | null
  margem_venda: number | null
  preco_venda: number | null
  preco_praticado: number | null
  ordem: number | null
  conjunto_id: string | null
  conjunto_codigo: string | null
  conjunto_nome: string | null
  valor_venda: number | null
  local_venda: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  vendido_em: string | null
}

export interface ConjuntoPayload {
  id: string
  codigo: string
  nome: string
  descricao: string | null
  status: string
  exibir_no_site: boolean
  destaque_home: boolean
  fenearte: boolean
  categoria: string
  fotos: string[]
  margem_venda: number | null
  preco_venda: number | null
  preco_praticado: number | null
  preco_total: number | null
  peso_total: number | null
  venda_modo: string
}

export interface ActionResult {
  ok: boolean
  error?: string
  warning?: string
}

const SCHEMA_MIGRATION_HINT =
  'Execute o arquivo supabase-fix-precificacao.sql no SQL Editor do Supabase (Dashboard → SQL) e tente salvar novamente.'

const CATEGORIA_MIGRATION_HINT =
  'Execute o arquivo supabase-fix-categoria-produtos.sql no SQL Editor do Supabase (Dashboard → SQL) e tente salvar novamente.'

function isMissingColumnError(message: string): boolean {
  return /schema cache/i.test(message)
    || /could not find the/i.test(message)
    || /column.*does not exist/i.test(message)
}

function formatDbError(message: string): string {
  if (isMissingColumnError(message)) {
    return `${message}\n\n${SCHEMA_MIGRATION_HINT}`
  }
  if (/produtos_categoria_check/i.test(message)) {
    return `${message}\n\n${CATEGORIA_MIGRATION_HINT}`
  }
  return message
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function buildPecaEstoqueRow(
  peca: PecaPayload,
  emConjunto: boolean,
  destaqueHome: boolean,
  includePricing: boolean,
  includeVenda = true,
) {
  const row: Record<string, unknown> = {
    id:               peca.id,
    codigo:           peca.codigo           || null,
    nome:             peca.nome             || null,
    dimensoes:        peca.dimensoes        || null,
    descricao:        peca.descricao        || null,
    status:           peca.status || '',
    exibir_no_site:   emConjunto ? false : peca.exibir_no_site,
    destaque_home:    emConjunto ? false : destaqueHome,
    fenearte:         emConjunto ? false : peca.fenearte,
    peso:             peca.peso,
    categoria:        emConjunto ? null : (peca.categoria || null),
    area_pintura:     peca.area_pintura,
    execucao_h:       peca.execucao_h,
    fotos:            peca.fotos,
    tipo_embalagem:   peca.tipo_embalagem   || null,
    tipo_argila:      peca.tipo_argila      || null,
    qnt_argila_kg:    peca.qnt_argila_kg,
    esmalte_qnt_gr:   peca.esmalte_qnt_gr,
    engobe_qnt_gr:    peca.engobe_qnt_gr,
    tinta_qnt_gr:     peca.tinta_qnt_gr,
    tipo_biscoito:    peca.tipo_biscoito    || null,
    tipo_queima:      peca.tipo_queima      || null,
    custo_extra:      peca.custo_extra,
    ordem:            peca.ordem,
    conjunto_id:      peca.conjunto_id      || null,
    conjunto_codigo:  peca.conjunto_codigo  || null,
    conjunto_nome:    peca.conjunto_nome    || null,
  }
  if (includePricing) {
    row.margem_venda = peca.margem_venda
    row.preco_venda = peca.preco_venda
    row.preco_praticado = peca.preco_praticado
  }
  if (includeVenda) {
    if (peca.status === 'vendido') {
      row.valor_venda = peca.valor_venda
      row.local_venda = peca.local_venda || null
      row.cliente_nome = peca.cliente_nome || null
      row.cliente_telefone = peca.cliente_telefone || null
      row.cliente_email = peca.cliente_email || null
      row.vendido_em = peca.vendido_em || new Date().toISOString()
    } else {
      row.valor_venda = null
      row.local_venda = null
      row.cliente_nome = null
      row.cliente_telefone = null
      row.cliente_email = null
      row.vendido_em = null
    }
  }
  return row
}

async function upsertPecaEstoque(
  supabase: SupabaseClient,
  peca: PecaPayload,
  emConjunto: boolean,
  destaqueHome: boolean,
): Promise<{ error?: string; warning?: string }> {
  const full = buildPecaEstoqueRow(peca, emConjunto, destaqueHome, true, true)
  let { error } = await supabase.from('pecas_estoque').upsert(full)
  if (error && isMissingColumnError(error.message)) {
    const noPricing = buildPecaEstoqueRow(peca, emConjunto, destaqueHome, false, true)
    let retry = await supabase.from('pecas_estoque').upsert(noPricing)
    error = retry.error
    if (error && isMissingColumnError(error.message)) {
      const base = buildPecaEstoqueRow(peca, emConjunto, destaqueHome, false, false)
      retry = await supabase.from('pecas_estoque').upsert(base)
      error = retry.error
    }
    if (!error) {
      return { warning: `Alguns campos não foram salvos (colunas ausentes no banco). ${SCHEMA_MIGRATION_HINT}` }
    }
  }
  if (error) return { error: formatDbError(error.message) }
  return {}
}

function buildConjuntoEstoqueRow(conjunto: ConjuntoPayload, destaqueHome: boolean, includePricing: boolean) {
  const row: Record<string, unknown> = {
    id:             conjunto.id,
    codigo:         conjunto.codigo    || null,
    nome:           conjunto.nome      || null,
    descricao:      conjunto.descricao || null,
    status:         conjunto.status    || null,
    exibir_no_site: conjunto.exibir_no_site,
    destaque_home:  destaqueHome,
    fenearte:       conjunto.fenearte,
    categoria:      conjunto.categoria || null,
    fotos:          conjunto.fotos,
  }
  if (includePricing) {
    row.margem_venda = conjunto.margem_venda
    row.preco_venda = conjunto.preco_venda
    row.preco_praticado = conjunto.preco_praticado
    row.venda_modo = conjunto.venda_modo || 'apenas_conjunto'
  }
  return row
}

async function upsertConjuntoEstoque(
  supabase: SupabaseClient,
  conjunto: ConjuntoPayload,
  destaqueHome: boolean,
): Promise<{ error?: string; warning?: string }> {
  const full = buildConjuntoEstoqueRow(conjunto, destaqueHome, true)
  let { error } = await supabase.from('conjuntos').upsert(full)
  if (error && isMissingColumnError(error.message)) {
    const base = buildConjuntoEstoqueRow(conjunto, destaqueHome, false)
    const retry = await supabase.from('conjuntos').upsert(base)
    error = retry.error
    if (!error) {
      return { warning: `Precificação do conjunto não salva no banco (colunas ausentes). ${SCHEMA_MIGRATION_HINT}` }
    }
  }
  if (error) return { error: formatDbError(error.message) }
  return {}
}

// Mapeia status interno → status da loja pública
const STATUS_LOJA: Record<string, string> = {
  disponivel:    'Disponível',
  vendido:       'Vendido',
  sob_encomenda: 'Sob Encomenda',
  acervo:        'Acervo',
}

const MAX_DESTAQUES_HOME = 6
const DESTAQUE_LIMIT_MSG =
  'Já existem 6 peças em destaque (Peças do momento). Remova o destaque de outra peça publicada antes de selecionar esta.'

async function countDestaquesAtivos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  excludeId?: string,
): Promise<number> {
  const { data: pecas } = await supabase
    .from('pecas_estoque')
    .select('id')
    .eq('destaque_home', true)
    .eq('exibir_no_site', true)
    .is('conjunto_id', null)

  const { data: conjuntos } = await supabase
    .from('conjuntos')
    .select('id')
    .eq('destaque_home', true)
    .eq('exibir_no_site', true)

  const ids = new Set<string>()
  for (const p of pecas ?? []) {
    if (p.id !== excludeId) ids.add(p.id)
  }
  for (const c of conjuntos ?? []) {
    if (c.id !== excludeId) ids.add(c.id)
  }
  return ids.size
}

async function validateDestaqueLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  itemId: string,
  exibirNoSite: boolean,
  destaqueHome: boolean,
): Promise<ActionResult | null> {
  if (!exibirNoSite || !destaqueHome) return null
  const count = await countDestaquesAtivos(supabase, itemId)
  if (count >= MAX_DESTAQUES_HOME) {
    return { ok: false, error: DESTAQUE_LIMIT_MSG }
  }
  return null
}

function slugify(nome: string, id: string): string {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'peca'}-${id.slice(0, 6)}`
}

/** Remove peças individuais da loja — só o conjunto pode ser publicado. */
async function removerPecasDoConjuntoNaLoja(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conjuntoId: string,
) {
  const { data: pecas } = await supabase
    .from('pecas_estoque')
    .select('id')
    .eq('conjunto_id', conjuntoId)

  if (!pecas?.length) return

  for (const peca of pecas) {
    await supabase.from('produtos').delete().eq('id', peca.id)
  }
}

export async function salvarPeca(peca: PecaPayload): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const emConjunto = !!peca.conjunto_id
    const destaqueHome = !emConjunto && peca.exibir_no_site && peca.destaque_home

    const destaqueErr = await validateDestaqueLimit(
      supabase,
      peca.id,
      !emConjunto && peca.exibir_no_site,
      destaqueHome,
    )
    if (destaqueErr) return destaqueErr

    // 1. Salvar na tabela interna pecas_estoque
    const upsertResult = await upsertPecaEstoque(supabase, peca, emConjunto, destaqueHome)
    if (upsertResult.error) return { ok: false, error: upsertResult.error }

  // 2. Sincronizar com a loja — peças em conjunto nunca são publicadas individualmente
    if (emConjunto) {
      await supabase.from('produtos').delete().eq('id', peca.id)
    } else if (peca.exibir_no_site) {
      const statusLoja = STATUS_LOJA[peca.status] ?? 'Disponível'
      const { error: errProd } = await supabase
        .from('produtos')
        .upsert({
          id:              peca.id,
          nome:            peca.nome             || 'Sem nome',
          slug:            slugify(peca.nome || 'peca', peca.id),
          categoria:       normalizeCategoriaLoja(peca.categoria),
          descricao:       peca.descricao        || null,
          preco:           peca.preco_venda,
          status:          statusLoja,
          aceita_encomenda: peca.status === 'sob_encomenda',
          medidas:         peca.dimensoes        || null,
          peso:            peca.peso != null ? Math.round(peca.peso) : null,
          imagens:         peca.fotos,
          destaque_home:   destaqueHome,
        })
      if (errProd) return { ok: false, error: formatDbError(`Loja: ${errProd.message}`) }
    } else {
      await supabase
        .from('produtos')
        .update({ status: 'Rascunho', destaque_home: false })
        .eq('id', peca.id)
    }

    revalidatePath('/admin/pecas')
    revalidatePath('/admin/vendas')
    revalidatePath('/loja')
    revalidatePath('/')
    return { ok: true, warning: upsertResult.warning }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}

export async function salvarConjunto(conjunto: ConjuntoPayload): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const destaqueHome = conjunto.exibir_no_site && conjunto.destaque_home

    const destaqueErr = await validateDestaqueLimit(
      supabase,
      conjunto.id,
      conjunto.exibir_no_site,
      destaqueHome,
    )
    if (destaqueErr) return destaqueErr

    const upsertResult = await upsertConjuntoEstoque(supabase, conjunto, destaqueHome)
    if (upsertResult.error) return { ok: false, error: upsertResult.error }

    // Peças do conjunto não entram na grade da loja (venda avulsa via página do conjunto)
    await removerPecasDoConjuntoNaLoja(supabase, conjunto.id)

    // Sincronizar loja apenas com dados do conjunto (fotos, nome, descrição, preço, etc.)
    if (conjunto.exibir_no_site) {
      const statusLoja = STATUS_LOJA[conjunto.status] ?? 'Disponível'
      const { error: errProd } = await supabase
        .from('produtos')
        .upsert({
          id:               conjunto.id,
          nome:             conjunto.nome     || conjunto.codigo || 'Conjunto',
          slug:             slugify(conjunto.nome || conjunto.codigo || 'conjunto', conjunto.id),
          categoria:        normalizeCategoriaLoja(conjunto.categoria),
          descricao:        conjunto.descricao || null,
          preco:            conjunto.preco_venda,
          status:           statusLoja,
          aceita_encomenda: conjunto.status === 'sob_encomenda',
          peso:             conjunto.peso_total != null ? Math.round(conjunto.peso_total) : null,
          imagens:          conjunto.fotos,
          destaque_home:    destaqueHome,
        })
      if (errProd) return { ok: false, error: formatDbError(`Loja: ${errProd.message}`) }
    } else {
      await supabase
        .from('produtos')
        .update({ status: 'Rascunho', destaque_home: false })
        .eq('id', conjunto.id)
    }

    revalidatePath('/admin/pecas')
    revalidatePath('/loja')
    revalidatePath('/')
    return { ok: true, warning: upsertResult.warning }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}

export async function deletarPeca(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await supabase.from('produtos').delete().eq('id', id)
    const { error } = await supabase
      .from('pecas_estoque')
      .delete()
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/pecas')
    revalidatePath('/loja')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}

export async function deletarConjunto(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    await supabase.from('produtos').delete().eq('id', id)
    const { error } = await supabase
      .from('conjuntos')
      .delete()
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin/pecas')
    revalidatePath('/loja')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
