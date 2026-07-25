import Image from 'next/image'
import { shouldUnoptimizeImage } from '@/lib/imageUtils'

interface CmsImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

export function CmsImage({
  src,
  alt,
  fill = false,
  className,
  sizes,
  priority = false,
}: CmsImageProps) {
  const trimmed = src?.trim()
  if (!trimmed) return null

  const unoptimized = shouldUnoptimizeImage(trimmed)

  if (fill) {
    return (
      <Image
        src={trimmed}
        alt={alt}
        fill
        unoptimized={unoptimized}
        priority={priority}
        className={className ?? 'object-cover'}
        sizes={sizes ?? '(max-width:768px) 100vw, 50vw'}
      />
    )
  }

  return (
    <Image
      src={trimmed}
      alt={alt}
      width={900}
      height={1200}
      unoptimized={unoptimized}
      priority={priority}
      className={className ?? 'w-full h-full object-cover'}
      sizes={sizes ?? '(max-width:768px) 100vw, 768px'}
    />
  )
}
