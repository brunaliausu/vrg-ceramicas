'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateSlug } from '@/lib/utils'
import { ImageUpload } from './ImageUpload'
import type { Produto } from '@/types'
import {
  CATEGORIAS, STATUS_OPTIONS, CORES, MATERIAIS, ACABAMENTOS, CUIDADOS,
} from '@/types'

interface Props {
  produto?: Produto
  modo: 'novo' | 'editar'
}

type Campo = Omit<Produto, 'id' | 'slug' | 'criado_em' | 'atualizado_em'>

export function ProductForm({ produto, modo }: Props) {
  const router = useRouter()
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [sucesso, setSucesso] = useState('')
  const [erro, setErro] = useState('')
  const [imagens, setImagens] = useState<string[]>(produto?.imagens ?? [])
  const [imagensNovas, setImagensNovas] = useState<File[]>([])

  const [form, setForm] = useState<Campo>({
    nome: produto?.nome ?? '',
    categoria: produto?.categoria ?? 'Utilitários',
    colecao: produto?.colecao ?? '',
    descricao: produto?.descricao ?? '',
    preco: produto?.preco ?? null,
    status: produto?.status ?? 'Rascunho',
    aceita_encomenda: produto?.aceita_encomenda ?? false,
    destaque_home: produto?.destaque_home ?? false,
    destaque_loja: produto?.destaque_loja ?? false,
    ordem_exibicao: produto?.ordem_exibicao ?? null,
    cor: produto?.cor ?? null,
    material: produto?.material ?? null,
    acabamento: produto?.acabamento ?? null,
    medidas: produto?.medidas ?? '',
    capacidade: produto?.capacidade ?? '',
    peso: produto?.peso ?? null,
    cuidados: produto?.cuidados ?? [],
    imagens: produto?.imagens ?? [],
  })

  function set<K extends keyof Campo>(key: K, value: Campo[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCuidado(c: typeof CUIDADOS[number]) {
    const lista = form.cuidados.includes(c)
      ? form.cuidados.filter((x) => x !== c)
      : [...form.cuidados, c]
    set('cuidados', lista as typeof CUIDADOS)
  }

  async function fazerUploadImagens(produtoId: string, novas: File[]): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = [...imagens]

    for (const file of novas) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${produtoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage
        .from('produtos')
        .upload(path, file, { upsert: false })

      if (!error && data) {
        const { data: publicData } = supabase.storage.from('produtos').getPublicUrl(data.path)
        urls.push(publicData.publicUrl)
      }
    }

    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!form.nome.trim()) {
      setErro('O nome da peça é obrigatório.')
      return
    }

    setSalvando(true)
    const supabase = createClient()

    try {
      if (modo === 'novo') {
        // Generate a unique slug by appending a timestamp suffix if needed
        let slug = generateSlug(form.nome)

        // Primeiro insere para obter o ID
        const { data: inserido, error: errInsert } = await supabase
          .from('produtos')
          .insert({ ...form, slug, imagens: [] })
          .select('id')
          .single()

        if (errInsert || !inserido) {
          // Slug conflict: retry with a unique suffix
          if (errInsert?.code === '23505') {
            slug = `${slug}-${Date.now().toString(36)}`
            const { data: retry, error: errRetry } = await supabase
              .from('produtos')
              .insert({ ...form, slug, imagens: [] })
              .select('id')
              .single()
            if (errRetry || !retry) {
              setErro(`Erro ao salvar: ${errRetry?.message ?? 'tente novamente'}`)
              return
            }
            // continue with retry.id
            const urlsFinais = imagensNovas.length
              ? await fazerUploadImagens(retry.id, imagensNovas)
              : imagens
            await supabase.from('produtos').update({ imagens: urlsFinais }).eq('id', retry.id)
            setSucesso('Produto salvo com sucesso!')
            setTimeout(() => router.push('/admin'), 1200)
            return
          }
          setErro(`Erro ao salvar: ${errInsert?.message ?? 'tente novamente'}`)
          return
        }

        // Upload das imagens novas
        const urlsFinais = imagensNovas.length
          ? await fazerUploadImagens(inserido.id, imagensNovas)
          : imagens

        // Atualiza com as URLs das imagens
        await supabase
          .from('produtos')
          .update({ imagens: urlsFinais })
          .eq('id', inserido.id)

        setSucesso('Produto salvo com sucesso!')
        setTimeout(() => router.push('/admin'), 1200)
      } else if (produto) {
        const urlsFinais = imagensNovas.length
          ? await fazerUploadImagens(produto.id, imagensNovas)
          : imagens

        const { error: errUpdate } = await supabase
          .from('produtos')
          .update({ ...form, imagens: urlsFinais })
          .eq('id', produto.id)

        if (errUpdate) {
          setErro(`Erro ao salvar: ${errUpdate.message}`)
          return
        }

        setSucesso('Produto atualizado com sucesso!')
        setTimeout(() => router.refresh(), 800)
      }
    } finally {
      setSalvando(false)
    }
  }

  async function handleExcluir() {
    if (!produto) return
    if (!confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return

    setExcluindo(true)
    const supabase = createClient()
    await supabase.from('produtos').delete().eq('id', produto.id)
    router.push('/admin')
  }

  const inputClass =
    'w-full bg-white border border-pedra px-4 py-2.5 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors'
  const labelClass = 'block font-sans text-xs text-carvao/70 mb-1.5'
  const selectClass = inputClass + ' appearance-none'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Mensagens */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUNA ESQUERDA */}
        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="bg-white border border-pedra p-6 space-y-4">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
              Informações básicas
            </h2>

            <div>
              <label className={labelClass}>Nome da peça *</label>
              <input
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Nome da peça"
                className={inputClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Categoria *</label>
                <select
                  value={form.categoria}
                  onChange={(e) => set('categoria', e.target.value as typeof form.categoria)}
                  className={selectClass}
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Coleção</label>
                <input
                  value={form.colecao ?? ''}
                  onChange={(e) => set('colecao', e.target.value || null)}
                  placeholder="Ex: Flor de Lis"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Descrição</label>
              <textarea
                value={form.descricao ?? ''}
                onChange={(e) => set('descricao', e.target.value || null)}
                rows={4}
                placeholder="Descreva a peça — materiais, formas, inspiração..."
                className={inputClass + ' resize-none'}
              />
            </div>
          </div>

          {/* Atributos */}
          <div className="bg-white border border-pedra p-6 space-y-4">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
              Atributos
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Cor / tom</label>
                <select
                  value={form.cor ?? ''}
                  onChange={(e) => set('cor', e.target.value as typeof form.cor || null)}
                  className={selectClass}
                >
                  <option value="">— Selecionar —</option>
                  {CORES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Material</label>
                <select
                  value={form.material ?? ''}
                  onChange={(e) => set('material', e.target.value as typeof form.material || null)}
                  className={selectClass}
                >
                  <option value="">— Selecionar —</option>
                  {MATERIAIS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Acabamento</label>
                <select
                  value={form.acabamento ?? ''}
                  onChange={(e) => set('acabamento', e.target.value as typeof form.acabamento || null)}
                  className={selectClass}
                >
                  <option value="">— Selecionar —</option>
                  {ACABAMENTOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Capacidade</label>
                <input
                  value={form.capacidade ?? ''}
                  onChange={(e) => set('capacidade', e.target.value || null)}
                  placeholder="Ex: 300 ml"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Medidas</label>
                <input
                  value={form.medidas ?? ''}
                  onChange={(e) => set('medidas', e.target.value || null)}
                  placeholder="Alt. 15 × Diâm. 10 cm"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Peso (gramas)</label>
                <input
                  type="number"
                  value={form.peso ?? ''}
                  onChange={(e) => set('peso', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Ex: 350"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Cuidados e uso</label>
              <div className="space-y-2 mt-1">
                {CUIDADOS.map((c) => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.cuidados.includes(c)}
                      onChange={() => toggleCuidado(c)}
                      className="accent-terracota"
                    />
                    <span className="font-sans text-sm text-carvao/70">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="space-y-6">
          {/* Fotos */}
          <div className="bg-white border border-pedra p-6">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra mb-4">
              Fotos do produto
            </h2>
            <ImageUpload
              imagens={imagens}
              onChange={(urls) => setImagens(urls)}
              onNovasImagens={(files) => setImagensNovas(files)}
            />
          </div>

          {/* Venda */}
          <div className="bg-white border border-pedra p-6 space-y-4">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
              Venda
            </h2>

            <div>
              <label className={labelClass}>Status *</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as typeof form.status)}
                className={selectClass}
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {form.status === 'Rascunho' && (
                <p className="font-sans text-xs text-amber-700 mt-1.5">
                  Rascunho — este produto não aparece no site.
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Preço (R$)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.preco ?? ''}
                onChange={(e) => set('preco', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ex: 280"
                className={inputClass}
              />
              <p className="font-sans text-xs text-muted mt-1">
                Deixe vazio para produtos Sob Encomenda (aparece como &ldquo;Sob consulta&rdquo;).
              </p>
            </div>

            <div>
              <label className={labelClass}>Aceita encomenda?</label>
              <div className="flex gap-3 mt-1">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set('aceita_encomenda', v)}
                    className={`font-sans text-sm px-4 py-2 border transition-colors ${
                      form.aceita_encomenda === v
                        ? 'border-carvao bg-carvao text-cru'
                        : 'border-pedra text-carvao/60 hover:border-carvao'
                    }`}
                  >
                    {v ? 'Sim' : 'Não'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destaque e ordenação */}
          <div className="bg-white border border-pedra p-6 space-y-4">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted pb-3 border-b border-pedra">
              Destaque e ordenação
            </h2>

            {[
              { key: 'destaque_home' as const, label: 'Destaque na Home' },
              { key: 'destaque_loja' as const, label: 'Destaque na Loja' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div className="flex gap-3 mt-1">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => set(key, v)}
                      className={`font-sans text-sm px-4 py-2 border transition-colors ${
                        form[key] === v
                          ? 'border-carvao bg-carvao text-cru'
                          : 'border-pedra text-carvao/60 hover:border-carvao'
                      }`}
                    >
                      {v ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className={labelClass}>Ordem de exibição</label>
              <input
                type="number"
                min={1}
                value={form.ordem_exibicao ?? ''}
                onChange={(e) => set('ordem_exibicao', e.target.value ? Number(e.target.value) : null)}
                placeholder="Ex: 1 (primeiro na loja)"
                className={inputClass}
              />
              <p className="font-sans text-xs text-muted mt-1">
                Deixe vazio para ordenação automática (mais recente primeiro).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé de ações */}
      <div className="flex items-center justify-between pt-4 border-t border-pedra">
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={salvando}
            className="bg-carvao text-cru font-sans text-sm px-8 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : modo === 'novo' ? 'Salvar produto' : 'Salvar alterações'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="font-sans text-sm text-carvao/60 hover:text-carvao transition-colors"
          >
            Cancelar
          </button>
        </div>

        {modo === 'editar' && produto && (
          <button
            type="button"
            onClick={handleExcluir}
            disabled={excluindo}
            className="font-sans text-xs text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
          >
            {excluindo ? 'Excluindo...' : 'Excluir produto'}
          </button>
        )}
      </div>
    </form>
  )
}
