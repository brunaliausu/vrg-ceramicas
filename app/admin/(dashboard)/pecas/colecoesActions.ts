'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminOrNull } from '@/lib/auth/require-admin'
import {
  MAX_COLECOES_NO_SITE,
  slugifyColecao,
  type ColecaoPayload,
} from '@/lib/colecaoUtils'
import type { ActionResult } from './actions'

const LIMITE_SITE_MSG =
  `No máximo ${MAX_COLECOES_NO_SITE} coleções podem estar visíveis no site ao mesmo tempo. Desative outra coleção antes.`

async function countColecoesNoSite(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  excludeId?: string,
): Promise<number> {
  let query = supabase
    .from('colecoes')
    .select('id', { count: 'exact', head: true })
    .eq('exibir_no_site', true)
  if (excludeId) query = query.neq('id', excludeId)
  const { count } = await query
  return count ?? 0
}

export async function salvarColecao(payload: ColecaoPayload): Promise<ActionResult & { id?: string }> {
  const auth = await requireAdminOrNull()
  if (!auth) return { ok: false, error: 'Não autorizado' }

  const nome = payload.nome.trim()
  if (!nome) return { ok: false, error: 'Informe o nome da coleção.' }

  if (payload.exibir_no_site) {
    const count = await countColecoesNoSite(auth.supabase, payload.id)
    if (count >= MAX_COLECOES_NO_SITE) {
      return { ok: false, error: LIMITE_SITE_MSG }
    }
  }

  const slug = slugifyColecao(nome)
  const row = {
    nome,
    slug,
    exibir_no_site: payload.exibir_no_site,
    site_lead: payload.site_lead.trim() || 'Coleção',
    site_titulo: payload.site_titulo.trim() || nome,
    site_texto: payload.site_texto.trim(),
    site_imagem: payload.site_imagem.trim(),
    ordem: payload.ordem ?? 0,
    atualizado_em: new Date().toISOString(),
  }

  if (payload.id) {
    const { error } = await auth.supabase.from('colecoes').update(row).eq('id', payload.id)
    if (error) return { ok: false, error: error.message }
    revalidatePaths()
    return { ok: true, id: payload.id }
  }

  const { data, error } = await auth.supabase
    .from('colecoes')
    .insert(row)
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePaths()
  return { ok: true, id: data.id }
}

export async function toggleColecaoNoSite(id: string, exibir: boolean): Promise<ActionResult> {
  const auth = await requireAdminOrNull()
  if (!auth) return { ok: false, error: 'Não autorizado' }

  if (exibir) {
    const count = await countColecoesNoSite(auth.supabase, id)
    if (count >= MAX_COLECOES_NO_SITE) {
      return { ok: false, error: LIMITE_SITE_MSG }
    }
  }

  const { error } = await auth.supabase
    .from('colecoes')
    .update({ exibir_no_site: exibir, atualizado_em: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePaths()
  return { ok: true }
}

function revalidatePaths() {
  revalidatePath('/admin/colecoes')
  revalidatePath('/admin/pecas')
  revalidatePath('/loja')
  revalidatePath('/')
}

export async function resolverColecaoNome(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  colecaoId: string | null | undefined,
): Promise<string | null> {
  if (!colecaoId) return null
  const { data } = await supabase.from('colecoes').select('nome').eq('id', colecaoId).maybeSingle()
  return data?.nome ?? null
}
