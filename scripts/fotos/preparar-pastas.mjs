#!/usr/bin/env node
/**
 * Cria a estrutura fotos-vrg/{CODIGO}/ a partir dos códigos cadastrados no Supabase.
 *
 * Uso:
 *   node scripts/fotos/preparar-pastas.mjs
 *   node scripts/fotos/preparar-pastas.mjs ~/Desktop/fotos-vrg
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createClient } from '@supabase/supabase-js'
import { loadEnvLocal, normalizeCodigo } from './lib/env.mjs'

const destRoot = path.resolve(process.argv[2] || path.join(os.homedir(), 'Desktop', 'fotos-vrg'))

async function main() {
  const env = loadEnvLocal()
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const [{ data: pecas, error: e1 }, { data: conjuntos, error: e2 }] = await Promise.all([
    supabase.from('pecas_estoque').select('codigo, nome, conjunto_id').not('codigo', 'is', null),
    supabase.from('conjuntos').select('codigo, nome'),
  ])

  if (e1) throw new Error(`Erro ao buscar peças: ${e1.message}`)
  if (e2) throw new Error(`Erro ao buscar conjuntos: ${e2.message}`)

  const entries = new Map()

  for (const p of pecas ?? []) {
    if (!p.codigo?.trim()) continue
    const codigo = normalizeCodigo(p.codigo)
    if (p.conjunto_id) continue
    entries.set(codigo, { codigo, nome: p.nome ?? '', tipo: 'peça avulsa' })
  }

  for (const c of conjuntos ?? []) {
    if (!c.codigo?.trim()) continue
    const codigo = normalizeCodigo(c.codigo)
    entries.set(codigo, { codigo, nome: c.nome ?? '', tipo: 'conjunto' })
  }

  fs.mkdirSync(destRoot, { recursive: true })

  let created = 0
  for (const { codigo, nome, tipo } of [...entries.values()].sort((a, b) =>
    a.codigo.localeCompare(b.codigo, undefined, { numeric: true }),
  )) {
    const dir = path.join(destRoot, codigo)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      created++
    }
    const readme = path.join(dir, '_LEIA.txt')
    if (!fs.existsSync(readme)) {
      fs.writeFileSync(
        readme,
        `Código: ${codigo}\nTipo: ${tipo}\nNome: ${nome || '(sem nome)'}\n\nColoque aqui as fotos desta peça.\nA 1ª foto (01-...) será a capa no site.\n`,
      )
    }
  }

  const indicePath = path.join(destRoot, '_INDICE.csv')
  const lines = ['codigo,tipo,nome,fotos_na_pasta']
  for (const { codigo, nome, tipo } of [...entries.values()].sort((a, b) =>
    a.codigo.localeCompare(b.codigo, undefined, { numeric: true }),
  )) {
    const dir = path.join(destRoot, codigo)
    const count = fs.readdirSync(dir).filter((f) => !f.startsWith('_') && !f.startsWith('.')).length
    lines.push(`"${codigo}","${tipo}","${(nome || '').replace(/"/g, '""')}",${count}`)
  }
  fs.writeFileSync(indicePath, lines.join('\n') + '\n')

  console.log(`\n✓ Pasta destino: ${destRoot}`)
  console.log(`✓ ${entries.size} códigos (${created} pastas novas criadas)`)
  console.log(`✓ Índice: ${indicePath}`)
  console.log('\nPróximo passo: arraste as fotos para cada pasta ou use gerar-inventario + mapeamento.csv')
}

main().catch((err) => {
  console.error('Erro:', err.message)
  process.exit(1)
})
