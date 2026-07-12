'use client'

import { useState, useTransition } from 'react'
import { ocultarPublicadosSemFoto } from './actions'
import type { ItemSemFoto } from '@/lib/sem-foto-utils'

interface Props {
  items: ItemSemFoto[]
}

export function OcultarSemFotoClient({ items }: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleOcultar() {
    const lista = items
      .slice(0, 20)
      .map((i) => `• ${i.codigo || '—'} — ${i.nome.trim() || 'Sem nome'} (${i.tipo === 'conjunto' ? 'conjunto' : 'peça'})`)
      .join('\n')
    const extra = items.length > 20 ? `\n… e mais ${items.length - 20} item(ns)` : ''

    if (
      !confirm(
        `Desmarcar "Exibir no site" para ${items.length} item(ns) sem foto?\n\n${lista}${extra}\n\nNada será excluído do estoque — apenas ocultado na loja.`,
      )
    ) {
      return
    }

    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await ocultarPublicadosSemFoto()
      if (result.ok) {
        setMessage(
          `Concluído: ${result.pecas ?? 0} peça(s), ${result.conjuntos ?? 0} conjunto(s) atualizados; ${result.loja ?? 0} removido(s) da vitrine.`,
        )
        window.location.reload()
      } else {
        setError(result.error ?? 'Erro ao ocultar')
      }
    })
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleOcultar}
        disabled={pending || items.length === 0}
        className="px-5 py-2.5 bg-terracota text-white font-sans text-sm disabled:opacity-50"
      >
        {pending ? 'Ocultando…' : `Ocultar ${items.length} item(ns) sem foto`}
      </button>
      {message && (
        <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3">
          {message}
        </p>
      )}
      {error && (
        <p className="font-sans text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">
          {error}
        </p>
      )}
    </div>
  )
}
