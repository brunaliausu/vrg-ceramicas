'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ContatoConteudo } from '@/types'

interface Props {
  inicial: ContatoConteudo
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

export function ContatoForm({ inicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ContatoConteudo>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function set<K extends keyof ContatoConteudo>(key: K, value: ContatoConteudo[K]) {
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
      .upsert({ id: 'contato', dados: form, atualizado_em: new Date().toISOString() })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso('Conteúdo da página Contato salvo com sucesso!')
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

      <Secao titulo="Cabeçalho da página">
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

      <Secao titulo="Formulário de encomenda">
        <div>
          <label className={labelClass}>Título acima do formulário</label>
          <input value={form.form_titulo} onChange={(e) => set('form_titulo', e.target.value)} className={inputClass} />
        </div>
        <p className="font-sans text-xs text-muted">
          Os campos do formulário (nome, e-mail, mensagem) são fixos. Apenas o título da seção é editável aqui.
        </p>
      </Secao>

      <Secao titulo="Contatos e redes">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Rótulo WhatsApp</label>
            <input value={form.whatsapp_rotulo} onChange={(e) => set('whatsapp_rotulo', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Texto do link WhatsApp</label>
            <input value={form.whatsapp_texto} onChange={(e) => set('whatsapp_texto', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rótulo Instagram</label>
            <input value={form.instagram_rotulo} onChange={(e) => set('instagram_rotulo', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Handle do Instagram (com @)</label>
            <input value={form.instagram_handle} onChange={(e) => set('instagram_handle', e.target.value)} className={inputClass} />
          </div>
        </div>
      </Secao>

      <Secao titulo="Informações adicionais">
        <div>
          <label className={labelClass}>Título — Envios</label>
          <input value={form.envios_titulo} onChange={(e) => set('envios_titulo', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Texto — Envios</label>
          <textarea rows={3} value={form.envios_texto} onChange={(e) => set('envios_texto', e.target.value)} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Título — Encomendas</label>
          <input value={form.encomendas_titulo} onChange={(e) => set('encomendas_titulo', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Texto — Encomendas</label>
          <textarea rows={3} value={form.encomendas_texto} onChange={(e) => set('encomendas_texto', e.target.value)} className={textareaClass} />
        </div>
      </Secao>

      <div className="flex items-center gap-4 pt-2 border-t border-pedra">
        <button
          type="submit"
          disabled={salvando}
          className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar alterações de Contato'}
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
