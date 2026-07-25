/** URLs do Supabase Storage — carregar direto, sem passar pelo otimizador da Vercel. */
export function isSupabaseStorageUrl(src: string): boolean {
  try {
    const u = new URL(src)
    return u.hostname.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/')
  } catch {
    return false
  }
}

/** Evita falhas no mobile com fotos grandes do CMS (limite do otimizador ~4 MB). */
export function shouldUnoptimizeImage(src: string): boolean {
  if (!src || src.startsWith('blob:') || src.startsWith('data:')) return true
  return isSupabaseStorageUrl(src)
}
