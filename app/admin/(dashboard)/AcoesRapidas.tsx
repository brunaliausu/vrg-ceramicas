'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Produto } from '@/types'

interface Props {
  produto: Produto
}

export function AcoesRapidas({ produto }: Props) {
  const router = useRouter()

  async function marcarVendido() {
    if (!confirm(`Marcar "${produto.nome}" como Vendido?`)) return
    const supabase = createClient()
    await supabase.from('produtos').update({ status: 'Vendido' }).eq('id', produto.id)
    router.refresh()
  }

  async function toggleDestaqueHome() {
    const supabase = createClient()
    await supabase
      .from('produtos')
      .update({ destaque_home: !produto.destaque_home })
      .eq('id', produto.id)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {produto.status === 'Disponível' && (
        <button
          onClick={marcarVendido}
          className="font-sans text-xs text-carvao/50 hover:text-carvao transition-colors whitespace-nowrap"
          title="Marcar como vendido"
        >
          Vendido
        </button>
      )}
      <button
        onClick={toggleDestaqueHome}
        className={`font-sans text-xs transition-colors whitespace-nowrap ${
          produto.destaque_home
            ? 'text-terracota'
            : 'text-carvao/30 hover:text-carvao/60'
        }`}
        title={produto.destaque_home ? 'Remover destaque da Home' : 'Destacar na Home'}
      >
        ★
      </button>
    </div>
  )
}
