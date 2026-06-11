'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export interface VendaFormData {
  valor_venda: string
  local_venda: string
  cliente_nome: string
  cliente_telefone: string
  cliente_email: string
}

interface Props {
  pecaLabel: string
  initial: VendaFormData
  onConfirm: (data: VendaFormData) => void
  onCancel: () => void
}

const INP =
  'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota bg-white'
const LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1'

export function VendaModal({ pecaLabel, initial, onConfirm, onCancel }: Props) {
  const [form, setForm] = useState<VendaFormData>(initial)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSubmit() {
    const valor = parseFloat(form.valor_venda.replace(',', '.'))
    if (!form.valor_venda.trim() || Number.isNaN(valor) || valor <= 0) {
      setError('Informe o valor da venda.')
      return
    }
    setError(null)
    onConfirm({ ...form, valor_venda: String(valor) })
  }

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white border border-pedra shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl text-carvao mb-1">Registrar venda</h2>
        <p className="font-sans text-sm text-muted mb-5">{pecaLabel}</p>

        <div className="space-y-4">
          <div>
            <label className={LBL}>Valor da venda *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.valor_venda}
              onChange={(e) => setForm((f) => ({ ...f, valor_venda: e.target.value }))}
              placeholder="0,00"
              className={INP}
              autoFocus
            />
          </div>
          <div>
            <label className={LBL}>Local da venda</label>
            <input
              type="text"
              value={form.local_venda}
              onChange={(e) => setForm((f) => ({ ...f, local_venda: e.target.value }))}
              placeholder="Ex: Loja, feira, Instagram…"
              className={INP}
            />
          </div>
          <div>
            <label className={LBL}>Nome do cliente</label>
            <input
              type="text"
              value={form.cliente_nome}
              onChange={(e) => setForm((f) => ({ ...f, cliente_nome: e.target.value }))}
              placeholder="Nome"
              className={INP}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Telefone</label>
              <input
                type="tel"
                value={form.cliente_telefone}
                onChange={(e) => setForm((f) => ({ ...f, cliente_telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                className={INP}
              />
            </div>
            <div>
              <label className={LBL}>E-mail</label>
              <input
                type="email"
                value={form.cliente_email}
                onChange={(e) => setForm((f) => ({ ...f, cliente_email: e.target.value }))}
                placeholder="email@exemplo.com"
                className={INP}
              />
            </div>
          </div>
        </div>

        {error && <p className="font-sans text-xs text-red-600 mt-3">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors"
          >
            Confirmar venda
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
