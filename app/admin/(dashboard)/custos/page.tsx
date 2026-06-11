import { createClient } from '@/lib/supabase/server'
import { CustosForm } from './CustosForm'

async function getCustos() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('custos_config')
      .select('dados')
      .eq('id', 1)
      .single()
    return data?.dados ?? {}
  } catch {
    return {}
  }
}

export default async function CustosPage() {
  const dados = await getCustos()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-light text-carvao">Custos & Precificação</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Configure os insumos de custo. Os campos calculados são atualizados automaticamente.
        </p>
      </div>
      <CustosForm inicial={dados as Record<string, unknown>} />
    </div>
  )
}
