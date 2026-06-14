#!/usr/bin/env node
/**
 * Copia (ou move) fotos para fotos-vrg/{CODIGO}/ conforme CSV de mapeamento.
 *
 * CSV precisa das colunas: caminho_completo (ou arquivo) + codigo_destino
 * Opcional: ordem_na_peca → renomeia para 01-nome.jpg, 02-nome.jpg
 *
 * Uso:
 *   node scripts/fotos/organizar-por-csv.mjs ~/Desktop/fotos-vrg/_INVENTARIO.csv
 *   node scripts/fotos/organizar-por-csv.mjs mapeamento.csv --move
 *   node scripts/fotos/organizar-por-csv.mjs mapeamento.csv --dry-run
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { isImageFile, normalizeCodigo, sortImageNames } from './lib/env.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const move = args.includes('--move')
const csvPath = args.find((a) => !a.startsWith('--'))

if (!csvPath) {
  console.error('Uso: node scripts/fotos/organizar-por-csv.mjs <arquivo.csv> [--dry-run] [--move]')
  process.exit(1)
}

const destRoot = path.join(os.homedir(), 'Desktop', 'fotos-vrg')

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const headers = lines[0].split(',').map((h) => h.replace(/^"|"$/g, '').trim())
  return lines.slice(1).map((line) => {
    const cols = []
    let cur = ''
    let inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        cols.push(cur)
        cur = ''
      } else cur += ch
    }
    cols.push(cur)
    const row = {}
    headers.forEach((h, i) => { row[h] = cols[i] ?? '' })
    return row
  })
}

function padOrder(n) {
  return String(n).padStart(2, '0')
}

const rows = parseCsv(fs.readFileSync(path.resolve(csvPath), 'utf8'))
const byCodigo = new Map()

for (const row of rows) {
  const codigo = normalizeCodigo(row.codigo_destino || '')
  if (!codigo) continue
  const src = (row.caminho_completo || row.arquivo || '').trim()
  if (!src) continue
  const fullSrc = path.isAbsolute(src) ? src : path.resolve(path.dirname(csvPath), src)
  if (!fs.existsSync(fullSrc)) {
    console.warn(`⚠ Arquivo não encontrado: ${fullSrc}`)
    continue
  }
  const ordem = parseInt(row.ordem_na_peca || '999', 10) || 999
  if (!byCodigo.has(codigo)) byCodigo.set(codigo, [])
  byCodigo.get(codigo).push({ fullSrc, ordem, base: path.basename(fullSrc) })
}

let copied = 0
let skipped = 0

for (const [codigo, items] of byCodigo) {
  const dir = path.join(destRoot, codigo)
  if (!dryRun) fs.mkdirSync(dir, { recursive: true })

  const sorted = items.sort((a, b) => a.ordem - b.ordem || a.base.localeCompare(b.base, undefined, { numeric: true }))

  for (let i = 0; i < sorted.length; i++) {
    const { fullSrc, base } = sorted[i]
    const ext = path.extname(base)
    const destName = `${padOrder(i + 1)}-${base.replace(/^\d+-/, '')}`
    const dest = path.join(dir, destName)

    if (fs.existsSync(dest) && !dryRun) {
      skipped++
      console.warn(`⚠ Já existe, pulando: ${codigo}/${destName}`)
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] ${fullSrc} → ${codigo}/${destName}`)
    } else if (move) {
      fs.renameSync(fullSrc, dest)
    } else {
      fs.copyFileSync(fullSrc, dest)
    }
    copied++
  }
}

console.log(`\n${dryRun ? 'Simulação' : move ? 'Movidas' : 'Copiadas'}: ${copied} foto(s)`)
if (skipped) console.log(`Puladas (já existiam): ${skipped}`)
console.log(`Destino: ${destRoot}`)
if (!dryRun) {
  console.log('\nRevise as pastas e depois rode o importador para o site (quando estiver pronto).')
}
