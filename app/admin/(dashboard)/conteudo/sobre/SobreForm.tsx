'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import type { SobreConteudo } from '@/types'

interface Props {
  inicial: SobreConteudo
}

const inputClass =
  'w-full bg-white border border-pedra px-4 py-2.5 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors'
const labelClass = 'block font-sans text-xs text-carvao/70 mb-1.5'
const textareaClass = inputClass + ' resize-none'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-pedra p-6 space-y-5">
      <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
        {titulo}
      </h2>
      {children}
    </div>
  )
}

export function SobreForm({ inicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<SobreConteudo>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function set<K extends keyof SobreConteudo>(key: K, value: SobreConteudo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setSucesso('')
    setErro('')

    const supabase = createClient()
    const { error } = await supabase
      .from('conteudo_site')
      .upsert({ id: 'sobre', dados: form, atualizado_em: new Date().toISOString() })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso('Conteúdo da página Sobre salvo com sucesso!')
      router.refresh()
    }
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sucesso && (
        <div className="bg-emerald-50 border border-emerald-200 px-4 py-3">
          <p className="font-sans text-sm text-emerald-700">{sucesso}</p>
        </div>
      )}
      {erro && (
        <div className="bg-red-50 border border-red-200 px-4 py-3">
          <p className="font-sans text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* ── HERO ── */}
      <Secao titulo="Hero — cabeçalho da página">
        <div>
          <label className={labelClass}>Lead (linha pequena)</label>
          <input value={form.hero_lead} onChange={(e) => set('hero_lead', e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Título — linha 1</label>
            <input value={form.hero_titulo1} onChange={(e) => set('hero_titulo1', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Título — linha 2 (em itálico terracota)</label>
            <input value={form.hero_titulo2} onChange={(e) => set('hero_titulo2', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Título — linha 3</label>
            <input value={form.hero_titulo3} onChange={(e) => set('hero_titulo3', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Subtítulo (parágrafo abaixo do título)</label>
          <textarea rows={2} value={form.hero_subtitulo} onChange={(e) => set('hero_subtitulo', e.target.value)} className={textareaClass} />
        </div>
        <ConteudoImageUpload
          label="Foto da artista (hero)"
          hint="Proporção 4:5 ou retrato. Foto do ateliê, da artista trabalhando ou portrait."
          value={form.hero_imagem}
          onChange={(url) => set('hero_imagem', url)}
        />
      </Secao>

      {/* ── CARTA ── */}
      <Secao titulo="Carta da artista — texto em primeira pessoa">
        <div>
          <label className={labelClass}>Parágrafo 1 (com letra maiúscula decorativa)</label>
          <textarea rows={4} value={form.carta_p1} onChange={(e) => set('carta_p1', e.target.value)} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Parágrafo 2</label>
          <textarea rows={4} value={form.carta_p2} onChange={(e) => set('carta_p2', e.target.value)} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Parágrafo 3</label>
          <textarea rows={4} value={form.carta_p3} onChange={(e) => set('carta_p3', e.target.value)} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Citação em itálico (frase de destaque)</label>
          <textarea rows={2} value={form.carta_quote} onChange={(e) => set('carta_quote', e.target.value)} className={textareaClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Assinatura (fonte cursiva)</label>
            <input value={form.carta_assinatura} onChange={(e) => set('carta_assinatura', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cargo / função</label>
            <input value={form.carta_cargo} onChange={(e) => set('carta_cargo', e.target.value)} className={inputClass} />
          </div>
        </div>
      </Secao>

      {/* ── PROCESSO ── */}
      <Secao titulo="Processo criativo — 4 etapas">
        <div>
          <label className={labelClass}>Título da seção</label>
          <input value={form.processo_titulo} onChange={(e) => set('processo_titulo', e.target.value)} className={inputClass} />
        </div>

        {([1, 2, 3, 4] as const).map((n) => {
          const tKey = `processo_p${n}_titulo` as keyof SobreConteudo
          const txKey = `processo_p${n}_texto` as keyof SobreConteudo
          const imgKey = `processo_p${n}_imagem` as keyof SobreConteudo
          const nums = ['01 · Centrar', '02 · Modelar', '03 · Secar & esmaltar', '04 · Queimar']
          return (
            <div key={n} className="border border-pedra p-4 space-y-3">
              <p className="font-sans text-xs font-medium text-terracota">{nums[n - 1]}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Título da etapa</label>
                  <input
                    value={form[tKey] as string}
                    onChange={(e) => set(tKey, e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Descrição</label>
                  <input
                    value={form[txKey] as string}
                    onChange={(e) => set(txKey, e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <ConteudoImageUpload
                label={`Foto da etapa ${n}`}
                hint="Proporção 1:1 ou 4:3."
                value={form[imgKey] as string}
                onChange={(url) => set(imgKey, url)}
              />
            </div>
          )
        })}
      </Secao>

      {/* ── VALORES ── */}
      <Secao titulo="Valores da marca — 3 pilares">
        {([1, 2, 3] as const).map((n) => {
          const tKey = `valores_${n}_titulo` as keyof SobreConteudo
          const txKey = `valores_${n}_texto` as keyof SobreConteudo
          return (
            <div key={n} className="grid grid-cols-3 gap-4 border-b border-pedra pb-4 last:border-0 last:pb-0">
              <div>
                <label className={labelClass}>Valor {n} — título</label>
                <input value={form[tKey] as string} onChange={(e) => set(tKey, e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Descrição</label>
                <input value={form[txKey] as string} onChange={(e) => set(txKey, e.target.value)} className={inputClass} />
              </div>
            </div>
          )
        })}
      </Secao>

      {/* ── CTA ── */}
      <Secao titulo="Chamada para ação (CTA final)">
        <div>
          <label className={labelClass}>Texto do CTA</label>
          <input value={form.cta_titulo} onChange={(e) => set('cta_titulo', e.target.value)} className={inputClass} />
        </div>
        <ConteudoImageUpload
          label="Imagem de fundo do CTA"
          hint="Imagem larga (16:9). Aparece com sobreposição escura."
          value={form.cta_imagem}
          onChange={(url) => set('cta_imagem', url)}
        />
      </Secao>

      {/* ── SUBMIT ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-pedra">
        <button
          type="submit"
          disabled={salvando}
          className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações de Sobre'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/conteudo')}
          className="font-sans text-sm text-carvao/60 hover:text-carvao transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
