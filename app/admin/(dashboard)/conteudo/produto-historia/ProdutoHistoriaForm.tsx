'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ConteudoImageUpload } from '@/components/admin/ConteudoImageUpload'
import type { ProdutoHistoriaConteudo } from '@/types'

interface Props {
  inicial: ProdutoHistoriaConteudo
}

const inputClass =
  'w-full bg-white border border-pedra px-4 py-2.5 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors'
const labelClass = 'block font-sans text-xs text-carvao/70 mb-1.5'
const textareaClass = inputClass + ' resize-none'

export function ProdutoHistoriaForm({ inicial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ProdutoHistoriaConteudo>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')

  function set<K extends keyof ProdutoHistoriaConteudo>(key: K, value: ProdutoHistoriaConteudo[K]) {
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
      .upsert({ id: 'produto_historia', dados: form, atualizado_em: new Date().toISOString() })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso('Seção "A história desta peça" salva com sucesso!')
      router.refresh()
    }
    setSalvando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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

      <div className="bg-areia border border-pedra p-4">
        <p className="font-sans text-xs text-carvao/70 leading-relaxed">
          Esta seção aparece no rodapé de <strong>todas as páginas de produto</strong>, logo abaixo
          dos detalhes da peça. Use para contar a história do ateliê e do processo artesanal de
          forma geral.
        </p>
      </div>

      <div className="bg-white border border-pedra p-6 space-y-5">
        <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
          Conteúdo da seção
        </h2>

        <div>
          <label className={labelClass}>Lead (linha pequena acima do título)</label>
          <input
            value={form.lead}
            onChange={(e) => set('lead', e.target.value)}
            placeholder="A história desta peça"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Título</label>
          <input
            value={form.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            placeholder="Nascida no ateliê, com intenção"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Texto / parágrafo</label>
          <textarea
            rows={5}
            value={form.texto}
            onChange={(e) => set('texto', e.target.value)}
            placeholder="Cada peça VRG passa por semanas de processo..."
            className={textareaClass}
          />
        </div>

        <div>
          <label className={labelClass}>Assinatura da artista (fonte cursiva)</label>
          <input
            value={form.assinatura}
            onChange={(e) => set('assinatura', e.target.value)}
            placeholder="— Valéria"
            className={inputClass}
          />
        </div>

        <ConteudoImageUpload
          label="Foto do processo / ateliê (aparece ao lado do texto)"
          hint="Proporção 16:9 ou 4:3. Mãos no barro, torno ou ateliê."
          value={form.imagem}
          onChange={(url) => set('imagem', url)}
        />
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-pedra">
        <button
          type="submit"
          disabled={salvando}
          className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar seção história do produto'}
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
