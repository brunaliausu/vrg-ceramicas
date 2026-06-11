'use client'

import { useState, useTransition } from 'react'
import { salvarCustos } from './actions'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Item {
  nome: string
  valor: number
}

interface CustosData {
  custo_fixo: Item[]
  mao_de_obra: Item[]
  execucao: Item[]      // valor = horas
  embalagem: Item[]
  argila: Item[]
  engobe: Item[]
  queima_biscoito: Item[]
  queima_alta: Item[]
  esmalte: Item[]
  tinta: Item[]
  margem_venda: Item[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: CustosData = {
  custo_fixo: [
    { nome: 'Aluguel', valor: 350 },
    { nome: 'Condomínio', valor: 300 },
    { nome: 'Água', valor: 30 },
    { nome: 'Energia', valor: 50 },
    { nome: 'Faxineira', valor: 100 },
    { nome: 'Ajudante', valor: 1000 },
  ],
  mao_de_obra: [
    { nome: 'Remuneração', valor: 4000 },
  ],
  execucao: [
    { nome: 'AA — Altíssima', valor: 2.5 },
    { nome: 'A — Alta', valor: 2 },
    { nome: 'M — Média', valor: 1.5 },
    { nome: 'B — Baixa', valor: 1 },
  ],
  embalagem: [
    { nome: 'P — Pequena', valor: 5 },
    { nome: 'M — Média', valor: 10 },
    { nome: 'G — Grande', valor: 15 },
    { nome: 'GG — Extra Grande', valor: 20 },
  ],
  argila: [
    { nome: 'Ocre', valor: 3.5 },
    { nome: 'Shiro', valor: 11 },
    { nome: 'Marfim', valor: 11 },
    { nome: 'Tabaco', valor: 11 },
    { nome: 'Terracota', valor: 8.6 },
    { nome: 'Preta', valor: 14.5 },
    { nome: 'Creme', valor: 11 },
    { nome: 'Preta c/ pinta branca', valor: 12 },
    { nome: 'Choko', valor: 0 },
  ],
  engobe: [
    { nome: 'Engobe (gr)', valor: 0 },
    { nome: 'Relação gr/m²', valor: 0 },
  ],
  queima_biscoito: [
    { nome: 'Até 12 cm', valor: 7.2 },
    { nome: '13 a 25 cm', valor: 11 },
    { nome: '26 a 45 cm', valor: 13.6 },
  ],
  queima_alta: [
    { nome: 'Baixa (P) — até 12 cm', valor: 0 },
    { nome: 'Baixa (M) — 13 a 25 cm', valor: 0 },
    { nome: 'Baixa (G) — 26 a 45 cm', valor: 0 },
    { nome: 'Alta (P) — até 12 cm', valor: 13 },
    { nome: 'Alta (M) — 13 a 25 cm', valor: 20 },
    { nome: 'Alta (G) — 26 a 45 cm', valor: 25 },
  ],
  esmalte: [
    { nome: 'Esmalte (gr)', valor: 0.27 },
    { nome: 'Relação gr/m²', valor: 107.143 },
  ],
  tinta: [
    { nome: 'Tinta (ml)', valor: 0 },
    { nome: 'Relação ml/m²', valor: 0 },
  ],
  margem_venda: [
    { nome: 'Margem padrão', valor: 55 },
  ],
}

function parseInicial(raw: Record<string, unknown>): CustosData {
  const isItemArray = (v: unknown): v is Item[] =>
    Array.isArray(v) && (v.length === 0 || (typeof v[0] === 'object' && 'nome' in (v[0] as object)))

  return {
    custo_fixo:      isItemArray(raw.custo_fixo)      ? raw.custo_fixo      : DEFAULTS.custo_fixo,
    mao_de_obra:     isItemArray(raw.mao_de_obra)     ? raw.mao_de_obra     : DEFAULTS.mao_de_obra,
    execucao:        isItemArray(raw.execucao)        ? raw.execucao        : DEFAULTS.execucao,
    embalagem:       isItemArray(raw.embalagem)       ? raw.embalagem       : DEFAULTS.embalagem,
    argila:          isItemArray(raw.argila)          ? raw.argila          : DEFAULTS.argila,
    engobe:          isItemArray(raw.engobe)          ? raw.engobe          : DEFAULTS.engobe,
    queima_biscoito: isItemArray(raw.queima_biscoito) ? raw.queima_biscoito : DEFAULTS.queima_biscoito,
    queima_alta:     isItemArray(raw.queima_alta)     ? raw.queima_alta     : DEFAULTS.queima_alta,
    esmalte:         isItemArray(raw.esmalte)         ? raw.esmalte         : DEFAULTS.esmalte,
    tinta:           isItemArray(raw.tinta)           ? raw.tinta           : DEFAULTS.tinta,
    margem_venda:    isItemArray(raw.margem_venda)    ? raw.margem_venda    : DEFAULTS.margem_venda,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function sum(items: Item[]) {
  return items.reduce((acc, i) => acc + (i.valor || 0), 0)
}

// ─── Seção dinâmica ───────────────────────────────────────────────────────────

interface CalcRow { label: string; value: number; unit?: 'R$' | 'h' }

function DynamicSection({
  title,
  items,
  colHeader,
  addLabel,
  onAdd,
  onUpdate,
  onRemove,
  calcRows,
}: {
  title: string
  items: Item[]
  colHeader: string
  addLabel: string
  onAdd: () => void
  onUpdate: (idx: number, field: keyof Item, value: string | number) => void
  onRemove: (idx: number) => void
  calcRows?: CalcRow[]
}) {
  return (
    <div className="bg-white border border-pedra overflow-hidden">
      {/* Cabeçalho da seção */}
      <div className="px-5 py-3 bg-[#F3F0EB] border-b border-pedra">
        <p className="font-sans text-[10px] tracking-widest uppercase text-muted">{title}</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-pedra">
            <th className="font-sans text-[10px] tracking-widest uppercase text-muted py-2.5 px-5 text-left">
              Item
            </th>
            <th className="font-sans text-[10px] tracking-widest uppercase text-muted py-2.5 px-4 text-right">
              {colHeader}
            </th>
            <th className="w-10" />
          </tr>
        </thead>

        <tbody className="divide-y divide-pedra/40">
          {items.map((item, idx) => (
            <tr key={idx} className="hover:bg-cru/40 transition-colors group">
              {/* Nome editável */}
              <td className="px-5 py-2">
                <input
                  type="text"
                  value={item.nome}
                  onChange={(e) => onUpdate(idx, 'nome', e.target.value)}
                  className="w-full bg-transparent border-b border-transparent hover:border-pedra focus:border-terracota font-sans text-sm text-carvao focus:outline-none transition-colors py-0.5"
                />
              </td>

              {/* Valor editável */}
              <td className="px-4 py-2 text-right">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.valor === 0 ? '' : item.valor}
                  placeholder="0,00"
                  onChange={(e) => onUpdate(idx, 'valor', parseFloat(e.target.value) || 0)}
                  className="w-32 bg-white border border-pedra px-3 py-1.5 font-sans text-sm text-right text-carvao placeholder:text-muted/30 focus:outline-none focus:border-terracota transition-colors"
                />
              </td>

              {/* Remover linha */}
              <td className="px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  title="Remover linha"
                  className="opacity-0 group-hover:opacity-100 text-muted/40 hover:text-red-500 font-sans text-xl leading-none transition-all"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}

          {/* Linhas calculadas */}
          {calcRows?.map((row, i) => (
            <tr key={`calc-${i}`} className="bg-carvao/5 border-t border-pedra">
              <td className="px-5 py-2.5 font-sans text-xs font-medium text-carvao">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-sans text-sm font-semibold text-terracota" colSpan={2}>
                {row.unit === 'h' ? `${fmt(row.value)} h` : `R$ ${fmt(row.value)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botão adicionar linha */}
      <div className="px-5 py-3 border-t border-pedra/40">
        <button
          type="button"
          onClick={onAdd}
          className="font-sans text-xs text-terracota hover:text-carvao transition-colors flex items-center gap-1.5"
        >
          <span className="text-base leading-none font-light">+</span>
          {addLabel}
        </button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CustosForm({ inicial }: { inicial: Record<string, unknown> }) {
  const [d, setD] = useState<CustosData>(() => parseInicial(inicial))
  const [ok, setOk] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Handlers genéricos ────────────────────────────────────────────────────

  function updateItem(section: keyof CustosData, idx: number, field: keyof Item, value: string | number) {
    setD((prev) => {
      const arr = [...prev[section]]
      arr[idx] = { ...arr[idx], [field]: value }
      return { ...prev, [section]: arr }
    })
    setOk(false)
  }

  function addItem(section: keyof CustosData, newItem: Item = { nome: '', valor: 0 }) {
    setD((prev) => ({ ...prev, [section]: [...prev[section], newItem] }))
    setOk(false)
  }

  function removeItem(section: keyof CustosData, idx: number) {
    setD((prev) => ({ ...prev, [section]: prev[section].filter((_, i) => i !== idx) }))
    setOk(false)
  }

  // ── Valores calculados ────────────────────────────────────────────────────

  const totalFixo    = sum(d.custo_fixo)
  const custoHoraFixo = totalFixo / 160
  const custoHoraMO  = sum(d.mao_de_obra) / 160

  // ── Salvar ────────────────────────────────────────────────────────────────

  function handleSave() {
    startTransition(async () => {
      await salvarCustos(d as unknown as Record<string, unknown>)
      setOk(true)
    })
  }

  return (
    <div className="space-y-8">

      {/* 1 — Custo Fixo */}
      <DynamicSection
        title="1 — Custo Fixo Mensal"
        items={d.custo_fixo}
        colHeader="Valor (R$)"
        addLabel="Adicionar item"
        onAdd={() => addItem('custo_fixo')}
        onUpdate={(i, f, v) => updateItem('custo_fixo', i, f, v)}
        onRemove={(i) => removeItem('custo_fixo', i)}
        calcRows={[
          { label: 'Custo Total', value: totalFixo },
          { label: 'Custo / Hora  (÷ 160 h)', value: custoHoraFixo },
        ]}
      />

      {/* 2 — Mão de Obra */}
      <DynamicSection
        title="2 — Custo Mão de Obra"
        items={d.mao_de_obra}
        colHeader="Valor (R$)"
        addLabel="Adicionar item"
        onAdd={() => addItem('mao_de_obra')}
        onUpdate={(i, f, v) => updateItem('mao_de_obra', i, f, v)}
        onRemove={(i) => removeItem('mao_de_obra', i)}
        calcRows={[
          { label: 'Custo / Hora  (÷ 160 h)', value: custoHoraMO },
        ]}
      />

      {/* 3 — Execução */}
      <DynamicSection
        title="3 — Execução — Complexidade × Horas"
        items={d.execucao}
        colHeader="Horas"
        addLabel="Adicionar complexidade"
        onAdd={() => addItem('execucao')}
        onUpdate={(i, f, v) => updateItem('execucao', i, f, v)}
        onRemove={(i) => removeItem('execucao', i)}
      />

      {/* 4 — Embalagem */}
      <DynamicSection
        title="4 — Embalagem"
        items={d.embalagem}
        colHeader="Custo (R$)"
        addLabel="Adicionar tamanho"
        onAdd={() => addItem('embalagem')}
        onUpdate={(i, f, v) => updateItem('embalagem', i, f, v)}
        onRemove={(i) => removeItem('embalagem', i)}
      />

      {/* 5 — Argila */}
      <DynamicSection
        title="5 — Argila — Custo por Kg (R$)"
        items={d.argila}
        colHeader="Custo / Kg (R$)"
        addLabel="Adicionar tipo de argila"
        onAdd={() => addItem('argila')}
        onUpdate={(i, f, v) => updateItem('argila', i, f, v)}
        onRemove={(i) => removeItem('argila', i)}
      />

      {/* 6 — Engobe */}
      <DynamicSection
        title="6 — Engobe"
        items={d.engobe}
        colHeader="Valor"
        addLabel="Adicionar item"
        onAdd={() => addItem('engobe')}
        onUpdate={(i, f, v) => updateItem('engobe', i, f, v)}
        onRemove={(i) => removeItem('engobe', i)}
      />

      {/* 7 — Queima Biscoito */}
      <DynamicSection
        title="7 — Queima Biscoito"
        items={d.queima_biscoito}
        colHeader="Custo (R$)"
        addLabel="Adicionar faixa"
        onAdd={() => addItem('queima_biscoito')}
        onUpdate={(i, f, v) => updateItem('queima_biscoito', i, f, v)}
        onRemove={(i) => removeItem('queima_biscoito', i)}
      />

      {/* 8 — Queima 1046° / 1240° */}
      <DynamicSection
        title="8 — Queima — 1046° / 1240°"
        items={d.queima_alta}
        colHeader="Custo (R$)"
        addLabel="Adicionar faixa"
        onAdd={() => addItem('queima_alta')}
        onUpdate={(i, f, v) => updateItem('queima_alta', i, f, v)}
        onRemove={(i) => removeItem('queima_alta', i)}
      />

      {/* 9 — Esmalte */}
      <DynamicSection
        title="9 — Esmalte"
        items={d.esmalte}
        colHeader="Valor"
        addLabel="Adicionar item"
        onAdd={() => addItem('esmalte')}
        onUpdate={(i, f, v) => updateItem('esmalte', i, f, v)}
        onRemove={(i) => removeItem('esmalte', i)}
      />

      {/* 10 — Tinta */}
      <DynamicSection
        title="10 — Tinta"
        items={d.tinta}
        colHeader="Valor"
        addLabel="Adicionar item"
        onAdd={() => addItem('tinta')}
        onUpdate={(i, f, v) => updateItem('tinta', i, f, v)}
        onRemove={(i) => removeItem('tinta', i)}
      />

      {/* 11 — Margem de venda */}
      <DynamicSection
        title="11 — Margem de venda"
        items={d.margem_venda}
        colHeader="Percentual (%)"
        addLabel="Adicionar margem"
        onAdd={() => addItem('margem_venda', { nome: 'Margem', valor: 55 })}
        onUpdate={(i, f, v) => updateItem('margem_venda', i, f, v)}
        onRemove={(i) => removeItem('margem_venda', i)}
      />

      {/* Salvar */}
      <div className="flex items-center gap-4 pb-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center bg-carvao text-cru font-sans text-sm px-6 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Salvando…' : 'Salvar configurações'}
        </button>
        {ok && <p className="font-sans text-sm text-green-700">Salvo com sucesso!</p>}
      </div>
    </div>
  )
}
