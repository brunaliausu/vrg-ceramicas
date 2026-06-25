'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminOrNull } from '@/lib/auth/require-admin'
import {
  PRODUTOS_TESTE_LEGADO,
  PRODUTOS_TESTE_LEGADO_IDS,
} from '@/lib/produtos-teste-legado'
import type { ActionResult } from '../pecas/actions'

function mismatchMessage(
  expected: { id: string; nome: string; categoria: string },
  found: { nome: string; categoria: string } | undefined,
): string | null {
  if (!found) return `Produto ${expected.id} não encontrado no banco`
  if (found.nome !== expected.nome) {
    return `Nome divergente para ${expected.id}: esperado "${expected.nome}", encontrado "${found.nome}"`
  }
  if (found.categoria !== expected.categoria) {
    return `Categoria divergente para "${found.nome}": esperado "${expected.categoria}", encontrado "${found.categoria}"`
  }
  return null
}

export async function deletarProdutosTesteLegado(): Promise<ActionResult & { deleted?: number }> {
  const auth = await requireAdminOrNull()
  if (!auth) return { ok: false, error: 'Não autorizado' }

  try {
    const { supabase } = auth
    const { data: found, error: selectError } = await supabase
      .from('produtos')
      .select('id, nome, categoria')
      .in('id', [...PRODUTOS_TESTE_LEGADO_IDS])

    if (selectError) return { ok: false, error: selectError.message }

    const byId = new Map((found ?? []).map((row) => [row.id, row]))
    for (const expected of PRODUTOS_TESTE_LEGADO) {
      const problem = mismatchMessage(expected, byId.get(expected.id))
      if (problem) return { ok: false, error: problem }
    }

    if ((found?.length ?? 0) !== PRODUTOS_TESTE_LEGADO.length) {
      return {
        ok: false,
        error: `Esperados ${PRODUTOS_TESTE_LEGADO.length} produtos; encontrados ${found?.length ?? 0}. Nada foi excluído.`,
      }
    }

    for (const id of PRODUTOS_TESTE_LEGADO_IDS) {
      await supabase.from('conjunto_pecas').delete().eq('peca_id', id)
    }

    const { error: deleteError, count } = await supabase
      .from('produtos')
      .delete({ count: 'exact' })
      .in('id', [...PRODUTOS_TESTE_LEGADO_IDS])

    if (deleteError) return { ok: false, error: deleteError.message }

    revalidatePath('/loja')
    revalidatePath('/admin')
    revalidatePath('/admin/limpar-produtos-teste')

    return { ok: true, deleted: count ?? PRODUTOS_TESTE_LEGADO.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' }
  }
}
