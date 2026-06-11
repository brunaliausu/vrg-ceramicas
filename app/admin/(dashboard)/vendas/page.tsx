import { createClient } from '@/lib/supabase/server'
import { VendasTable, type VendaRow } from './VendasTable'

async function getVendas(): Promise<VendaRow[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('pecas_estoque')
      .select(
        'id, codigo, nome, status, fotos, valor_venda, local_venda, cliente_nome, cliente_telefone, cliente_email, conjunto_codigo, conjunto_nome, vendido_em',
      )
      .eq('status', 'vendido')
      .order('vendido_em', { ascending: false, nullsFirst: false })
      .order('codigo', { ascending: true })
    return (data ?? []) as VendaRow[]
  } catch {
    return []
  }
}

export default async function VendasPage() {
  const vendas = await getVendas()

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden">
      <div className="shrink-0 mb-6">
        <h1 className="font-serif text-3xl font-light text-carvao">Vendas</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Peças marcadas como vendidas no cadastro de estoque, com dados do cliente e valor realizado.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <VendasTable rows={vendas} />
      </div>
    </div>
  )
}
