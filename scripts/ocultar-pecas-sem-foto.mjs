/**
 * Oculta da loja peças/conjuntos publicados sem foto (não exclui do estoque).
 * Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/ocultar-pecas-sem-foto.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i), line.slice(i + 1)]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.argv.includes('--dry-run')

function temFotos(urls) {
  return Array.isArray(urls) && urls.some((u) => String(u).trim().length > 0)
}

async function main() {
  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL não encontrada em .env.local')
    process.exit(1)
  }
  if (!serviceKey) {
    console.error('Defina SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API → service_role)')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [{ data: pecas }, { data: conjuntos }, { data: produtos }] = await Promise.all([
    supabase
      .from('pecas_estoque')
      .select('id, codigo, nome, fotos, exibir_no_site, conjunto_id')
      .is('conjunto_id', null)
      .eq('exibir_no_site', true),
    supabase
      .from('conjuntos')
      .select('id, codigo, nome, fotos, exibir_no_site')
      .eq('exibir_no_site', true),
    supabase
      .from('produtos')
      .select('id, nome, status, imagens')
      .neq('status', 'Rascunho'),
  ])

  const pecasSemFoto = (pecas ?? []).filter((p) => !temFotos(p.fotos))
  const conjuntosSemFoto = (conjuntos ?? []).filter((c) => !temFotos(c.fotos))
  const produtosSemFoto = (produtos ?? []).filter((p) => !temFotos(p.imagens))

  const lojaIds = new Set([
    ...produtosSemFoto.map((p) => p.id),
    ...pecasSemFoto.map((p) => p.id),
    ...conjuntosSemFoto.map((c) => c.id),
  ])

  console.log(`Peças avulsas sem foto (exibir no site): ${pecasSemFoto.length}`)
  for (const p of pecasSemFoto) console.log(`  • ${p.codigo || '—'} — ${p.nome}`)
  console.log(`Conjuntos sem foto (exibir no site): ${conjuntosSemFoto.length}`)
  for (const c of conjuntosSemFoto) console.log(`  • ${c.codigo || '—'} — ${c.nome}`)
  console.log(`Produtos na loja sem imagem: ${produtosSemFoto.length}`)
  for (const p of produtosSemFoto) console.log(`  • ${p.nome} (${p.status})`)

  if (pecasSemFoto.length === 0 && conjuntosSemFoto.length === 0 && produtosSemFoto.length === 0) {
    console.log('Nada a fazer.')
    return
  }

  if (dryRun) {
    console.log('\n--dry-run: nenhuma alteração feita.')
    return
  }

  if (pecasSemFoto.length > 0) {
    const { error } = await supabase
      .from('pecas_estoque')
      .update({ exibir_no_site: false, destaque_home: false })
      .in('id', pecasSemFoto.map((p) => p.id))
    if (error) {
      console.error('Erro pecas_estoque:', error.message)
      process.exit(1)
    }
  }

  if (conjuntosSemFoto.length > 0) {
    const { error } = await supabase
      .from('conjuntos')
      .update({ exibir_no_site: false, destaque_home: false })
      .in('id', conjuntosSemFoto.map((c) => c.id))
    if (error) {
      console.error('Erro conjuntos:', error.message)
      process.exit(1)
    }
  }

  if (lojaIds.size > 0) {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'Rascunho', destaque_home: false })
      .in('id', [...lojaIds])
    if (error) {
      console.error('Erro produtos:', error.message)
      process.exit(1)
    }
  }

  console.log('\nConcluído. Itens permanecem no estoque; removidos apenas da vitrine.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
