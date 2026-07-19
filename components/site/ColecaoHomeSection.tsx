import Link from 'next/link'
import Image from 'next/image'
import { colecaoHref, type ColecaoDB } from '@/lib/colecaoUtils'
import { ProductCard } from '@/components/product/ProductCard'
import type { Produto } from '@/types'

function CmsImage({
  src,
  alt,
  className,
  fill = false,
}: {
  src: string
  alt: string
  className?: string
  fill?: boolean
}) {
  if (!src) return null
  if (fill) {
    return <Image src={src} alt={alt} fill className={className ?? 'object-cover'} sizes="(max-width:768px) 100vw, 50vw" />
  }
  return <Image src={src} alt={alt} width={900} height={1200} className={className ?? 'w-full h-full object-cover'} />
}

interface Props {
  colecao: ColecaoDB
  produtos: Produto[]
}

export function ColecaoHomeSection({ colecao, produtos }: Props) {
  if (!colecao.exibir_no_site) return null

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="relative rounded-2xl overflow-hidden min-h-[480px] flex items-center">
        {colecao.site_imagem ? (
          <CmsImage src={colecao.site_imagem} alt={colecao.site_titulo || colecao.nome} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-carvao" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-carvao/80 to-carvao/20" />
        <div className="relative z-10 px-8 sm:px-16 py-12 max-w-lg text-cru">
          <p className="font-sans text-[10px] tracking-[0.32em] uppercase text-argila mb-4">
            {colecao.site_lead || 'Coleção'}
          </p>
          <h2 className="font-serif font-light leading-tight mb-5" style={{ fontSize: 'clamp(40px, 5vw, 66px)' }}>
            {colecao.site_titulo || colecao.nome}
          </h2>
          {colecao.site_texto && (
            <p className="font-sans text-sm leading-relaxed text-cru/80 mb-8 max-w-sm">
              {colecao.site_texto}
            </p>
          )}
          <Link
            href={colecaoHref(colecao.slug)}
            className="inline-flex items-center gap-3 border border-cru text-cru font-sans text-xs tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-cru hover:text-carvao transition-colors"
          >
            Descobrir a coleção
          </Link>
        </div>
      </div>

      {produtos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </section>
  )
}
