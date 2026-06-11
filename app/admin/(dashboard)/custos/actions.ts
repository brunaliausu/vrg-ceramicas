'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function salvarCustos(dados: Record<string, unknown>) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('custos_config')
    .upsert({ id: 1, dados, atualizado_em: new Date().toISOString() })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/custos')
  revalidatePath('/admin/pecas')
}
