'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  imagens: string[]
  onChange: (urls: string[]) => void
  onNovasImagens: (files: File[]) => void
}

interface Item {
  tipo: 'existente' | 'nova'
  url?: string
  file?: File
  preview?: string
}

export function ImageUpload({ imagens, onChange, onNovasImagens }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lista, setLista] = useState<Item[]>(
    imagens.map((url) => ({ tipo: 'existente', url }))
  )

  useEffect(() => {
    const existentes = lista.filter((i) => i.tipo === 'existente').map((i) => i.url!)
    const novas = lista.filter((i) => i.tipo === 'nova').map((i) => i.file!)
    onChange(existentes)
    onNovasImagens(novas)
  }, [lista]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const novas: Item[] = files.map((file) => ({
      tipo: 'nova',
      file,
      preview: URL.createObjectURL(file),
    }))

    setLista((prev) => [...prev, ...novas])
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  function remover(index: number) {
    setLista((prev) => {
      const item = prev[index]
      if (item.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {lista.map((item, i) => {
          const src = item.url ?? item.preview ?? ''
          return (
            <div key={i} className="relative aspect-square bg-areia group">
              {src && (
                <Image
                  src={src}
                  alt={`Foto ${i + 1}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              )}
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-carvao/60 text-cru font-sans text-[9px] text-center py-0.5">
                  Principal
                </span>
              )}
              {item.tipo === 'nova' && (
                <span className="absolute top-1 left-1 bg-terracota text-cru font-sans text-[8px] px-1.5 py-0.5">
                  Nova
                </span>
              )}
              <button
                type="button"
                onClick={() => remover(i)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover foto"
              >
                ×
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="aspect-square bg-areia border-2 border-dashed border-pedra hover:border-terracota flex flex-col items-center justify-center gap-1 transition-colors group"
        >
          <span className="text-2xl text-pedra group-hover:text-terracota leading-none transition-colors">+</span>
          <span className="font-sans text-[10px] text-muted group-hover:text-terracota transition-colors">
            Adicionar
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleSelecionar}
      />

      <p className="font-sans text-xs text-muted">
        As fotos serão salvas ao clicar em &ldquo;Salvar produto&rdquo;. A primeira foto é a principal.
        Passe o mouse sobre uma foto para removê-la.
      </p>
    </div>
  )
}
