'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth/require-admin'

const schema = z.object({
  mostrar_vendidos: z.boolean(),
})

export type ConfigActionResult = { ok: true } | { ok: false; error: string }

export async function atualizarMostrarVendidos(
  mostrar_vendidos: boolean,
): Promise<ConfigActionResult> {
  try {
    const parsed = schema.safeParse({ mostrar_vendidos })
    if (!parsed.success) {
      return { ok: false, error: 'Valor inválido' }
    }

    const { supabase } = await requireAdmin()
    const { error } = await supabase
      .from('configuracoes')
      .update({ mostrar_vendidos: parsed.data.mostrar_vendidos })
      .eq('id', 1)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin')
    revalidatePath('/loja')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Não autorizado' }
  }
}
