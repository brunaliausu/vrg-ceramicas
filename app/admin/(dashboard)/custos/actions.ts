'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/require-admin'
import { custosPayloadSchema } from '@/lib/validations/custos'

export async function salvarCustos(dados: Record<string, unknown>) {
  const parsed = custosPayloadSchema.safeParse(dados)
  if (!parsed.success) {
    throw new Error('Dados de custos inválidos')
  }

  const { supabase } = await requireAdmin()
  const { error } = await supabase
    .from('custos_config')
    .upsert({ id: 1, dados: parsed.data, atualizado_em: new Date().toISOString() })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/custos')
  revalidatePath('/admin/pecas')
}
