'use client'

import { useState, useTransition } from 'react'
import { deletarProdutosTesteLegado } from './actions'

interface Props {
  produtos: Array<{
    id: string
    nome: string
    categoria: string
    status: string
    lojaLabel: string
  }>
}

export function LimparProdutosTesteClient({ produtos }: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleDelete() {
    const lista = produtos.map((p) => `• ${p.nome.trim()} (${p.lojaLabel})`).join('\n')
    if (
      !confirm(
        `Excluir permanentemente estas ${produtos.length} peças de teste?\n\n${lista}\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await deletarProdutosTesteLegado()
      if (result.ok) {
        setMessage(`${result.deleted ?? produtos.length} produto(s) excluído(s) da loja.`)
        window.location.reload()
      } else {
        setError(result.error ?? 'Erro ao excluir')
      }
    })
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending || produtos.length === 0}
        className="px-5 py-2.5 bg-terracota text-white font-sans text-sm disabled:opacity-50"
      >
        {pending ? 'Excluindo…' : `Excluir ${produtos.length} peça(s) de teste`}
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
