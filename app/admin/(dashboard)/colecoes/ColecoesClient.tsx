'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import {
  MAX_COLECOES_NO_SITE,
  type ColecaoDB,
} from '@/lib/colecaoUtils'
import { salvarColecao, toggleColecaoNoSite } from '@/app/admin/(dashboard)/pecas/colecoesActions'

const LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1'
const INP = 'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao bg-white focus:outline-none focus:border-terracota'

interface Props {
  colecoes: ColecaoDB[]
}

export function ColecoesClient({ colecoes: initial }: Props) {
  const [colecoes, setColecoes] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [draft, setDraft] = useState({
    nome: '',
    exibir_no_site: false,
    site_lead: 'Coleção',
    site_titulo: '',
    site_texto: '',
    site_imagem: '',
  })

  const noSiteCount = colecoes.filter((c) => c.exibir_no_site).length

  function startEdit(c: ColecaoDB) {
    setEditingId(c.id)
    setDraft({
      nome: c.nome,
      exibir_no_site: c.exibir_no_site,
      site_lead: c.site_lead,
      site_titulo: c.site_titulo,
      site_texto: c.site_texto,
      site_imagem: c.site_imagem,
    })
    setError(null)
    setMessage(null)
  }

  function startNew() {
    setEditingId('new')
    setDraft({
      nome: '',
      exibir_no_site: false,
      site_lead: 'Coleção',
      site_titulo: '',
      site_texto: '',
      site_imagem: '',
    })
    setError(null)
    setMessage(null)
  }

  function saveDraft() {
    startTransition(async () => {
      setError(null)
      setMessage(null)
      const payload = {
        ...(editingId && editingId !== 'new' ? { id: editingId } : {}),
        nome: draft.nome,
        exibir_no_site: draft.exibir_no_site,
        site_lead: draft.site_lead,
        site_titulo: draft.site_titulo || draft.nome,
        site_texto: draft.site_texto,
        site_imagem: draft.site_imagem,
        ordem: editingId && editingId !== 'new'
          ? colecoes.find((c) => c.id === editingId)?.ordem ?? colecoes.length
          : colecoes.length,
      }
      const result = await salvarColecao(payload)
      if (!result.ok) {
        setError(result.error ?? 'Erro ao salvar')
        return
      }
      setMessage(editingId === 'new' ? 'Coleção criada.' : 'Coleção atualizada.')
      setEditingId(null)
      window.location.reload()
    })
  }

  function toggleSite(id: string, exibir: boolean) {
    startTransition(async () => {
      setError(null)
      const result = await toggleColecaoNoSite(id, exibir)
      if (!result.ok) {
        setError(result.error ?? 'Erro ao atualizar')
        return
      }
      setColecoes((prev) => prev.map((c) => (c.id === id ? { ...c, exibir_no_site: exibir } : c)))
    })
  }

  return (
    <div className="space-y-6">
      <p className="font-sans text-sm text-carvao/70 max-w-2xl">
        Cadastre coleções e vincule às peças no estoque. Até{' '}
        <strong>{MAX_COLECOES_NO_SITE}</strong> coleções podem ter seção na home e filtro na loja.
        Peças com coleção aparecem ao selecionar a coleção em <code className="text-xs bg-areia px-1">/loja?colecao=…</code>.
      </p>

      <p className="font-sans text-xs text-muted">
        No site agora: {noSiteCount}/{MAX_COLECOES_NO_SITE} coleção(ões) visível(is)
      </p>

      {error && (
        <p className="font-sans text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3">{error}</p>
      )}
      {message && (
        <p className="font-sans text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3">{message}</p>
      )}

      <button
        type="button"
        onClick={startNew}
        className="font-sans text-xs bg-terracota text-white px-4 py-2 hover:bg-terracota/90"
      >
        + Nova coleção
      </button>

      {(editingId === 'new' || editingId) && (
        <div className="border border-pedra p-5 bg-white space-y-4 max-w-xl">
          <h2 className="font-serif text-xl text-carvao">
            {editingId === 'new' ? 'Nova coleção' : 'Editar coleção'}
          </h2>
          <div>
            <label className={LBL}>Nome</label>
            <input
              value={draft.nome}
              onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value, site_titulo: d.site_titulo || e.target.value }))}
              className={INP}
              placeholder="Ex: Seres"
            />
          </div>
          <label className="flex items-center gap-2 font-sans text-sm text-carvao cursor-pointer">
            <input
              type="checkbox"
              checked={draft.exibir_no_site}
              onChange={(e) => setDraft((d) => ({ ...d, exibir_no_site: e.target.checked }))}
              className="accent-carvao"
            />
            Exibir seção no site (home + filtro na loja)
          </label>
          {draft.exibir_no_site && (
            <>
              <div>
                <label className={LBL}>Lead</label>
                <input value={draft.site_lead} onChange={(e) => setDraft((d) => ({ ...d, site_lead: e.target.value }))} className={INP} />
              </div>
              <div>
                <label className={LBL}>Título no site</label>
                <input value={draft.site_titulo} onChange={(e) => setDraft((d) => ({ ...d, site_titulo: e.target.value }))} className={INP} />
              </div>
              <div>
                <label className={LBL}>Descrição</label>
                <textarea value={draft.site_texto} onChange={(e) => setDraft((d) => ({ ...d, site_texto: e.target.value }))} rows={3} className={`${INP} resize-none`} />
              </div>
              <ConteudoImageUpload label="Imagem de fundo" value={draft.site_imagem} onChange={(url) => setDraft((d) => ({ ...d, site_imagem: url }))} />
            </>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={pending} onClick={saveDraft} className="font-sans text-xs bg-carvao text-cru px-4 py-2 disabled:opacity-40">
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditingId(null)} className="font-sans text-xs border border-pedra px-3 py-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="border border-pedra overflow-hidden">
        <table className="w-full font-sans text-sm">
          <thead className="bg-areia text-left text-xs text-carvao/60">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">No site</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {colecoes.map((c) => (
              <tr key={c.id} className="border-t border-pedra">
                <td className="px-4 py-3 font-medium">{c.nome}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => toggleSite(c.id, !c.exibir_no_site)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${c.exibir_no_site ? 'bg-terracota' : 'bg-pedra/50'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${c.exibir_no_site ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => startEdit(c)} className="font-sans text-xs text-terracota hover:text-carvao">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {colecoes.length === 0 && (
          <p className="px-4 py-8 text-center font-sans text-sm text-muted">Nenhuma coleção cadastrada.</p>
        )}
      </div>

      <Link href="/admin/pecas" className="font-sans text-xs text-muted hover:text-carvao">
        ← Voltar para Peças & Estoque
      </Link>
    </div>
  )
}
