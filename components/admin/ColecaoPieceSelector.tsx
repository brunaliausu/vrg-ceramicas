'use client'

import { useState } from 'react'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import {
  MAX_COLECOES_NO_SITE,
  defaultColecaoSiteFields,
  type ColecaoDB,
} from '@/lib/colecaoUtils'
import { salvarColecao } from '@/app/admin/(dashboard)/pecas/colecoesActions'

const LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1'
const INP = 'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao bg-white focus:outline-none focus:border-terracota'

interface Props {
  value: string | null
  onChange: (colecaoId: string | null) => void
  colecoes: ColecaoDB[]
  onColecoesChange: (colecoes: ColecaoDB[]) => void
  disabled?: boolean
}

export function ColecaoPieceSelector({
  value,
  onChange,
  colecoes,
  onColecoesChange,
  disabled = false,
}: Props) {
  const [creating, setCreating] = useState(false)
  const [nome, setNome] = useState('')
  const [exibirNoSite, setExibirNoSite] = useState(false)
  const [siteLead, setSiteLead] = useState('Coleção')
  const [siteTitulo, setSiteTitulo] = useState('')
  const [siteTexto, setSiteTexto] = useState('')
  const [siteImagem, setSiteImagem] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const noSiteCount = colecoes.filter((c) => c.exibir_no_site).length
  const canShowOnSite = exibirNoSite ? noSiteCount < MAX_COLECOES_NO_SITE : true

  async function handleCreate() {
    const trimmed = nome.trim()
    if (!trimmed) {
      setError('Informe o nome da coleção.')
      return
    }
    if (exibirNoSite && noSiteCount >= MAX_COLECOES_NO_SITE) {
      setError(`No máximo ${MAX_COLECOES_NO_SITE} coleções podem estar no site. Desative outra antes.`)
      return
    }

    setSaving(true)
    setError(null)
    const defaults = defaultColecaoSiteFields(trimmed)
    const result = await salvarColecao({
      nome: trimmed,
      exibir_no_site: exibirNoSite,
      site_lead: siteLead.trim() || defaults.site_lead,
      site_titulo: siteTitulo.trim() || trimmed,
      site_texto: siteTexto.trim(),
      site_imagem: siteImagem.trim(),
      ordem: colecoes.length,
    })
    setSaving(false)

    if (!result.ok || !result.id) {
      setError(result.error ?? 'Erro ao salvar coleção')
      return
    }

    const nova: ColecaoDB = {
      id: result.id,
      nome: trimmed,
      slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      exibir_no_site: exibirNoSite,
      site_lead: siteLead.trim() || defaults.site_lead,
      site_titulo: siteTitulo.trim() || trimmed,
      site_texto: siteTexto.trim(),
      site_imagem: siteImagem.trim(),
      ordem: colecoes.length,
    }
    onColecoesChange([...colecoes, nova].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')))
    onChange(result.id)
    setCreating(false)
    setNome('')
    setExibirNoSite(false)
    setSiteLead('Coleção')
    setSiteTitulo('')
    setSiteTexto('')
    setSiteImagem('')
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={LBL}>Coleção</label>
        <select
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          className={INP}
        >
          <option value="">Nenhuma</option>
          {colecoes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}{c.exibir_no_site ? ' · no site' : ''}
            </option>
          ))}
        </select>
      </div>

      {!disabled && !creating && (
        <button
          type="button"
          onClick={() => {
            setCreating(true)
            setError(null)
          }}
          className="font-sans text-[11px] text-terracota hover:text-carvao border border-terracota/40 px-3 py-1.5 hover:bg-terracota/5 transition-colors"
        >
          + Nova coleção
        </button>
      )}

      {creating && (
        <div className="border border-pedra/70 bg-cru/20 p-4 space-y-3">
          <p className="font-sans text-xs font-medium text-carvao">Nova coleção</p>
          <div>
            <label className={LBL}>Nome da coleção</label>
            <input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (!siteTitulo) setSiteTitulo(e.target.value)
              }}
              placeholder="Ex: Seres"
              className={INP}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-sans text-xs text-carvao cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exibirNoSite}
                onChange={(e) => setExibirNoSite(e.target.checked)}
                className="accent-carvao"
              />
              Exibir seção desta coleção no site
            </label>
            <span className="font-sans text-[10px] text-muted">
              ({noSiteCount}/{MAX_COLECOES_NO_SITE} no site)
            </span>
          </div>

          {exibirNoSite && (
            <div className="space-y-3 pt-1 border-t border-pedra/40">
              {!canShowOnSite && (
                <p className="font-sans text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1.5">
                  Limite de {MAX_COLECOES_NO_SITE} coleções no site atingido. Desative outra em Admin → Coleções.
                </p>
              )}
              <div>
                <label className={LBL}>Texto de introdução (lead)</label>
                <input value={siteLead} onChange={(e) => setSiteLead(e.target.value)} className={INP} placeholder="Coleção" />
              </div>
              <div>
                <label className={LBL}>Título no site</label>
                <input value={siteTitulo} onChange={(e) => setSiteTitulo(e.target.value)} className={INP} placeholder={nome || 'Seres'} />
              </div>
              <div>
                <label className={LBL}>Descrição no site</label>
                <textarea
                  value={siteTexto}
                  onChange={(e) => setSiteTexto(e.target.value)}
                  rows={3}
                  className={`${INP} resize-none`}
                  placeholder="Texto exibido na home e na loja"
                />
              </div>
              <ConteudoImageUpload
                label="Imagem de fundo (home)"
                value={siteImagem}
                onChange={setSiteImagem}
              />
            </div>
          )}

          {error && <p className="font-sans text-[11px] text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || (exibirNoSite && !canShowOnSite)}
              onClick={handleCreate}
              className="font-sans text-xs bg-carvao text-cru px-4 py-2 disabled:opacity-40"
            >
              {saving ? 'Salvando…' : 'Criar coleção'}
            </button>
            <button
              type="button"
              onClick={() => { setCreating(false); setError(null) }}
              className="font-sans text-xs text-muted px-3 py-2 border border-pedra"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
