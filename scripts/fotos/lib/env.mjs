import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('Arquivo .env.local não encontrado na raiz do projeto.')
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    env[trimmed.slice(0, i)] = trimmed.slice(i + 1)
  }
  return env
}

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'])

export function isImageFile(name) {
  return IMAGE_EXT.has(path.extname(name).toLowerCase())
}

export function normalizeCodigo(raw) {
  return raw.trim().toUpperCase().replace(/\s+/g, '')
}

/** Ordena arquivos: 01.jpg, 02.jpg… ou ordem alfabética. */
export function sortImageNames(files) {
  return [...files].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }))
}
