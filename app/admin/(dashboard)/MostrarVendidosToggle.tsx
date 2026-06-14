'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarMostrarVendidos } from './configuracoes/actions'

interface Props {
  ativo: boolean
}

export function MostrarVendidosToggle({ ativo }: Props) {
  const [valor, setValor] = useState(ativo)
  const [salvando, setSalvando] = useState(false)
  const router = useRouter()

  async function toggle() {
    setSalvando(true)
    const novoValor = !valor
    const result = await atualizarMostrarVendidos(novoValor)
    if (result.ok) {
      setValor(novoValor)
      router.refresh()
    }
    setSalvando(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={salvando}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        valor ? 'bg-terracota' : 'bg-pedra'
      } disabled:opacity-50 flex-shrink-0`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          valor ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
