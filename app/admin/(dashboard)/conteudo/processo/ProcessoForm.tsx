'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import type { ProcessoConteudo } from '@/types'

interface Props {
  inicial: ProcessoConteudo
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

const ETAPAS = [
  { n: 1, num: '01' },
  { n: 2, num: '02' },
  { n: 3, num: '03' },
  { n: 4, num: '04' },
  { n: 5, num: '05' },
  { n: 6, num: '06' },
] as const

export function ProcessoForm({ inicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ProcessoConteudo>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function set<K extends keyof ProcessoConteudo>(key: K, value: ProcessoConteudo[K]) {
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
      .upsert({ id: 'processo', dados: form, atualizado_em: new Date().toISOString() })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso('Conteúdo da página Processo salvo com sucesso!')
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

      <Secao titulo="Introdução da página">
        <div>
          <label className={labelClass}>Lead (linha pequena)</label>
          <input value={form.hero_lead} onChange={(e) => set('hero_lead', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Título principal</label>
          <input value={form.hero_titulo} onChange={(e) => set('hero_titulo', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Texto introdutório</label>
          <textarea rows={3} value={form.hero_texto} onChange={(e) => set('hero_texto', e.target.value)} className={textareaClass} />
        </div>
      </Secao>

      <Secao titulo="Etapas do processo">
        {ETAPAS.map(({ n, num }) => {
          const tKey = `etapa${n}_titulo` as keyof ProcessoConteudo
          const txKey = `etapa${n}_texto` as keyof ProcessoConteudo
          const imgKey = `etapa${n}_imagem` as keyof ProcessoConteudo
          return (
            <div key={n} className="border border-pedra p-4 space-y-3">
              <p className="font-sans text-xs font-medium text-terracota">Etapa {num}</p>
              <div>
                <label className={labelClass}>Título</label>
                <input value={form[tKey] as string} onChange={(e) => set(tKey, e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea
                  rows={3}
                  value={form[txKey] as string}
                  onChange={(e) => set(txKey, e.target.value)}
                  className={textareaClass}
                />
              </div>
              <ConteudoImageUpload
                label={`Foto — etapa ${num}`}
                hint="Proporção 16:9 recomendada."
                value={form[imgKey] as string}
                onChange={(url) => set(imgKey, url)}
              />
            </div>
          )
        })}
      </Secao>

      <Secao titulo="Nota final">
        <div>
          <label className={labelClass}>Citação em destaque</label>
          <input value={form.nota_quote} onChange={(e) => set('nota_quote', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Texto complementar</label>
          <textarea rows={3} value={form.nota_texto} onChange={(e) => set('nota_texto', e.target.value)} className={textareaClass} />
        </div>
      </Secao>

      <div className="flex items-center gap-4 pt-2 border-t border-pedra">
        <button
          type="submit"
          disabled={salvando}
          className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações de Processo'}
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
