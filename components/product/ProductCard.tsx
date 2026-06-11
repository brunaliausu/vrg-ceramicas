import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Produto } from '@/types'

interface ProductCardProps {
  produto: Produto
}

export function ProductCard({ produto }: ProductCardProps) {
  const { nome, slug, categoria, status, imagens } = produto
  const imagem = imagens?.[0]
  const mostrarBadge = status === 'Vendido' || status === 'Sob Encomenda'

  return (
    <Link href={`/produtos/${slug}`} className="group block">
      {/* Imagem */}
      <div className="relative aspect-[4/5] overflow-hidden bg-areia mb-3">
        {imagem ? (
          <Image
            src={imagem}
            alt={nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border border-pedra/50 rounded-full" />
          </div>
        )}

        {/* Badge de status */}
        {mostrarBadge && (
          <div className="absolute top-3 left-3">
            <StatusBadge status={status} />
          </div>
        )}

        {/* Overlay ao hover */}
        <div className="absolute inset-0 bg-carvao/0 group-hover:bg-carvao/5 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <p className="font-sans text-xs tracking-widest uppercase text-muted">{categoria}</p>
        <h3 className="font-serif text-base font-normal text-carvao group-hover:text-terracota transition-colors leading-snug">
          {nome}
        </h3>
      </div>
    </Link>
  )
}
