'use client'

import { useState } from 'react'
import Image from 'next/image'
import { shouldUnoptimizeImage } from '@/lib/imageUtils'

interface ProductGalleryProps {
  imagens: string[]
  nome: string
}

export function ProductGallery({ imagens, nome }: ProductGalleryProps) {
  const [ativa, setAtiva] = useState(0)

  if (!imagens || imagens.length === 0) {
    return (
      <div className="aspect-square bg-areia flex items-center justify-center">
        <div className="w-16 h-16 border border-pedra/50 rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Imagem principal */}
      <div className="relative aspect-[4/5] overflow-hidden bg-areia">
        <Image
          src={imagens[ativa]}
          alt={`${nome} — foto ${ativa + 1}`}
          fill
          priority
          unoptimized={shouldUnoptimizeImage(imagens[ativa])}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Miniaturas */}
      {imagens.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {imagens.map((img, i) => (
            <button
              key={i}
              onClick={() => setAtiva(i)}
              className={`relative aspect-square overflow-hidden bg-areia transition-opacity ${
                i === ativa ? 'ring-1 ring-carvao' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${nome} — miniatura ${i + 1}`}
                fill
                unoptimized={shouldUnoptimizeImage(img)}
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
