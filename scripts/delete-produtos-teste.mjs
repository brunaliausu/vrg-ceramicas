/**
 * Remove produtos de teste da loja (IDs fixos identificados nos prints).
 * Uso: SUPABASE_SERVICE_ROLE_KEY=... node scripts/delete-produtos-teste.mjs
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

/** IDs exatos — conferidos com nome + categoria no banco de produção */
const TEST_PRODUCT_IDS = [
  { id: '312218b8-b4e5-4eb6-9560-07006a7e6260', label: 'Petisqueira Borboleta' },
  { id: 'f0303720-b188-4532-aaed-9ea39a6a1fe6', label: 'Vaso' },
  { id: '0e386aad-bc29-40bb-8c38-0e9f0d386bc6', label: 'Flor de Lis' },
  { id: '519151e2-893c-47d4-a482-c17b8df45f54', label: 'O voo do pássaro' },
  { id: '7c44dfc9-b7e2-4dd4-8991-f6a17e5890e7', label: 'Borboleta' },
  { id: '1647fcdc-673a-4a4a-b0af-d9f74a0f9c55', label: 'teste' },
]

const ids = TEST_PRODUCT_IDS.map((p) => p.id)

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

  const { data: found, error: selectError } = await supabase
    .from('produtos')
    .select('id, nome, categoria, status')
    .in('id', ids)

  if (selectError) {
    console.error('Erro ao consultar:', selectError.message)
    process.exit(1)
  }

  console.log('Produtos encontrados:', found?.length ?? 0)
  for (const row of found ?? []) {
    const meta = TEST_PRODUCT_IDS.find((p) => p.id === row.id)
    console.log(`  • ${row.nome} (${row.categoria}) — ${row.status} [${meta?.label}]`)
  }

  if ((found?.length ?? 0) !== ids.length) {
    const foundIds = new Set((found ?? []).map((r) => r.id))
    const missing = ids.filter((id) => !foundIds.has(id))
    console.error('Esperado 6 produtos. Ausentes ou já removidos:', missing)
    process.exit(1)
  }

  const { error: deleteError, count } = await supabase
    .from('produtos')
    .delete({ count: 'exact' })
    .in('id', ids)

  if (deleteError) {
    console.error('Erro ao excluir:', deleteError.message)
    process.exit(1)
  }

  console.log(`Excluídos ${count ?? 0} produto(s) de teste.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
