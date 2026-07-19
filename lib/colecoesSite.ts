import { createClient } from '@/lib/supabase/server'
import type { ColecaoDB } from '@/lib/colecaoUtils'

export async function getColecoesPublicas(): Promise<ColecaoDB[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('colecoes')
      .select('id, nome, slug, exibir_no_site, site_lead, site_titulo, site_texto, site_imagem, ordem')
      .eq('exibir_no_site', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })
      .limit(3)
    return (data ?? []) as ColecaoDB[]
  } catch {
    return []
  }
}

export async function getAllColecoesAdmin(): Promise<ColecaoDB[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('colecoes')
      .select('id, nome, slug, exibir_no_site, site_lead, site_titulo, site_texto, site_imagem, ordem')
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })
    return (data ?? []) as ColecaoDB[]
  } catch {
    return []
  }
}
