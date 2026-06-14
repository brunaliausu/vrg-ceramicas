'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { conteudoPayloadSchema } from '@/lib/validations/conteudo'

export type ConteudoActionResult = { ok: true } | { ok: false; error: string }

export async function salvarConteudoSite(
  id: string,
  dados: object,
): Promise<ConteudoActionResult> {
  try {
    const parsed = conteudoPayloadSchema.safeParse({ id, dados: dados as Record<string, unknown> })
    if (!parsed.success) {
      return { ok: false, error: 'Dados de conteúdo inválidos' }
    }

    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('conteudo_site')
      .upsert({
        id: parsed.data.id,
        dados: parsed.data.dados,
        atualizado_em: new Date().toISOString(),
      })

    if (error) return { ok: false, error: error.message }

    revalidatePath('/')
    revalidatePath('/sobre')
    revalidatePath('/processo')
    revalidatePath('/contato')
    revalidatePath(`/admin/conteudo/${parsed.data.id === 'produto_historia' ? 'produto-historia' : parsed.data.id}`)
    revalidatePath('/admin/conteudo')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Não autorizado' }
  }
}
