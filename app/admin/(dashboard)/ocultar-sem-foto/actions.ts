'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdminOrNull } from '@/lib/auth/require-admin'
import { filtrarSemFoto, temFotos, type ItemSemFoto } from '@/lib/sem-foto-utils'
import type { ActionResult } from '../pecas/actions'

type AdminSupabase = Awaited<ReturnType<typeof createClient>>

async function carregarCandidatosSemFoto(supabase: AdminSupabase) {
  const [{ data: pecas }, { data: conjuntos }, { data: produtos }] = await Promise.all([
    supabase
      .from('pecas_estoque')
      .select('id, codigo, nome, fotos, exibir_no_site, conjunto_id')
      .is('conjunto_id', null)
      .eq('exibir_no_site', true),
    supabase
      .from('conjuntos')
      .select('id, codigo, nome, fotos, exibir_no_site')
      .eq('exibir_no_site', true),
    supabase
      .from('produtos')
      .select('id, nome, status, imagens')
      .neq('status', 'Rascunho'),
  ])

  const produtosSemFoto = (produtos ?? []).filter((p) => !temFotos(p.imagens))
  const naLojaIds = new Set((produtos ?? []).map((p) => p.id))

  const items: ItemSemFoto[] = []
  const coveredIds = new Set<string>()

  for (const peca of filtrarSemFoto(pecas ?? [])) {
    coveredIds.add(peca.id)
    items.push({
      id: peca.id,
      tipo: 'peca',
      codigo: peca.codigo ?? '',
      nome: peca.nome ?? '',
      exibirNoSite: peca.exibir_no_site ?? false,
      naLoja: naLojaIds.has(peca.id),
    })
  }

  for (const conjunto of filtrarSemFoto(conjuntos ?? [])) {
    coveredIds.add(conjunto.id)
    items.push({
      id: conjunto.id,
      tipo: 'conjunto',
      codigo: conjunto.codigo ?? '',
      nome: conjunto.nome ?? '',
      exibirNoSite: conjunto.exibir_no_site ?? false,
      naLoja: naLojaIds.has(conjunto.id),
    })
  }

  const orphanIds = produtosSemFoto
    .map((p) => p.id)
    .filter((id) => !coveredIds.has(id))

  if (orphanIds.length > 0) {
    const [{ data: pecaRefs }, { data: conjuntoRefs }] = await Promise.all([
      supabase.from('pecas_estoque').select('id, codigo, nome').in('id', orphanIds),
      supabase.from('conjuntos').select('id, codigo, nome').in('id', orphanIds),
    ])
    const pecaById = new Map((pecaRefs ?? []).map((p) => [p.id, p]))
    const conjuntoById = new Map((conjuntoRefs ?? []).map((c) => [c.id, c]))

    for (const produto of produtosSemFoto) {
      if (coveredIds.has(produto.id)) continue
      coveredIds.add(produto.id)
      const conjuntoRef = conjuntoById.get(produto.id)
      const pecaRef = pecaById.get(produto.id)
      if (conjuntoRef) {
        items.push({
          id: produto.id,
          tipo: 'conjunto',
          codigo: conjuntoRef.codigo ?? '',
          nome: conjuntoRef.nome ?? produto.nome ?? '',
          exibirNoSite: false,
          naLoja: true,
        })
      } else if (pecaRef) {
        items.push({
          id: produto.id,
          tipo: 'peca',
          codigo: pecaRef.codigo ?? '',
          nome: pecaRef.nome ?? produto.nome ?? '',
          exibirNoSite: false,
          naLoja: true,
        })
      } else {
        items.push({
          id: produto.id,
          tipo: 'peca',
          codigo: '',
          nome: produto.nome ?? '',
          exibirNoSite: false,
          naLoja: true,
        })
      }
    }
  }

  return {
    items: items.sort((a, b) => {
      const codigoCmp = (a.codigo || a.nome).localeCompare(b.codigo || b.nome, 'pt-BR', { numeric: true })
      if (codigoCmp !== 0) return codigoCmp
      return a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true })
    }),
    pecaIds: items.filter((i) => i.tipo === 'peca').map((i) => i.id),
    conjuntoIds: items.filter((i) => i.tipo === 'conjunto').map((i) => i.id),
    lojaIds: produtosSemFoto.map((p) => p.id),
  }
}

export async function listarPublicadosSemFoto(): Promise<ItemSemFoto[]> {
  const auth = await requireAdminOrNull()
  if (!auth) return []
  const { items } = await carregarCandidatosSemFoto(auth.supabase)
  return items
}

export async function ocultarPublicadosSemFoto(): Promise<ActionResult & {
  pecas?: number
  conjuntos?: number
  loja?: number
}> {
  const auth = await requireAdminOrNull()
  if (!auth) return { ok: false, error: 'Não autorizado' }

  try {
    const { supabase } = auth
    const { items, pecaIds, conjuntoIds, lojaIds } = await carregarCandidatosSemFoto(supabase)
    if (items.length === 0) {
      return { ok: true, pecas: 0, conjuntos: 0, loja: 0 }
    }

    if (pecaIds.length > 0) {
      const { error } = await supabase
        .from('pecas_estoque')
        .update({ exibir_no_site: false, destaque_home: false })
        .in('id', pecaIds)
      if (error) return { ok: false, error: error.message }
    }

    if (conjuntoIds.length > 0) {
      const { error } = await supabase
        .from('conjuntos')
        .update({ exibir_no_site: false, destaque_home: false })
        .in('id', conjuntoIds)
      if (error) return { ok: false, error: error.message }
    }

    if (lojaIds.length > 0) {
      const { error } = await supabase
        .from('produtos')
        .update({ status: 'Rascunho', destaque_home: false })
        .in('id', lojaIds)
      if (error) return { ok: false, error: error.message }
    }

    revalidatePath('/admin/pecas')
    revalidatePath('/admin/ocultar-sem-foto')
    revalidatePath('/loja')
    revalidatePath('/')

    return {
      ok: true,
      pecas: pecaIds.length,
      conjuntos: conjuntoIds.length,
      loja: lojaIds.length,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
