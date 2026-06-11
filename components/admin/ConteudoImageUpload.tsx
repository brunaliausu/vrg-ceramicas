'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface Props {
  /** URL atual da imagem (vinda do banco) */
  value: string
  /** Chamado com a nova URL pública após upload */
  onChange: (url: string) => void
  label?: string
  hint?: string
}

export function ConteudoImageUpload({ value, onChange, label, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(value)
  const [erro, setErro] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Pré-visualização imediata
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setErro('')
    setUploading(true)

    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `conteudo/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('produtos')
      .upload(path, file, { upsert: false })

    if (error || !data) {
      setErro('Erro ao enviar imagem. Tente novamente.')
      setUploading(false)
      return
    }

    const { data: pub } = supabase.storage.from('produtos').getPublicUrl(data.path)
    onChange(pub.publicUrl)
    setUploading(false)
    URL.revokeObjectURL(localUrl)
    e.target.value = ''
  }

  function remover() {
    setPreview('')
    onChange('')
    setErro('')
  }

  const hasImage = Boolean(preview)

  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-sans text-xs text-carvao/70 mb-1.5">{label}</label>
      )}

      {hasImage ? (
        <div className="relative w-full aspect-video bg-areia group overflow-hidden rounded-sm">
          <Image
            src={preview}
            alt="Preview"
            fill
            sizes="600px"
            className="object-cover"
            unoptimized={preview.startsWith('blob:')}
          />
          {uploading && (
            <div className="absolute inset-0 bg-carvao/40 flex items-center justify-center">
              <span className="font-sans text-xs text-cru">Enviando...</span>
            </div>
          )}
          {!uploading && (
            <div className="absolute inset-0 bg-carvao/0 group-hover:bg-carvao/30 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-sans text-xs bg-cru text-carvao px-3 py-1.5 hover:bg-areia transition-colors"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={remover}
                className="font-sans text-xs bg-red-600 text-white px-3 py-1.5"
              >
                Remover
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-video bg-areia border-2 border-dashed border-pedra hover:border-terracota flex flex-col items-center justify-center gap-2 transition-colors group"
        >
          <span className="text-3xl text-pedra group-hover:text-terracota transition-colors leading-none">+</span>
          <span className="font-sans text-xs text-muted group-hover:text-terracota transition-colors">
            Clique para adicionar imagem
          </span>
        </button>
      )}

      {erro && <p className="font-sans text-xs text-red-600">{erro}</p>}
      {hint && <p className="font-sans text-xs text-muted">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
