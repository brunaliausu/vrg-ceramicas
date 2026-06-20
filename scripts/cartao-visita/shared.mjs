import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { loadEnvLocal } from '../fotos/lib/env.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const CARD_W = 100 // mm — 10 cm
export const CARD_H = 60  // mm — 6 cm

export const COLORS = {
  cru: [245, 241, 234],
  areia: [234, 227, 217],
  carvao: [43, 41, 38],
  terracota: [176, 137, 104],
  argila: [201, 168, 139],
  pedra: [214, 207, 196],
  muted: [138, 126, 117],
}

export function formatWhatsApp(num) {
  const d = String(num).replace(/\D/g, '')
  if (d.length === 13 && d.startsWith('55')) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  }
  if (d.length === 12 && d.startsWith('55')) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  }
  return num
}

export function displaySite(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export async function loadImageDataUrl(source) {
  if (source.startsWith('http')) {
    const res = await fetch(source)
    if (!res.ok) throw new Error(`Falha ao baixar imagem: ${source}`)
    const buf = Buffer.from(await res.arrayBuffer())
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    return `data:${type};base64,${buf.toString('base64')}`
  }
  const abs = path.isAbsolute(source) ? source : path.join(ROOT, source)
  const buf = fs.readFileSync(abs)
  const ext = path.extname(abs).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  return `data:${mime};base64,${buf.toString('base64')}`
}

export function imageFormat(dataUrl) {
  if (dataUrl.includes('image/png')) return 'PNG'
  if (dataUrl.includes('image/webp')) return 'WEBP'
  return 'JPEG'
}

export async function getImageSize(dataUrl) {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const meta = await sharp(Buffer.from(base64, 'base64')).metadata()
  if (!meta.width || !meta.height) throw new Error('Não foi possível ler dimensões da imagem.')
  return { width: meta.width, height: meta.height }
}

/** Preenche retângulo estilo object-cover (proporção real da imagem) */
export function drawCoverImageInRect(doc, dataUrl, rx, ry, rw, rh, imgW, imgH) {
  const format = imageFormat(dataUrl)
  const imgRatio = imgW / imgH
  const rectRatio = rw / rh
  let w, h, x, y
  if (imgRatio > rectRatio) {
    h = rh
    w = rh * imgRatio
    x = rx + (rw - w) / 2
    y = ry
  } else {
    w = rw
    h = rw / imgRatio
    x = rx
    y = ry + (rh - h) / 2
  }
  doc.addImage(dataUrl, format, x, y, w, h, undefined, 'FAST')
}

export function drawCoverImage(doc, dataUrl, pageW, pageH, imgW, imgH) {
  drawCoverImageInRect(doc, dataUrl, 0, 0, pageW, pageH, imgW, imgH)
}

export async function fetchHeroUrl(supabase) {
  const { data, error } = await supabase
    .from('conteudo_site')
    .select('dados')
    .eq('id', 'home')
    .single()
  if (error) throw new Error(`Erro ao buscar hero: ${error.message}`)
  const hero = data?.dados?.hero_imagem
  if (!hero || typeof hero !== 'string') {
    throw new Error('hero_imagem não configurada na Home do CMS.')
  }
  return hero
}

export async function loadCardData() {
  const env = loadEnvLocal()
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )

  const whatsapp = env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511999999999'
  let siteUrl = env.NEXT_PUBLIC_SITE_URL ?? 'https://vrgceramicas.com'
  if (/localhost|127\.0\.0\.1/.test(siteUrl)) siteUrl = 'https://vrgceramicas.com'
  const instagram = '@vrg.ceramicas'

  const heroUrl = await fetchHeroUrl(supabase)
  const heroDataUrl = await loadImageDataUrl(heroUrl)

  return { whatsapp, siteUrl, instagram, heroDataUrl }
}

const FONTS_DIR = path.join(ROOT, 'scripts/cartao-visita/fonts')
const FONT_FILES = {
  light: 'CormorantGaramond-wght.ttf',
  lightItalic: 'CormorantGaramond-Italic-wght.ttf',
}
const FONT_URLS = {
  light: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond%5Bwght%5D.ttf',
  lightItalic: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Italic%5Bwght%5D.ttf',
}

export async function ensureCormorantFonts() {
  fs.mkdirSync(FONTS_DIR, { recursive: true })
  for (const [key, filename] of Object.entries(FONT_FILES)) {
    const dest = path.join(FONTS_DIR, filename)
    if (!fs.existsSync(dest)) {
      const res = await fetch(FONT_URLS[key])
      if (!res.ok) throw new Error(`Falha ao baixar fonte: ${FONT_URLS[key]}`)
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    }
  }
  return {
    light: fs.readFileSync(path.join(FONTS_DIR, FONT_FILES.light)).toString('base64'),
    lightItalic: fs.readFileSync(path.join(FONTS_DIR, FONT_FILES.lightItalic)).toString('base64'),
  }
}

export function registerCormorantFonts(doc, fonts) {
  doc.addFileToVFS('Cormorant-Light.ttf', fonts.light)
  doc.addFont('Cormorant-Light.ttf', 'Cormorant', 'normal')
  doc.addFileToVFS('Cormorant-LightItalic.ttf', fonts.lightItalic)
  doc.addFont('Cormorant-LightItalic.ttf', 'Cormorant', 'italic')
}

export function writePdf(doc, filename) {
  const outDir = path.join(ROOT, 'output')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, filename)
  fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')))
  return outPath
}
