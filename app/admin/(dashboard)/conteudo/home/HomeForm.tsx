'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import type { HomeConteudo } from '@/types'

interface Props {
  inicial: HomeConteudo
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

export function HomeForm({ inicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<HomeConteudo>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function set<K extends keyof HomeConteudo>(key: K, value: HomeConteudo[K]) {
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
      .upsert({ id: 'home', dados: form, atualizado_em: new Date().toISOString() })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso('Conteúdo da Home salvo com sucesso!')
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
      <Secao titulo="Hero — seção principal">
        <div>
          <label className={labelClass}>Texto de destaque (eyebrow)</label>
          <input
            value={form.hero_eyebrow}
            onChange={(e) => set('hero_eyebrow', e.target.value)}
            placeholder="Cerâmica autoral feita à mão · Brasil"
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Título — linha 1</label>
            <input value={form.hero_linha1} onChange={(e) => set('hero_linha1', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Título — linha 2</label>
            <input value={form.hero_linha2} onChange={(e) => set('hero_linha2', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Título — linha 3 (em itálico terracota)</label>
            <input value={form.hero_linha3} onChange={(e) => set('hero_linha3', e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Parágrafo do hero</label>
          <textarea rows={3} value={form.hero_texto} onChange={(e) => set('hero_texto', e.target.value)} className={textareaClass} />
        </div>
        <ConteudoImageUpload
          label="Imagem do hero (aparece à direita)"
          hint="Proporção recomendada: 4:5 (retrato). Fundos neutros com luz natural."
          value={form.hero_imagem}
          onChange={(url) => set('hero_imagem', url)}
        />
      </Secao>

      {/* ── MARQUEE ── */}
      <Secao titulo="Faixa giratória (marquee)">
        <div>
          <label className={labelClass}>Termos — separe com · (ponto alto)</label>
          <input
            value={form.marquee_termos}
            onChange={(e) => set('marquee_termos', e.target.value)}
            placeholder="peça única · feito à mão · barro & fogo"
            className={inputClass}
          />
          <p className="font-sans text-xs text-muted mt-1.5">
            A faixa repete os termos em loop. Use o símbolo · para separar.
          </p>
        </div>
      </Secao>

      {/* ── ARTISTA ── */}
      <Secao titulo="Seção da artista">
        <div>
          <label className={labelClass}>Lead (linha pequena sobre o título)</label>
          <input value={form.artista_lead} onChange={(e) => set('artista_lead', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Citação / quote da artista</label>
          <textarea rows={3} value={form.artista_quote} onChange={(e) => set('artista_quote', e.target.value)} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Biografia curta</label>
          <textarea rows={4} value={form.artista_bio} onChange={(e) => set('artista_bio', e.target.value)} className={textareaClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Assinatura (escrita cursiva)</label>
            <input value={form.artista_assinatura} onChange={(e) => set('artista_assinatura', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Cargo / função</label>
            <input value={form.artista_cargo} onChange={(e) => set('artista_cargo', e.target.value)} className={inputClass} />
          </div>
        </div>
        <ConteudoImageUpload
          label="Foto da artista ou do processo"
          hint="Proporção 4:5. Preferência por luz natural, mãos no barro ou ateliê."
          value={form.artista_imagem}
          onChange={(url) => set('artista_imagem', url)}
        />
      </Secao>

      {/* ── COLEÇÃO ── */}
      <Secao titulo="Bloco de coleção em destaque">
        <div>
          <label className={labelClass}>Lead</label>
          <input value={form.colecao_lead} onChange={(e) => set('colecao_lead', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Nome da coleção</label>
          <input value={form.colecao_titulo} onChange={(e) => set('colecao_titulo', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Descrição da coleção</label>
          <textarea rows={3} value={form.colecao_texto} onChange={(e) => set('colecao_texto', e.target.value)} className={textareaClass} />
        </div>
        <ConteudoImageUpload
          label="Imagem de fundo do bloco da coleção"
          hint="Imagem larga (16:9 ou panorâmica). Aparecerá com sobreposição escura."
          value={form.colecao_imagem}
          onChange={(url) => set('colecao_imagem', url)}
        />
      </Secao>

      {/* ── SUBMIT ── */}
      <div className="flex items-center gap-4 pt-2 border-t border-pedra">
        <button
          type="submit"
          disabled={salvando}
          className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações da Home'}
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
