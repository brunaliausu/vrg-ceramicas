#!/usr/bin/env node
/**
 * Lista todas as fotos de uma pasta “bagunçada” para facilitar o mapeamento.
 * Agrupa sequências de câmera (0B5A7182, 0B5A7183…) como possíveis sessões da mesma peça.
 *
 * Uso:
 *   node scripts/fotos/gerar-inventario.mjs ~/Downloads/FOTOS
 *   node scripts/fotos/gerar-inventario.mjs ~/Documents/fotos ~/Downloads/FOTOS
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { isImageFile, sortImageNames } from './lib/env.mjs'

const sources = process.argv.slice(2)
if (sources.length === 0) {
  console.error('Uso: node scripts/fotos/gerar-inventario.mjs <pasta-origem> [pasta-origem-2 ...]')
  process.exit(1)
}

function walkImages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkImages(full, acc)
    else if (isImageFile(entry.name)) acc.push(full)
  }
  return acc
}

function cameraNumber(name) {
  const m = name.match(/(\d{3,5})(?=\.[a-z]+$)/i)
  return m ? parseInt(m[1], 10) : null
}

function groupByCameraSequence(files) {
  const withMeta = files.map((full) => {
    const base = path.basename(full)
    const num = cameraNumber(base)
    const mtime = fs.statSync(full).mtimeMs
    return { full, base, num, mtime }
  })

  withMeta.sort((a, b) => {
    if (a.num != null && b.num != null && a.num !== b.num) return a.num - b.num
    return a.mtime - b.mtime
  })

  const groups = []
  let current = []

  for (const item of withMeta) {
    if (current.length === 0) {
      current.push(item)
      continue
    }
    const prev = current[current.length - 1]
    const numGap = item.num != null && prev.num != null ? item.num - prev.num : 999
    const timeGap = item.mtime - prev.mtime
    const sameSession = numGap >= 1 && numGap <= 8 && timeGap < 15 * 60 * 1000

    if (sameSession) current.push(item)
    else {
      groups.push(current)
      current = [item]
    }
  }
  if (current.length) groups.push(current)
  return groups
}

const allFiles = []
for (const src of sources) {
  allFiles.push(...walkImages(path.resolve(src)))
}

if (allFiles.length === 0) {
  console.error('Nenhuma imagem encontrada nas pastas informadas.')
  process.exit(1)
}

const outDir = path.join(os.homedir(), 'Desktop', 'fotos-vrg')
fs.mkdirSync(outDir, { recursive: true })
const outCsv = path.join(outDir, '_INVENTARIO.csv')
const groups = groupByCameraSequence(allFiles)

const rows = ['id_sessao,arquivo,caminho_completo,codigo_destino,ordem_na_peca']
let id = 1
for (const group of groups) {
  const sessionId = `S${String(id).padStart(3, '0')}`
  group.forEach((item, idx) => {
    rows.push(
      `"${sessionId}","${item.base.replace(/"/g, '""')}","${item.full.replace(/"/g, '""')}","",${idx + 1}`,
    )
  })
  id++
}

fs.writeFileSync(outCsv, rows.join('\n') + '\n')

console.log(`\n✓ ${allFiles.length} fotos encontradas em ${sources.length} pasta(s)`)
console.log(`✓ ${groups.length} sessões sugeridas (sequências de câmera próximas)`)
console.log(`✓ Inventário: ${outCsv}`)
console.log('\nComo usar:')
console.log('1. Abra _INVENTARIO.csv no Numbers/Excel')
console.log('2. Preencha a coluna codigo_destino (ex: U1, D15, C4) para cada linha ou sessão inteira')
console.log('3. Rode: node scripts/fotos/organizar-por-csv.mjs _INVENTARIO.csv')
