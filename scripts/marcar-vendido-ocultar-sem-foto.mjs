/**
 * 1) Oculta da loja produtos sem foto (só vitrine — não altera pecas_estoque/conjuntos).
 * 2) Marca como vendido tudo que permanece publicado na loja (com foto).
 *
 * Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/marcar-vendido-ocultar-sem-foto.mjs [--dry-run]
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

  const { data: produtos, error: errProd } = await supabase
    .from('produtos')
    .select('id, nome, status, imagens')
    .neq('status', 'Rascunho')

  if (errProd) {
    console.error('Erro ao listar produtos:', errProd.message)
    process.exit(1)
  }

  const lista = produtos ?? []
  const semFoto = lista.filter((p) => !temFotos(p.imagens))
  const comFoto = lista.filter((p) => temFotos(p.imagens))

  console.log('── Ocultar da loja (sem foto, só vitrine) ──')
  console.log(`Produtos: ${semFoto.length}`)
  for (const p of semFoto) console.log(`  • ${p.nome} (${p.status})`)

  console.log('\n── Marcar como vendido (com foto, na loja) ──')
  console.log(`Produtos: ${comFoto.length}`)
  for (const p of comFoto) console.log(`  • ${p.nome} (${p.status})`)

  const [{ data: pecasPub }, { data: conjuntosPub }] = await Promise.all([
    supabase
      .from('pecas_estoque')
      .select('id, codigo, nome, fotos, exibir_no_site, conjunto_id, status')
      .is('conjunto_id', null)
      .eq('exibir_no_site', true),
    supabase
      .from('conjuntos')
      .select('id, codigo, nome, fotos, exibir_no_site, status')
      .eq('exibir_no_site', true),
  ])

  const pecasVendido = (pecasPub ?? []).filter((p) => temFotos(p.fotos))
  const conjuntosVendido = (conjuntosPub ?? []).filter((c) => temFotos(c.fotos))

  console.log(`\nPeças avulsas publicadas (com foto) → vendido: ${pecasVendido.length}`)
  for (const p of pecasVendido) console.log(`  • ${p.codigo || '—'} — ${p.nome}`)
  console.log(`Conjuntos publicados (com foto) → vendido: ${conjuntosVendido.length}`)
  for (const c of conjuntosVendido) console.log(`  • ${c.codigo || '—'} — ${c.nome}`)

  if (semFoto.length === 0 && comFoto.length === 0) {
    console.log('\nNada publicado na loja.')
    return
  }

  if (dryRun) {
    console.log('\n--dry-run: nenhuma alteração feita.')
    return
  }

  const now = new Date().toISOString()

  if (semFoto.length > 0) {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'Rascunho', destaque_home: false })
      .in('id', semFoto.map((p) => p.id))
    if (error) {
      console.error('Erro ao ocultar sem foto:', error.message)
      process.exit(1)
    }
  }

  if (comFoto.length > 0) {
    const { error } = await supabase
      .from('produtos')
      .update({ status: 'Vendido', destaque_home: false })
      .in('id', comFoto.map((p) => p.id))
    if (error) {
      console.error('Erro produtos vendido:', error.message)
      process.exit(1)
    }
  }

  if (pecasVendido.length > 0) {
    const { error } = await supabase
      .from('pecas_estoque')
      .update({ status: 'vendido', vendido_em: now })
      .in('id', pecasVendido.map((p) => p.id))
    if (error) {
      console.error('Erro pecas_estoque:', error.message)
      process.exit(1)
    }
  }

  if (conjuntosVendido.length > 0) {
    const { error } = await supabase
      .from('conjuntos')
      .update({ status: 'vendido' })
      .in('id', conjuntosVendido.map((c) => c.id))
    if (error) {
      console.error('Erro conjuntos:', error.message)
      process.exit(1)
    }
  }

  console.log('\nConcluído.')
  console.log(`  Ocultos da loja (sem foto): ${semFoto.length}`)
  console.log(`  Vendidos na loja + admin: ${comFoto.length} produto(s), ${pecasVendido.length} peça(s), ${conjuntosVendido.length} conjunto(s)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
