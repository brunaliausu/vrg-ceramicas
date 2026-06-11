import { createClient } from '@/lib/supabase/server'
import { PecasTable } from './PecasTable'

export interface CustoItem { nome: string; valor: number }

export interface ConjuntoDB {
  id: string
  codigo: string | null
  nome: string | null
  descricao: string | null
  status: string | null
  exibir_no_site: boolean | null
  destaque_home: boolean | null
  fenearte: boolean | null
  categoria: string | null
  fotos: string[] | null
  margem_venda: number | null
  preco_venda: number | null
  preco_praticado: number | null
  venda_modo: string | null
}

// ─── Defaults (mesmos do CustosForm) ─────────────────────────────────────────

const DEFAULT_CUSTO_FIXO_TOTAL  = 350 + 300 + 30 + 50 + 100 + 1000 // 1 830
const DEFAULT_MAO_DE_OBRA_TOTAL = 4000

const DEFAULT_EMBALAGEM: CustoItem[] = [
  { nome: 'P — Pequena',       valor: 5  },
  { nome: 'M — Média',         valor: 10 },
  { nome: 'G — Grande',        valor: 15 },
  { nome: 'GG — Extra Grande', valor: 20 },
]

const DEFAULT_ARGILA: CustoItem[] = [
  { nome: 'Ocre',                  valor: 3.5  },
  { nome: 'Shiro',                 valor: 11   },
  { nome: 'Marfim',                valor: 11   },
  { nome: 'Tabaco',                valor: 11   },
  { nome: 'Terracota',             valor: 8.6  },
  { nome: 'Preta',                 valor: 14.5 },
  { nome: 'Creme',                 valor: 11   },
  { nome: 'Preta c/ pinta branca', valor: 12   },
  { nome: 'Choko',                 valor: 0    },
]

const DEFAULT_ESMALTE: CustoItem[] = [
  { nome: 'Esmalte (gr)',   valor: 0.27    },
  { nome: 'Relação gr/m²', valor: 107.143 },
]

const DEFAULT_ENGOBE: CustoItem[] = [
  { nome: 'Engobe (gr)',   valor: 0 },
  { nome: 'Relação gr/m²', valor: 0 },
]

const DEFAULT_TINTA: CustoItem[] = [
  { nome: 'Tinta (ml)',    valor: 0 },
  { nome: 'Relação ml/m²', valor: 0 },
]

const DEFAULT_BISCOITO: CustoItem[] = [
  { nome: 'Até 12 cm',    valor: 7.2  },
  { nome: '13 a 25 cm',   valor: 11   },
  { nome: '26 a 45 cm',   valor: 13.6 },
]

const DEFAULT_MARGEM_VENDA = 55

const DEFAULT_QUEIMA_ALTA: CustoItem[] = [
  { nome: 'Baixa (P) — até 12 cm',  valor: 0  },
  { nome: 'Baixa (M) — 13 a 25 cm', valor: 0  },
  { nome: 'Baixa (G) — 26 a 45 cm', valor: 0  },
  { nome: 'Alta (P) — até 12 cm',   valor: 13 },
  { nome: 'Alta (M) — 13 a 25 cm',  valor: 20 },
  { nome: 'Alta (G) — 26 a 45 cm',  valor: 25 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcCustoHora(dados: Record<string, unknown>, key: string): number {
  const items = dados[key]
  if (!Array.isArray(items)) return 0
  const total = items.reduce((acc: number, i: unknown) => {
    if (typeof i === 'object' && i !== null && 'valor' in i) {
      return acc + (Number((i as { valor: unknown }).valor) || 0)
    }
    return acc
  }, 0)
  return total / 160
}

function getMargemVenda(dados: Record<string, unknown>): number {
  const raw = dados.margem_venda
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0] as { valor?: unknown }
    const v = Number(first?.valor)
    if (v > 0) return v
  }
  return DEFAULT_MARGEM_VENDA
}

function getItems(
  dados: Record<string, unknown>,
  key: string,
  defaults: CustoItem[],
): CustoItem[] {
  const raw = dados[key]
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    typeof (raw[0] as Record<string, unknown>).nome === 'string'
  ) {
    return raw as CustoItem[]
  }
  return defaults
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getConjuntos(): Promise<ConjuntoDB[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('conjuntos').select('*')
    return (data ?? []) as ConjuntoDB[]
  } catch {
    return []
  }
}

async function getPecas() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('pecas_estoque')
      .select('*')
      .order('fenearte', { ascending: false, nullsFirst: false })
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('criado_em', { ascending: true })
    return data ?? []
  } catch {
    return []
  }
}

async function getCustos() {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('custos_config')
      .select('dados')
      .eq('id', 1)
      .single()
    return (data?.dados as Record<string, unknown>) ?? {}
  } catch {
    return {}
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PecasPage() {
  const [pecas, custos, conjuntos] = await Promise.all([getPecas(), getCustos(), getConjuntos()])

  const custoHoraFixo =
    calcCustoHora(custos, 'custo_fixo') || DEFAULT_CUSTO_FIXO_TOTAL / 160
  const custoHoraMO =
    calcCustoHora(custos, 'mao_de_obra') || DEFAULT_MAO_DE_OBRA_TOTAL / 160

  const embalagemItems   = getItems(custos, 'embalagem',       DEFAULT_EMBALAGEM)
  const argilaItems      = getItems(custos, 'argila',          DEFAULT_ARGILA)
  const esmalteItems     = getItems(custos, 'esmalte',         DEFAULT_ESMALTE)
  const engobeItems      = getItems(custos, 'engobe',          DEFAULT_ENGOBE)
  const tintaItems       = getItems(custos, 'tinta',           DEFAULT_TINTA)
  const biscoitoItems    = getItems(custos, 'queima_biscoito', DEFAULT_BISCOITO)
  const queimaAltaItems  = getItems(custos, 'queima_alta',     DEFAULT_QUEIMA_ALTA)
  const margemVendaConfig  = getMargemVenda(custos)

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] overflow-hidden pb-[4.5rem]">
      <div className="shrink-0 mb-6">
        <h1 className="font-serif text-3xl font-light text-carvao">Peças & Estoque</h1>
        <p className="font-sans text-xs text-muted mt-1">
          Cadastre e gerencie as peças. Os campos de custo são calculados automaticamente com base nas tabelas de custos.
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
      <PecasTable
        pecasIniciais={pecas}
        conjuntosIniciais={conjuntos}
        custoHoraFixo={custoHoraFixo}
        custoHoraMO={custoHoraMO}
        embalagemItems={embalagemItems}
        argilaItems={argilaItems}
        esmalteItems={esmalteItems}
        engobeItems={engobeItems}
        tintaItems={tintaItems}
        biscoitoItems={biscoitoItems}
        queimaAltaItems={queimaAltaItems}
        margemVendaConfig={margemVendaConfig}
      />
      </div>
    </div>
  )
}
