'use client'

import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import NextImage from 'next/image'
import { createClient } from '@/lib/supabase/client'
import {
  type ConjuntoPecaLink,
  addLink,
  collectConjuntoIds,
  getConjuntoMeta,
  getConjuntoPiecesFromRows,
  mergeLinksWithRows,
  pecaHasAnyConjunto,
  pecaInConjunto,
  pecaConjuntoIds,
  removeLink,
  linkRowsForConjunto,
  linkQuantidade,
  quantidadeMapForConjunto,
  updateLinkQuantidade,
} from './conjuntoLinks'
import { salvarPeca, salvarConjunto, deletarPeca, deletarConjunto, syncConjuntoPecas } from './actions'
import type { CustoItem, ConjuntoDB } from './page'
import { VendaModal, type VendaFormData } from './VendaModal'
import { generatePecasPdf, type PecasPdfRow, type PdfColumnId } from './generatePecasPdf'
import { PecasPdfModal } from './PecasPdfModal'
import { SelecionarAvulsasModal } from './SelecionarAvulsasModal'
import { FormarConjuntoModal } from './FormarConjuntoModal'
import { DuplicatePecaModal, type DuplicatePecaMode } from './DuplicatePecaModal'
import { ConfirmDeleteModal } from './ConfirmDeleteModal'
import {
  calcEngobeCusto,
  calcEngobeQtdGr,
  calcEsmalteCusto,
  calcEsmalteQtdGr,
  calcTintaCusto,
  calcTintaQtdMl,
  getRelacaoGrM2,
  getRelacaoMlM2,
  getPrecoUnitario,
  inferPinturaAplicavelFromDb,
  resolvePinturaQuantitiesForSave,
  syncPinturaQuantities,
} from '@/lib/pinturaCustos'
import {
  type CodigoListEntry,
  CATEGORIAS_PECA,
  categoriaToPrefix,
  compareCodigoDisplay,
  getCodigoMae,
  assignVariantCodigosForSameCodeCopy,
  inferPrefixFromCodigos,
  parsePecaCodigoLoose,
  suggestCodigoForCategoria,
  suggestNextConjuntoCodigo,
  suggestNextPecaCodigo,
  normalizeCodigoKey,
  validateConjuntoCodigoUnique,
  validatePecaCodigoUnique,
} from './codigoUtils'

function Thumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
  if (src.startsWith('blob:') || src.startsWith('data:')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`absolute inset-0 w-full h-full object-cover ${className ?? ''}`} />
  }
  return <NextImage src={src} alt={alt} fill sizes="80px" className={`object-cover ${className ?? ''}`} />
}

function getMergedFotoSrcs(existing: string[], pending: string[], novaPrincipal: boolean): string[] {
  if (novaPrincipal && pending.length > 0) return [...pending, ...existing]
  return [...existing, ...pending]
}

function getPecaFotoSrcs(row: PecaRow): string[] {
  return getMergedFotoSrcs(row.fotos, row.fotosNovas.map((f) => f.preview), row.novaPrincipal)
}

function getConjuntoFotoSrcs(cdata: ConjuntoData): string[] {
  return getMergedFotoSrcs(cdata.fotos, cdata.fotosNovas.map((f) => f.preview), cdata.novaPrincipal)
}

function gridIndexToMergedIndex(
  gridIndex: number,
  isNew: boolean,
  existingCount: number,
  pendingCount: number,
  novaPrincipal: boolean,
): number {
  if (isNew) return novaPrincipal ? gridIndex : existingCount + gridIndex
  return novaPrincipal ? pendingCount + gridIndex : gridIndex
}

function pecaFotoTitulo(row: PecaRow): string {
  return [row.codigo, row.nome].filter(Boolean).join(' — ') || 'Peça'
}

interface FotoPreviewState {
  fotos: string[]
  initialIndex: number
  titulo?: string
  onManage?: () => void
}

function FotoPreviewModal({ fotos, initialIndex, titulo, onClose, onManage }: FotoPreviewState & { onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex)
  const src = fotos[index]

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex, fotos])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(fotos.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fotos.length, onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-black/85 p-4"
      onMouseDown={onClose}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-3" onMouseDown={(e) => e.stopPropagation()}>
        <div className="w-full flex items-center justify-between gap-3 text-cru">
          <div className="min-w-0">
            {titulo && <p className="font-sans text-sm truncate">{titulo}</p>}
            {fotos.length > 1 && (
              <p className="font-sans text-[10px] text-cru/70 mt-0.5">
                Foto {index + 1} de {fotos.length}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-cru/80 hover:text-cru text-3xl leading-none w-9 h-9 flex items-center justify-center"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="relative w-full flex items-center justify-center min-h-[200px] max-h-[78vh]">
          {fotos.length > 1 && (
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="absolute left-0 z-10 w-10 h-10 rounded-full bg-black/50 text-cru hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Foto anterior"
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={titulo ? `Foto — ${titulo}` : 'Foto ampliada'}
            className="max-w-full max-h-[78vh] w-auto h-auto object-contain rounded-sm shadow-2xl"
          />
          {fotos.length > 1 && (
            <button
              type="button"
              disabled={index === fotos.length - 1}
              onClick={() => setIndex((i) => Math.min(fotos.length - 1, i + 1))}
              className="absolute right-0 z-10 w-10 h-10 rounded-full bg-black/50 text-cru hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              aria-label="Próxima foto"
            >
              ›
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onManage && (
            <button
              type="button"
              onClick={() => { onClose(); onManage() }}
              className="font-sans text-xs tracking-wide uppercase px-4 py-2 border border-cru/40 text-cru hover:bg-cru/10 transition-colors"
            >
              Gerenciar fotos
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="font-sans text-xs tracking-wide uppercase px-4 py-2 bg-cru text-carvao hover:bg-cru/90 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PecaDB {
  id: string
  codigo: string | null
  nome: string | null
  dimensoes: string | null
  descricao: string | null
  status: string | null
  exibir_no_site: boolean | null
  destaque_home: boolean | null
  fenearte: boolean | null
  peso: number | null
  categoria: string | null
  area_pintura: number | null
  execucao_h: number | null
  fotos: string[]
  tipo_embalagem: string | null
  tipo_argila: string | null
  qnt_argila_kg: number | null
  esmalte_qnt_gr: number | null
  engobe_qnt_gr: number | null
  tinta_qnt_gr: number | null
  tipo_biscoito: string | null
  tipo_queima: string | null
  custo_extra: number | null
  margem_venda: number | null
  preco_venda: number | null
  preco_praticado: number | null
  ordem: number | null
  conjunto_id: string | null
  conjunto_codigo: string | null
  conjunto_nome: string | null
  valor_venda: number | null
  local_venda: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  vendido_em: string | null
}

interface PendingFoto { file: File; preview: string }

interface PecaRow {
  id: string
  codigo: string
  nome: string
  dimensoes: string
  descricao: string
  status: string
  exibir_no_site: boolean
  destaque_home: boolean
  fenearte: boolean
  peso: string
  categoria: string
  area_pintura: string
  execucao_h: string
  fotos: string[]
  fotosNovas: PendingFoto[]
  novaPrincipal: boolean
  tipo_embalagem: string
  tipo_argila: string
  qnt_argila_kg: string
  esmalte_qnt_gr: string
  engobe_qnt_gr: string
  tinta_qnt_gr: string
  esmalte_aplicavel: boolean
  engobe_aplicavel: boolean
  tinta_aplicavel: boolean
  tipo_biscoito: string
  tipo_queima: string
  custo_extra: string
  margem_venda: string
  preco_praticado: string
  ordem: number | null
  isNew: boolean
  dirty: boolean
  conjunto_id: string | null
  conjunto_codigo: string
  conjunto_nome: string
  valor_venda: string
  local_venda: string
  cliente_nome: string
  cliente_telefone: string
  cliente_email: string
  vendido_em: string | null
}

interface SameCodeDuplicateSession {
  kind: 'conjunto' | 'peca'
  sourceConjuntoId?: string
  sourcePecaId?: string
  draftConjuntoId?: string
  draftPecaIds: string[]
}

// Dados gerenciados a nível do conjunto (não da peça individual)
interface ConjuntoData {
  codigo: string
  nome: string
  descricao: string
  status: string
  exibir_no_site: boolean
  destaque_home: boolean
  fenearte: boolean
  categoria: string
  fotos: string[]
  fotosNovas: PendingFoto[]
  novaPrincipal: boolean
  margem_venda: string
  preco_praticado: string
  venda_modo: string
  dirty: boolean
}

type VendaModo = 'apenas_conjunto' | 'conjunto_e_pecas'

const VENDA_MODO_OPTIONS: { value: VendaModo; label: string; description: string }[] = [
  {
    value: 'apenas_conjunto',
    label: 'Apenas como conjunto',
    description: 'O cliente compra o conjunto completo. As peças não podem ser vendidas separadamente no site.',
  },
  {
    value: 'conjunto_e_pecas',
    label: 'Conjunto ou peças avulsas',
    description: 'No site, o cliente pode comprar o conjunto ou escolher uma peça específica do conjunto.',
  },
]

interface ConjuntoInfo { id: string; codigo: string; nome: string }

interface Props {
  pecasIniciais: PecaDB[]
  conjuntosIniciais: ConjuntoDB[]
  conjuntoLinksIniciais: ConjuntoPecaLink[]
  custoHoraFixo: number
  custoHoraMO: number
  embalagemItems: CustoItem[]
  argilaItems: CustoItem[]
  esmalteItems: CustoItem[]
  engobeItems: CustoItem[]
  tintaItems: CustoItem[]
  biscoitoItems: CustoItem[]
  queimaAltaItems: CustoItem[]
  margemVendaConfig: number
}

// ─── Display types ────────────────────────────────────────────────────────────

type DisplayItem =
  | { type: 'conjunto-header'; conjuntoId: string; conjuntoCodigo: string; conjuntoNome: string; rows: PecaRow[] }
  | { type: 'row'; row: PecaRow; displayConjuntoId?: string }

function buildDisplay(
  rows: PecaRow[],
  links: ConjuntoPecaLink[],
  metaById: Map<string, { codigo: string; nome: string }>,
): DisplayItem[] {
  const items: DisplayItem[] = []
  const conjuntoIds = collectConjuntoIds(rows, links)

  for (const row of rows) {
    if (!pecaHasAnyConjunto(row.id, row, links)) {
      items.push({ type: 'row', row })
    }
  }

  const sortedConjuntoIds = conjuntoIds.sort((a, b) => {
    const ma = metaById.get(a) ?? getConjuntoMeta(a, rows)
    const mb = metaById.get(b) ?? getConjuntoMeta(b, rows)
    return compareCodigoDisplay(ma.codigo || a, mb.codigo || b)
  })

  for (const conjuntoId of sortedConjuntoIds) {
    const groupRows = getConjuntoPiecesFromRows(rows, conjuntoId, links)
    if (groupRows.length === 0) continue
    const meta = metaById.get(conjuntoId) ?? getConjuntoMeta(conjuntoId, rows)
    items.push({
      type: 'conjunto-header',
      conjuntoId,
      conjuntoCodigo: meta.codigo,
      conjuntoNome: meta.nome,
      rows: groupRows,
    })
    for (const r of groupRows) {
      items.push({ type: 'row', row: r, displayConjuntoId: conjuntoId })
    }
  }

  return items
}

function displayItemKey(item: DisplayItem): string {
  if (item.type === 'conjunto-header') return `conjunto:${item.conjuntoId}`
  return item.displayConjuntoId ? `row:${item.row.id}:${item.displayConjuntoId}` : `row:${item.row.id}`
}

/** Peça avulsa com feira ativa ou linha do conjunto com feira ativa (não inclui peças filhas). */
function isDisplayItemFenearte(item: DisplayItem, conjuntosData: Map<string, ConjuntoData>): boolean {
  if (item.type === 'conjunto-header') {
    return conjuntosData.get(item.conjuntoId)?.fenearte ?? false
  }
  const row = item.row
  if (item.displayConjuntoId) return false
  return row.fenearte
}

/** Visibilidade na tabela em modo feira — inclui peças filhas do conjunto marcado para feira. */
function isDisplayItemFenearteVisible(item: DisplayItem, conjuntosData: Map<string, ConjuntoData>): boolean {
  if (item.type === 'conjunto-header') {
    return conjuntosData.get(item.conjuntoId)?.fenearte ?? false
  }
  const activeConjuntoId = item.displayConjuntoId ?? item.row.conjunto_id
  if (activeConjuntoId) {
    return conjuntosData.get(activeConjuntoId)?.fenearte ?? false
  }
  return item.row.fenearte
}

function fmtPrecoPdf(value: number): string {
  return value > 0 ? `R$ ${fmt(value)}` : '—'
}

function yesNoPdf(value: boolean): string {
  return value ? 'Sim' : 'Não'
}

function getRowPhotoSrc(row: PecaRow): string | null {
  if (row.novaPrincipal && row.fotosNovas.length > 0) return row.fotosNovas[0].preview
  return row.fotos[0] ?? row.fotosNovas[0]?.preview ?? null
}

function getDisplayItemPhotoSrc(item: DisplayItem, conjuntosData: Map<string, ConjuntoData>): string | null {
  if (item.type === 'conjunto-header') {
    const cdata = conjuntosData.get(item.conjuntoId)
    if (!cdata) return null
    if (cdata.novaPrincipal && cdata.fotosNovas.length > 0) return cdata.fotosNovas[0].preview
    return cdata.fotos[0] ?? cdata.fotosNovas[0]?.preview ?? null
  }
  const row = item.row
  if (row.novaPrincipal && row.fotosNovas.length > 0) return row.fotosNovas[0].preview
  return row.fotos[0] ?? row.fotosNovas[0]?.preview ?? null
}

function isConjuntoFullySold(rows: PecaRow[], conjuntoId: string, links: ConjuntoPecaLink[]): boolean {
  const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, links)
  return pieces.length > 0 && pieces.every((p) => p.status === 'vendido')
}

/** Peças vendidas avulsas e conjuntos 100% vendidos ficam no final da lista. */
function sortRowsForDisplay(rows: PecaRow[], links: ConjuntoPecaLink[]): PecaRow[] {
  const fullySoldConjuntos = new Set<string>()
  for (const conjuntoId of collectConjuntoIds(rows, links)) {
    if (isConjuntoFullySold(rows, conjuntoId, links)) {
      fullySoldConjuntos.add(conjuntoId)
    }
  }

  function atEnd(row: PecaRow): boolean {
    if (pecaHasAnyConjunto(row.id, row, links)) {
      return pecaConjuntoIds(row.id, row, links).some((cid) => fullySoldConjuntos.has(cid))
    }
    return row.status === 'vendido'
  }

  return [...rows].sort((a, b) => {
    const endA = atEnd(a) ? 1 : 0
    const endB = atEnd(b) ? 1 : 0
    if (endA !== endB) return endA - endB

    // Conjuntos da mesma família: original (C4) antes das variantes (C4-02…)
    if (a.conjunto_id && b.conjunto_id && a.conjunto_id !== b.conjunto_id) {
      const conjCmp = compareCodigoDisplay(a.conjunto_codigo, b.conjunto_codigo)
      if (conjCmp !== 0) return conjCmp
    }

    // Peças avulsas da mesma família: original (U1) antes das variantes (U1-02…)
    if (!a.conjunto_id && !b.conjunto_id) {
      const ma = getCodigoMae(a.codigo)
      const mb = getCodigoMae(b.codigo)
      if (ma === mb && ma) {
        const famCmp = compareCodigoDisplay(a.codigo, b.codigo)
        if (famCmp !== 0) return famCmp
      }
    }

    return (a.ordem ?? 0) - (b.ordem ?? 0) || compareCodigoDisplay(a.codigo, b.codigo)
  })
}

const EMPTY_VENDA: Pick<PecaRow, 'valor_venda' | 'local_venda' | 'cliente_nome' | 'cliente_telefone' | 'cliente_email' | 'vendido_em'> = {
  valor_venda: '', local_venda: '', cliente_nome: '', cliente_telefone: '', cliente_email: '', vendido_em: null,
}

interface SearchResultItem {
  type: 'peca' | 'conjunto'
  id: string
  codigo: string
  nome: string
  detail?: string
}

function filterRowsBySearch(
  rows: PecaRow[],
  links: ConjuntoPecaLink[],
  metaById: Map<string, { codigo: string; nome: string }>,
  query: string,
): PecaRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows

  const matchingConjuntoIds = new Set<string>()
  for (const [id, meta] of metaById) {
    if (meta.codigo.toLowerCase().includes(q) || meta.nome.toLowerCase().includes(q)) {
      matchingConjuntoIds.add(id)
    }
  }

  for (const r of rows) {
    const pecaMatch = r.codigo.toLowerCase().includes(q) || r.nome.toLowerCase().includes(q)
    if (pecaMatch) {
      for (const id of pecaConjuntoIds(r.id, r, links)) matchingConjuntoIds.add(id)
    }
  }

  return rows.filter((r) => {
    const conjuntoIds = pecaConjuntoIds(r.id, r, links)
    if (conjuntoIds.length === 0) {
      return r.codigo.toLowerCase().includes(q) || r.nome.toLowerCase().includes(q)
    }
    return conjuntoIds.some((id) => matchingConjuntoIds.has(id))
  })
}

function buildSearchResults(
  rows: PecaRow[],
  links: ConjuntoPecaLink[],
  metaById: Map<string, { codigo: string; nome: string }>,
  query: string,
): SearchResultItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: SearchResultItem[] = []
  const seenPecas = new Set<string>()
  const seenConjuntos = new Set<string>()

  for (const id of collectConjuntoIds(rows, links)) {
    if (seenConjuntos.has(id)) continue
    const meta = metaById.get(id) ?? getConjuntoMeta(id, rows)
    const conjMatch = meta.codigo.toLowerCase().includes(q) || meta.nome.toLowerCase().includes(q)
    if (conjMatch) {
      seenConjuntos.add(id)
      const count = getConjuntoPiecesFromRows(rows, id, links).length
      results.push({
        type: 'conjunto',
        id,
        codigo: meta.codigo,
        nome: meta.nome,
        detail: `${count} ${count === 1 ? 'peça' : 'peças'}`,
      })
    }
  }

  rows.forEach((r) => {
    const pecaMatch = r.codigo.toLowerCase().includes(q) || r.nome.toLowerCase().includes(q)
    if (pecaMatch && !seenPecas.has(r.id)) {
      seenPecas.add(r.id)
      const conjuntoIds = pecaConjuntoIds(r.id, r, links)
      const detail = conjuntoIds.length > 0
        ? conjuntoIds.map((id) => metaById.get(id)?.codigo || getConjuntoMeta(id, rows).codigo).filter(Boolean).join(', ')
        : undefined
      results.push({
        type: 'peca',
        id: r.id,
        codigo: r.codigo,
        nome: r.nome,
        detail: detail ? `Conjunto(s) ${detail}` : undefined,
      })
    }
  })

  return results.slice(0, 12)
}

const MAX_DESTAQUES_HOME = 6
const DESTAQUE_LIMIT_MSG =
  'Já existem 6 peças em destaque (Peças do momento). Remova o destaque de outra peça publicada antes de selecionar esta.'

function countDestaquesAtivos(
  rows: PecaRow[],
  conjuntosData: Map<string, ConjuntoData>,
  excludeId?: string,
): number {
  let count = 0
  for (const r of rows) {
    if (r.conjunto_id || !r.exibir_no_site || !r.destaque_home) continue
    if (excludeId && r.id === excludeId) continue
    count++
  }
  for (const [id, c] of conjuntosData) {
    if (!c.exibir_no_site || !c.destaque_home) continue
    if (excludeId && id === excludeId) continue
    count++
  }
  return count
}

type PublicationFieldKey = 'foto' | 'nome' | 'descricao' | 'preco' | 'dimensao' | 'peso'

const PUBLICATION_FIELD_LABELS: Record<PublicationFieldKey, string> = {
  foto: 'Foto',
  nome: 'Nome',
  descricao: 'Descrição',
  preco: 'Preço sugerido',
  dimensao: 'Dimensão',
  peso: 'Peso da argila (kg)',
}

type PublicationMissingResult = {
  fields: PublicationFieldKey[]
  focusPieceId?: string
}

function pubFieldHighlightCls(active: boolean) {
  return active ? 'ring-2 ring-terracota ring-offset-2 rounded-sm bg-terracota/8 transition-all' : ''
}

function resolvePublicationFieldElementId(
  key: PublicationFieldKey,
  inConjunto: boolean,
  pieceId?: string | null,
): string {
  switch (key) {
    case 'foto': return inConjunto ? 'modal-field-conjunto-foto' : 'modal-field-peca-foto'
    case 'nome': return inConjunto ? 'modal-field-conjunto-nome' : 'modal-field-nome'
    case 'descricao': return inConjunto ? 'modal-field-conjunto-descricao' : 'modal-field-descricao'
    case 'preco': return inConjunto ? 'modal-field-conjunto-preco' : 'modal-field-preco'
    case 'dimensao': return `modal-field-dimensao-${pieceId ?? ''}`
    case 'peso': return `modal-field-peso-${pieceId ?? ''}`
  }
}

function getMissingPublicationFieldsPeca(row: PecaRow, custoTotal: number, margemVenda: number): PublicationMissingResult {
  const fields: PublicationFieldKey[] = []
  if (row.fotos.length + row.fotosNovas.length === 0) fields.push('foto')
  if (!row.nome.trim()) fields.push('nome')
  if (!row.descricao.trim()) fields.push('descricao')
  const { precoSugerido } = buildPecaPricing(row, custoTotal, margemVenda)
  if (precoSugerido <= 0) fields.push('preco')
  if (!row.dimensoes.trim()) fields.push('dimensao')
  if (nv(row.qnt_argila_kg) <= 0) fields.push('peso')
  const needsPieceFocus = fields.includes('dimensao') || fields.includes('peso')
  return { fields, focusPieceId: needsPieceFocus ? row.id : undefined }
}

function getMissingPublicationFieldsConjunto(
  cdata: ConjuntoData,
  conjuntoCodigo: string,
  conjuntoNome: string,
  pieces: PecaRow[],
  precoSugerido: number,
  totalArgilaKg: number,
): PublicationMissingResult {
  const fields: PublicationFieldKey[] = []
  if (cdata.fotos.length + cdata.fotosNovas.length === 0) fields.push('foto')
  if (!conjuntoNome.trim() && !conjuntoCodigo.trim()) fields.push('nome')
  if (!cdata.descricao.trim()) fields.push('descricao')
  if (precoSugerido <= 0) fields.push('preco')
  const pieceMissingDim = pieces.find((p) => !p.dimensoes.trim())
  if (pieceMissingDim) fields.push('dimensao')
  if (totalArgilaKg <= 0) fields.push('peso')
  const pieceMissingPeso = pieces.find((p) => nv(p.qnt_argila_kg) <= 0)
  const focusPieceId = pieceMissingDim?.id ?? pieceMissingPeso?.id
  return { fields, focusPieceId }
}

const defaultConjuntoData = (): ConjuntoData => ({
  codigo: '', nome: '',
  descricao: '', status: '', exibir_no_site: false,
  destaque_home: false, fenearte: false, categoria: '', fotos: [],
  fotosNovas: [], novaPrincipal: false, margem_venda: String(DEFAULT_MARGEM_VENDA), preco_praticado: '',
  venda_modo: 'apenas_conjunto', dirty: false,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_MARGEM_VENDA = 55

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function nv(s: string) { return s !== '' ? parseFloat(s) || 0 : 0 }

function effectiveMargem(margemPercent: number): number {
  return margemPercent > 0 ? margemPercent : DEFAULT_MARGEM_VENDA
}

/** Margem sobre o preço: preço = custo ÷ (1 − margem%). Ex.: 100 ÷ (1 − 0,55) = 222,22 */
function calcPrecoSugerido(custoTotal: number, margemPercent: number): number {
  if (custoTotal <= 0) return 0
  const margem = margemPercent / 100
  if (margem >= 1) return 0
  const divisor = 1 - margem
  if (divisor <= 0) return 0
  return custoTotal / divisor
}

function buildPecaPricing(row: PecaRow, custoTotal: number, margemVenda: number) {
  const margem = effectiveMargem(margemVenda)
  const precoSugerido = calcPrecoSugerido(custoTotal, margem)
  const precoPraticado = row.preco_praticado !== '' ? parseFloat(row.preco_praticado) || 0 : precoSugerido
  return { custoTotal, margem, precoSugerido, precoPraticado }
}

interface RowCosts {
  valEmb: number | null
  valArg: number | null
  valEsmalte: number | null
  valEngobe: number | null
  valTinta: number | null
  valBisc: number | null
  valQueima: number | null
  maoDeObra: number | null
  rateio: number | null
  custoExtra: number
  custoTotal: number
}

function calcRowCosts(
  row: PecaRow,
  custoHoraMO: number,
  custoHoraFixo: number,
  embalagemItems: CustoItem[],
  argilaItems: CustoItem[],
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
  biscoitoItems: CustoItem[],
  queimaAltaItems: CustoItem[],
): RowCosts {
  const execH = nv(row.execucao_h)
  const maoDeObra = execH > 0 ? execH * custoHoraMO : null
  const rateio = execH > 0 ? execH * custoHoraFixo : null
  const embSel = embalagemItems.find((e) => e.nome === row.tipo_embalagem)
  const valEmb = embSel ? embSel.valor : null
  const argSel = argilaItems.find((a) => a.nome === row.tipo_argila)
  const valArg = argSel && nv(row.qnt_argila_kg) > 0 ? nv(row.qnt_argila_kg) * argSel.valor : null
  const valEsmalte = calcEsmalteCusto(row, esmalteItems)
  const valEngobe = calcEngobeCusto(row, engobeItems)
  const valTinta = calcTintaCusto(row, tintaItems)
  const biscSel = biscoitoItems.find((b) => b.nome === row.tipo_biscoito)
  const valBisc = biscSel ? biscSel.valor : null
  const queimaSel = queimaAltaItems.find((q) => q.nome === row.tipo_queima)
  const valQueima = queimaSel ? queimaSel.valor : null
  const custoExtra = nv(row.custo_extra)
  const custoTotal =
    (maoDeObra ?? 0) + (rateio ?? 0) +
    (valEmb ?? 0) + (valArg ?? 0) + (valEsmalte ?? 0) + (valEngobe ?? 0) +
    (valTinta ?? 0) + (valBisc ?? 0) + (valQueima ?? 0) + custoExtra
  return { valEmb, valArg, valEsmalte, valEngobe, valTinta, valBisc, valQueima, maoDeObra, rateio, custoExtra, custoTotal }
}

function calcConjuntoTotals(
  conjuntoRows: PecaRow[],
  quantidadeByPecaId: Map<string, number>,
  custoHoraMO: number,
  custoHoraFixo: number,
  embalagemItems: CustoItem[],
  argilaItems: CustoItem[],
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
  biscoitoItems: CustoItem[],
  queimaAltaItems: CustoItem[],
) {
  let totalArgilaKg = 0
  let totalCusto = 0
  let valEmb = 0, valArg = 0, valEsmalte = 0, valEngobe = 0, valTinta = 0
  let valBisc = 0, valQueima = 0, maoDeObra = 0, rateio = 0, custoExtra = 0

  conjuntoRows.forEach((row) => {
    const q = quantidadeByPecaId.get(row.id) ?? 1
    const c = calcRowCosts(row, custoHoraMO, custoHoraFixo, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems)
    totalArgilaKg += nv(row.qnt_argila_kg) * q
    totalCusto += c.custoTotal * q
    valEmb += (c.valEmb ?? 0) * q
    valArg += (c.valArg ?? 0) * q
    valEsmalte += (c.valEsmalte ?? 0) * q
    valEngobe += (c.valEngobe ?? 0) * q
    valTinta += (c.valTinta ?? 0) * q
    valBisc += (c.valBisc ?? 0) * q
    valQueima += (c.valQueima ?? 0) * q
    maoDeObra += (c.maoDeObra ?? 0) * q
    rateio += (c.rateio ?? 0) * q
    custoExtra += c.custoExtra * q
  })

  return {
    totalArgilaKg,
    totalCusto,
    valEmb, valArg, valEsmalte, valEngobe, valTinta, valBisc, valQueima, maoDeObra, rateio, custoExtra,
  }
}

function calcConjuntoPricing(
  conjuntoRows: PecaRow[],
  quantidadeByPecaId: Map<string, number>,
  margemVenda: number,
  precoPraticadoStr: string,
  custoHoraMO: number,
  custoHoraFixo: number,
  embalagemItems: CustoItem[],
  argilaItems: CustoItem[],
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
  biscoitoItems: CustoItem[],
  queimaAltaItems: CustoItem[],
) {
  const totals = calcConjuntoTotals(
    conjuntoRows, quantidadeByPecaId, custoHoraMO, custoHoraFixo,
    embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
  )
  const margem = effectiveMargem(margemVenda)
  const precoSugerido = calcPrecoSugerido(totals.totalCusto, margem)
  const precoPraticado = precoPraticadoStr !== '' ? parseFloat(precoPraticadoStr) || 0 : precoSugerido
  return { ...totals, margem, precoSugerido, precoPraticado }
}

function dbToRow(p: PecaDB): PecaRow {
  return {
    id: p.id,
    codigo:          p.codigo          ?? '',
    nome:            p.nome            ?? '',
    dimensoes:       p.dimensoes       ?? '',
    descricao:       p.descricao       ?? '',
    status:          p.status          ?? '',
    exibir_no_site:  p.exibir_no_site  ?? false,
    destaque_home:   p.destaque_home   ?? false,
    fenearte:        p.fenearte        ?? false,
    peso:            p.peso            != null ? String(p.peso)     : '',
    categoria:       p.categoria       ?? '',
    area_pintura:    p.area_pintura    != null ? String(p.area_pintura)    : '',
    execucao_h:      p.execucao_h      != null ? String(p.execucao_h)      : '',
    fotos:           p.fotos           ?? [],
    fotosNovas:      [],
    novaPrincipal:   false,
    tipo_embalagem:  p.tipo_embalagem  ?? '',
    tipo_argila:     p.tipo_argila     ?? '',
    qnt_argila_kg:   p.qnt_argila_kg   != null ? String(p.qnt_argila_kg)   : '',
    esmalte_qnt_gr:  p.esmalte_qnt_gr  != null ? String(p.esmalte_qnt_gr)  : '',
    engobe_qnt_gr:   p.engobe_qnt_gr   != null ? String(p.engobe_qnt_gr)   : '',
    tinta_qnt_gr:    p.tinta_qnt_gr    != null ? String(p.tinta_qnt_gr)    : '',
    esmalte_aplicavel: inferPinturaAplicavelFromDb(p.esmalte_qnt_gr),
    engobe_aplicavel:  inferPinturaAplicavelFromDb(p.engobe_qnt_gr),
    tinta_aplicavel:   inferPinturaAplicavelFromDb(p.tinta_qnt_gr),
    tipo_biscoito:   p.tipo_biscoito   ?? '',
    tipo_queima:     p.tipo_queima     ?? '',
    custo_extra:     p.custo_extra     != null ? String(p.custo_extra)     : '',
    margem_venda:    p.margem_venda != null ? String(p.margem_venda) : String(DEFAULT_MARGEM_VENDA),
    preco_praticado: p.preco_praticado != null ? String(p.preco_praticado) : '',
    ordem:           p.ordem,
    isNew: false,
    dirty: false,
    conjunto_id:     p.conjunto_id     ?? null,
    conjunto_codigo: p.conjunto_codigo ?? '',
    conjunto_nome:   p.conjunto_nome   ?? '',
    valor_venda:     p.valor_venda != null ? String(p.valor_venda) : '',
    local_venda:     p.local_venda ?? '',
    cliente_nome:    p.cliente_nome ?? '',
    cliente_telefone: p.cliente_telefone ?? '',
    cliente_email:   p.cliente_email ?? '',
    vendido_em:      p.vendido_em ?? null,
  }
}

function emptyRow(conjuntoId?: string, conjuntoCodigo?: string, conjuntoNome?: string, initialStatus = ''): PecaRow {
  return {
    id: crypto.randomUUID(),
    codigo: '', nome: '', dimensoes: '',
    descricao: '', status: initialStatus, exibir_no_site: false, destaque_home: false, fenearte: false,
    peso: '', categoria: '',
    area_pintura: '', execucao_h: '',
    fotos: [], fotosNovas: [], novaPrincipal: false,
    tipo_embalagem: '', tipo_argila: '', qnt_argila_kg: '',
    esmalte_qnt_gr: '', engobe_qnt_gr: '', tinta_qnt_gr: '',
    esmalte_aplicavel: false, engobe_aplicavel: false, tinta_aplicavel: false,
    tipo_biscoito: '', tipo_queima: '',
    custo_extra: '', margem_venda: String(DEFAULT_MARGEM_VENDA), preco_praticado: '',
    ordem: null, isNew: true, dirty: true,
    conjunto_id:     conjuntoId     ?? null,
    conjunto_codigo: conjuntoCodigo ?? '',
    conjunto_nome:   conjuntoNome   ?? '',
    ...EMPTY_VENDA,
  }
}

function suggestNextPecaCodigoFromSource(source: PecaRow, allCodigos: string[]): string {
  if (source.categoria) {
    const fromCat = suggestCodigoForCategoria(source.categoria, allCodigos)
    if (fromCat) return fromCat
  }
  const parsed = parsePecaCodigoLoose(source.codigo)
  const prefix = parsed?.prefix ?? inferPrefixFromCodigos([source.codigo])
  return suggestNextPecaCodigo(prefix, allCodigos)
}

function findFamiliaInsertIndex(rows: PecaRow[], sourceRowId: string): number {
  const source = rows.find((r) => r.id === sourceRowId)
  if (!source || source.conjunto_id) {
    const idx = rows.findIndex((r) => r.id === sourceRowId)
    return idx === -1 ? rows.length : idx + 1
  }
  const mother = getCodigoMae(source.codigo)
  let insertAt = rows.findIndex((r) => r.id === sourceRowId) + 1
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (r.conjunto_id) continue
    if (getCodigoMae(r.codigo) === mother) insertAt = i + 1
  }
  return insertAt
}

function clonePecaAsNew(source: PecaRow, overrides: Partial<PecaRow>): PecaRow {
  return {
    ...source,
    id: crypto.randomUUID(),
    fotos: [],
    fotosNovas: [],
    novaPrincipal: false,
    isNew: true,
    dirty: true,
    exibir_no_site: false,
    destaque_home: false,
    status: source.status === 'vendido' ? '' : source.status,
    ...EMPTY_VENDA,
    ...overrides,
  }
}

function cloneConjuntoDataAsNew(source: ConjuntoData): ConjuntoData {
  return {
    ...source,
    fotos: [],
    fotosNovas: [],
    novaPrincipal: false,
    exibir_no_site: false,
    destaque_home: false,
    status: source.status === 'vendido' ? '' : source.status,
    dirty: true,
  }
}

// ─── Style constants ──────────────────────────────────────────────────────────

const TH = 'font-sans text-[9px] tracking-widest uppercase text-muted py-2 px-2 whitespace-nowrap'
const numInput = 'bg-white border border-pedra px-1.5 py-1 font-sans text-xs text-carvao placeholder:text-muted/30 focus:outline-none focus:border-terracota transition-colors text-right w-full max-w-[5.5rem]'
const textInput = 'w-full bg-transparent border-b border-transparent hover:border-pedra focus:border-terracota font-sans text-xs text-carvao placeholder:text-muted/30 focus:outline-none transition-colors py-0.5'
const selectCls = 'bg-white border border-pedra px-2 py-1.5 font-sans text-sm text-carvao focus:outline-none focus:border-terracota transition-colors appearance-none cursor-pointer'
const tableSelectCls = 'w-full bg-white border border-pedra px-1.5 py-1 font-sans text-[11px] text-carvao focus:outline-none focus:border-terracota transition-colors appearance-none cursor-pointer min-w-0'

const TABLE_ACTION_STACK = 'flex flex-col items-stretch gap-1.5 w-[5.5rem] mx-auto'
const TABLE_ACTION_BTN = 'w-full font-sans text-[10px] px-2 py-0.5 border transition-colors whitespace-nowrap text-center'
const TABLE_ACTION_EDIT = `${TABLE_ACTION_BTN} text-terracota hover:text-carvao border-terracota/40 hover:bg-areia/60`
const TABLE_ACTION_DUP = `${TABLE_ACTION_BTN} text-muted hover:text-carvao border-pedra hover:bg-areia/60`
const TABLE_ACTION_DEL = `${TABLE_ACTION_BTN} text-red-500/80 hover:text-red-600 border-red-200 hover:bg-red-50`
const TABLE_ACTION_ADD = `${TABLE_ACTION_BTN} text-terracota hover:text-carvao border-terracota/30 hover:bg-areia/60 flex items-center justify-center gap-0.5`

// Visual do conjunto — paleta VRG (terracota / areia / carvao)
const CONJ_HEADER_ROW = 'border-t-2 border-terracota/35 border-b border-terracota/15 bg-[#EDE8DF]'
const CONJ_HEADER_ROW_DIRTY = 'border-t-2 border-terracota/50 border-b border-terracota/25 bg-[#E5DACE]'
const CONJ_CHILD_ROW = 'bg-areia/30 border-l-[3px] border-l-terracota/40'
const CONJ_CHILD_ROW_HOVER = 'hover:bg-areia/50'
const CONJ_CHILD_INDENT = 'pl-4'

const STICKY_CHECKBOX = 'sticky left-0 z-20'
const STICKY_FOTO = 'sticky left-10 z-20 shadow-[4px_0_8px_-2px_rgba(43,41,38,0.08)] w-[72px]'

function stickyCellBg(row: PecaRow, inConjunto: boolean, effectiveFenearte: boolean): string {
  if (row.dirty) return 'bg-[#F7F2ED]'
  if (inConjunto) {
    return effectiveFenearte ? 'bg-[#FDF8EF] group-hover:bg-[#FCF3E4]' : 'bg-[#EEE9E2] group-hover:bg-[#E8E2DA]'
  }
  if (row.fenearte) return 'bg-[#FFF8EB] group-hover:bg-[#FFF3D6]'
  return 'bg-white group-hover:bg-[#F5F1EA]'
}

const STATUS_OPTIONS = [
  { value: 'disponivel',    label: 'Disponível',    dot: 'bg-green-500' },
  { value: 'vendido',       label: 'Vendido',       dot: 'bg-red-400'   },
  { value: 'sob_encomenda', label: 'Sob encomenda', dot: 'bg-amber-400' },
  { value: 'acervo',        label: 'Acervo',        dot: 'bg-slate-400' },
]

function statusLabel(value: string): string {
  if (!value) return '—'
  const opt = STATUS_OPTIONS.find((s) => s.value === value)
  return opt?.label ?? value
}

function pesoGramsFromArgilaKg(kg: number): number | null {
  return kg > 0 ? Math.round(kg * 1000) : null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalcCell({ value }: { value: number | null }) {
  if (value == null || value === 0) return <span className="font-sans text-sm text-muted/40">—</span>
  return <span className="font-sans text-sm font-semibold text-terracota">R$ {fmt(value)}</span>
}

function SelectCell({ value, onChange, items, placeholder = '— Selecionar —', className }: {
  value: string; onChange: (v: string) => void; items: CustoItem[]; placeholder?: string; className?: string
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={className ?? `${selectCls} min-w-[150px]`}>
      <option value="">{placeholder}</option>
      {items.map((i) => <option key={i.nome} value={i.nome}>{i.nome}</option>)}
    </select>
  )
}

function CodigoField({
  value,
  error,
  onChange,
  onCommit,
  className,
  placeholder,
}: {
  value: string
  error?: string
  onChange: (v: string) => void
  onCommit: (prev: string) => void
  className?: string
  placeholder?: string
}) {
  const prevRef = useRef(value)
  return (
    <div className="min-w-0">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { prevRef.current = value }}
        onBlur={() => onCommit(prevRef.current)}
        className={`${className ?? ''} ${error ? '!border-red-400 focus:!border-red-500' : ''}`}
      />
      {error && <p className="font-sans text-[9px] text-red-600 mt-0.5 leading-tight max-w-[200px]">{error}</p>}
    </div>
  )
}

function StatusBadge({ value }: { value: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === value)
  if (!opt) return <span className="font-sans text-xs text-muted/40">—</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${opt.dot}`} />
      <span className="font-sans text-xs text-carvao">{opt.label}</span>
    </span>
  )
}

// ─── Generic description modal ────────────────────────────────────────────────

function DescricaoModal({ titulo, descricaoAtual, onClose, onSave }: {
  titulo?: string; descricaoAtual: string; onClose: () => void; onSave: (texto: string) => void
}) {
  const [texto, setTexto] = useState(descricaoAtual)
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div className="bg-white border border-pedra shadow-2xl p-5 w-[480px] max-h-[90vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted">Descrição</p>
            {titulo && <p className="font-sans text-xs text-carvao mt-0.5">{titulo}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-carvao text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Escreva aqui uma descrição completa…" rows={8}
          className="w-full border border-pedra px-3 py-2.5 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors resize-none" />
        <p className="font-sans text-[10px] text-muted/50 mt-1.5 mb-4">{texto.length} caracteres · Campo opcional</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:border-carvao transition-colors">Cancelar</button>
          <button type="button" onClick={() => { onSave(texto); onClose() }}
            className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors">Salvar descrição</button>
        </div>
      </div>
    </div>
  )
}

// ─── Generic photo modal (used for both peças and conjuntos) ──────────────────

interface FotoModalProps {
  titulo?: string
  fotos: string[]
  fotosNovas: PendingFoto[]
  novaPrincipal: boolean
  onClose: () => void
  onAddFiles: (files: FileList) => void
  onRemoveExisting: (i: number) => void
  onRemoveNew: (i: number) => void
  onSetPrincipal: (i: number, isNew: boolean) => void
  onPreviewPhoto?: (index: number) => void
}

function FotoModal({ titulo, fotos, fotosNovas, novaPrincipal, onClose, onAddFiles, onRemoveExisting, onRemoveNew, onSetPrincipal, onPreviewPhoto }: FotoModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const totalFotos = fotos.length + fotosNovas.length

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div className="bg-white border border-pedra shadow-2xl p-5 w-80 max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted">Fotos</p>
            {titulo && <p className="font-sans text-xs text-carvao mt-0.5">{titulo}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-carvao text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {fotos.map((src, i) => {
            const isPrincipal = i === 0 && !novaPrincipal
            return (
              <div key={`ex-${i}`} className="relative aspect-square bg-areia group/img rounded-sm overflow-hidden">
                <Thumb src={src} alt={`Foto ${i + 1}`} />
                {onPreviewPhoto && (
                  <button
                    type="button"
                    onClick={() => onPreviewPhoto(gridIndexToMergedIndex(i, false, fotos.length, fotosNovas.length, novaPrincipal))}
                    className="absolute inset-0 z-[1] cursor-zoom-in"
                    aria-label={`Ampliar foto ${i + 1}`}
                  />
                )}
                {isPrincipal && <span className="absolute bottom-0 inset-x-0 z-[2] bg-carvao/75 text-cru font-sans text-[8px] text-center py-0.5 leading-tight pointer-events-none">Principal</span>}
                <div className="absolute inset-0 z-[2] bg-black/0 group-hover/img:bg-black/40 transition-colors pointer-events-none" />
                <div className="absolute inset-0 z-[3] flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  {!isPrincipal && <button type="button" onClick={() => onSetPrincipal(i, false)} className="bg-white/90 text-carvao hover:bg-terracota hover:text-cru font-sans text-[9px] px-1.5 py-1">★</button>}
                  <button type="button" onClick={() => onRemoveExisting(i)} className="bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center">×</button>
                </div>
              </div>
            )
          })}
          {fotosNovas.map((f, i) => {
            const isPrincipal = i === 0 && (novaPrincipal || fotos.length === 0)
            return (
              <div key={`new-${i}`} className="relative aspect-square bg-areia group/img rounded-sm overflow-hidden">
                <Thumb src={f.preview} alt={`Nova ${i + 1}`} />
                {onPreviewPhoto && (
                  <button
                    type="button"
                    onClick={() => onPreviewPhoto(gridIndexToMergedIndex(i, true, fotos.length, fotosNovas.length, novaPrincipal))}
                    className="absolute inset-0 z-[1] cursor-zoom-in"
                    aria-label={`Ampliar foto nova ${i + 1}`}
                  />
                )}
                {!isPrincipal && <span className="absolute top-0.5 left-0.5 z-[2] bg-terracota text-cru font-sans text-[7px] px-1 py-0.5 pointer-events-none">Nova</span>}
                {isPrincipal && <span className="absolute bottom-0 inset-x-0 z-[2] bg-carvao/75 text-cru font-sans text-[8px] text-center py-0.5 leading-tight pointer-events-none">Principal</span>}
                <div className="absolute inset-0 z-[2] bg-black/0 group-hover/img:bg-black/40 transition-colors pointer-events-none" />
                <div className="absolute inset-0 z-[3] flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  {!isPrincipal && <button type="button" onClick={() => onSetPrincipal(i, true)} className="bg-white/90 text-carvao hover:bg-terracota hover:text-cru font-sans text-[9px] px-1.5 py-1">★</button>}
                  <button type="button" onClick={() => onRemoveNew(i)} className="bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center">×</button>
                </div>
              </div>
            )
          })}
          <button type="button" onClick={() => inputRef.current?.click()} className="aspect-square bg-areia border-2 border-dashed border-pedra hover:border-terracota flex flex-col items-center justify-center gap-1 group/add rounded-sm">
            <span className="text-2xl text-pedra group-hover/add:text-terracota leading-none">+</span>
            <span className="font-sans text-[8px] text-muted group-hover/add:text-terracota">Adicionar</span>
          </button>
        </div>
        {totalFotos > 0 && <p className="font-sans text-[9px] text-muted">Passe o mouse e clique <strong>★</strong> para definir a principal.</p>}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
          onChange={(e) => { if (e.target.files?.length) { onAddFiles(e.target.files); e.target.value = '' } }} />
      </div>
    </div>
  )
}

// ─── Conjunto modal ───────────────────────────────────────────────────────────

function ConjuntoModal({ row, existingConjuntos, suggestedCodigo, onClose, onCreate, onJoin, onLeave }: {
  row: PecaRow; existingConjuntos: ConjuntoInfo[]
  suggestedCodigo: string
  onClose: () => void
  onCreate: (rowId: string, codigo: string, nome: string) => string | null
  onJoin: (rowId: string, conjuntoId: string) => void
  onLeave: (rowId: string) => void
}) {
  const isInConjunto = !!row.conjunto_id
  const othersAvailable = existingConjuntos.filter((c) => c.id !== row.conjunto_id)
  const [tab, setTab] = useState<'new' | 'existing'>(!isInConjunto && othersAvailable.length > 0 ? 'existing' : 'new')
  const [codigo, setCodigo] = useState(suggestedCodigo)
  const [nome, setNome] = useState('')

  useEffect(() => {
    if (tab === 'new' && suggestedCodigo && !codigo.trim()) {
      setCodigo(suggestedCodigo)
    }
  }, [tab, suggestedCodigo, codigo])
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState(othersAvailable[0]?.id ?? '')
  const mi = 'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota transition-colors bg-white'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40" onMouseDown={onClose}>
      <div className="bg-white border border-pedra shadow-2xl p-5 w-[400px] max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted">Conjunto</p>
            {row.nome && <p className="font-sans text-xs text-carvao mt-0.5">{row.nome}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-carvao text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
        </div>
        {isInConjunto && (
          <div className="mb-4 p-3 bg-cru border border-terracota/30">
            <p className="font-sans text-[9px] tracking-widest uppercase text-terracota mb-1">Conjunto atual</p>
            <p className="font-mono text-sm font-bold text-carvao">{row.conjunto_codigo || '—'}</p>
            {row.conjunto_nome && <p className="font-sans text-xs text-muted mt-0.5">{row.conjunto_nome}</p>}
            <button type="button" onClick={() => { onLeave(row.id); onClose() }}
              className="mt-2.5 font-sans text-[10px] text-red-500 hover:text-red-700 underline underline-offset-2">
              Remover deste conjunto
            </button>
          </div>
        )}
        {(!isInConjunto || othersAvailable.length > 0) && (
          <>
            {isInConjunto && <p className="font-sans text-[10px] text-muted mb-2 uppercase tracking-widest">Mover para outro conjunto</p>}
            {(isInConjunto ? othersAvailable : existingConjuntos).length > 0 && (
              <div className="flex border border-pedra mb-4">
                <button type="button" onClick={() => setTab('existing')}
                  className={`flex-1 font-sans text-xs py-2 transition-colors ${tab === 'existing' ? 'bg-carvao text-cru' : 'bg-white text-carvao hover:bg-areia'}`}>
                  Adicionar a existente
                </button>
                <button type="button" onClick={() => setTab('new')}
                  className={`flex-1 font-sans text-xs py-2 transition-colors ${tab === 'new' ? 'bg-carvao text-cru' : 'bg-white text-carvao hover:bg-areia'}`}>
                  Criar novo
                </button>
              </div>
            )}
            {tab === 'existing' && othersAvailable.length > 0 && (
              <div className="space-y-3">
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={`${selectCls} w-full`}>
                  {othersAvailable.map((c) => <option key={c.id} value={c.id}>{c.codigo}{c.nome ? ` — ${c.nome}` : ''}</option>)}
                </select>
                <button type="button" onClick={() => { onJoin(row.id, selectedId); onClose() }}
                  className="w-full font-sans text-xs bg-carvao text-cru px-4 py-2 hover:bg-carvao/85 transition-colors">
                  {isInConjunto ? 'Mover para este conjunto' : 'Adicionar a este conjunto'}
                </button>
              </div>
            )}
            {tab === 'new' && (
              <div className="space-y-3">
                <div>
                  <label className="font-sans text-[9px] tracking-widest uppercase text-muted block mb-1">Código do conjunto *</label>
                  <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: C3" className={`${mi} font-mono`} autoFocus />
                </div>
                <div>
                  <label className="font-sans text-[9px] tracking-widest uppercase text-muted block mb-1">Nome (opcional)</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Jogo de chá branco" className={mi} />
                </div>
                {createError && <p className="font-sans text-xs text-red-600">{createError}</p>}
                <button type="button" disabled={!codigo.trim()} onClick={() => {
                  const err = onCreate(row.id, codigo.trim(), nome.trim())
                  if (err) { setCreateError(err); return }
                  onClose()
                }}
                  className="w-full font-sans text-xs bg-carvao text-cru px-4 py-2 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {isInConjunto ? 'Criar e mover para novo conjunto' : 'Criar conjunto e adicionar peça'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal de detalhes / custos da peça ───────────────────────────────────────

function ModalSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-[10px] tracking-widest uppercase text-carvao font-semibold mb-3 pb-2 border-b border-pedra/50">
      {children}
    </p>
  )
}

function ModalValor({ value }: { value: number | null }) {
  return (
    <div className="flex items-center justify-end min-w-[96px] shrink-0 text-right">
      <CalcCell value={value} />
    </div>
  )
}

function ModalCostRow({ label, value, children }: { label: string; value: number | null; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_96px] gap-4 items-center py-2.5 border-b border-pedra/25 last:border-0">
      <div className="min-w-0">
        <label className="font-sans text-[9px] tracking-widest uppercase text-muted block mb-1.5">{label}</label>
        {children}
      </div>
      <ModalValor value={value} />
    </div>
  )
}

function pinturaCalcHint(
  area: number,
  qtd: number,
  unit: 'gr' | 'ml',
  relacao: number,
  relLabel: string,
): string {
  if (area <= 0) return `Informe a área pintura (${relLabel})`
  if (relacao <= 0) return `Configure ${relLabel} na tabela de custos`
  if (qtd <= 0) return ''
  return `${qtd.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unit} = ${area.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} m² × ${relacao.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}`
}

function PinturaAplicavelSelect({
  aplicavel,
  onChange,
  hint,
}: {
  aplicavel: boolean
  onChange: (sim: boolean) => void
  hint?: string
}) {
  return (
    <div>
      <select
        value={aplicavel ? 'sim' : 'nao'}
        onChange={(e) => onChange(e.target.value === 'sim')}
        className={MODAL_SEL_FULL}
      >
        <option value="nao">Não</option>
        <option value="sim">Sim</option>
      </select>
      {hint && aplicavel && (
        <p className="font-sans text-[9px] text-muted/70 mt-1">{hint}</p>
      )}
    </div>
  )
}

interface MaterialCostLine {
  label: string
  unitText: string
  total: number
}

function buildMaterialCostLines(
  piece: PecaRow,
  costs: Pick<RowCosts, 'valEmb' | 'valArg' | 'valEsmalte' | 'valEngobe' | 'valTinta' | 'valBisc' | 'valQueima'>,
  embalagemItems: CustoItem[],
  argilaItems: CustoItem[],
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
  biscoitoItems: CustoItem[],
  queimaAltaItems: CustoItem[],
): MaterialCostLine[] {
  const lines: MaterialCostLine[] = []

  if (piece.tipo_embalagem) {
    const embSel = embalagemItems.find((e) => e.nome === piece.tipo_embalagem)
    if (embSel) {
      lines.push({
        label: 'Embalagem',
        unitText: `R$ ${fmt(embSel.valor)}/un`,
        total: costs.valEmb ?? 0,
      })
    }
  }

  if (piece.tipo_argila) {
    const argSel = argilaItems.find((a) => a.nome === piece.tipo_argila)
    const qnt = nv(piece.qnt_argila_kg)
    if (argSel && qnt > 0) {
      lines.push({
        label: 'Argila',
        unitText: `R$ ${fmt(argSel.valor)}/kg × ${qnt.toLocaleString('pt-BR', { maximumFractionDigits: 3 })} kg`,
        total: costs.valArg ?? 0,
      })
    }
  }

  const qntEsm = calcEsmalteQtdGr(piece, esmalteItems)
  if (piece.esmalte_aplicavel && qntEsm > 0 && esmalteItems[0]) {
    lines.push({
      label: 'Esmalte',
      unitText: `R$ ${fmt(esmalteItems[0].valor)}/gr × ${qntEsm.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} gr`,
      total: costs.valEsmalte ?? 0,
    })
  }

  const qntEng = calcEngobeQtdGr(piece, engobeItems)
  if (piece.engobe_aplicavel && qntEng > 0 && engobeItems[0]) {
    lines.push({
      label: 'Engobe',
      unitText: `R$ ${fmt(engobeItems[0].valor)}/gr × ${qntEng.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} gr`,
      total: costs.valEngobe ?? 0,
    })
  }

  const qntTin = calcTintaQtdMl(piece, tintaItems)
  if (piece.tinta_aplicavel && qntTin > 0 && tintaItems[0]) {
    lines.push({
      label: 'Tinta',
      unitText: `R$ ${fmt(tintaItems[0].valor)}/ml × ${qntTin.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ml`,
      total: costs.valTinta ?? 0,
    })
  }

  if (piece.tipo_biscoito) {
    const biscSel = biscoitoItems.find((b) => b.nome === piece.tipo_biscoito)
    if (biscSel) {
      lines.push({
        label: 'Primeira queima (biscoito)',
        unitText: `R$ ${fmt(biscSel.valor)}/queima`,
        total: costs.valBisc ?? 0,
      })
    }
  }

  if (piece.tipo_queima) {
    const queimaSel = queimaAltaItems.find((q) => q.nome === piece.tipo_queima)
    if (queimaSel) {
      lines.push({
        label: 'Segunda queima (alta ou baixa)',
        unitText: `R$ ${fmt(queimaSel.valor)}/queima`,
        total: costs.valQueima ?? 0,
      })
    }
  }

  return lines
}

type ConjuntoCostTotals = ReturnType<typeof calcConjuntoTotals>

function formatPieceCostPart(value: number): string {
  if (value === 0) return '0'
  return Number.isInteger(value) ? String(value) : fmt(value)
}

function formatConjuntoCostUnitDetail(
  pieces: PecaRow[],
  quantidadeByPecaId: Map<string, number>,
  unitValueForPiece: (piece: PecaRow, index: number) => number,
): string {
  const parts: string[] = []
  pieces.forEach((piece, index) => {
    const qty = quantidadeByPecaId.get(piece.id) ?? 1
    const unit = unitValueForPiece(piece, index)
    if (unit <= 0) return
    const unitLabel = formatPieceCostPart(unit)
    parts.push(qty > 1 ? `${unitLabel} × ${qty} un.` : unitLabel)
  })
  return parts.length > 0 ? parts.join(' + ') : '—'
}

function buildConjuntoAggregatedMaterialLines(
  pieces: PecaRow[],
  quantidadeByPecaId: Map<string, number>,
  totals: ConjuntoCostTotals,
  custoHoraMO: number,
  custoHoraFixo: number,
  embalagemItems: CustoItem[],
  argilaItems: CustoItem[],
  esmalteItems: CustoItem[],
  engobeItems: CustoItem[],
  tintaItems: CustoItem[],
  biscoitoItems: CustoItem[],
  queimaAltaItems: CustoItem[],
): MaterialCostLine[] {
  const lines: MaterialCostLine[] = []
  const pieceCosts = pieces.map((p) =>
    calcRowCosts(p, custoHoraMO, custoHoraFixo, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems),
  )
  const unitDetail = (getter: (cost: ReturnType<typeof calcRowCosts>) => number) =>
    formatConjuntoCostUnitDetail(pieces, quantidadeByPecaId, (piece, index) => getter(pieceCosts[index]))

  if (totals.valEmb > 0) {
    lines.push({
      label: 'Embalagem',
      unitText: unitDetail((c) => c.valEmb ?? 0),
      total: totals.valEmb,
    })
  }

  if (totals.valArg > 0) {
    lines.push({
      label: 'Argila',
      unitText: unitDetail((c) => c.valArg ?? 0),
      total: totals.valArg,
    })
  }

  if (totals.valEsmalte > 0) {
    lines.push({
      label: 'Esmalte',
      unitText: unitDetail((c) => c.valEsmalte ?? 0),
      total: totals.valEsmalte,
    })
  }

  if (totals.valEngobe > 0) {
    lines.push({
      label: 'Engobe',
      unitText: unitDetail((c) => c.valEngobe ?? 0),
      total: totals.valEngobe,
    })
  }

  if (totals.valTinta > 0) {
    lines.push({
      label: 'Tinta',
      unitText: unitDetail((c) => c.valTinta ?? 0),
      total: totals.valTinta,
    })
  }

  if (totals.valBisc > 0) {
    lines.push({
      label: 'Primeira queima (biscoito)',
      unitText: unitDetail((c) => c.valBisc ?? 0),
      total: totals.valBisc,
    })
  }

  if (totals.valQueima > 0) {
    lines.push({
      label: 'Segunda queima (alta ou baixa)',
      unitText: unitDetail((c) => c.valQueima ?? 0),
      total: totals.valQueima,
    })
  }

  return lines
}

function ConjuntoCustosResumo({
  pieces,
  quantidadeByPecaId,
  totals,
  custoHoraMO,
  custoHoraFixo,
  embalagemItems,
  argilaItems,
  esmalteItems,
  engobeItems,
  tintaItems,
  biscoitoItems,
  queimaAltaItems,
}: {
  pieces: PecaRow[]
  quantidadeByPecaId: Map<string, number>
  totals: ConjuntoCostTotals
  custoHoraMO: number
  custoHoraFixo: number
  embalagemItems: CustoItem[]
  argilaItems: CustoItem[]
  esmalteItems: CustoItem[]
  engobeItems: CustoItem[]
  tintaItems: CustoItem[]
  biscoitoItems: CustoItem[]
  queimaAltaItems: CustoItem[]
}) {
  const pieceCosts = pieces.map((p) =>
    calcRowCosts(p, custoHoraMO, custoHoraFixo, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems),
  )
  const materialLines = buildConjuntoAggregatedMaterialLines(
    pieces, quantidadeByPecaId, totals, custoHoraMO, custoHoraFixo,
    embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
  )
  const maoDeObraDetail = formatConjuntoCostUnitDetail(
    pieces, quantidadeByPecaId, (_piece, index) => pieceCosts[index]?.maoDeObra ?? 0,
  )
  const rateioDetail = formatConjuntoCostUnitDetail(
    pieces, quantidadeByPecaId, (_piece, index) => pieceCosts[index]?.rateio ?? 0,
  )
  const custoExtraDetail = formatConjuntoCostUnitDetail(
    pieces, quantidadeByPecaId, (piece) => nv(piece.custo_extra),
  )

  return (
    <div className="rounded-sm border border-pedra/40 px-4 py-3 space-y-3">
      <div>
        <p className="font-sans text-[9px] tracking-widest uppercase text-muted mb-2">
          Materiais (soma das peças · unitário × quantidade)
        </p>
        <ModalMateriaisResumo lines={materialLines} />
      </div>
      <div className="border-t border-pedra/25 pt-2 space-y-0">
        <ConjuntoCustoSummaryRow label="Mão de obra" total={totals.maoDeObra} unitDetail={maoDeObraDetail} />
        <ConjuntoCustoSummaryRow label="Rateio custo fixo" total={totals.rateio} unitDetail={rateioDetail} />
        <ConjuntoCustoSummaryRow label="Custo extra" total={totals.custoExtra} unitDetail={custoExtraDetail} />
        <ConjuntoCustoSummaryRow label="Custo total" total={totals.totalCusto} bold />
      </div>
    </div>
  )
}

function ConjuntoCustoSummaryRow({
  label,
  total,
  unitDetail,
  bold = false,
}: {
  label: string
  total: number
  unitDetail?: string
  bold?: boolean
}) {
  return (
    <div className={`grid grid-cols-[1fr_96px] gap-4 items-center py-2.5 ${bold ? '' : 'border-b border-pedra/25'}`}>
      <div>
        <span className={`font-sans text-sm ${bold ? 'font-semibold' : ''} text-carvao`}>{label}</span>
        {unitDetail && unitDetail !== '—' && (
          <p className="font-sans text-[10px] text-muted/70 mt-0.5">{unitDetail}</p>
        )}
      </div>
      <ModalValor value={total > 0 ? total : null} />
    </div>
  )
}

function ModalMateriaisResumo({ lines }: { lines: MaterialCostLine[] }) {
  const total = lines.reduce((sum, l) => sum + l.total, 0)
  if (lines.length === 0) {
    return (
      <p className="font-sans text-xs text-muted/50 py-2 italic">Nenhum material selecionado acima.</p>
    )
  }
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr_88px] gap-2 pb-1 border-b border-pedra/30">
        <span className="font-sans text-[8px] tracking-widest uppercase text-muted">Material</span>
        <span className="font-sans text-[8px] tracking-widest uppercase text-muted">Unitário</span>
        <span className="font-sans text-[8px] tracking-widest uppercase text-muted text-right">Total</span>
      </div>
      {lines.map((line) => (
        <div key={line.label} className="grid grid-cols-[1fr_1fr_88px] gap-2 items-center py-1">
          <span className="font-sans text-xs text-carvao">{line.label}</span>
          <span className="font-sans text-[10px] text-muted tabular-nums">{line.unitText}</span>
          <span className="font-sans text-xs font-semibold text-terracota tabular-nums text-right">
            {line.total > 0 ? `R$ ${fmt(line.total)}` : '—'}
          </span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_88px] gap-2 items-center pt-2 mt-1 border-t border-pedra/30">
        <span className="font-sans text-xs font-semibold text-carvao">Total materiais</span>
        <span className="font-sans text-sm font-bold text-terracota tabular-nums text-right">
          {total > 0 ? `R$ ${fmt(total)}` : '—'}
        </span>
      </div>
    </div>
  )
}

function ModalToggle({ checked, onChange, activeClass }: { checked: boolean; onChange: () => void; activeClass: string }) {
  return (
    <button type="button" onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? activeClass : 'bg-pedra/50'}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  )
}

function ExibirNoSitePromptModal({
  titulo,
  onSim,
  onNao,
}: {
  titulo: string
  onSim: () => void
  onNao: () => void
}) {
  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white border border-pedra shadow-2xl w-full max-w-md p-6">
        <h2 className="font-serif text-xl text-carvao mb-2">Publicar no site?</h2>
        <p className="font-sans text-sm text-carvao/80 mb-6">{titulo}</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onNao}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors">
            Não, manter interno
          </button>
          <button type="button" onClick={onSim}
            className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors">
            Sim, exibir no site
          </button>
        </div>
      </div>
    </div>
  )
}

type BulkDeletionPlan = {
  conjuntoIds: string[]
  pecaIds: string[]
  pecaCount: number
  conjuntoCount: number
}

function buildBulkDeletionPlan(
  selectedKeys: Set<string>,
  displayItems: DisplayItem[],
  rows: PecaRow[],
  links: ConjuntoPecaLink[],
): BulkDeletionPlan {
  const conjuntoIds: string[] = []
  for (const key of selectedKeys) {
    if (key.startsWith('conjunto:')) conjuntoIds.push(key.slice('conjunto:'.length))
  }
  const conjuntoIdSet = new Set(conjuntoIds)
  const pecaIds: string[] = []
  for (const item of displayItems) {
    if (item.type !== 'row') continue
    const key = displayItemKey(item)
    if (!selectedKeys.has(key)) continue
    const activeConjuntoId = item.displayConjuntoId ?? item.row.conjunto_id
    if (activeConjuntoId && conjuntoIdSet.has(activeConjuntoId)) continue
    pecaIds.push(item.row.id)
  }
  let pecaCount = pecaIds.length
  for (const conjuntoId of conjuntoIds) {
    pecaCount += getConjuntoPiecesFromRows(rows, conjuntoId, links).length
  }
  return { conjuntoIds, pecaIds, pecaCount, conjuntoCount: conjuntoIds.length }
}

function BulkDeleteConfirmModal({
  plan,
  deleting,
  onConfirm,
  onCancel,
}: {
  plan: BulkDeletionPlan
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const parts: string[] = []
  if (plan.conjuntoCount > 0) {
    parts.push(`${plan.conjuntoCount} conjunto(s) com todas as peças`)
  }
  const avulsas = plan.pecaIds.length
  if (avulsas > 0) {
    parts.push(`${avulsas} peça(s) avulsa(s) ou individual(es)`)
  }
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4" onMouseDown={onCancel}>
      <div className="bg-white border border-pedra shadow-2xl w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl text-carvao mb-2">Excluir selecionados</h2>
        <p className="font-sans text-sm text-carvao/80 mb-3">
          Esta ação não pode ser desfeita. Serão removidos <strong>{plan.pecaCount} peça(s)</strong>
          {plan.conjuntoCount > 0 ? ` e ${plan.conjuntoCount} conjunto(s)` : ''}:
        </p>
        <ul className="font-sans text-sm text-carvao mb-5 list-disc pl-5 space-y-1">
          {parts.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel} disabled={deleting}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={deleting}
            className="font-sans text-xs bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors disabled:opacity-50">
            {deleting ? 'Excluindo…' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PublicationWarningModal({
  missingFields,
  onAdjust,
  onProceed,
  onCancel,
}: {
  missingFields: PublicationFieldKey[]
  onAdjust: () => void
  onProceed: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4" onMouseDown={onCancel}>
      <div className="bg-white border border-pedra shadow-2xl w-full max-w-md p-6" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl text-carvao mb-2">Informações incompletas</h2>
        <p className="font-sans text-sm text-carvao/80 mb-3">
          Para exibir no site, os campos principais devem estar cadastrados. Os seguintes campos não foram preenchidos:
        </p>
        <ul className="font-sans text-sm text-carvao mb-4 list-disc pl-5 space-y-1">
          {missingFields.map((field) => <li key={field}>{PUBLICATION_FIELD_LABELS[field]}</li>)}
        </ul>
        <p className="font-sans text-sm text-muted mb-5">Deseja ajustar o cadastro antes de publicar?</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onCancel}
            className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={onProceed}
            className="font-sans text-xs text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors">
            Seguir assim mesmo
          </button>
          <button type="button" onClick={onAdjust}
            className="font-sans text-xs bg-carvao text-cru px-4 py-2 hover:bg-carvao/85 transition-colors">
            Sim, ajustar
          </button>
        </div>
      </div>
    </div>
  )
}

function DestaqueToggle({
  active,
  visible,
  onToggle,
  size = 'sm',
}: {
  active: boolean
  visible: boolean
  onToggle: () => void
  size?: 'sm' | 'md'
}) {
  if (!visible) return <span className="font-sans text-[10px] text-muted/30 select-none">—</span>
  const h = size === 'md' ? 'h-5 w-9' : 'h-4 w-7'
  const knob = size === 'md' ? 'h-4 w-4 translate-x-4' : 'h-3 w-3 translate-x-3'
  const knobOff = size === 'md' ? 'h-4 w-4 translate-x-0' : 'h-3 w-3 translate-x-0'
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={onToggle} title="Peças do momento"
        className={`relative inline-flex ${h} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${active ? 'bg-amber-500' : 'bg-pedra/50'}`}>
        <span className={`pointer-events-none inline-block rounded-full bg-white shadow transform transition-transform ${active ? knob : knobOff}`} />
      </button>
      {active && <span className="font-sans text-[8px] text-amber-600 tracking-wide uppercase">Destaque</span>}
    </div>
  )
}

const MODAL_INP = 'w-full border border-pedra px-3 py-2 font-sans text-sm text-carvao focus:outline-none focus:border-terracota bg-white'
const MODAL_INP_NUM = `${MODAL_INP} text-right tabular-nums`
const MODAL_SEL_FULL = `${selectCls} w-full`
const MODAL_LBL = 'font-sans text-[9px] tracking-widest uppercase text-muted block mb-1.5'

function PecaModalPieceFields({
  piece, index, inConjunto, canRemove, highlighted, statusValue, codigoError, highlightPublicationFields, quantidade = 1, onQuantidadeChange, onUpdate, onCategoriaChange, onCodigoChange, onCodigoCommit, onStatusChange, onOpenFotos, onPreviewFoto, onAddFotos, onRemove,
  margemVendaConfig,
  custoHoraFixo, custoHoraMO,
  embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
}: {
  piece: PecaRow
  index: number
  inConjunto: boolean
  canRemove: boolean
  highlighted?: boolean
  statusValue?: string
  codigoError?: string
  highlightPublicationFields?: PublicationFieldKey[]
  quantidade?: number
  onQuantidadeChange?: (quantidade: number) => void
  onUpdate: (changes: Partial<PecaRow>) => void
  onCategoriaChange?: (categoria: string) => void
  onCodigoChange: (value: string) => void
  onCodigoCommit: (prev: string) => void
  onStatusChange: (status: string) => void
  onOpenFotos: () => void
  onPreviewFoto: () => void
  onAddFotos: (files: FileList) => void
  onRemove?: () => void
  margemVendaConfig: number
  custoHoraFixo: number
  custoHoraMO: number
  embalagemItems: CustoItem[]
  argilaItems: CustoItem[]
  esmalteItems: CustoItem[]
  engobeItems: CustoItem[]
  tintaItems: CustoItem[]
  biscoitoItems: CustoItem[]
  queimaAltaItems: CustoItem[]
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const costs = calcRowCosts(piece, custoHoraMO, custoHoraFixo, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems)
  const { custoTotal, maoDeObra, rateio, valEmb, valArg, valEsmalte, valEngobe, valTinta, valBisc, valQueima } = costs
  const pricing = buildPecaPricing(piece, custoTotal, margemVendaConfig)
  const materialLines = buildMaterialCostLines(
    piece, costs, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
  )

  const principalSrc = (piece.novaPrincipal && piece.fotosNovas.length > 0)
    ? piece.fotosNovas[0].preview
    : (piece.fotos[0] ?? piece.fotosNovas[0]?.preview ?? null)
  const totalFotos = piece.fotos.length + piece.fotosNovas.length
  const precoPraticadoIsAuto = piece.preco_praticado === '' && pricing.precoSugerido > 0
  const precoPraticadoDisplay = precoPraticadoIsAuto ? pricing.precoSugerido.toFixed(2) : piece.preco_praticado
  const areaPintura = nv(piece.area_pintura)

  function handlePinturaUpdate(changes: Partial<PecaRow>) {
    const merged = { ...piece, ...changes }
    onUpdate({
      ...changes,
      ...syncPinturaQuantities(merged, esmalteItems, engobeItems, tintaItems),
    })
  }

  return (
    <section
      id={inConjunto ? `modal-piece-${piece.id}` : undefined}
      className={`p-4 border bg-white rounded-sm space-y-5 transition-all duration-500 ${
        highlighted
          ? 'border-terracota ring-2 ring-terracota/40 shadow-md'
          : 'border-pedra/50'
      }`}
    >
      {highlighted && (
        <p className="font-sans text-xs text-terracota bg-terracota/10 border border-terracota/25 px-3 py-2 rounded-sm">
          Nova peça — selecione a categoria para gerar o código, depois preencha nome, medidas e materiais.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <ModalSectionTitle>Peça {index + 1}</ModalSectionTitle>
        {canRemove && onRemove && (
          <button type="button" onClick={onRemove}
            className="font-sans text-[10px] text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 hover:border-red-400 transition-colors shrink-0">
            Remover
          </button>
        )}
      </div>

      <div className="flex gap-5">
        <div
          id={!inConjunto ? 'modal-field-peca-foto' : undefined}
          className={`shrink-0 p-1 -m-1 ${!inConjunto && highlightPublicationFields?.includes('foto') ? pubFieldHighlightCls(true) : ''}`}
        >
          <label className={MODAL_LBL}>Foto</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                onAddFotos(e.target.files)
                e.target.value = ''
                onOpenFotos()
              }
            }} />
          <button type="button" onClick={() => { if (totalFotos > 0) onPreviewFoto(); else fileRef.current?.click() }}
            title={totalFotos > 0 ? 'Ver foto ampliada' : 'Adicionar foto'}
            className={`relative w-[72px] h-[72px] overflow-hidden flex items-center justify-center shrink-0 border transition-colors cursor-zoom-in ${
              inConjunto ? 'bg-white border-pedra/50 hover:border-terracota/50' : 'bg-areia border-pedra hover:border-terracota'
            }`}>
            {principalSrc ? (
              <Thumb src={principalSrc} alt="Foto da peça" className={inConjunto ? 'opacity-80 saturate-75' : ''} />
            ) : (
              <svg className="w-6 h-6 text-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {totalFotos > 1 && (
              <span className="absolute top-0.5 right-0.5 bg-carvao/75 text-cru font-sans text-[8px] w-4 h-4 flex items-center justify-center">{totalFotos}</span>
            )}
          </button>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3">
          {!inConjunto && onCategoriaChange && (
            <div>
              <label className={MODAL_LBL}>Categoria</label>
              <select
                value={piece.categoria}
                onChange={(e) => onCategoriaChange(e.target.value)}
                className={MODAL_SEL_FULL}
              >
                <option value="">— Selecionar —</option>
                {CATEGORIAS_PECA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={MODAL_LBL}>Código</label>
            <CodigoField
              value={piece.codigo}
              error={codigoError}
              placeholder="Ex: U1, D2, UD3, C4"
              className={`${MODAL_INP} font-mono`}
              onChange={onCodigoChange}
              onCommit={onCodigoCommit}
            />
          </div>
          <div
            id={!inConjunto ? 'modal-field-nome' : undefined}
            className={`${!inConjunto && onCategoriaChange ? 'col-span-2' : ''} p-1 -m-1 ${!inConjunto && highlightPublicationFields?.includes('nome') ? pubFieldHighlightCls(true) : ''}`}
          >
            <label className={MODAL_LBL}>Nome</label>
            <input type="text" value={piece.nome} onChange={(e) => onUpdate({ nome: e.target.value })} placeholder="Nome da peça" className={MODAL_INP} />
          </div>
          {inConjunto && onQuantidadeChange && (
            <div>
              <label className={MODAL_LBL}>Quantidade no conjunto</label>
              <input
                type="number"
                min={1}
                step={1}
                value={quantidade}
                onChange={(e) => onQuantidadeChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className={MODAL_INP_NUM}
              />
              <p className="font-sans text-[9px] text-muted/60 mt-1">
                Unidades desta peça neste conjunto. O custo e preço do conjunto multiplicam por esta quantidade.
              </p>
            </div>
          )}
          {inConjunto && (
            <div className="col-span-2">
              <label className={MODAL_LBL}>Status da peça</label>
              <select value={statusValue ?? piece.status} onChange={(e) => onStatusChange(e.target.value)} className={MODAL_SEL_FULL}>
                <option value="">— Selecionar —</option>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <p className="font-sans text-[9px] text-muted/60 mt-1">Inicialmente igual ao conjunto; altere se a peça foi vendida separadamente.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-carvao font-semibold mb-3 pb-2 border-b border-pedra/50">Medidas & horas</p>
        <div className="grid grid-cols-2 gap-4">
          <div
            id={`modal-field-dimensao-${piece.id}`}
            className={`p-1 -m-1 ${highlightPublicationFields?.includes('dimensao') ? pubFieldHighlightCls(true) : ''}`}
          >
            <label className={MODAL_LBL}>Dimensões</label>
            <input type="text" value={piece.dimensoes} onChange={(e) => onUpdate({ dimensoes: e.target.value })} placeholder="Ex: 15×10 cm" className={MODAL_INP} />
          </div>
          <div>
            <label className={MODAL_LBL}>Área pintura (m²)</label>
            <input type="number" min="0" step="0.0001" value={piece.area_pintura}
              onChange={(e) => handlePinturaUpdate({ area_pintura: e.target.value })} placeholder="0" className={MODAL_INP_NUM} />
          </div>
          <div>
            <label className={MODAL_LBL}>Horas trabalhadas</label>
            <input type="number" min="0" step="0.01" value={piece.execucao_h} onChange={(e) => onUpdate({ execucao_h: e.target.value })} placeholder="0" className={MODAL_INP_NUM} />
          </div>
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-carvao font-semibold mb-3 pb-2 border-b border-pedra/50">Materiais</p>
        <div className="rounded-sm border border-pedra/40 px-4 py-1">
          <ModalCostRow label="Embalagem" value={valEmb}>
            <SelectCell value={piece.tipo_embalagem} onChange={(v) => onUpdate({ tipo_embalagem: v })} items={embalagemItems} className={MODAL_SEL_FULL} />
          </ModalCostRow>
          <div className="grid grid-cols-[1fr_96px] gap-4 items-end py-2.5 border-b border-pedra/25">
            <div className="grid grid-cols-[minmax(220px,1fr)_96px] gap-3 items-end">
              <div>
                <label className={MODAL_LBL}>Tipo argila</label>
                <SelectCell value={piece.tipo_argila} onChange={(v) => onUpdate({ tipo_argila: v })} items={argilaItems} className={`${selectCls} w-full min-w-[220px]`} />
              </div>
              <div
                id={`modal-field-peso-${piece.id}`}
                className={`p-1 -m-1 ${highlightPublicationFields?.includes('peso') ? pubFieldHighlightCls(true) : ''}`}
              >
                <label className={MODAL_LBL}>Peso argila (kg)</label>
                <input type="number" min="0" step="0.001" value={piece.qnt_argila_kg}
                  onChange={(e) => onUpdate({ qnt_argila_kg: e.target.value })} placeholder="0" className={`${MODAL_INP_NUM} w-full py-2`} />
              </div>
            </div>
            <ModalValor value={valArg} />
          </div>
          <ModalCostRow label="Esmalte — aplicável" value={valEsmalte}>
            <PinturaAplicavelSelect
              aplicavel={piece.esmalte_aplicavel}
              onChange={(sim) => handlePinturaUpdate({ esmalte_aplicavel: sim })}
              hint={pinturaCalcHint(areaPintura, calcEsmalteQtdGr(piece, esmalteItems), 'gr', getRelacaoGrM2(esmalteItems), 'Relação gr/m²')}
            />
          </ModalCostRow>
          <ModalCostRow label="Engobe — aplicável" value={valEngobe}>
            <PinturaAplicavelSelect
              aplicavel={piece.engobe_aplicavel}
              onChange={(sim) => handlePinturaUpdate({ engobe_aplicavel: sim })}
              hint={pinturaCalcHint(areaPintura, calcEngobeQtdGr(piece, engobeItems), 'gr', getRelacaoGrM2(engobeItems), 'Relação gr/m²')}
            />
          </ModalCostRow>
          <ModalCostRow label="Tinta — aplicável" value={valTinta}>
            <PinturaAplicavelSelect
              aplicavel={piece.tinta_aplicavel}
              onChange={(sim) => handlePinturaUpdate({ tinta_aplicavel: sim })}
              hint={pinturaCalcHint(areaPintura, calcTintaQtdMl(piece, tintaItems), 'ml', getRelacaoMlM2(tintaItems), 'Relação ml/m²')}
            />
          </ModalCostRow>
        </div>
      </div>

      <div>
        <p className="font-sans text-[10px] tracking-widest uppercase text-carvao font-semibold mb-3 pb-2 border-b border-pedra/50">Queimas</p>
        <div className="rounded-sm border border-pedra/40 px-4 py-1">
          <ModalCostRow label="Primeira queima (biscoito)" value={valBisc}>
            <SelectCell value={piece.tipo_biscoito} onChange={(v) => onUpdate({ tipo_biscoito: v })} items={biscoitoItems} className={MODAL_SEL_FULL} />
          </ModalCostRow>
          <ModalCostRow label="Segunda queima (alta ou baixa)" value={valQueima}>
            <SelectCell value={piece.tipo_queima} onChange={(v) => onUpdate({ tipo_queima: v })} items={queimaAltaItems} className={MODAL_SEL_FULL} />
          </ModalCostRow>
        </div>
      </div>

      {inConjunto && (
        <div>
          <label className={MODAL_LBL}>Custo extra desta peça (R$)</label>
          <input type="number" min="0" step="0.01" value={piece.custo_extra} onChange={(e) => onUpdate({ custo_extra: e.target.value })} placeholder="0" className={MODAL_INP_NUM} />
          {quantidade > 1 && custoTotal > 0 && (
            <p className="font-sans text-[9px] text-muted/70 mt-1.5 text-right tabular-nums">
              No conjunto: {quantidade} un. × R$ {fmt(custoTotal)} = R$ {fmt(custoTotal * quantidade)}
            </p>
          )}
        </div>
      )}

      {!inConjunto && (
        <div id="modal-field-preco" className={`p-1 -m-1 ${highlightPublicationFields?.includes('preco') ? pubFieldHighlightCls(true) : ''}`}>
        <p className="font-sans text-[10px] tracking-widest uppercase text-carvao font-semibold mb-3 pb-2 border-b border-pedra/50">Custos da peça</p>
        <div className="rounded-sm border border-pedra/40 px-4 py-3 mb-3 space-y-3">
          <div>
            <p className="font-sans text-[9px] tracking-widest uppercase text-muted mb-2">Materiais</p>
            <ModalMateriaisResumo lines={materialLines} />
          </div>
          <div className="border-t border-pedra/25 pt-2 space-y-0">
            <div className="grid grid-cols-[1fr_96px] gap-4 items-center py-2.5 border-b border-pedra/25">
              <span className="font-sans text-sm text-carvao">Mão de obra</span>
              <ModalValor value={maoDeObra} />
            </div>
            <div className="grid grid-cols-[1fr_96px] gap-4 items-center py-2.5 border-b border-pedra/25">
              <span className="font-sans text-sm text-carvao">Rateio custo fixo</span>
              <ModalValor value={rateio} />
            </div>
            <ModalCostRow label="Custo extra (R$)" value={null}>
              <input type="number" min="0" step="0.01" value={piece.custo_extra} onChange={(e) => onUpdate({ custo_extra: e.target.value })} placeholder="0" className={MODAL_INP_NUM} />
            </ModalCostRow>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-2 gap-4 p-3 bg-areia/40 border border-pedra/30">
            <div>
              <label className={MODAL_LBL}>Custo total</label>
              <div className="flex justify-end py-1">
                {pricing.custoTotal > 0
                  ? <span className="font-sans text-sm font-bold text-carvao tabular-nums">R$ {fmt(pricing.custoTotal)}</span>
                  : <span className="font-sans text-sm text-muted/40">—</span>}
              </div>
            </div>
            <div>
              <label className={MODAL_LBL}>Margem de venda (%)</label>
              <div className="flex justify-end py-1">
                <span className="font-sans text-sm font-semibold text-carvao tabular-nums">{fmt(margemVendaConfig)}%</span>
              </div>
              <p className="font-sans text-[9px] text-muted/60 mt-0.5">Definida em Custos & Precificação</p>
            </div>
            <div>
              <label className={MODAL_LBL}>Preço sugerido</label>
              <div className="flex justify-end py-1">
                {pricing.precoSugerido > 0
                  ? <span className="font-sans text-sm font-bold text-terracota tabular-nums">R$ {fmt(pricing.precoSugerido)}</span>
                  : <span className="font-sans text-sm text-muted/40">—</span>}
              </div>
              <p className="font-sans text-[9px] text-muted/60 mt-0.5">Custo ÷ (1 − margem) · exibido no site</p>
            </div>
            <div>
              <label className={MODAL_LBL}>Preço praticado</label>
              <input type="number" min="0" step="0.01" value={precoPraticadoDisplay}
                onChange={(e) => onUpdate({ preco_praticado: e.target.value })}
                placeholder="0"
                title={precoPraticadoIsAuto ? 'Preenchido automaticamente com o preço sugerido' : undefined}
                className={`${MODAL_INP_NUM} ${precoPraticadoIsAuto ? 'text-muted/50' : ''}`} />
            </div>
          </div>
        </div>
        </div>
      )}
    </section>
  )
}

function PecaDetalhesModal({
  row, allRows, conjuntoLinks, activeConjuntoId, onClose, onUpdatePiece, onStatusChangePiece, onConjuntoClick,
  onOpenPieceFotos, onAddPieceFotos, onPreviewPieceFotos,   onAddAnotherPiece, onRemovePiece, onUpdateLinkQuantidade,
  lockConjunto, conjuntoData,
  onCreateConjuntoDraft, onClearConjunto,
  onUpdateConjuntoMeta, onUpdateConjuntoData, onConjuntoStatusChange, onOpenConjuntoFotos, onPreviewConjuntoFotos, onAddConjuntoFotos,
  onSave,
  onDuplicate,
  saving,
  saveError,
  migrationWarning,
  scrollToPieceId,
  highlightPieceId,
  onScrollToPieceDone,
  pendingVendaRowId,
  conjuntoStatusDisplay,
  conjuntoCodigoError,
  onConjuntoCodigoChange,
  onConjuntoCodigoCommit,
  onConjuntoCategoriaChange,
  onPecaCodigoChange,
  onPecaCodigoCommit,
  onPecaCategoriaChange,
  pecaCodigoErrors,
  highlightPublicationFields,
  publicationFocusPieceId,
  margemVendaConfig,
  custoHoraFixo, custoHoraMO,
  embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
}: {
  row: PecaRow
  allRows: PecaRow[]
  conjuntoLinks: ConjuntoPecaLink[]
  activeConjuntoId: string | null
  onClose: () => void
  onUpdatePiece: (id: string, changes: Partial<PecaRow>) => void
  onStatusChangePiece: (id: string, status: string) => void
  onConjuntoClick: () => void
  onOpenPieceFotos: (id: string) => void
  onPreviewPieceFotos: (id: string) => void
  onAddPieceFotos: (id: string, files: FileList) => void
  onAddAnotherPiece: () => void
  onRemovePiece: (id: string) => void
  onUpdateLinkQuantidade: (pecaId: string, quantidade: number) => void
  lockConjunto: boolean
  conjuntoData: ConjuntoData | null
  onCreateConjuntoDraft: () => void
  onClearConjunto: () => void
  onUpdateConjuntoMeta: (changes: { codigo?: string; nome?: string }) => void
  onUpdateConjuntoData: (changes: Partial<ConjuntoData>) => void
  onConjuntoStatusChange: (status: string) => void
  onOpenConjuntoFotos: () => void
  onPreviewConjuntoFotos: () => void
  onAddConjuntoFotos: (files: FileList) => void
  onSave: () => void
  onDuplicate?: () => void
  saving: boolean
  saveError: string | null
  migrationWarning: string | null
  scrollToPieceId: string | null
  highlightPieceId: string | null
  onScrollToPieceDone: () => void
  pendingVendaRowId: string | null
  conjuntoStatusDisplay: string
  conjuntoCodigoError?: string
  onConjuntoCodigoChange: (value: string) => void
  onConjuntoCodigoCommit: (prev: string) => void
  onConjuntoCategoriaChange: (categoria: string) => void
  onPecaCodigoChange: (pieceId: string, value: string) => void
  onPecaCodigoCommit: (pieceId: string, prev: string) => void
  onPecaCategoriaChange: (pieceId: string, categoria: string) => void
  pecaCodigoErrors: Record<string, string>
  highlightPublicationFields: PublicationFieldKey[]
  publicationFocusPieceId: string | null
  margemVendaConfig: number
  custoHoraFixo: number
  custoHoraMO: number
  embalagemItems: CustoItem[]
  argilaItems: CustoItem[]
  esmalteItems: CustoItem[]
  engobeItems: CustoItem[]
  tintaItems: CustoItem[]
  biscoitoItems: CustoItem[]
  queimaAltaItems: CustoItem[]
}) {
  const conjuntoFileRef = useRef<HTMLInputElement>(null)
  const isNew = row.isNew
  const inConjunto = !!activeConjuntoId
  const conjuntoPieces = useMemo(
    () => (activeConjuntoId ? getConjuntoPiecesFromRows(allRows, activeConjuntoId, conjuntoLinks) : [row]),
    [allRows, activeConjuntoId, row, conjuntoLinks],
  )
  type NovoCadastroTipo = 'avulsa' | 'conjunto'
  const [novoTipo, setNovoTipo] = useState<NovoCadastroTipo | null>(() =>
    lockConjunto || inConjunto ? 'conjunto' : null,
  )

  useEffect(() => {
    if (lockConjunto || activeConjuntoId) setNovoTipo('conjunto')
  }, [activeConjuntoId, lockConjunto])

  useEffect(() => {
    if (!scrollToPieceId || highlightPublicationFields.length > 0) return
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`modal-piece-${scrollToPieceId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      onScrollToPieceDone()
    }, 80)
    return () => window.clearTimeout(timer)
  }, [scrollToPieceId, highlightPublicationFields.length, conjuntoPieces.length, onScrollToPieceDone])

  useEffect(() => {
    if (!highlightPublicationFields.length) return
    let cancelled = false
    const scrollToField = () => {
      if (cancelled) return
      const order: PublicationFieldKey[] = ['foto', 'nome', 'descricao', 'dimensao', 'peso', 'preco']
      for (const key of order) {
        if (!highlightPublicationFields.includes(key)) continue
        const pieceId = (key === 'dimensao' || key === 'peso')
          ? (publicationFocusPieceId ?? row.id)
          : null
        const el = document.getElementById(resolvePublicationFieldElementId(key, inConjunto, pieceId))
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
    }
    const needsPieceScroll = publicationFocusPieceId
      && (highlightPublicationFields.includes('dimensao') || highlightPublicationFields.includes('peso'))
    if (needsPieceScroll) {
      const pieceEl = document.getElementById(`modal-piece-${publicationFocusPieceId}`)
      if (pieceEl) pieceEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.setTimeout(scrollToField, 380)
    } else {
      window.setTimeout(scrollToField, 120)
    }
    return () => { cancelled = true }
  }, [highlightPublicationFields, publicationFocusPieceId, inConjunto, row.id])

  const cdata = conjuntoData

  const showTipoPicker = isNew && !lockConjunto && novoTipo === null
  const showFormContent = !isNew || lockConjunto || novoTipo !== null
  const showConjuntoConfig = showFormContent && cdata && inConjunto
  const showSinglePieceForm = showFormContent && !inConjunto && (!isNew || novoTipo === 'avulsa')
  const showStandalonePublication = isNew && novoTipo === 'avulsa'
  const showEditPublication = !isNew && !inConjunto

  const conjuntoTotalUnidades = activeConjuntoId
    ? conjuntoPieces.reduce(
      (sum, p) => sum + linkQuantidade(conjuntoLinks, activeConjuntoId, p.id),
      0,
    )
    : conjuntoPieces.length

  const conjuntoPricing = showConjuntoConfig && cdata && activeConjuntoId
    ? calcConjuntoPricing(
      conjuntoPieces,
      quantidadeMapForConjunto(conjuntoLinks, activeConjuntoId),
      margemVendaConfig, cdata.preco_praticado,
      custoHoraMO, custoHoraFixo, embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    : null
  const conjuntoPraticadoIsAuto = cdata && cdata.preco_praticado === '' && (conjuntoPricing?.precoSugerido ?? 0) > 0
  const conjuntoPraticadoDisplay = conjuntoPraticadoIsAuto
    ? (conjuntoPricing?.precoSugerido ?? 0).toFixed(2)
    : (cdata?.preco_praticado ?? '')

  const conjuntoPrincipalSrc = cdata
    ? (cdata.novaPrincipal && cdata.fotosNovas.length > 0)
      ? cdata.fotosNovas[0].preview
      : (cdata.fotos[0] ?? cdata.fotosNovas[0]?.preview ?? null)
    : null
  const totalFotosConj = cdata ? cdata.fotos.length + cdata.fotosNovas.length : 0

  function selectNovoTipoAvulsa() {
    if (activeConjuntoId) onClearConjunto()
    setNovoTipo('avulsa')
  }

  function selectNovoTipoConjunto() {
    if (!activeConjuntoId) onCreateConjuntoDraft()
    setNovoTipo('conjunto')
  }

  function handleConjuntoFotoClick() {
    if (totalFotosConj > 0) onPreviewConjuntoFotos()
    else conjuntoFileRef.current?.click()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div className="bg-white border border-pedra shadow-2xl w-full max-w-[760px] max-h-[92vh] flex flex-col" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-pedra shrink-0 bg-[#F3F0EB]">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted">
              {isNew
                ? (showTipoPicker ? 'Novo cadastro' : novoTipo === 'conjunto' ? 'Cadastrar conjunto' : 'Cadastrar peça avulsa')
                : 'Editar peça'}
            </p>
            {!isNew && inConjunto && (
              <p className="font-sans text-[10px] text-terracota mt-1">
                Conjunto: {conjuntoData?.codigo || '—'}{conjuntoData?.nome ? ` — ${conjuntoData.nome}` : ''}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-carvao text-2xl leading-none w-7 h-7 flex items-center justify-center shrink-0">×</button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-7">
          {showTipoPicker && (
            <section className="space-y-4">
              <p className="font-sans text-sm text-carvao">O que você deseja cadastrar?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={selectNovoTipoAvulsa}
                  className="p-5 border-2 border-pedra bg-white hover:border-terracota hover:bg-areia/30 transition-colors text-left rounded-sm group">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-muted group-hover:text-terracota transition-colors">Opção 1</span>
                  <p className="font-serif text-lg text-carvao mt-1">Peça avulsa</p>
                  <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                    Uma única peça publicada individualmente na loja.
                  </p>
                </button>
                <button type="button" onClick={selectNovoTipoConjunto}
                  className="p-5 border-2 border-pedra bg-white hover:border-terracota hover:bg-[#EDE8DF]/80 transition-colors text-left rounded-sm group">
                  <span className="font-sans text-[10px] tracking-widest uppercase text-muted group-hover:text-terracota transition-colors">Opção 2</span>
                  <p className="font-serif text-lg text-carvao mt-1">Conjunto</p>
                  <p className="font-sans text-xs text-muted mt-2 leading-relaxed">
                    Várias peças vendidas juntas, com um único código na loja.
                  </p>
                </button>
              </div>
            </section>
          )}

          {showConjuntoConfig && cdata && (
            <section className="p-4 border-2 border-terracota/25 bg-[#EDE8DF]/60 rounded-sm space-y-4">
              <ModalSectionTitle>{lockConjunto ? 'Conjunto' : 'Novo conjunto'}</ModalSectionTitle>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={MODAL_LBL}>Código do conjunto</label>
                  <CodigoField
                    value={conjuntoData?.codigo ?? ''}
                    error={conjuntoCodigoError}
                    placeholder="Código único"
                    className={`${MODAL_INP} font-mono`}
                    onChange={onConjuntoCodigoChange}
                    onCommit={onConjuntoCodigoCommit}
                  />
                </div>
                <div
                  id="modal-field-conjunto-nome"
                  className={`p-1 -m-1 ${highlightPublicationFields.includes('nome') ? pubFieldHighlightCls(true) : ''}`}
                >
                  <label className={MODAL_LBL}>Nome do conjunto</label>
                  <input
                    type="text"
                    value={conjuntoData?.nome ?? ''}
                    onChange={(e) => onUpdateConjuntoMeta({ nome: e.target.value })}
                    placeholder="Nome (opcional)"
                    className={MODAL_INP}
                  />
                  {highlightPublicationFields.includes('nome') && (
                    <span className="block font-sans text-[10px] text-terracota mt-1">Preencha o nome ou código do conjunto.</span>
                  )}
                </div>
                <div>
                  <label className={MODAL_LBL}>Categoria</label>
                  <select
                    value={cdata.categoria}
                    onChange={(e) => onConjuntoCategoriaChange(e.target.value)}
                    className={MODAL_SEL_FULL}
                  >
                    <option value="">— Selecionar —</option>
                    {CATEGORIAS_PECA.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div
                  id="modal-field-conjunto-foto"
                  className={`shrink-0 p-1 -m-1 ${highlightPublicationFields.includes('foto') ? pubFieldHighlightCls(true) : ''}`}
                >
                  <label className={MODAL_LBL}>Foto do conjunto</label>
                  <input ref={conjuntoFileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        onAddConjuntoFotos(e.target.files)
                        e.target.value = ''
                        onOpenConjuntoFotos()
                      }
                    }} />
                  <button type="button" onClick={handleConjuntoFotoClick}
                    title={totalFotosConj > 0 ? 'Ver foto ampliada' : 'Adicionar fotos ao conjunto'}
                    className="relative w-[72px] h-[72px] overflow-hidden flex items-center justify-center shrink-0 border-2 border-terracota/40 bg-white hover:border-terracota transition-colors cursor-zoom-in">
                    {conjuntoPrincipalSrc ? (
                      <Thumb src={conjuntoPrincipalSrc} alt="Foto do conjunto" />
                    ) : (
                      <svg className="w-6 h-6 text-terracota/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {totalFotosConj > 1 && (
                      <span className="absolute top-0.5 right-0.5 bg-terracota text-cru font-sans text-[8px] w-4 h-4 flex items-center justify-center">{totalFotosConj}</span>
                    )}
                  </button>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={MODAL_LBL}>Status</label>
                    <select value={conjuntoStatusDisplay} onChange={(e) => onConjuntoStatusChange(e.target.value)} className={MODAL_SEL_FULL}>
                      <option value="">— Selecionar —</option>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={MODAL_LBL}>Exibição em feira</label>
                    <div className="flex items-center gap-2 pt-1">
                      <ModalToggle checked={cdata.fenearte} onChange={() => onUpdateConjuntoData({ fenearte: !cdata.fenearte })} activeClass="bg-amber-500" />
                      {cdata.fenearte && <span className="font-sans text-[10px] text-amber-600 uppercase tracking-wide">Sim</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="modal-field-conjunto-descricao"
                className={`p-1 -m-1 ${highlightPublicationFields.includes('descricao') ? pubFieldHighlightCls(true) : ''}`}
              >
                <label className={MODAL_LBL}>Descrição do conjunto</label>
                <textarea value={cdata.descricao} onChange={(e) => onUpdateConjuntoData({ descricao: e.target.value })}
                  placeholder="Descrição para o site (opcional)" rows={3}
                  className={`${MODAL_INP} resize-none leading-relaxed`} />
              </div>
            </section>
          )}

          {showConjuntoConfig && (
            <div className="space-y-4">
              {conjuntoPieces.map((piece, i) => (
                <PecaModalPieceFields
                  key={piece.id}
                  piece={piece}
                  index={i}
                  inConjunto
                  quantidade={activeConjuntoId ? linkQuantidade(conjuntoLinks, activeConjuntoId, piece.id) : 1}
                  onQuantidadeChange={(q) => onUpdateLinkQuantidade(piece.id, q)}
                  highlighted={highlightPieceId === piece.id}
                  canRemove={conjuntoPieces.length > 1}
                  onUpdate={(changes) => onUpdatePiece(piece.id, changes)}
                  statusValue={pendingVendaRowId === piece.id ? 'vendido' : piece.status}
                  codigoError={pecaCodigoErrors[`peca:${piece.id}`]}
                  highlightPublicationFields={highlightPublicationFields}
                  onCodigoChange={(v) => onPecaCodigoChange(piece.id, v)}
                  onCodigoCommit={(prev) => onPecaCodigoCommit(piece.id, prev)}
                  onStatusChange={(status) => onStatusChangePiece(piece.id, status)}
                  onOpenFotos={() => onOpenPieceFotos(piece.id)}
                  onPreviewFoto={() => onPreviewPieceFotos(piece.id)}
                  onAddFotos={(files) => onAddPieceFotos(piece.id, files)}
                  onRemove={() => onRemovePiece(piece.id)}
                  margemVendaConfig={margemVendaConfig}
                  custoHoraFixo={custoHoraFixo}
                  custoHoraMO={custoHoraMO}
                  embalagemItems={embalagemItems}
                  argilaItems={argilaItems}
                  esmalteItems={esmalteItems}
                  engobeItems={engobeItems}
                  tintaItems={tintaItems}
                  biscoitoItems={biscoitoItems}
                  queimaAltaItems={queimaAltaItems}
                />
              ))}

              <button type="button" onClick={onAddAnotherPiece}
                className="w-full font-sans text-xs text-terracota hover:text-carvao border border-dashed border-terracota/50 px-4 py-3 hover:bg-areia/40 transition-colors flex items-center justify-center gap-2">
                <span className="text-lg leading-none font-light">+</span> Adicionar outra peça ao conjunto
              </button>

              {conjuntoPricing && cdata && (
                <section className="p-4 bg-terracota/10 border-2 border-terracota/25 rounded-sm space-y-5">
                  <div>
                    <ModalSectionTitle>Custos do conjunto</ModalSectionTitle>
                    <p className="font-sans text-[10px] text-muted mb-3">
                      {conjuntoTotalUnidades} {conjuntoTotalUnidades === 1 ? 'unidade' : 'unidades'} em {conjuntoPieces.length} {conjuntoPieces.length === 1 ? 'tipo de peça' : 'tipos de peça'} — soma de materiais, mão de obra, rateio e custos extras
                    </p>
                    <ConjuntoCustosResumo
                      pieces={conjuntoPieces}
                      quantidadeByPecaId={quantidadeMapForConjunto(conjuntoLinks, activeConjuntoId)}
                      totals={conjuntoPricing}
                      custoHoraMO={custoHoraMO}
                      custoHoraFixo={custoHoraFixo}
                      embalagemItems={embalagemItems}
                      argilaItems={argilaItems}
                      esmalteItems={esmalteItems}
                      engobeItems={engobeItems}
                      tintaItems={tintaItems}
                      biscoitoItems={biscoitoItems}
                      queimaAltaItems={queimaAltaItems}
                    />
                  </div>

                  <div
                    id="modal-field-conjunto-preco"
                    className={`p-1 -m-1 ${highlightPublicationFields.includes('preco') ? pubFieldHighlightCls(true) : ''}`}
                  >
                    <ModalSectionTitle>Totais do conjunto</ModalSectionTitle>
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={MODAL_LBL}>Custo total</label>
                      <div className="flex justify-end py-2">
                        {conjuntoPricing.totalCusto > 0
                          ? <span className="font-sans text-lg font-bold text-carvao tabular-nums">R$ {fmt(conjuntoPricing.totalCusto)}</span>
                          : <span className="font-sans text-sm text-muted/40">—</span>}
                      </div>
                    </div>
                    <div>
                      <label className={MODAL_LBL}>Margem de venda (%)</label>
                      <div className="flex justify-end py-2">
                        <span className="font-sans text-lg font-semibold text-carvao tabular-nums">{fmt(margemVendaConfig)}%</span>
                      </div>
                      <p className="font-sans text-[9px] text-muted/60">Definida em Custos & Precificação</p>
                    </div>
                    <div>
                      <label className={MODAL_LBL}>Preço sugerido</label>
                      <div className="flex justify-end py-2">
                        {conjuntoPricing.precoSugerido > 0
                          ? <span className="font-sans text-lg font-bold text-terracota tabular-nums">R$ {fmt(conjuntoPricing.precoSugerido)}</span>
                          : <span className="font-sans text-sm text-muted/40">—</span>}
                      </div>
                      <p className="font-sans text-[9px] text-muted/60">Custo ÷ (1 − margem) · exibido no site</p>
                    </div>
                    <div>
                      <label className={MODAL_LBL}>Preço praticado</label>
                      <input type="number" min="0" step="0.01" value={conjuntoPraticadoDisplay}
                        onChange={(e) => onUpdateConjuntoData({ preco_praticado: e.target.value })}
                        placeholder="0"
                        title={conjuntoPraticadoIsAuto ? 'Preenchido automaticamente com o preço sugerido' : undefined}
                        className={`${MODAL_INP_NUM} ${conjuntoPraticadoIsAuto ? 'text-muted/50' : ''}`} />
                    </div>
                    </div>
                  </div>

                  <div>
                    <ModalSectionTitle>Modo de venda no site</ModalSectionTitle>
                    <div className="space-y-2">
                      {VENDA_MODO_OPTIONS.map((opt) => (
                        <label key={opt.value}
                          className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition-colors ${
                            cdata.venda_modo === opt.value ? 'border-terracota/50 bg-white' : 'border-pedra/40 hover:bg-white/60'
                          }`}>
                          <input type="radio" name="venda_modo" value={opt.value}
                            checked={cdata.venda_modo === opt.value}
                            onChange={() => onUpdateConjuntoData({ venda_modo: opt.value })}
                            className="mt-0.5 shrink-0" />
                          <div>
                            <p className="font-sans text-sm text-carvao">{opt.label}</p>
                            <p className="font-sans text-xs text-muted mt-0.5 leading-relaxed">{opt.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {showSinglePieceForm && (showStandalonePublication || showEditPublication) && (
            <section>
              <ModalSectionTitle>Publicação no site</ModalSectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className={MODAL_LBL}>Status</label>
                  <select value={pendingVendaRowId === row.id ? 'vendido' : row.status} onChange={(e) => onStatusChangePiece(row.id, e.target.value)} className={MODAL_SEL_FULL}>
                    <option value="">— Selecionar —</option>
                    {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={MODAL_LBL}>Exibição em feira</label>
                  <div className="flex items-center gap-2 pt-1">
                    <ModalToggle checked={row.fenearte} onChange={() => onUpdatePiece(row.id, { fenearte: !row.fenearte })} activeClass="bg-amber-500" />
                    {row.fenearte && <span className="font-sans text-[10px] text-amber-600 uppercase tracking-wide">Sim</span>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {showSinglePieceForm && (
            <PecaModalPieceFields
              piece={row}
              index={0}
              inConjunto={inConjunto}
              canRemove={false}
              statusValue={pendingVendaRowId === row.id ? 'vendido' : row.status}
              codigoError={pecaCodigoErrors[`peca:${row.id}`]}
              highlightPublicationFields={highlightPublicationFields}
              onCodigoChange={(v) => onPecaCodigoChange(row.id, v)}
              onCodigoCommit={(prev) => onPecaCodigoCommit(row.id, prev)}
              onCategoriaChange={(c) => onPecaCategoriaChange(row.id, c)}
              onUpdate={(changes) => onUpdatePiece(row.id, changes)}
              onStatusChange={(status) => onStatusChangePiece(row.id, status)}
              onOpenFotos={() => onOpenPieceFotos(row.id)}
              onPreviewFoto={() => onPreviewPieceFotos(row.id)}
              onAddFotos={(files) => onAddPieceFotos(row.id, files)}
              margemVendaConfig={margemVendaConfig}
              custoHoraFixo={custoHoraFixo}
              custoHoraMO={custoHoraMO}
              embalagemItems={embalagemItems}
              argilaItems={argilaItems}
              esmalteItems={esmalteItems}
              engobeItems={engobeItems}
              tintaItems={tintaItems}
              biscoitoItems={biscoitoItems}
              queimaAltaItems={queimaAltaItems}
            />
          )}

          {isNew && !lockConjunto && novoTipo !== null && (
            <button type="button" onClick={() => {
              if (novoTipo === 'conjunto' && activeConjuntoId) onClearConjunto()
              setNovoTipo(null)
            }}
              className="font-sans text-[10px] text-muted hover:text-terracota transition-colors">
              ← Alterar tipo de cadastro
            </button>
          )}

          {showSinglePieceForm && !isNew && inConjunto && (
            <p className="font-sans text-[10px] text-muted/60 italic">Status, categoria e publicação são gerenciados pelo conjunto.</p>
          )}

          {showSinglePieceForm && !isNew && (
            <button type="button" onClick={onConjuntoClick}
              className="font-sans text-xs text-terracota hover:text-carvao border border-terracota/30 px-4 py-2.5 hover:bg-areia/50 transition-colors w-full text-left">
              {inConjunto ? `Gerenciar conjunto (${row.conjunto_codigo})` : 'Agrupar em conjunto…'}
            </button>
          )}

          {showSinglePieceForm && (showStandalonePublication || showEditPublication) && (
            <section
              id="modal-field-descricao"
              className={`p-1 -m-1 ${highlightPublicationFields.includes('descricao') ? pubFieldHighlightCls(true) : ''}`}
            >
              <ModalSectionTitle>Descrição</ModalSectionTitle>
              <textarea value={row.descricao} onChange={(e) => onUpdatePiece(row.id, { descricao: e.target.value })}
                placeholder="Descrição para o site (opcional)" rows={4}
                className={`${MODAL_INP} resize-none leading-relaxed`} />
            </section>
          )}
        </div>

        <div className="px-6 py-3 border-t border-pedra flex items-center justify-between gap-4 shrink-0 bg-[#FAFAF8]">
          <div className="min-w-0 flex items-center gap-2">
            {!isNew && onDuplicate && (
              <button type="button" onClick={onDuplicate}
                className="font-sans text-xs text-terracota hover:text-carvao px-4 py-2 border border-terracota/40 hover:bg-areia/50 transition-colors whitespace-nowrap">
                Gerar cópia
              </button>
            )}
            {saveError && <p className="font-sans text-xs text-red-600 break-words">{saveError}</p>}
            {!saveError && migrationWarning && (
              <p className="font-sans text-xs text-amber-800 break-words">{migrationWarning}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={onClose}
              className="font-sans text-xs text-muted hover:text-carvao px-4 py-2 border border-pedra hover:bg-areia/50 transition-colors">
              Fechar
            </button>
            <button type="button" onClick={onSave} disabled={saving || showTipoPicker}
              className="font-sans text-xs bg-carvao text-cru px-5 py-2 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
// ─── Main component ───────────────────────────────────────────────────────────

export function PecasTable({
  pecasIniciais, conjuntosIniciais, conjuntoLinksIniciais, custoHoraFixo, custoHoraMO,
  embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems,
  biscoitoItems, queimaAltaItems, margemVendaConfig,
}: Props) {
  const [rows, setRows] = useState<PecaRow[]>(() => pecasIniciais.map(dbToRow))
  const [conjuntoLinks, setConjuntoLinks] = useState<ConjuntoPecaLink[]>(() =>
    mergeLinksWithRows(conjuntoLinksIniciais, pecasIniciais.map(dbToRow)),
  )
  const [dirtyConjuntoLinkIds, setDirtyConjuntoLinkIds] = useState<Set<string>>(() => new Set())

  // Dados gerenciados ao nível do conjunto
  const [conjuntosData, setConjuntosData] = useState<Map<string, ConjuntoData>>(() => {
    const map = new Map<string, ConjuntoData>()
    conjuntosIniciais.forEach((c) => {
      map.set(c.id, {
        codigo:         c.codigo         ?? '',
        nome:           c.nome           ?? '',
        descricao:      c.descricao      ?? '',
        status:         c.status         ?? '',
        exibir_no_site: c.exibir_no_site ?? false,
        destaque_home:  c.destaque_home  ?? false,
        fenearte:       c.fenearte       ?? false,
        categoria:      c.categoria      ?? '',
        fotos:          c.fotos          ?? [],
        fotosNovas: [], novaPrincipal: false,
        margem_venda:   c.margem_venda != null ? String(c.margem_venda) : String(DEFAULT_MARGEM_VENDA),
        preco_praticado: c.preco_praticado != null ? String(c.preco_praticado) : '',
        venda_modo:      c.venda_modo ?? 'apenas_conjunto',
        dirty: false,
      })
    })
    return map
  })

  const [fotoModal, setFotoModal] = useState<{ type: 'peca'; id: string } | { type: 'conjunto'; id: string } | null>(null)
  const [fotoPreview, setFotoPreview] = useState<FotoPreviewState | null>(null)
  const [descricaoModal, setDescricaoModal] = useState<{ type: 'peca'; id: string } | { type: 'conjunto'; id: string } | null>(null)
  const [conjuntoModal, setConjuntoModal] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<string | null>(null)
  const [editModalConjuntoId, setEditModalConjuntoId] = useState<string | null>(null)
  const [editModalLockedConjunto, setEditModalLockedConjunto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [destaqueLimitMsg, setDestaqueLimitMsg] = useState<string | null>(null)
  const [publicationWarning, setPublicationWarning] = useState<{
    missingFields: PublicationFieldKey[]
    onAdjust: () => void
    onProceed: () => void
  } | null>(null)
  const [highlightPublicationFields, setHighlightPublicationFields] = useState<PublicationFieldKey[]>([])
  const [publicationFocusPieceId, setPublicationFocusPieceId] = useState<string | null>(null)
  const [exibirSitePrompt, setExibirSitePrompt] = useState<
    { type: 'peca'; id: string } | { type: 'conjunto'; id: string } | null
  >(null)
  const [modalSaving, setModalSaving] = useState(false)
  const [modalSaveError, setModalSaveError] = useState<string | null>(null)
  const [migrationWarning, setMigrationWarning] = useState<string | null>(null)
  const [scrollToPieceId, setScrollToPieceId] = useState<string | null>(null)
  const [highlightPieceId, setHighlightPieceId] = useState<string | null>(null)
  const [vendaModal, setVendaModal] = useState<{ rowId: string; initial: VendaFormData } | null>(null)
  const [pendingVendaRowId, setPendingVendaRowId] = useState<string | null>(null)
  const [pendingConjuntoVendaId, setPendingConjuntoVendaId] = useState<string | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfSelectionMode, setPdfSelectionMode] = useState<'all' | 'feira'>('all')
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [avulsasPicker, setAvulsasPicker] = useState<{ conjuntoId: string } | null>(null)
  const [formConjuntoModal, setFormConjuntoModal] = useState<{ rowIds: string[] } | null>(null)
  const [formConjuntoError, setFormConjuntoError] = useState<string | null>(null)
  const [codigoErrors, setCodigoErrors] = useState<Record<string, string>>({})
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { type: 'peca'; id: string; codigo: string; nome: string }
    | { type: 'conjunto'; id: string; codigo: string; nome: string }
    | null
  >(null)
  const [deleteInProgress, setDeleteInProgress] = useState(false)
  const [duplicatePecaPrompt, setDuplicatePecaPrompt] = useState<{ rowId: string } | null>(null)
  const [duplicateConjuntoPrompt, setDuplicateConjuntoPrompt] = useState<{ conjuntoId: string } | null>(null)
  const [sameCodeDuplicateSession, setSameCodeDuplicateSession] = useState<SameCodeDuplicateSession | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const directInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const conjuntoInputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const searchDropRef = useRef<HTMLDivElement>(null)

  // Ensure all conjunto_ids in rows have an entry in conjuntosData
  useEffect(() => {
    const ids = new Set(collectConjuntoIds(rows, conjuntoLinks))
    setConjuntosData((prev) => {
      let changed = false
      const next = new Map(prev)
      ids.forEach((id) => {
        if (!next.has(id)) { next.set(id, defaultConjuntoData()); changed = true }
      })
      return changed ? next : prev
    })
  }, [rows, conjuntoLinks])

  // Peças do conjunto sem status — preencher com o status do conjunto
  useEffect(() => {
    setRows((prev) => {
      let changed = false
      const next = prev.map((r) => {
        if (!r.conjunto_id || r.status) return r
        const cdata = conjuntosData.get(r.conjunto_id)
        if (!cdata?.status) return r
        changed = true
        return { ...r, status: cdata.status }
      })
      return changed ? next : prev
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync inicial apenas
  }, [])

  function focusConjuntoPiece(pieceId: string) {
    setScrollToPieceId(pieceId)
    setHighlightPieceId(pieceId)
    window.setTimeout(() => setHighlightPieceId(null), 3000)
  }

  // Derived list of conjuntos
  const conjuntoMetaById = useMemo(() => {
    const m = new Map<string, { codigo: string; nome: string }>()
    for (const [id, cdata] of conjuntosData) {
      m.set(id, { codigo: cdata.codigo, nome: cdata.nome })
    }
    for (const c of conjuntosIniciais) {
      if (!m.has(c.id)) {
        m.set(c.id, { codigo: c.codigo ?? '', nome: c.nome ?? '' })
      }
    }
    for (const r of rows) {
      if (r.conjunto_id && !m.get(r.conjunto_id)?.codigo) {
        m.set(r.conjunto_id, { codigo: r.conjunto_codigo, nome: r.conjunto_nome })
      }
    }
    return m
  }, [conjuntosIniciais, rows, conjuntosData])

  const conjuntos = useMemo<ConjuntoInfo[]>(() => {
    const map = new Map<string, ConjuntoInfo>()
    for (const id of collectConjuntoIds(rows, conjuntoLinks)) {
      const meta = conjuntoMetaById.get(id) ?? getConjuntoMeta(id, rows)
      map.set(id, { id, codigo: meta.codigo, nome: meta.nome })
    }
    return Array.from(map.values())
  }, [rows, conjuntoLinks, conjuntoMetaById])

  const filteredRows = useMemo(() => {
    const hiddenDraftIds = sameCodeDuplicateSession
      ? new Set(sameCodeDuplicateSession.draftPecaIds)
      : null
    const visible = hiddenDraftIds ? rows.filter((r) => !hiddenDraftIds.has(r.id)) : rows
    return sortRowsForDisplay(filterRowsBySearch(visible, conjuntoLinks, conjuntoMetaById, searchQuery), conjuntoLinks)
  }, [rows, searchQuery, sameCodeDuplicateSession, conjuntoLinks, conjuntoMetaById])
  const displayItems = useMemo(
    () => buildDisplay(filteredRows, conjuntoLinks, conjuntoMetaById),
    [filteredRows, conjuntoLinks, conjuntoMetaById],
  )
  const tableDisplayItems = useMemo(() => {
    if (pdfSelectionMode !== 'feira') return displayItems
    return displayItems.filter((item) => isDisplayItemFenearteVisible(item, conjuntosData))
  }, [displayItems, pdfSelectionMode, conjuntosData])
  const selectableKeysForMode = useMemo(
    () => tableDisplayItems.map(displayItemKey),
    [tableDisplayItems],
  )
  const allVisibleSelected = selectableKeysForMode.length > 0 && selectableKeysForMode.every((k) => selectedKeys.has(k))
  const totalSelectedCount = useMemo(() => {
    let n = 0
    for (const item of displayItems) {
      if (selectedKeys.has(displayItemKey(item))) n++
    }
    return n
  }, [displayItems, selectedKeys])
  const feiraSelectedCount = useMemo(() => {
    let n = 0
    for (const item of displayItems) {
      const key = displayItemKey(item)
      if (!selectedKeys.has(key)) continue
      if (!isDisplayItemFenearte(item, conjuntosData)) continue
      n++
    }
    return n
  }, [displayItems, selectedKeys, conjuntosData])
  const selectedPdfCount = useMemo(() => {
    let n = 0
    for (const item of tableDisplayItems) {
      if (selectedKeys.has(displayItemKey(item))) n++
    }
    return n
  }, [tableDisplayItems, selectedKeys])
  const selectedAvulsaRowIds = useMemo(() => {
    const ids = new Set<string>()
    for (const item of displayItems) {
      if (item.type !== 'row') continue
      if (selectedKeys.has(displayItemKey(item))) ids.add(item.row.id)
    }
    return [...ids]
  }, [displayItems, selectedKeys])
  const bulkDeletionPlan = useMemo(
    () => buildBulkDeletionPlan(selectedKeys, displayItems, rows, conjuntoLinks),
    [selectedKeys, displayItems, rows, conjuntoLinks],
  )
  const canBulkDelete = bulkDeletionPlan.pecaCount > 0
  const avulsasPickerItems = useMemo(() => {
    const targetConjuntoId = avulsasPicker?.conjuntoId
    return rows
      .filter((r) => {
        if (!targetConjuntoId) return true
        return !pecaInConjunto(r.id, targetConjuntoId, r, conjuntoLinks)
      })
      .map((r) => {
        const outrosConjuntos = pecaConjuntoIds(r.id, r, conjuntoLinks).filter(
          (id) => id !== targetConjuntoId,
        )
        const detail =
          outrosConjuntos.length > 0
            ? `Também em: ${outrosConjuntos.map((id) => conjuntoMetaById.get(id)?.codigo || id.slice(0, 6)).join(', ')}`
            : undefined
        return {
          id: r.id,
          codigo: r.codigo,
          nome: r.nome,
          photoSrc: getRowPhotoSrc(r),
          detail,
        }
      })
  }, [rows, conjuntoLinks, avulsasPicker, conjuntoMetaById])
  const searchResults = useMemo(
    () => buildSearchResults(rows, conjuntoLinks, conjuntoMetaById, searchQuery),
    [rows, conjuntoLinks, conjuntoMetaById, searchQuery],
  )

  useEffect(() => {
    if (pdfSelectionMode !== 'feira') return
    setSelectedKeys((prev) => {
      const allowed = new Set(tableDisplayItems.map(displayItemKey))
      const next = new Set<string>()
      for (const key of prev) {
        if (allowed.has(key)) next.add(key)
      }
      if (next.size === prev.size && [...next].every((k) => prev.has(k))) return prev
      return next
    })
  }, [pdfSelectionMode, tableDisplayItems])

  function toggleSelectKey(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAllVisible() {
    setSelectedKeys(new Set(selectableKeysForMode))
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  function buildPdfRows(filterFeira: boolean): PecasPdfRow[] {
    const pdfRows: PecasPdfRow[] = []

    for (const item of displayItems) {
      const key = displayItemKey(item)
      if (!selectedKeys.has(key)) continue
      if (filterFeira && !isDisplayItemFenearte(item, conjuntosData)) continue

      if (item.type === 'conjunto-header') {
        const cdata = conjuntosData.get(item.conjuntoId) ?? defaultConjuntoData()
        const conjPricing = calcConjuntoPricing(
          item.rows,
          quantidadeMapForConjunto(conjuntoLinks, item.conjuntoId),
          margemVendaConfig, cdata.preco_praticado,
          custoHoraMO, custoHoraFixo,
          embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
        )
        const praticadoVal = cdata.preco_praticado !== ''
          ? parseFloat(cdata.preco_praticado) || null
          : conjPricing.precoSugerido > 0 ? conjPricing.precoSugerido : null
        pdfRows.push({
          codigo: item.conjuntoCodigo || '—',
          nome: item.conjuntoNome || '—',
          status: statusLabel(cdata.status),
          custo: fmtPrecoPdf(conjPricing.totalCusto),
          sugerido: fmtPrecoPdf(conjPricing.precoSugerido),
          praticado: praticadoVal != null ? fmtPrecoPdf(praticadoVal) : '—',
          exibirSite: yesNoPdf(cdata.exibir_no_site),
          fenearte: yesNoPdf(cdata.fenearte),
          imageSrc: getDisplayItemPhotoSrc(item, conjuntosData),
        })
      } else {
        const row = item.row
        const inConjunto = !!row.conjunto_id
        const costs = calcRowCosts(
          row, custoHoraMO, custoHoraFixo,
          embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
        )
        const pricing = buildPecaPricing(row, costs.custoTotal, margemVendaConfig)
        const praticadoVal = row.preco_praticado !== ''
          ? parseFloat(row.preco_praticado) || null
          : pricing.precoSugerido > 0 ? pricing.precoSugerido : null
        const conjuntoFenearte = inConjunto ? (conjuntosData.get(row.conjunto_id!)?.fenearte ?? false) : row.fenearte
        pdfRows.push({
          codigo: row.codigo || '—',
          nome: row.nome || '—',
          status: statusLabel(row.status),
          custo: fmtPrecoPdf(costs.custoTotal),
          sugerido: fmtPrecoPdf(pricing.precoSugerido),
          praticado: praticadoVal != null ? fmtPrecoPdf(praticadoVal) : '—',
          exibirSite: inConjunto ? '—' : yesNoPdf(row.exibir_no_site),
          fenearte: inConjunto ? yesNoPdf(conjuntoFenearte) : yesNoPdf(row.fenearte),
          imageSrc: getDisplayItemPhotoSrc(item, conjuntosData),
        })
      }
    }

    return pdfRows
  }

  function openPdfModal() {
    setPdfError(null)
    if (totalSelectedCount === 0) {
      setPdfError('Selecione ao menos um item para gerar o PDF.')
      return
    }
    setPdfModalOpen(true)
  }

  async function handlePdfConfirm(columns: PdfColumnId[], filterFeira: boolean) {
    const pdfRows = buildPdfRows(filterFeira)
    if (pdfRows.length === 0) {
      setPdfError(
        filterFeira
          ? 'Nenhum item selecionado está marcado para exibição em feira.'
          : 'Nenhum item para exportar.',
      )
      setPdfModalOpen(false)
      return
    }
    await generatePecasPdf(pdfRows, columns)
    setPdfModalOpen(false)
  }

  useEffect(() => {
    function h(e: MouseEvent) {
      if (searchDropRef.current && !searchDropRef.current.contains(e.target as Node))
        setSearchOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function selectSearchResult(item: SearchResultItem) {
    setSearchOpen(false)
    if (item.type === 'peca') {
      setSearchQuery(item.codigo || item.nome)
      openEditModal(item.id)
      requestAnimationFrame(() => {
        document.getElementById(`peca-row-${item.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    } else {
      setSearchQuery(item.codigo || item.nome)
      requestAnimationFrame(() => {
        document.getElementById(`conjunto-row-${item.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }
  }

  // ── Peça mutations ─────────────────────────────────────────────────────────

  function getConjuntoCodigo(conjuntoId: string): string {
    return conjuntosData.get(conjuntoId)?.codigo
      ?? conjuntoMetaById.get(conjuntoId)?.codigo
      ?? rows.find((r) => r.conjunto_id === conjuntoId)?.conjunto_codigo
      ?? ''
  }

  function getConjuntoNome(conjuntoId: string): string {
    return conjuntosData.get(conjuntoId)?.nome
      ?? conjuntoMetaById.get(conjuntoId)?.nome
      ?? rows.find((r) => r.conjunto_id === conjuntoId)?.conjunto_nome
      ?? ''
  }

  function buildCodigoLists(excludePecaId?: string, excludeConjuntoId?: string): CodigoListEntry {
    const pecaCodigos = rows.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      conjuntoId: r.conjunto_id,
    }))
    const conjuntoIds = collectConjuntoIds(rows, conjuntoLinks)
    const conjuntoCodigos = conjuntoIds.map((conjuntoId) => ({
      conjuntoId,
      codigo: getConjuntoCodigo(conjuntoId),
    }))
    return { pecaCodigos, conjuntoCodigos }
  }

  function getAllCodigoStrings(): string[] {
    const out: string[] = []
    const conjuntoSeen = new Set<string>()
    for (const r of rows) {
      if (r.codigo.trim()) out.push(r.codigo)
    }
    for (const id of collectConjuntoIds(rows, conjuntoLinks)) {
      const codigo = getConjuntoCodigo(id).trim()
      if (codigo && !conjuntoSeen.has(id)) {
        conjuntoSeen.add(id)
        out.push(codigo)
      }
    }
    return out
  }

  /** Apenas códigos de peças — usado para sugerir o próximo U/D/C/UD. */
  function getAllPecaCodigoStrings(): string[] {
    return rows.map((r) => r.codigo.trim()).filter(Boolean)
  }

  function suggestNewPecaCodigo(conjuntoId?: string, categoria?: string): string {
    const all = getAllPecaCodigoStrings()
    if (categoria) {
      const fromCat = suggestCodigoForCategoria(categoria, all)
      if (fromCat) return fromCat
    }
    if (conjuntoId) {
      const cdata = conjuntosData.get(conjuntoId)
      if (cdata?.categoria) {
        const fromConjCat = suggestCodigoForCategoria(cdata.categoria, all)
        if (fromConjCat) return fromConjCat
      }
      const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
      const prefix = inferPrefixFromCodigos(pieces.map((p) => p.codigo))
      return suggestNextPecaCodigo(prefix, all)
    }
    return ''
  }

  function handlePecaCategoriaChange(rowId: string, categoria: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return
    const suggested = suggestCodigoForCategoria(categoria, getAllPecaCodigoStrings())
    const changes: Partial<PecaRow> = { categoria }
    if (suggested && row.isNew) {
      changes.codigo = suggested
    } else if (suggested && !row.codigo.trim()) {
      changes.codigo = suggested
    }
    update(rowId, changes)
    setCodigoError(`peca:${rowId}`, null)
  }

  function handleConjuntoCategoriaChange(conjuntoId: string, categoria: string) {
    updateConjuntoData(conjuntoId, { categoria })
    const prefix = categoriaToPrefix(categoria)
    if (!prefix) return
    const used = [...getAllPecaCodigoStrings()]
    setRows((prev) =>
      prev.map((r) => {
        if (r.conjunto_id !== conjuntoId || !r.isNew || r.codigo.trim()) return r
        const code = suggestNextPecaCodigo(prefix, used)
        used.push(code)
        return { ...r, codigo: code, categoria, dirty: true }
      }),
    )
    setSaveStatus('idle')
  }

  function setCodigoError(key: string, message: string | null) {
    setCodigoErrors((prev) => {
      if (!message) {
        if (!(key in prev)) return prev
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: message }
    })
  }

  function handlePecaCodigoInput(rowId: string, value: string) {
    update(rowId, { codigo: value })
    setCodigoError(`peca:${rowId}`, null)
  }

  function commitPecaCodigo(rowId: string, prevValue: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return
    if (!row.codigo.trim()) {
      setCodigoError(`peca:${rowId}`, null)
      return
    }
    const result = validatePecaCodigoUnique(row.codigo, buildCodigoLists(rowId), rowId, {
      strictFormat: row.isNew,
      inConjunto: pecaHasAnyConjunto(row.id, row, conjuntoLinks),
    })
    if (!result.ok) {
      setCodigoError(`peca:${rowId}`, result.error)
      update(rowId, { codigo: prevValue })
      return
    }
    setCodigoError(`peca:${rowId}`, null)
    if (result.canonical !== row.codigo) update(rowId, { codigo: result.canonical })
  }

  function handleConjuntoCodigoInput(conjuntoId: string, value: string) {
    updateConjunto(conjuntoId, { codigo: value })
    setCodigoError(`conjunto:${conjuntoId}`, null)
  }

  function validateAllCodigosBeforeSave(
    scope?: { pecaIds?: string[]; conjuntoIds?: string[] },
    rowsSource: PecaRow[] = rows,
  ): string | null {
    const lists = buildCodigoLists()

    const seen = new Set<string>()
    const pecaRows = scope?.pecaIds
      ? rowsSource.filter((r) => scope.pecaIds!.includes(r.id))
      : rowsSource
    for (const r of pecaRows) {
      if (!r.codigo.trim()) continue
      const result = validatePecaCodigoUnique(r.codigo, lists, r.id, {
        strictFormat: r.isNew,
        inConjunto: pecaHasAnyConjunto(r.id, r, conjuntoLinks),
      })
      if (!result.ok) return result.error
    }
    const scopeConjuntoIds = scope
      ? (scope.conjuntoIds ?? [])
      : collectConjuntoIds(rowsSource, conjuntoLinks)
    for (const conjuntoId of scopeConjuntoIds) {
      const codigo = getConjuntoCodigo(conjuntoId)
      if (!codigo.trim()) continue
      const result = validateConjuntoCodigoUnique(codigo, lists, conjuntoId)
      if (!result.ok) return result.error
      const key = normalizeCodigoKey(result.canonical)
      if (seen.has(key)) return `O código ${result.canonical} já existe em outro conjunto.`
      seen.add(key)
    }
    return null
  }

  function commitConjuntoCodigo(conjuntoId: string, prevValue: string) {
    const current = getConjuntoCodigo(conjuntoId)
    if (!current.trim()) {
      setCodigoError(`conjunto:${conjuntoId}`, null)
      return
    }
    const result = validateConjuntoCodigoUnique(current, buildCodigoLists(undefined, conjuntoId), conjuntoId)
    if (!result.ok) {
      setCodigoError(`conjunto:${conjuntoId}`, result.error)
      updateConjunto(conjuntoId, { codigo: prevValue })
      return
    }
    setCodigoError(`conjunto:${conjuntoId}`, null)
    if (result.canonical !== current) updateConjunto(conjuntoId, { codigo: result.canonical })
  }

  function update(id: string, changes: Partial<PecaRow>) {
    const conjuntoId = rows.find((r) => r.id === id)?.conjunto_id
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...changes, dirty: true } : r))
    if (conjuntoId) updateConjuntoData(conjuntoId, {})
    setSaveStatus('idle')
  }

  function buildVendaFormInitial(row: PecaRow): VendaFormData {
    const { custoTotal } = calcRowCosts(
      row, custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const pricing = buildPecaPricing(row, custoTotal, margemVendaConfig)
    const defaultValor = row.valor_venda !== ''
      ? row.valor_venda
      : row.preco_praticado !== ''
        ? row.preco_praticado
        : pricing.precoSugerido > 0
          ? pricing.precoSugerido.toFixed(2)
          : ''
    return {
      valor_venda: defaultValor,
      local_venda: row.local_venda,
      cliente_nome: row.cliente_nome,
      cliente_telefone: row.cliente_telefone,
      cliente_email: row.cliente_email,
    }
  }

  function getStatusDisplayValue(row: PecaRow): string {
    if (pendingVendaRowId === row.id) return 'vendido'
    return row.status
  }

  function getConjuntoStatusDisplayValue(conjuntoId: string, currentStatus: string): string {
    if (pendingConjuntoVendaId === conjuntoId) return 'vendido'
    return currentStatus
  }

  function cancelVendaModal() {
    setVendaModal(null)
    setPendingVendaRowId(null)
    setPendingConjuntoVendaId(null)
  }

  function handleStatusChange(rowId: string, newStatus: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return
    const effectiveStatus = getStatusDisplayValue(row)
    if (effectiveStatus === newStatus) return

    if (newStatus === 'vendido' && row.status !== 'vendido') {
      setPendingVendaRowId(rowId)
      setPendingConjuntoVendaId(null)
      setVendaModal({ rowId, initial: buildVendaFormInitial(row) })
      return
    }

    setPendingVendaRowId(null)

    if (row.status === 'vendido' && newStatus !== 'vendido') {
      update(rowId, {
        status: newStatus,
        ...EMPTY_VENDA,
        exibir_no_site: false,
        destaque_home: false,
      })
      return
    }

    update(rowId, { status: newStatus })
  }

  function handleConjuntoStatusChange(conjuntoId: string, newStatus: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const displayStatus = getConjuntoStatusDisplayValue(conjuntoId, cdata.status)
    if (displayStatus === newStatus) return

    if (newStatus === 'vendido' && cdata.status !== 'vendido') {
      const refPiece = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)[0]
      if (refPiece) {
        setPendingConjuntoVendaId(conjuntoId)
        setPendingVendaRowId(null)
        setVendaModal({ rowId: refPiece.id, initial: buildVendaFormInitial(refPiece) })
        return
      }
      updateConjuntoData(conjuntoId, { status: newStatus })
      return
    }

    setPendingConjuntoVendaId(null)

    if (cdata.status === 'vendido' && newStatus !== 'vendido') {
      setRows((prev) => prev.map((r) => {
        if (r.conjunto_id !== conjuntoId) return r
        return {
          ...r,
          status: newStatus,
          ...EMPTY_VENDA,
          exibir_no_site: false,
          destaque_home: false,
          dirty: true,
        }
      }))
      updateConjuntoData(conjuntoId, { status: newStatus })
      return
    }

    updateConjuntoData(conjuntoId, { status: newStatus })
  }

  function confirmVenda(data: VendaFormData) {
    if (!vendaModal) return
    const rowId = vendaModal.rowId
    const conjuntoVendaId = pendingConjuntoVendaId
    setVendaModal(null)
    setPendingVendaRowId(null)
    setPendingConjuntoVendaId(null)

    const vendaFields = {
      status: 'vendido',
      valor_venda: data.valor_venda,
      local_venda: data.local_venda,
      cliente_nome: data.cliente_nome,
      cliente_telefone: data.cliente_telefone,
      cliente_email: data.cliente_email,
      vendido_em: new Date().toISOString(),
      exibir_no_site: false,
      destaque_home: false,
    }

    if (conjuntoVendaId) {
      setRows((prev) => prev.map((r) => {
        if (r.conjunto_id !== conjuntoVendaId) return r
        return { ...r, ...vendaFields, dirty: true }
      }))
      updateConjuntoData(conjuntoVendaId, { status: 'vendido' })
      setSaveStatus('idle')
      return
    }

    update(rowId, vendaFields)
  }

  function openEditModal(id: string) {
    const target = rows.find((r) => r.id === id)
    setEditModalLockedConjunto(!!target?.conjunto_id)
    setEditModal(id)
    clearPublicationFieldHighlights()
  }

  function openDeletePecaConfirm(row: PecaRow) {
    setDeleteConfirm({ type: 'peca', id: row.id, codigo: row.codigo, nome: row.nome })
  }

  function openDeleteConjuntoConfirm(conjuntoId: string) {
    const ref = rows.find((r) => r.conjunto_id === conjuntoId)
    setDeleteConfirm({
      type: 'conjunto',
      id: conjuntoId,
      codigo: ref?.conjunto_codigo ?? '',
      nome: ref?.conjunto_nome ?? '',
    })
  }

  async function executeDeleteConfirm() {
    if (!deleteConfirm) return
    setDeleteInProgress(true)
    try {
      if (deleteConfirm.type === 'peca') {
        await handleDelete(deleteConfirm.id)
      } else {
        await handleDeleteConjunto(deleteConfirm.id)
      }
      setDeleteConfirm(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeleteInProgress(false)
    }
  }

  function openDuplicateConjunto(conjuntoId: string) {
    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    if (pieces.length === 0) return
    setDuplicateConjuntoPrompt({ conjuntoId })
  }

  function openDuplicatePeca(rowId: string) {
    const source = rows.find((r) => r.id === rowId)
    if (!source || source.conjunto_id) return
    setDuplicatePecaPrompt({ rowId })
  }

  function revertSameCodeDuplicateSession() {
    if (!sameCodeDuplicateSession) return
    const session = sameCodeDuplicateSession
    const draftIds = new Set(session.draftPecaIds)
    setRows((prev) => prev.filter((r) => !draftIds.has(r.id)))
    if (session.draftConjuntoId) {
      setConjuntosData((prev) => {
        const next = new Map(prev)
        next.delete(session.draftConjuntoId!)
        return next
      })
    }
    setSameCodeDuplicateSession(null)
  }

  function duplicatePecaSameCode(rowId: string) {
    const source = rows.find((r) => r.id === rowId)
    if (!source || source.conjunto_id) return

    const allCodes = [...getAllCodigoStrings()]
    const copyCodigo = assignVariantCodigosForSameCodeCopy([source.codigo], allCodes)[0]

    const newRow = clonePecaAsNew(source, {
      codigo: copyCodigo,
      conjunto_id: null,
      conjunto_codigo: '',
      conjunto_nome: '',
      ordem: null,
    })

    setRows((prev) => [...prev, newRow])
    setSameCodeDuplicateSession({
      kind: 'peca',
      sourcePecaId: rowId,
      draftPecaIds: [newRow.id],
    })
    setDuplicatePecaPrompt(null)
    setEditModalLockedConjunto(false)
    setEditModal(newRow.id)
    setSaveStatus('idle')
    clearPublicationFieldHighlights()
  }

  function duplicatePeca(rowId: string, mode: DuplicatePecaMode) {
    if (mode === 'same-code') {
      duplicatePecaSameCode(rowId)
      return
    }

    const source = rows.find((r) => r.id === rowId)
    if (!source || source.conjunto_id) return

    const allCodes = getAllCodigoStrings()
    const newCodigo = suggestNextPecaCodigoFromSource(source, allCodes)
    const newRow = clonePecaAsNew(source, {
      codigo: newCodigo,
      conjunto_id: null,
      conjunto_codigo: '',
      conjunto_nome: '',
      ordem: null,
    })

    setRows((prev) => {
      const insertAt = findFamiliaInsertIndex(prev, rowId)
      return [...prev.slice(0, insertAt), newRow, ...prev.slice(insertAt)]
    })
    setDuplicatePecaPrompt(null)
    setEditModalLockedConjunto(false)
    setEditModal(newRow.id)
    setSaveStatus('idle')
    clearPublicationFieldHighlights()
    window.setTimeout(() => {
      document.getElementById(`peca-row-${newRow.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  function duplicateConjuntoSameCode(conjuntoId: string) {
    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    if (pieces.length === 0) return

    const ref = pieces[0]
    const sourceCdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()

    const allCodes = [...getAllCodigoStrings()]
    const working = [...allCodes]

    const copyConjuntoCodigo = assignVariantCodigosForSameCodeCopy([ref.conjunto_codigo], working)[0]
    working.push(copyConjuntoCodigo)
    const copyPieceCodigos = assignVariantCodigosForSameCodeCopy(
      pieces.map((p) => p.codigo),
      working,
    )

    const newConjuntoId = crypto.randomUUID()
    const newConjuntoNome = ref.conjunto_nome
    const pieceStatus = sourceCdata.status === 'vendido' ? '' : sourceCdata.status

    const newPieces = pieces.map((piece, idx) => clonePecaAsNew(piece, {
      codigo: copyPieceCodigos[idx],
      conjunto_id: newConjuntoId,
      conjunto_codigo: copyConjuntoCodigo,
      conjunto_nome: newConjuntoNome,
      status: pieceStatus,
      categoria: '',
      descricao: '',
      fenearte: false,
      ordem: idx,
    }))

    setRows((prev) => [...prev, ...newPieces])

    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(newConjuntoId, cloneConjuntoDataAsNew(sourceCdata))
      return next
    })

    setSameCodeDuplicateSession({
      kind: 'conjunto',
      sourceConjuntoId: conjuntoId,
      draftConjuntoId: newConjuntoId,
      draftPecaIds: newPieces.map((p) => p.id),
    })
    setDuplicateConjuntoPrompt(null)
    setEditModalLockedConjunto(true)
    setEditModal(newPieces[0].id)
    setSaveStatus('idle')
    clearPublicationFieldHighlights()
  }

  function duplicateConjunto(conjuntoId: string, mode: DuplicatePecaMode) {
    if (mode === 'same-code') {
      duplicateConjuntoSameCode(conjuntoId)
      return
    }

    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    if (pieces.length === 0) return

    const ref = pieces[0]
    const sourceCdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const newConjuntoId = crypto.randomUUID()
    const allCodes = [...getAllCodigoStrings()]
    const newConjuntoCodigo = suggestNextConjuntoCodigo(allCodes)
    allCodes.push(newConjuntoCodigo)
    const newConjuntoNome = ref.conjunto_nome
    const pieceStatus = sourceCdata.status === 'vendido' ? '' : sourceCdata.status

    const newPieces = pieces.map((piece, idx) => {
      const newPieceCodigo = suggestNextPecaCodigoFromSource(piece, allCodes)
      allCodes.push(newPieceCodigo)
      return clonePecaAsNew(piece, {
        codigo: newPieceCodigo,
        conjunto_id: newConjuntoId,
        conjunto_codigo: newConjuntoCodigo,
        conjunto_nome: newConjuntoNome,
        status: pieceStatus,
        categoria: '',
        descricao: '',
        fenearte: false,
        ordem: idx,
      })
    })

    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(newConjuntoId, cloneConjuntoDataAsNew(sourceCdata))
      return next
    })
    setRows((prev) => {
      let lastIdx = -1
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].conjunto_id === conjuntoId) lastIdx = i
      }
      if (lastIdx === -1) return [...prev, ...newPieces]
      return [...prev.slice(0, lastIdx + 1), ...newPieces, ...prev.slice(lastIdx + 1)]
    })
    setDuplicateConjuntoPrompt(null)
    setEditModalLockedConjunto(true)
    setEditModal(newPieces[0].id)
    setSaveStatus('idle')
    clearPublicationFieldHighlights()
    window.setTimeout(() => {
      document.getElementById(`conjunto-row-${newConjuntoId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  function openConjuntoEditModal(conjuntoId: string) {
    const piece = rows.find((r) => r.conjunto_id === conjuntoId)
    if (piece) openEditModal(piece.id)
  }

  function focusPublicationFieldsInModal(
    editRowId: string,
    missing: PublicationMissingResult,
    keepModalOpen = false,
  ) {
    if (!keepModalOpen || editModal !== editRowId) {
      openEditModal(editRowId)
    }
    setHighlightPublicationFields(missing.fields)
    setPublicationFocusPieceId(missing.focusPieceId ?? null)
    setExibirSitePrompt(null)
  }

  function clearPublicationFieldHighlights() {
    setHighlightPublicationFields([])
    setPublicationFocusPieceId(null)
  }

  function updateConjunto(conjuntoId: string, changes: { codigo?: string; nome?: string }) {
    setConjuntosData((prev) => {
      const next = new Map(prev)
      const c = next.get(conjuntoId) ?? defaultConjuntoData()
      next.set(conjuntoId, {
        ...c,
        codigo: changes.codigo !== undefined ? changes.codigo : c.codigo,
        nome: changes.nome !== undefined ? changes.nome : c.nome,
        dirty: true,
      })
      return next
    })
    setRows((prev) => prev.map((r) => {
      if (r.conjunto_id !== conjuntoId) return r
      const patch: Partial<PecaRow> = { dirty: true }
      if (changes.codigo !== undefined) patch.conjunto_codigo = changes.codigo
      if (changes.nome !== undefined) patch.conjunto_nome = changes.nome
      return { ...r, ...patch }
    }))
    setSaveStatus('idle')
  }

  // ── Conjunto data mutations ────────────────────────────────────────────────

  function updateConjuntoData(id: string, changes: Partial<ConjuntoData>) {
    const prevCdata = conjuntosData.get(id)
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(id, { ...(next.get(id) ?? defaultConjuntoData()), ...changes, dirty: true })
      return next
    })
    if (changes.status !== undefined) {
      const prevStatus = prevCdata?.status ?? ''
      setRows((prevRows) => prevRows.map((r) => {
        if (r.conjunto_id !== id) return r
        if (r.status === '' || r.status === prevStatus) {
          return { ...r, status: changes.status!, dirty: true }
        }
        return r
      }))
    }
    setSaveStatus('idle')
  }

  function conjuntoStatusForPieces(conjuntoId: string, fallback = ''): string {
    const cdata = conjuntosData.get(conjuntoId)
    if (cdata?.status) return cdata.status
    const ref = rows.find((r) => r.conjunto_id === conjuntoId)
    return ref?.status || fallback
  }

  // ── Conjunto membership ────────────────────────────────────────────────────

  /** Publicação na loja fica na linha do conjunto; status da peça é pré-preenchido com o do conjunto. */
  const clearPecaSiteFields = (conjuntoStatus = ''): Pick<PecaRow, 'status' | 'descricao' | 'exibir_no_site' | 'destaque_home' | 'fenearte' | 'categoria'> => ({
    status: conjuntoStatus, descricao: '', exibir_no_site: false, destaque_home: false, fenearte: false, categoria: '',
  })

  function tryToggleDestaquePeca(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row || row.conjunto_id) return
    if (row.destaque_home) {
      setDestaqueLimitMsg(null)
      update(id, { destaque_home: false })
      return
    }
    if (countDestaquesAtivos(rows, conjuntosData, id) >= MAX_DESTAQUES_HOME) {
      setDestaqueLimitMsg(DESTAQUE_LIMIT_MSG)
      return
    }
    setDestaqueLimitMsg(null)
    update(id, { destaque_home: true })
  }

  function tryToggleDestaqueConjunto(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    if (cdata.destaque_home) {
      setDestaqueLimitMsg(null)
      updateConjuntoData(conjuntoId, { destaque_home: false })
      return
    }
    if (countDestaquesAtivos(rows, conjuntosData, conjuntoId) >= MAX_DESTAQUES_HOME) {
      setDestaqueLimitMsg(DESTAQUE_LIMIT_MSG)
      return
    }
    setDestaqueLimitMsg(null)
    updateConjuntoData(conjuntoId, { destaque_home: true })
  }

  function applyExibirPeca(id: string, value: boolean) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    setDestaqueLimitMsg(null)
    update(id, { exibir_no_site: value, destaque_home: value ? row.destaque_home : false })
  }

  function applyExibirConjunto(conjuntoId: string, value: boolean) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    setDestaqueLimitMsg(null)
    updateConjuntoData(conjuntoId, { exibir_no_site: value, destaque_home: value ? cdata.destaque_home : false })
  }

  function requestExibirPeca(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return

    if (row.exibir_no_site) {
      applyExibirPeca(id, false)
      return
    }

    const { custoTotal } = calcRowCosts(
      row, custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const missing = getMissingPublicationFieldsPeca(row, custoTotal, margemVendaConfig)
    if (missing.fields.length === 0) {
      applyExibirPeca(id, true)
      return
    }

    setPublicationWarning({
      missingFields: missing.fields,
      onAdjust: () => {
        setPublicationWarning(null)
        focusPublicationFieldsInModal(id, missing, editModal === id)
      },
      onProceed: () => {
        setPublicationWarning(null)
        clearPublicationFieldHighlights()
        applyExibirPeca(id, true)
      },
    })
  }

  function requestExibirConjunto(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()

    if (cdata.exibir_no_site) {
      applyExibirConjunto(conjuntoId, false)
      return
    }

    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    const ref = pieces[0]
    const pricing = calcConjuntoPricing(
      pieces,
      quantidadeMapForConjunto(conjuntoLinks, conjuntoId),
      margemVendaConfig, cdata.preco_praticado,
      custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const missing = getMissingPublicationFieldsConjunto(
      cdata,
      getConjuntoCodigo(conjuntoId),
      getConjuntoNome(conjuntoId),
      pieces,
      pricing.precoSugerido,
      pricing.totalArgilaKg,
    )
    if (missing.fields.length === 0) {
      applyExibirConjunto(conjuntoId, true)
      return
    }

    const first = pieces[0]
    setPublicationWarning({
      missingFields: missing.fields,
      onAdjust: () => {
        setPublicationWarning(null)
        if (first) focusPublicationFieldsInModal(first.id, missing, editModal === first.id)
      },
      onProceed: () => {
        setPublicationWarning(null)
        clearPublicationFieldHighlights()
        applyExibirConjunto(conjuntoId, true)
      },
    })
  }

  function createConjuntoFromSelection(rowIds: string[], codigo: string, nome: string) {
    if (rowIds.length < 2) return
    const codigoCheck = validateConjuntoCodigoUnique(codigo, buildCodigoLists())
    if (!codigoCheck.ok) {
      setFormConjuntoError(codigoCheck.error)
      return
    }
    setFormConjuntoError(null)
    const conjuntoId = crypto.randomUUID()
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(conjuntoId, {
        ...defaultConjuntoData(),
        codigo: codigoCheck.canonical,
        nome,
        dirty: true,
      })
      return next
    })
    setRows((prev) => prev.map((r) => {
      const idx = rowIds.indexOf(r.id)
      if (idx === -1) return r
      if (r.conjunto_id) return r
      return {
        ...r,
        ...clearPecaSiteFields(conjuntoStatusForPieces(conjuntoId, '')),
        ordem: idx,
        conjunto_id: conjuntoId,
        conjunto_codigo: codigoCheck.canonical,
        conjunto_nome: nome,
        dirty: true,
      }
    }))
    setConjuntoLinks((prev) => {
      let next = prev
      rowIds.forEach((pecaId, idx) => {
        next = addLink(next, conjuntoId, pecaId, idx)
      })
      return next
    })
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      rowIds.forEach((id) => next.delete(`row:${id}`))
      return next
    })
    setFormConjuntoModal(null)
    setSaveStatus('idle')
    window.setTimeout(() => {
      document.getElementById(`conjunto-row-${conjuntoId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 150)
  }

  function addAvulsasToConjunto(conjuntoId: string, rowIds: string[]) {
    if (rowIds.length === 0) return

    const meta = conjuntoMetaById.get(conjuntoId) ?? getConjuntoMeta(conjuntoId, rows)
    const existing = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    const pieceStatus = conjuntoStatusForPieces(conjuntoId)

    const toAdd = rowIds.filter((pecaId) => {
      const row = rows.find((r) => r.id === pecaId)
      return row && !pecaInConjunto(pecaId, conjuntoId, row, conjuntoLinks)
    })
    if (toAdd.length === 0) return

    setConjuntoLinks((prev) => {
      let next = prev
      toAdd.forEach((pecaId, idx) => {
        next = addLink(next, conjuntoId, pecaId, existing.length + idx)
      })
      return next
    })
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))

    setRows((prev) => prev.map((r) => {
      if (!toAdd.includes(r.id)) return r
      // Peça já pertence a outro conjunto — mantém conjunto primário; vínculo extra via conjuntoLinks.
      if (r.conjunto_id) return r
      return {
        ...r,
        ...clearPecaSiteFields(pieceStatus),
        ordem: existing.length + toAdd.indexOf(r.id),
        conjunto_id: conjuntoId,
        conjunto_codigo: meta.codigo,
        conjunto_nome: meta.nome,
        dirty: true,
      }
    }))
    setAvulsasPicker(null)
    focusConjuntoPiece(toAdd[0])
    setSaveStatus('idle')
  }

  function setConjuntoPieceQuantidade(conjuntoId: string, pecaId: string, quantidade: number) {
    setConjuntoLinks((prev) => updateLinkQuantidade(prev, conjuntoId, pecaId, quantidade))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setSaveStatus('idle')
  }

  function openAddPieceToConjuntoPicker(conjuntoId: string) {
    setAvulsasPicker({ conjuntoId })
  }

  function createConjunto(rowId: string, codigo: string, nome: string): string | null {
    const codigoCheck = validateConjuntoCodigoUnique(codigo, buildCodigoLists(rowId))
    if (!codigoCheck.ok) return codigoCheck.error
    const conjuntoId = crypto.randomUUID()
    const pieceStatus = conjuntoStatusForPieces(conjuntoId)
    setRows((prev) => prev.map((r) => r.id === rowId
      ? { ...r, conjunto_id: conjuntoId, conjunto_codigo: codigoCheck.canonical, conjunto_nome: nome, ...clearPecaSiteFields(pieceStatus), dirty: true }
      : r))
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(conjuntoId, {
        ...defaultConjuntoData(),
        codigo: codigoCheck.canonical,
        nome,
        dirty: true,
      })
      return next
    })
    setConjuntoLinks((prev) => addLink(prev, conjuntoId, rowId, 0))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setSaveStatus('idle')
    return null
  }

  function joinConjunto(rowId: string, conjuntoId: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row || pecaInConjunto(rowId, conjuntoId, row, conjuntoLinks)) return
    const meta = conjuntoMetaById.get(conjuntoId) ?? getConjuntoMeta(conjuntoId, rows)
    const pieceStatus = conjuntoStatusForPieces(conjuntoId)
    const existing = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    setConjuntoLinks((prev) => addLink(prev, conjuntoId, rowId, existing.length))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r
      if (r.conjunto_id) return r
      return {
        ...r,
        ...clearPecaSiteFields(pieceStatus),
        ordem: existing.length,
        conjunto_id: conjuntoId,
        conjunto_codigo: meta.codigo,
        conjunto_nome: meta.nome,
        dirty: true,
      }
    }))
    setSaveStatus('idle')
  }

  function leaveConjunto(rowId: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row?.conjunto_id) return
    const conjuntoId = row.conjunto_id
    const outros = pecaConjuntoIds(rowId, row, conjuntoLinks).filter((id) => id !== conjuntoId)
    setConjuntoLinks((prev) => removeLink(prev, conjuntoId, rowId))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    if (outros.length > 0) {
      const nextPrimary = outros[0]
      const meta = conjuntoMetaById.get(nextPrimary) ?? getConjuntoMeta(nextPrimary, rows)
      setRows((prev) => prev.map((r) => r.id === rowId
        ? { ...r, conjunto_id: nextPrimary, conjunto_codigo: meta.codigo, conjunto_nome: meta.nome, dirty: true }
        : r))
    } else {
      setRows((prev) => prev.map((r) => r.id === rowId
        ? { ...r, conjunto_id: null, conjunto_codigo: '', conjunto_nome: '', dirty: true }
        : r))
    }
    setSaveStatus('idle')
  }

  function openAddPecaForm(conjuntoId?: string) {
    if (conjuntoId) {
      openAddPieceToConjuntoPicker(conjuntoId)
      return
    }
    const newRow = { ...emptyRow(), codigo: '', categoria: '' }
    setEditModalLockedConjunto(false)
    setEditModalConjuntoId(null)
    setRows((prev) => [...prev, newRow])
    setEditModal(newRow.id)
    setSaveStatus('idle')
  }

  function isRowEmpty(r: PecaRow) {
    return !r.codigo.trim() && !r.nome.trim() && r.fotos.length === 0 && r.fotosNovas.length === 0
  }

  function closeEditModal() {
    const id = editModal

    if (id && sameCodeDuplicateSession?.draftPecaIds.includes(id)) {
      revertSameCodeDuplicateSession()
      setEditModal(null)
      setEditModalLockedConjunto(false)
      setExibirSitePrompt(null)
      setModalSaveError(null)
      setScrollToPieceId(null)
      setHighlightPieceId(null)
      clearPublicationFieldHighlights()
      return
    }

    if (id) {
      const row = rows.find((r) => r.id === id)
      if (row?.isNew) {
        const sessionRows = row.conjunto_id
          ? rows.filter((r) => r.conjunto_id === row.conjunto_id && r.isNew)
          : [row]
        const allEmpty = sessionRows.every(isRowEmpty)
        if (allEmpty) {
          const removeIds = new Set(sessionRows.map((r) => r.id))
          setRows((prev) => prev.filter((r) => !removeIds.has(r.id)))
          if (row.conjunto_id) {
            setConjuntosData((prev) => {
              const next = new Map(prev)
              next.delete(row.conjunto_id!)
              return next
            })
          }
        }
      }
    }
    if (editModalConjuntoId) {
      const pieces = getConjuntoPiecesFromRows(rows, editModalConjuntoId, conjuntoLinks)
      if (pieces.length === 0) {
        setConjuntosData((prev) => {
          const next = new Map(prev)
          next.delete(editModalConjuntoId)
          return next
        })
      }
      setEditModalConjuntoId(null)
    }
    setEditModal(null)
    setEditModalLockedConjunto(false)
    setExibirSitePrompt(null)
    setModalSaveError(null)
    setScrollToPieceId(null)
    setHighlightPieceId(null)
    clearPublicationFieldHighlights()
  }

  function suggestNewConjuntoCodigo(): string {
    return suggestNextConjuntoCodigo(getAllCodigoStrings())
  }

  function createConjuntoDraft(): string {
    const conjuntoId = crypto.randomUUID()
    const suggestedCodigo = suggestNewConjuntoCodigo()
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(conjuntoId, {
        ...defaultConjuntoData(),
        codigo: suggestedCodigo,
        nome: '',
        dirty: true,
      })
      return next
    })
    setEditModalConjuntoId(conjuntoId)
    setSaveStatus('idle')
    return conjuntoId
  }

  function enableConjuntoOnRow(rowId: string) {
    const row = rows.find((r) => r.id === rowId)
    if (row?.conjunto_id) return
    const conjuntoId = crypto.randomUUID()
    const suggestedCodigo = suggestNewConjuntoCodigo()
    const pieceStatus = conjuntoStatusForPieces(conjuntoId)
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(conjuntoId, {
        ...defaultConjuntoData(),
        codigo: suggestedCodigo,
        nome: '',
        dirty: true,
      })
      return next
    })
    setRows((prev) => prev.map((r) => r.id === rowId
      ? { ...r, conjunto_id: conjuntoId, conjunto_codigo: suggestedCodigo, conjunto_nome: '', ...clearPecaSiteFields(pieceStatus), dirty: true }
      : r))
    setConjuntoLinks((prev) => addLink(prev, conjuntoId, rowId, 0))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setSaveStatus('idle')
  }

  function clearConjuntoDraft() {
    if (!editModalConjuntoId) return
    const draftId = editModalConjuntoId
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.delete(draftId)
      return next
    })
    setConjuntoLinks((prev) => prev.filter((l) => l.conjunto_id !== draftId))
    setEditModalConjuntoId(null)
    setSaveStatus('idle')
  }

  function clearConjuntoOnRow(rowId: string) {
    const row = rows.find((r) => r.id === rowId)
    if (!row?.conjunto_id) return
    const cid = row.conjunto_id
    const sessionNew = rows.filter((r) => r.conjunto_id === cid && r.isNew)
    setRows((prev) => prev.map((r) =>
      r.conjunto_id === cid && r.isNew
        ? { ...r, conjunto_id: null, conjunto_codigo: '', conjunto_nome: '', dirty: true }
        : r))
    if (sessionNew.length > 0) {
      setConjuntosData((prev) => {
        const next = new Map(prev)
        next.delete(cid)
        return next
      })
    } else {
      leaveConjunto(rowId)
    }
    setSaveStatus('idle')
  }

  function addAnotherPieceInModal(conjuntoId: string) {
    const meta = conjuntoMetaById.get(conjuntoId) ?? getConjuntoMeta(conjuntoId, rows)
    const cdata = conjuntosData.get(conjuntoId)
    const existing = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    const ref = rows.find((r) => r.conjunto_id === conjuntoId) ?? existing[0]
    const categoria = cdata?.categoria || ref?.categoria || ''
    const newRow: PecaRow = {
      ...emptyRow(conjuntoId, meta.codigo, meta.nome, conjuntoStatusForPieces(conjuntoId, ref?.status ?? '')),
      ordem: existing.length,
      categoria,
      codigo: suggestNewPecaCodigo(conjuntoId, categoria),
    }
    setRows((prev) => [...prev, newRow])
    setConjuntoLinks((prev) => addLink(prev, conjuntoId, newRow.id, existing.length))
    setDirtyConjuntoLinkIds((prev) => new Set(prev).add(conjuntoId))
    setEditModalLockedConjunto(true)
    setEditModal(newRow.id)
    focusConjuntoPiece(newRow.id)
    setSaveStatus('idle')
  }

  function removePieceFromModal(pieceId: string, activeConjuntoId: string) {
    void removePieceFromModalAsync(pieceId, activeConjuntoId)
  }

  async function removePieceFromModalAsync(pieceId: string, activeConjuntoId: string) {
    const row = rows.find((r) => r.id === pieceId)
    if (!row || !pecaInConjunto(pieceId, activeConjuntoId, row, conjuntoLinks)) return

    const count = getConjuntoPiecesFromRows(rows, activeConjuntoId, conjuntoLinks).length
    if (count <= 1) return

    const nextLinks = removeLink(conjuntoLinks, activeConjuntoId, pieceId)

    if (row.isNew && row.conjunto_id === activeConjuntoId) {
      row.fotosNovas.forEach((f) => URL.revokeObjectURL(f.preview))
      setConjuntoLinks(nextLinks)
      setDirtyConjuntoLinkIds((prev) => new Set(prev).add(activeConjuntoId))
      setRows((prev) => prev.filter((r) => r.id !== pieceId))
      if (editModal === pieceId) {
        const remaining = getConjuntoPiecesFromRows(
          rows.filter((r) => r.id !== pieceId),
          activeConjuntoId,
          nextLinks,
        )
        setEditModal(remaining[0]?.id ?? null)
      }
      setSaveStatus('idle')
      return
    }

    if (row.conjunto_id === activeConjuntoId) {
      const outros = pecaConjuntoIds(pieceId, row, nextLinks)
      setConjuntoLinks(nextLinks)
      setDirtyConjuntoLinkIds((prev) => new Set(prev).add(activeConjuntoId))
      setRows((prev) => prev.map((r) => {
        if (r.id !== pieceId) return r
        if (outros.length > 0) {
          const nextPrimary = outros[0]
          const meta = conjuntoMetaById.get(nextPrimary) ?? getConjuntoMeta(nextPrimary, prev)
          return {
            ...r,
            conjunto_id: nextPrimary,
            conjunto_codigo: meta.codigo,
            conjunto_nome: meta.nome,
            dirty: true,
          }
        }
        return { ...r, conjunto_id: null, conjunto_codigo: '', conjunto_nome: '', dirty: true }
      }))
    } else {
      setConjuntoLinks(nextLinks)
      setDirtyConjuntoLinkIds((prev) => new Set(prev).add(activeConjuntoId))
    }

    setSaveStatus('idle')
    if (editModal === pieceId) {
      const remaining = getConjuntoPiecesFromRows(rows, activeConjuntoId, nextLinks)
      setEditModal(remaining[0]?.id ?? null)
      if (remaining.length === 0) closeEditModal()
    }
  }

  // ── Foto mutations (peças) ─────────────────────────────────────────────────

  function addFotos(rowId: string, files: FileList) {
    const pending = Array.from(files).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, fotosNovas: [...r.fotosNovas, ...pending], dirty: true } : r))
    setSaveStatus('idle')
  }
  function removeExistingFoto(rowId: string, index: number) {
    setRows((prev) => prev.map((r) => r.id === rowId ? { ...r, fotos: r.fotos.filter((_, i) => i !== index), dirty: true } : r))
  }
  function removeNewFoto(rowId: string, index: number) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r
      const removed = r.fotosNovas[index]; if (removed) URL.revokeObjectURL(removed.preview)
      return { ...r, fotosNovas: r.fotosNovas.filter((_, i) => i !== index), dirty: true }
    }))
  }
  function setPrincipalFoto(rowId: string, index: number, isNew: boolean) {
    setRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r
      if (!isNew) { const fotos = [...r.fotos]; const [item] = fotos.splice(index, 1); fotos.unshift(item); return { ...r, fotos, novaPrincipal: false, dirty: true } }
      else { const fotosNovas = [...r.fotosNovas]; const [item] = fotosNovas.splice(index, 1); fotosNovas.unshift(item); return { ...r, fotosNovas, novaPrincipal: true, dirty: true } }
    }))
  }

  // ── Foto mutations (conjuntos) ─────────────────────────────────────────────

  function addConjuntoFotos(conjuntoId: string, files: FileList) {
    const pending = Array.from(files).map((file) => ({ file, preview: URL.createObjectURL(file) }))
    updateConjuntoData(conjuntoId, {
      fotosNovas: [...(conjuntosData.get(conjuntoId)?.fotosNovas ?? []), ...pending],
    })
  }
  function removeConjuntoExistingFoto(conjuntoId: string, index: number) {
    const cdata = conjuntosData.get(conjuntoId); if (!cdata) return
    updateConjuntoData(conjuntoId, { fotos: cdata.fotos.filter((_, i) => i !== index) })
  }
  function removeConjuntoNewFoto(conjuntoId: string, index: number) {
    const cdata = conjuntosData.get(conjuntoId); if (!cdata) return
    const removed = cdata.fotosNovas[index]; if (removed) URL.revokeObjectURL(removed.preview)
    updateConjuntoData(conjuntoId, { fotosNovas: cdata.fotosNovas.filter((_, i) => i !== index) })
  }
  function setConjuntoPrincipalFoto(conjuntoId: string, index: number, isNew: boolean) {
    const cdata = conjuntosData.get(conjuntoId); if (!cdata) return
    if (!isNew) {
      const fotos = [...cdata.fotos]; const [item] = fotos.splice(index, 1); fotos.unshift(item)
      updateConjuntoData(conjuntoId, { fotos, novaPrincipal: false })
    } else {
      const fotosNovas = [...cdata.fotosNovas]; const [item] = fotosNovas.splice(index, 1); fotosNovas.unshift(item)
      updateConjuntoData(conjuntoId, { fotosNovas, novaPrincipal: true })
    }
  }

  function handlePecaThumbClick(row: PecaRow) {
    const fotos = getPecaFotoSrcs(row)
    if (fotos.length > 0) {
      setFotoPreview({
        fotos,
        initialIndex: 0,
        titulo: pecaFotoTitulo(row),
        onManage: () => setFotoModal({ type: 'peca', id: row.id }),
      })
    } else {
      directInputRefs.current.get(row.id)?.click()
    }
  }
  function handleConjuntoThumbClick(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const fotos = getConjuntoFotoSrcs(cdata)
    if (fotos.length > 0) {
      const ref = rows.find((r) => r.conjunto_id === conjuntoId)
      const titulo = [ref?.conjunto_codigo, ref?.conjunto_nome].filter(Boolean).join(' — ') || 'Conjunto'
      setFotoPreview({
        fotos,
        initialIndex: 0,
        titulo,
        onManage: () => setFotoModal({ type: 'conjunto', id: conjuntoId }),
      })
    } else {
      conjuntoInputRefs.current.get(conjuntoId)?.click()
    }
  }

  function previewPecaFotos(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const fotos = getPecaFotoSrcs(row)
    if (fotos.length === 0) return
    setFotoPreview({
      fotos,
      initialIndex: 0,
      titulo: pecaFotoTitulo(row),
      onManage: () => setFotoModal({ type: 'peca', id: row.id }),
    })
  }

  function previewConjuntoFotos(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const fotos = getConjuntoFotoSrcs(cdata)
    if (fotos.length === 0) return
    const ref = rows.find((r) => r.conjunto_id === conjuntoId)
    const titulo = [ref?.conjunto_codigo, ref?.conjunto_nome].filter(Boolean).join(' — ') || 'Conjunto'
    setFotoPreview({
      fotos,
      initialIndex: 0,
      titulo,
      onManage: () => setFotoModal({ type: 'conjunto', id: conjuntoId }),
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  function removeConjuntoFromState(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId)
    if (cdata) cdata.fotosNovas.forEach((f) => URL.revokeObjectURL(f.preview))
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.delete(conjuntoId)
      return next
    })
  }

  async function deleteConjuntoFromDb(conjuntoId: string, snapshotRows: PecaRow[]) {
    const pieces = getConjuntoPiecesFromRows(snapshotRows, conjuntoId, conjuntoLinks)
    const hadPersisted = conjuntosData.has(conjuntoId)
      || pieces.some((p) => !p.isNew)
      || snapshotRows.some((r) => r.conjunto_id === conjuntoId && !r.isNew)
    if (hadPersisted) {
      const result = await deletarConjunto(conjuntoId)
      if (!result.ok) throw new Error(result.error ?? 'Erro ao excluir conjunto')
    }
    removeConjuntoFromState(conjuntoId)
    setConjuntoLinks((prev) => prev.filter((l) => l.conjunto_id !== conjuntoId))
    return snapshotRows.map((r) => {
      if (r.conjunto_id !== conjuntoId) return r
      const outros = pecaConjuntoIds(r.id, r, conjuntoLinks).filter((id) => id !== conjuntoId)
      if (outros.length === 0) {
        return { ...r, conjunto_id: null, conjunto_codigo: '', conjunto_nome: '' }
      }
      const nextPrimary = outros[0]
      const meta = getConjuntoMeta(nextPrimary, snapshotRows)
      return { ...r, conjunto_id: nextPrimary, conjunto_codigo: meta.codigo, conjunto_nome: meta.nome }
    })
  }

  async function deletePecaFromDb(id: string, snapshotRows: PecaRow[]) {
    const row = snapshotRows.find((r) => r.id === id)
    if (!row) return snapshotRows
    if (!row.isNew) {
      const result = await deletarPeca(id)
      if (!result.ok) throw new Error(result.error ?? 'Erro ao excluir peça')
    }
    row.fotosNovas.forEach((f) => URL.revokeObjectURL(f.preview))
    let updatedRows = snapshotRows.filter((r) => r.id !== id)
    if (row.conjunto_id) {
      const remaining = updatedRows.filter((r) => r.conjunto_id === row.conjunto_id)
      if (remaining.length === 0) {
        const hadPersisted = snapshotRows.some((r) => r.conjunto_id === row.conjunto_id && !r.isNew)
        if (hadPersisted) {
          const result = await deletarConjunto(row.conjunto_id)
          if (!result.ok) throw new Error(result.error ?? 'Erro ao excluir conjunto')
        }
        removeConjuntoFromState(row.conjunto_id)
      }
    }
    return updatedRows
  }

  async function handleDelete(id: string) {
    const updatedRows = await deletePecaFromDb(id, rows)
    setRows(updatedRows)
    if (editModal === id) closeEditModal()
  }

  async function handleDeleteConjunto(conjuntoId: string) {
    const updatedRows = await deleteConjuntoFromDb(conjuntoId, rows)
    setRows(updatedRows)
    const editingInConjunto = editModal && rows.some((r) => r.id === editModal && r.conjunto_id === conjuntoId)
    if (editingInConjunto) closeEditModal()
  }

  async function handleBulkDelete() {
    const plan = bulkDeletionPlan
    if (plan.pecaCount === 0) return
    setBulkDeleting(true)
    try {
      let updatedRows = rows
      for (const conjuntoId of plan.conjuntoIds) {
        updatedRows = await deleteConjuntoFromDb(conjuntoId, updatedRows)
      }
      for (const id of plan.pecaIds) {
        updatedRows = await deletePecaFromDb(id, updatedRows)
      }
      setRows(updatedRows)
      clearSelection()
      setConfirmBulkDelete(false)
      setSaveStatus('idle')
      if (editModal) {
        const editRow = rows.find((r) => r.id === editModal)
        const removed = !updatedRows.some((r) => r.id === editModal)
          || (editRow?.conjunto_id && plan.conjuntoIds.includes(editRow.conjunto_id))
        if (removed) closeEditModal()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setBulkDeleting(false)
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  type SupabaseClient = Awaited<ReturnType<typeof createClient>>

  async function uploadPecaFotos(supabase: SupabaseClient, row: PecaRow): Promise<string[]> {
    const uploadedUrls: string[] = []
    for (const { file } of row.fotosNovas) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `pecas/${row.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadError } = await supabase.storage.from('produtos').upload(path, file, { upsert: false })
      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
      if (data) {
        const { data: pub } = supabase.storage.from('produtos').getPublicUrl(data.path)
        uploadedUrls.push(pub.publicUrl)
      }
    }
    return (row.novaPrincipal && uploadedUrls.length > 0)
      ? [uploadedUrls[0], ...row.fotos, ...uploadedUrls.slice(1)]
      : [...row.fotos, ...uploadedUrls]
  }

  async function uploadConjuntoFotos(supabase: SupabaseClient, conjuntoId: string, cdata: ConjuntoData): Promise<string[]> {
    const uploadedUrls: string[] = []
    for (const { file } of cdata.fotosNovas) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `conjuntos/${conjuntoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error: uploadError } = await supabase.storage.from('produtos').upload(path, file, { upsert: false })
      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)
      if (data) {
        const { data: pub } = supabase.storage.from('produtos').getPublicUrl(data.path)
        uploadedUrls.push(pub.publicUrl)
      }
    }
    return (cdata.novaPrincipal && uploadedUrls.length > 0)
      ? [uploadedUrls[0], ...cdata.fotos, ...uploadedUrls.slice(1)]
      : [...cdata.fotos, ...uploadedUrls]
  }

  async function persistPecaRow(supabase: SupabaseClient, row: PecaRow): Promise<string[]> {
    const allFotos = await uploadPecaFotos(supabase, row)
    const emConjunto = !!row.conjunto_id
    const { custoTotal } = calcRowCosts(
      row, custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const pricing = buildPecaPricing(row, custoTotal, margemVendaConfig)
    const precoPraticado = row.preco_praticado !== ''
      ? parseFloat(row.preco_praticado) || null
      : (pricing.precoSugerido > 0 ? pricing.precoSugerido : null)
    const pinturaQtd = resolvePinturaQuantitiesForSave(row, esmalteItems, engobeItems, tintaItems)
    const result = await salvarPeca({
      id: row.id, codigo: row.codigo, nome: row.nome, dimensoes: row.dimensoes,
      descricao: emConjunto ? null : (row.descricao || null),
      status: row.status,
      exibir_no_site: emConjunto ? false : row.exibir_no_site,
      destaque_home: emConjunto ? false : row.destaque_home,
      fenearte: emConjunto ? false : row.fenearte,
      peso: pesoGramsFromArgilaKg(nv(row.qnt_argila_kg)),
      categoria: emConjunto ? '' : row.categoria,
      area_pintura: row.area_pintura !== '' ? parseFloat(row.area_pintura) : null,
      execucao_h:   row.execucao_h   !== '' ? parseFloat(row.execucao_h)   : null,
      fotos: allFotos,
      tipo_embalagem: row.tipo_embalagem, tipo_argila: row.tipo_argila,
      qnt_argila_kg:  row.qnt_argila_kg  !== '' ? parseFloat(row.qnt_argila_kg)  : null,
      esmalte_qnt_gr: pinturaQtd.esmalte_qnt_gr,
      engobe_qnt_gr:  pinturaQtd.engobe_qnt_gr,
      tinta_qnt_gr:   pinturaQtd.tinta_qnt_gr,
      tipo_biscoito: row.tipo_biscoito, tipo_queima: row.tipo_queima,
      custo_extra:     row.custo_extra     !== '' ? parseFloat(row.custo_extra)     : null,
      margem_venda:    pricing.margem,
      preco_venda:     pricing.precoSugerido > 0 ? pricing.precoSugerido : null,
      preco_praticado: precoPraticado,
      ordem: row.ordem,
      conjunto_id: row.conjunto_id,
      conjunto_codigo: row.conjunto_codigo || null,
      conjunto_nome:   row.conjunto_nome   || null,
      valor_venda: row.status === 'vendido' && row.valor_venda !== ''
        ? parseFloat(row.valor_venda) || null
        : null,
      local_venda: row.status === 'vendido' ? (row.local_venda || null) : null,
      cliente_nome: row.status === 'vendido' ? (row.cliente_nome || null) : null,
      cliente_telefone: row.status === 'vendido' ? (row.cliente_telefone || null) : null,
      cliente_email: row.status === 'vendido' ? (row.cliente_email || null) : null,
      vendido_em: row.status === 'vendido' ? (row.vendido_em ?? new Date().toISOString()) : null,
    })
    if (!result.ok) throw new Error(result.error ?? 'Erro ao salvar no banco')
    if (result.warning) setMigrationWarning(result.warning)
    row.fotosNovas.forEach((f) => URL.revokeObjectURL(f.preview))
    return allFotos
  }

  async function persistConjunto(
    supabase: SupabaseClient,
    conjuntoId: string,
    cdata: ConjuntoData,
    conjuntoRows: PecaRow[],
  ): Promise<string[]> {
    const allFotos = await uploadConjuntoFotos(supabase, conjuntoId, cdata)
    const pricing = calcConjuntoPricing(
      conjuntoRows,
      quantidadeMapForConjunto(conjuntoLinks, conjuntoId),
      margemVendaConfig, cdata.preco_praticado,
      custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const precoPraticado = cdata.preco_praticado !== ''
      ? parseFloat(cdata.preco_praticado) || null
      : (pricing.precoSugerido > 0 ? pricing.precoSugerido : null)
    const refRow = conjuntoRows[0]
    const result = await salvarConjunto({
      id: conjuntoId,
      codigo: cdata.codigo || refRow?.conjunto_codigo || '',
      nome: cdata.nome || refRow?.conjunto_nome || '',
      descricao: cdata.descricao || null,
      status: cdata.status,
      exibir_no_site: cdata.exibir_no_site,
      destaque_home: cdata.destaque_home,
      fenearte: cdata.fenearte,
      categoria: cdata.categoria,
      fotos: allFotos,
      margem_venda: pricing.margem,
      preco_venda: pricing.precoSugerido > 0 ? pricing.precoSugerido : null,
      preco_praticado: precoPraticado,
      preco_total: pricing.precoSugerido > 0 ? pricing.precoSugerido : null,
      peso_total: pesoGramsFromArgilaKg(pricing.totalArgilaKg),
      venda_modo: cdata.venda_modo || 'apenas_conjunto',
    })
    if (!result.ok) throw new Error(result.error ?? 'Erro ao salvar conjunto')
    if (result.warning) setMigrationWarning(result.warning)
    cdata.fotosNovas.forEach((f) => URL.revokeObjectURL(f.preview))
    return allFotos
  }

  async function persistEditModalSession(editRow: PecaRow, rowsSnapshot: PecaRow[] = rows) {
    const supabase = createClient()
    const activeConjuntoId = editRow.conjunto_id ?? editModalConjuntoId
    if (activeConjuntoId) {
      const conjuntoId = activeConjuntoId
      const pieces = getConjuntoPiecesFromRows(rowsSnapshot, conjuntoId, conjuntoLinks)
      for (const p of pieces.filter((r) => r.dirty || r.isNew)) {
        const allFotos = await persistPecaRow(supabase, p)
        setRows((prev) => prev.map((r) => r.id === p.id
          ? { ...r, fotos: allFotos, fotosNovas: [], novaPrincipal: false, isNew: false, dirty: false }
          : r))
      }
      const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
      const conjuntoNeedsSave = cdata.dirty || pieces.some((p) => p.dirty || p.isNew)
      if (conjuntoNeedsSave) {
        const allFotos = await persistConjunto(supabase, conjuntoId, cdata, pieces)
        setConjuntosData((prev) => {
          const next = new Map(prev)
          next.set(conjuntoId, { ...cdata, fotos: allFotos, fotosNovas: [], novaPrincipal: false, dirty: false })
          return next
        })
      }
      if (dirtyConjuntoLinkIds.has(conjuntoId)) {
        const linkRows = linkRowsForConjunto(conjuntoLinks, conjuntoId)
        const linkResult = await syncConjuntoPecas(conjuntoId, linkRows)
        if (!linkResult.ok) throw new Error(linkResult.error)
        setDirtyConjuntoLinkIds((prev) => {
          const next = new Set(prev)
          next.delete(conjuntoId)
          return next
        })
      }
    } else if (editRow.dirty || editRow.isNew) {
      const allFotos = await persistPecaRow(supabase, editRow)
      setRows((prev) => prev.map((r) => r.id === editRow.id
        ? { ...r, fotos: allFotos, fotosNovas: [], novaPrincipal: false, isNew: false, dirty: false }
        : r))
    }
  }

  async function finishPublishPeca(id: string) {
    const current = rows.find((r) => r.id === id)
    if (!current) return
    const rowToSave = { ...current, exibir_no_site: true, dirty: true }
    const supabase = createClient()
    const allFotos = await persistPecaRow(supabase, rowToSave)
    setRows((prev) => prev.map((r) => r.id === id
      ? { ...rowToSave, fotos: allFotos, fotosNovas: [], novaPrincipal: false, isNew: false, dirty: false }
      : r))
    setExibirSitePrompt(null)
    closeEditModal()
    setSaveStatus('ok')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  async function finishPublishConjunto(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    const cdataToSave = { ...cdata, exibir_no_site: true, dirty: true }
    const supabase = createClient()
    const allFotos = await persistConjunto(supabase, conjuntoId, cdataToSave, pieces)
    setConjuntosData((prev) => {
      const next = new Map(prev)
      next.set(conjuntoId, { ...cdataToSave, fotos: allFotos, fotosNovas: [], novaPrincipal: false, dirty: false })
      return next
    })
    setExibirSitePrompt(null)
    closeEditModal()
    setSaveStatus('ok')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  function promptPublishPeca(id: string) {
    const row = rows.find((r) => r.id === id)
    if (!row) return
    const { custoTotal } = calcRowCosts(
      row, custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const missing = getMissingPublicationFieldsPeca(row, custoTotal, margemVendaConfig)
    if (missing.fields.length > 0) {
      setPublicationWarning({
        missingFields: missing.fields,
        onAdjust: () => {
          setPublicationWarning(null)
          focusPublicationFieldsInModal(id, missing, editModal === id)
        },
        onProceed: () => {
          setPublicationWarning(null)
          clearPublicationFieldHighlights()
          finishPublishPeca(id).catch((e) => setModalSaveError(e instanceof Error ? e.message : 'Erro ao publicar'))
        },
      })
      return
    }
    finishPublishPeca(id).catch((e) => setModalSaveError(e instanceof Error ? e.message : 'Erro ao publicar'))
  }

  function promptPublishConjunto(conjuntoId: string) {
    const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
    const pieces = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
    const ref = pieces[0]
    const pricing = calcConjuntoPricing(
      pieces,
      quantidadeMapForConjunto(conjuntoLinks, conjuntoId),
      margemVendaConfig, cdata.preco_praticado,
      custoHoraMO, custoHoraFixo,
      embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
    )
    const missing = getMissingPublicationFieldsConjunto(
      cdata,
      ref?.conjunto_codigo ?? '',
      ref?.conjunto_nome ?? '',
      pieces,
      pricing.precoSugerido,
      pricing.totalArgilaKg,
    )
    if (missing.fields.length > 0) {
      const first = pieces[0]
      setPublicationWarning({
        missingFields: missing.fields,
        onAdjust: () => {
          setPublicationWarning(null)
          if (first) focusPublicationFieldsInModal(first.id, missing, editModal === first.id)
        },
        onProceed: () => {
          setPublicationWarning(null)
          clearPublicationFieldHighlights()
          finishPublishConjunto(conjuntoId).catch((e) => setModalSaveError(e instanceof Error ? e.message : 'Erro ao publicar'))
        },
      })
      return
    }
    finishPublishConjunto(conjuntoId).catch((e) => setModalSaveError(e instanceof Error ? e.message : 'Erro ao publicar'))
  }

  async function handleModalSave() {
    if (!editRowModal) return

    const session = sameCodeDuplicateSession
    let modalScope: { pecaIds?: string[]; conjuntoIds?: string[] }
    if (session?.kind === 'conjunto' && session.sourceConjuntoId && session.draftConjuntoId) {
      modalScope = {
        pecaIds: [
          ...getConjuntoPiecesFromRows(rows, session.sourceConjuntoId, conjuntoLinks).map((r) => r.id),
          ...getConjuntoPiecesFromRows(rows, session.draftConjuntoId, conjuntoLinks).map((r) => r.id),
        ],
        conjuntoIds: [session.sourceConjuntoId, session.draftConjuntoId],
      }
    } else if (session?.kind === 'peca' && session.sourcePecaId) {
      modalScope = { pecaIds: [session.sourcePecaId, ...session.draftPecaIds] }
    } else if (editRowModal.conjunto_id ?? editModalConjuntoId) {
      const activeCid = editRowModal.conjunto_id ?? editModalConjuntoId!
      modalScope = {
        pecaIds: getConjuntoPiecesFromRows(rows, activeCid, conjuntoLinks).map((r) => r.id),
        conjuntoIds: [activeCid],
      }
    } else {
      modalScope = { pecaIds: [editRowModal.id] }
    }

    const codigoErr = validateAllCodigosBeforeSave(modalScope)
    if (codigoErr) {
      setModalSaveError(codigoErr)
      return
    }
    setModalSaving(true)
    setModalSaveError(null)
    try {
      const draftRow = rows.find((r) => r.id === editRowModal.id) ?? editRowModal
      await persistEditModalSession(draftRow, rows)

      if (session?.kind === 'conjunto' && session.sourceConjuntoId && session.draftConjuntoId) {
        setRows((prev) => {
          const draftPieces = prev.filter((r) => r.conjunto_id === session.draftConjuntoId)
          const withoutDraft = prev.filter((r) => r.conjunto_id !== session.draftConjuntoId)
          let lastIdx = -1
          for (let i = 0; i < withoutDraft.length; i++) {
            if (withoutDraft[i].conjunto_id === session.sourceConjuntoId) lastIdx = i
          }
          if (lastIdx === -1) return prev
          return [...withoutDraft.slice(0, lastIdx + 1), ...draftPieces, ...withoutDraft.slice(lastIdx + 1)]
        })
      } else if (session?.kind === 'peca' && session.sourcePecaId && session.draftPecaIds[0]) {
        const draftId = session.draftPecaIds[0]
        setRows((prev) => {
          const draft = prev.find((r) => r.id === draftId)
          if (!draft) return prev
          const withoutDraft = prev.filter((r) => r.id !== draftId)
          const insertAt = findFamiliaInsertIndex(withoutDraft, session.sourcePecaId!)
          return [...withoutDraft.slice(0, insertAt), draft, ...withoutDraft.slice(insertAt)]
        })
      }

      setSameCodeDuplicateSession(null)
      setExibirSitePrompt(
        (editRowModal.conjunto_id ?? editModalConjuntoId)
          ? { type: 'conjunto', id: editRowModal.conjunto_id ?? editModalConjuntoId! }
          : { type: 'peca', id: editRowModal.id },
      )
    } catch (err) {
      setModalSaveError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setModalSaving(false)
    }
  }

  function handleExibirSiteSim() {
    if (!exibirSitePrompt) return
    const prompt = exibirSitePrompt
    setExibirSitePrompt(null)
    if (prompt.type === 'peca') promptPublishPeca(prompt.id)
    else promptPublishConjunto(prompt.id)
  }

  function handleExibirSiteNao() {
    setExibirSitePrompt(null)
    closeEditModal()
  }

  async function handleSave() {
    const codigoErr = validateAllCodigosBeforeSave()
    if (codigoErr) {
      setSaveError(codigoErr)
      setSaveStatus('error')
      return
    }
    setSaving(true); setSaveStatus('idle'); setSaveError(null)
    const supabase = createClient()
    try {
      const allConjuntoIds = new Set([
        ...collectConjuntoIds(rows, conjuntoLinks),
        ...dirtyConjuntoLinkIds,
        ...Array.from(conjuntosData.entries()).filter(([, c]) => c.dirty).map(([id]) => id),
      ])
      for (const conjuntoId of allConjuntoIds) {
        const cdata = conjuntosData.get(conjuntoId) ?? defaultConjuntoData()
        const conjuntoRows = getConjuntoPiecesFromRows(rows, conjuntoId, conjuntoLinks)
        const linksDirty = dirtyConjuntoLinkIds.has(conjuntoId)
        const conjuntoDirty = cdata.dirty || conjuntoRows.some((r) => r.dirty)
        if (!conjuntoDirty && !linksDirty) continue
        if (conjuntoDirty) {
          const allFotos = await persistConjunto(supabase, conjuntoId, cdata, conjuntoRows)
          setConjuntosData((prev) => {
            const next = new Map(prev)
            next.set(conjuntoId, { ...cdata, fotos: allFotos, fotosNovas: [], novaPrincipal: false, dirty: false })
            return next
          })
        }
        const linkRows = linkRowsForConjunto(conjuntoLinks, conjuntoId)
        const linkResult = await syncConjuntoPecas(conjuntoId, linkRows)
        if (!linkResult.ok) throw new Error(linkResult.error)
      }

      setDirtyConjuntoLinkIds((prev) => {
        const next = new Set(prev)
        for (const conjuntoId of allConjuntoIds) next.delete(conjuntoId)
        return next
      })

      for (const row of rows.filter((r) => r.dirty)) {
        const allFotos = await persistPecaRow(supabase, row)
        setRows((prev) => prev.map((r) => r.id === row.id
          ? { ...r, fotos: allFotos, fotosNovas: [], novaPrincipal: false, isNew: false, dirty: false }
          : r))
      }

      setSaveStatus('ok')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro desconhecido')
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const hasDirty = rows.some((r) => r.dirty)
    || Array.from(conjuntosData.values()).some((c) => c.dirty)
    || dirtyConjuntoLinkIds.size > 0

  // ── Foto modal targets ─────────────────────────────────────────────────────

  const pecaFotoModal = fotoModal?.type === 'peca' ? rows.find((r) => r.id === fotoModal.id) ?? null : null
  const conjuntoFotoModalId = fotoModal?.type === 'conjunto' ? fotoModal.id : null
  const conjuntoFotoModalData = conjuntoFotoModalId ? conjuntosData.get(conjuntoFotoModalId) ?? null : null

  const descricaoPecaModal = descricaoModal?.type === 'peca' ? rows.find((r) => r.id === descricaoModal.id) ?? null : null
  const descricaoConjuntoModalId = descricaoModal?.type === 'conjunto' ? descricaoModal.id : null
  const descricaoConjuntoData = descricaoConjuntoModalId ? conjuntosData.get(descricaoConjuntoModalId) ?? null : null
  const descricaoConjuntoInfo = descricaoConjuntoModalId ? conjuntos.find((c) => c.id === descricaoConjuntoModalId) : null

  const conjuntoRowModal = conjuntoModal ? rows.find((r) => r.id === conjuntoModal) ?? null : null
  const editRowModal = editModal ? rows.find((r) => r.id === editModal) ?? null : null
  const editModalActiveConjuntoId = editRowModal
    ? (editRowModal.conjunto_id ?? editModalConjuntoId)
    : null
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      {migrationWarning && (
        <div className="shrink-0 px-3 py-2 bg-amber-50 border border-amber-300 rounded-sm">
          <p className="font-sans text-xs font-semibold text-amber-900">Migração do banco pendente</p>
          <p className="font-sans text-[11px] text-amber-800 mt-0.5 leading-snug break-words">{migrationWarning}</p>
          <p className="font-sans text-[10px] text-amber-700/80 mt-1">
            Arquivo: <code className="bg-amber-100/80 px-1">supabase-fix-precificacao.sql</code> no projeto → Supabase Dashboard → SQL → Run
          </p>
        </div>
      )}

      <div className="shrink-0 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <div ref={searchDropRef} className="relative flex-1 min-w-[12rem] max-w-sm">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/50 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => { if (searchQuery.trim()) setSearchOpen(true) }}
              placeholder="Buscar peça — código ou nome…"
              aria-label="Buscar peça"
              className="w-full border border-pedra pl-8 pr-7 py-1.5 font-sans text-xs text-carvao placeholder:text-muted/40 focus:outline-none focus:border-terracota bg-white"
            />
            {searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-carvao text-base leading-none w-5 h-5 flex items-center justify-center">×</button>
            )}
          </div>
        {searchOpen && searchQuery.trim() && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-pedra shadow-lg max-h-[280px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="px-3 py-3 font-sans text-xs text-muted">Nenhum resultado para &ldquo;{searchQuery}&rdquo;</p>
            ) : (
              searchResults.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-3 py-2.5 hover:bg-areia transition-colors border-b border-pedra/30 last:border-0 flex items-start gap-2.5"
                >
                  {item.type === 'conjunto' && <span className="w-1.5 h-1.5 rounded-full bg-terracota shrink-0 mt-1.5" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-carvao">{item.codigo || '—'}</span>
                      {item.type === 'conjunto' && (
                        <span className="font-sans text-[8px] tracking-widest uppercase text-terracota">Conjunto</span>
                      )}
                    </div>
                    {item.nome && <p className="font-sans text-xs text-muted truncate mt-0.5">{item.nome}</p>}
                    {item.detail && <p className="font-sans text-[10px] text-muted/70 mt-0.5">{item.detail}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
        </div>

        {pdfError && <p className="font-sans text-[11px] text-red-600 shrink-0">{pdfError}</p>}
        <button type="button" onClick={openPdfModal} disabled={totalSelectedCount === 0}
          className="font-sans text-xs bg-carvao text-cru px-3 py-1 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ml-auto">
          Gerar PDF
        </button>
      </div>

      {destaqueLimitMsg && (
        <div className="shrink-0 px-3 py-2 bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
          <p className="font-sans text-xs text-amber-900">{destaqueLimitMsg}</p>
          <button type="button" onClick={() => setDestaqueLimitMsg(null)} className="text-amber-700 hover:text-amber-900 text-lg leading-none shrink-0">×</button>
        </div>
      )}

      <div className="shrink-0 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={selectAllVisible}
          className="font-sans text-[11px] text-carvao border border-pedra px-2 py-1 hover:bg-areia/50 transition-colors">
          Selecionar todos
        </button>
        <button type="button" onClick={clearSelection}
          className="font-sans text-[11px] text-muted border border-pedra px-2 py-1 hover:bg-areia/50 transition-colors">
          Limpar seleção
        </button>
        <button
          type="button"
          onClick={() => { setFormConjuntoError(null); setFormConjuntoModal({ rowIds: selectedAvulsaRowIds }) }}
          disabled={selectedAvulsaRowIds.length < 2}
          title={selectedAvulsaRowIds.length < 2 ? 'Selecione ao menos 2 peças' : undefined}
          className="font-sans text-[11px] text-terracota border border-terracota/50 px-2 py-1 hover:bg-terracota/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Formar conjunto ({selectedAvulsaRowIds.length})
        </button>
        <button
          type="button"
          onClick={() => setConfirmBulkDelete(true)}
          disabled={!canBulkDelete || bulkDeleting}
          title={!canBulkDelete ? 'Selecione peças ou conjuntos para excluir' : undefined}
          className="font-sans text-[11px] text-red-600 border border-red-200 px-2 py-1 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Excluir selecionados ({bulkDeletionPlan.pecaCount})
        </button>
        <div className="flex flex-wrap items-center gap-2 border border-pedra/60 px-2 py-1 bg-cru/20">
          <span className="font-sans text-[8px] tracking-widest uppercase text-muted shrink-0">Seleção</span>
          <label className="flex items-center gap-1 font-sans text-[11px] text-carvao cursor-pointer select-none">
            <input
              type="radio"
              name="pdf-selection-mode"
              checked={pdfSelectionMode === 'all'}
              onChange={() => setPdfSelectionMode('all')}
              className="accent-carvao"
            />
            Todas as peças
          </label>
          <label className="flex items-center gap-1 font-sans text-[11px] text-carvao cursor-pointer select-none">
            <input
              type="radio"
              name="pdf-selection-mode"
              checked={pdfSelectionMode === 'feira'}
              onChange={() => setPdfSelectionMode('feira')}
              className="accent-carvao"
            />
            Apenas feira
          </label>
        </div>
        <span className="font-sans text-[11px] text-muted">
          {selectedPdfCount} de {selectableKeysForMode.length} selecionado(s)
        </span>
      </div>

      <div className="flex-1 min-h-0 border border-pedra bg-white overflow-auto">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-9" />
            <col className="w-[72px]" />
            <col className="w-[4.5rem]" />
            <col />
            <col className="w-[7.5rem]" />
            <col className="w-[7.25rem]" />
            <col className="w-[4.75rem]" />
            <col className="w-[4.75rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[3.25rem]" />
            <col className="w-[3.5rem]" />
          </colgroup>
          <thead className="sticky top-0 z-30">
            <tr className="bg-[#F3F0EB] border-b border-pedra">
              <th className={`${TH} text-center ${STICKY_CHECKBOX} bg-[#F3F0EB]`}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={() => (allVisibleSelected ? clearSelection() : selectAllVisible())}
                  title="Selecionar todos na lista"
                  className="w-3.5 h-3.5 accent-carvao cursor-pointer"
                />
              </th>
              <th className={`${TH} text-left ${STICKY_FOTO} bg-[#F3F0EB]`}>Foto</th>
              <th className={`${TH} text-left`}>Cód.</th>
              <th className={`${TH} text-left`}>Nome</th>
              <th className={`${TH} text-left`}>Categoria</th>
              <th className={`${TH} text-left border-l border-pedra/60`}>Status</th>
              <th className={`${TH} text-right border-l border-pedra/60`}>Sugerido</th>
              <th className={`${TH} text-right`}>Praticado</th>
              <th className={`${TH} text-center border-l border-pedra/60`}>Site</th>
              <th className={`${TH} text-center`}>Feira</th>
              <th className={`${TH} text-center`}>Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-pedra/40">
            {tableDisplayItems.map((item, displayIdx) => {

              // ── Conjunto header row ──────────────────────────────────────
              if (item.type === 'conjunto-header') {
                const cdata = conjuntosData.get(item.conjuntoId) ?? defaultConjuntoData()
                const principalSrc = (cdata.novaPrincipal && cdata.fotosNovas.length > 0)
                  ? cdata.fotosNovas[0].preview
                  : (cdata.fotos[0] ?? cdata.fotosNovas[0]?.preview ?? null)
                const totalFotosConj = cdata.fotos.length + cdata.fotosNovas.length
                const conjPricing = calcConjuntoPricing(
                  item.rows,
                  quantidadeMapForConjunto(conjuntoLinks, item.conjuntoId),
                  margemVendaConfig, cdata.preco_praticado,
                  custoHoraMO, custoHoraFixo,
                  embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
                )
                const conjuntoUnitTotal = item.rows.reduce(
                  (sum, r) => sum + linkQuantidade(conjuntoLinks, item.conjuntoId, r.id),
                  0,
                )

                const conjHeaderBg = cdata.dirty ? CONJ_HEADER_ROW_DIRTY : CONJ_HEADER_ROW

                const conjSelectKey = displayItemKey(item)

                return (
                  <tr key={`ch-${item.conjuntoId}`} id={`conjunto-row-${item.conjuntoId}`} className={conjHeaderBg}>
                    <td className={`px-2 py-2 text-center ${STICKY_CHECKBOX} ${conjHeaderBg}`}>
                      <input
                        type="checkbox"
                        checked={selectedKeys.has(conjSelectKey)}
                        onChange={() => toggleSelectKey(conjSelectKey)}
                        className="w-3.5 h-3.5 accent-carvao cursor-pointer"
                      />
                    </td>
                    {/* Col 1: Foto + badge */}
                    <td className={`px-2 py-2 ${STICKY_FOTO} ${conjHeaderBg}`}>
                      <input
                        ref={(el) => { if (el) conjuntoInputRefs.current.set(item.conjuntoId, el); else conjuntoInputRefs.current.delete(item.conjuntoId) }}
                        type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                        onChange={(e) => { if (e.target.files?.length) { addConjuntoFotos(item.conjuntoId, e.target.files); e.target.value = ''; setFotoModal({ type: 'conjunto', id: item.conjuntoId }) } }}
                      />
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-terracota shrink-0" />
                          <span className="font-sans text-[8px] tracking-widest uppercase text-carvao font-bold">Conjunto</span>
                        </span>
                        <button type="button" onClick={() => handleConjuntoThumbClick(item.conjuntoId)}
                          title={totalFotosConj > 0 ? 'Ver foto ampliada' : 'Adicionar fotos ao conjunto'}
                          className="relative w-[52px] h-[52px] bg-white border-2 border-terracota/50 hover:border-terracota overflow-hidden transition-all group/cthumb flex items-center justify-center shrink-0 shadow-md ring-2 ring-terracota/15 cursor-zoom-in">
                          {principalSrc ? <Thumb src={principalSrc} alt="Foto do conjunto" /> : (
                            <svg className="w-4 h-4 text-terracota/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <div className="absolute inset-0 bg-carvao/0 group-hover/cthumb:bg-carvao/30 transition-colors flex items-center justify-center pointer-events-none">
                            <svg className="w-3.5 h-3.5 text-white opacity-0 group-hover/cthumb:opacity-100 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalFotosConj > 0 ? 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' : 'M12 4v16m8-8H4'} />
                            </svg>
                          </div>
                          {totalFotosConj > 1 && <span className="absolute top-0.5 right-0.5 bg-terracota text-cru font-sans text-[7px] w-3.5 h-3.5 flex items-center justify-center">{totalFotosConj}</span>}
                        </button>
                      </div>
                    </td>

                    {/* Col 2: código */}
                    <td className="px-2 py-2">
                      <CodigoField
                        value={item.conjuntoCodigo}
                        error={codigoErrors[`conjunto:${item.conjuntoId}`]}
                        placeholder="Código"
                        className="font-mono text-[11px] font-bold text-carvao bg-transparent border-b border-terracota/40 focus:border-terracota focus:outline-none w-full py-0.5"
                        onChange={(v) => handleConjuntoCodigoInput(item.conjuntoId, v)}
                        onCommit={(prev) => commitConjuntoCodigo(item.conjuntoId, prev)}
                      />
                    </td>

                    {/* Col 3: nome */}
                    <td className="px-2 py-2 min-w-0">
                      <input type="text" value={item.conjuntoNome}
                        onChange={(e) => updateConjunto(item.conjuntoId, { nome: e.target.value })}
                        placeholder="Nome do conjunto"
                        className="font-sans text-[11px] text-carvao/80 bg-transparent border-b border-transparent hover:border-terracota/30 focus:border-terracota focus:outline-none w-full truncate" />
                    </td>

                    {/* Categoria do conjunto */}
                    <td className="px-2 py-2">
                      <select
                        value={cdata.categoria}
                        onChange={(e) => handleConjuntoCategoriaChange(item.conjuntoId, e.target.value)}
                        className={tableSelectCls}
                      >
                        <option value="">—</option>
                        {CATEGORIAS_PECA.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>

                    {/* Status do conjunto */}
                    <td className="px-2 py-2 border-l border-pedra/30">
                      <select value={getConjuntoStatusDisplayValue(item.conjuntoId, cdata.status)} onChange={(e) => handleConjuntoStatusChange(item.conjuntoId, e.target.value)}
                        className={tableSelectCls}>
                        <option value="">—</option>
                        {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>

                    <td className="px-2 py-2 text-right border-l border-pedra/30">
                      {conjPricing.precoSugerido > 0
                        ? <span className="font-sans text-[11px] font-bold text-terracota tabular-nums">R$ {fmt(conjPricing.precoSugerido)}</span>
                        : <span className="font-sans text-[11px] text-muted/40">—</span>}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {(() => {
                        const isAuto = cdata.preco_praticado === '' && conjPricing.precoSugerido > 0
                        const display = isAuto ? conjPricing.precoSugerido.toFixed(2) : cdata.preco_praticado
                        return (
                          <input type="number" min="0" step="0.01" value={display}
                            onChange={(e) => updateConjuntoData(item.conjuntoId, { preco_praticado: e.target.value })}
                            placeholder="0"
                            title={isAuto ? 'Preenchido automaticamente com o preço sugerido' : undefined}
                            className={`${numInput} border-carvao/30 ${isAuto ? 'text-muted/50' : ''}`} />
                        )
                      })()}
                    </td>

                    {/* Exibir no site (conjunto) */}
                    <td className="px-1 py-2 text-center border-l border-pedra/30">
                      <div className="flex flex-col items-center gap-0.5">
                        <button type="button" onClick={() => requestExibirConjunto(item.conjuntoId)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${cdata.exibir_no_site ? 'bg-terracota' : 'bg-pedra/50'}`}>
                          <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${cdata.exibir_no_site ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        {cdata.exibir_no_site && <span className="font-sans text-[7px] text-terracota tracking-wide uppercase leading-none">Sim</span>}
                      </div>
                    </td>

                    {/* Exibição em feira (conjunto) */}
                    <td className="px-1 py-2 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <button type="button" onClick={() => updateConjuntoData(item.conjuntoId, { fenearte: !cdata.fenearte })}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${cdata.fenearte ? 'bg-amber-500' : 'bg-pedra/50'}`}>
                          <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${cdata.fenearte ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        {cdata.fenearte && <span className="font-sans text-[7px] text-amber-600 tracking-wide uppercase leading-none">Sim</span>}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-1 py-2 text-center">
                      <div className={TABLE_ACTION_STACK}>
                        <button type="button" onClick={() => openConjuntoEditModal(item.conjuntoId)}
                          className={TABLE_ACTION_EDIT}>
                          Editar
                        </button>
                        <button type="button" onClick={() => openDuplicateConjunto(item.conjuntoId)}
                          className={TABLE_ACTION_DUP}>
                          Duplicar
                        </button>
                        <button type="button" onClick={() => openDeleteConjuntoConfirm(item.conjuntoId)}
                          className={TABLE_ACTION_DEL}>
                          Remover
                        </button>
                        <button type="button" onClick={() => openAddPecaForm(item.conjuntoId)}
                          title="Adicionar peça a este conjunto"
                          className={TABLE_ACTION_ADD}>
                          <span className="text-sm leading-none font-light">+</span>
                          <span>Peça</span>
                          <span className="text-muted/50">
                            ({conjuntoUnitTotal > item.rows.length
                              ? `${conjuntoUnitTotal} un.`
                              : item.rows.length})
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              }

              // ── Data row ───────────────────────────────────────────────────
              const row = item.row
              const activeConjuntoId = item.displayConjuntoId ?? row.conjunto_id
              const inConjunto = !!activeConjuntoId
              const linkQty = inConjunto && activeConjuntoId
                ? linkQuantidade(conjuntoLinks, activeConjuntoId, row.id)
                : 1
              const conjuntoFenearte = inConjunto
                ? (conjuntosData.get(activeConjuntoId!)?.fenearte ?? false)
                : false

              const costs = calcRowCosts(
                row, custoHoraMO, custoHoraFixo,
                embalagemItems, argilaItems, esmalteItems, engobeItems, tintaItems, biscoitoItems, queimaAltaItems,
              )
              const pricing = buildPecaPricing(row, costs.custoTotal, margemVendaConfig)

              const principalSrc = (row.novaPrincipal && row.fotosNovas.length > 0)
                ? row.fotosNovas[0].preview
                : (row.fotos[0] ?? row.fotosNovas[0]?.preview ?? null)
              const totalFotos = row.fotos.length + row.fotosNovas.length

              const effectiveFenearte = inConjunto ? conjuntoFenearte : row.fenearte
              const prevItem = tableDisplayItems[displayIdx - 1]
              const nextItem = tableDisplayItems[displayIdx + 1]
              const isFirstInConjunto = inConjunto && prevItem?.type === 'conjunto-header'
              const isLastInConjunto = inConjunto && (
                !nextItem ||
                nextItem.type === 'conjunto-header' ||
                (nextItem.type === 'row' && (nextItem.displayConjuntoId ?? nextItem.row.conjunto_id) !== activeConjuntoId)
              )
              const conjChildSpacing = inConjunto
                ? `${isFirstInConjunto ? 'pt-4' : ''} ${isLastInConjunto ? 'pb-4 border-b-2 border-terracota/25 mb-1' : ''}`
                : ''

              const rowBg = row.dirty
                ? 'bg-terracota/[0.04]'
                : inConjunto
                  ? (effectiveFenearte ? `bg-amber-50/35 ${CONJ_CHILD_ROW_HOVER}` : `${CONJ_CHILD_ROW} ${CONJ_CHILD_ROW_HOVER}`)
                  : row.fenearte ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-cru/40'
              const stickyBg = stickyCellBg(row, inConjunto, effectiveFenearte)

              // Placeholder for conjunto-managed fields
              const conjuntoManagedCell = (
                <span className="font-sans text-[10px] text-muted/50 italic select-none">conjunto</span>
              )

              const rowSelectKey = displayItemKey(item)

              return (
                <tr key={rowSelectKey} id={`peca-row-${activeConjuntoId ? `${activeConjuntoId}-` : ''}${row.id}`} className={`transition-colors group ${rowBg} ${conjChildSpacing}`}>

                  <td className={`px-2 py-2 text-center ${STICKY_CHECKBOX} transition-colors ${stickyBg}`}>
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(rowSelectKey)}
                      onChange={() => toggleSelectKey(rowSelectKey)}
                      className="w-3.5 h-3.5 accent-carvao cursor-pointer"
                    />
                  </td>

                  {/* Foto */}
                  <td className={`px-2 py-2 ${STICKY_FOTO} transition-colors ${stickyBg} ${inConjunto ? `${CONJ_CHILD_INDENT} border-l-[3px] border-l-terracota/40` : ''}`}>
                    <input
                      ref={(el) => { if (el) directInputRefs.current.set(row.id, el); else directInputRefs.current.delete(row.id) }}
                      type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                      onChange={(e) => { if (e.target.files?.length) { addFotos(row.id, e.target.files); e.target.value = ''; setFotoModal({ type: 'peca', id: row.id }) } }}
                    />
                    <button type="button" onClick={() => handlePecaThumbClick(row)} title={totalFotos > 0 ? 'Ver foto ampliada' : 'Adicionar foto'}
                      className={`relative w-[52px] h-[52px] overflow-hidden transition-all group/thumb flex items-center justify-center shrink-0 cursor-zoom-in ${
                        inConjunto
                          ? 'bg-white border border-pedra/40 hover:border-terracota/50'
                          : 'bg-areia border border-pedra hover:border-terracota'
                      }`}>
                      {principalSrc ? (
                        <Thumb
                          src={principalSrc}
                          alt="Foto da peça"
                          className={inConjunto ? 'ring-1 ring-inset ring-terracota/15' : ''}
                        />
                      ) : (
                        <svg className={`w-5 h-5 ${inConjunto ? 'text-pedra/50' : 'text-muted/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                      <div className={`absolute inset-0 transition-colors flex items-center justify-center pointer-events-none ${inConjunto ? 'bg-white/0 group-hover/thumb:bg-carvao/20' : 'bg-carvao/0 group-hover/thumb:bg-carvao/35'}`}>
                        <svg className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={totalFotos > 0 ? 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7' : 'M12 4v16m8-8H4'} />
                        </svg>
                      </div>
                      {totalFotos > 1 && <span className="absolute top-0.5 right-0.5 bg-carvao/70 text-cru font-sans text-[8px] w-4 h-4 flex items-center justify-center">{totalFotos}</span>}
                    </button>
                  </td>

                  <td className={`px-2 py-2 ${inConjunto ? 'pl-4' : ''}`}>
                    <CodigoField
                      value={row.codigo}
                      error={codigoErrors[`peca:${row.id}`]}
                      placeholder="C1"
                      className={`${textInput} font-mono`}
                      onChange={(v) => handlePecaCodigoInput(row.id, v)}
                      onCommit={(prev) => commitPecaCodigo(row.id, prev)}
                    />
                  </td>
                  <td className="px-2 py-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <input type="text" value={row.nome} onChange={(e) => update(row.id, { nome: e.target.value })} placeholder="Nome" className={`${textInput} truncate flex-1 min-w-0`} />
                      {inConjunto && linkQty > 1 && (
                        <span
                          className="shrink-0 font-sans text-[9px] font-semibold uppercase tracking-wide text-terracota bg-terracota/10 border border-terracota/25 px-1.5 py-0.5"
                          title="Quantidade desta peça neste conjunto"
                        >
                          {linkQty} un.
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="px-2 py-2">
                    {inConjunto ? (
                      <div className="flex justify-center">{conjuntoManagedCell}</div>
                    ) : (
                      <select
                        value={row.categoria}
                        onChange={(e) => handlePecaCategoriaChange(row.id, e.target.value)}
                        className={tableSelectCls}
                      >
                        <option value="">—</option>
                        {CATEGORIAS_PECA.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    )}
                  </td>

                  {/* Status — peças avulsas e peças do conjunto (venda separada) */}
                  <td className="px-2 py-2 border-l border-pedra/30">
                    <select value={getStatusDisplayValue(row)} onChange={(e) => handleStatusChange(row.id, e.target.value)} className={tableSelectCls}>
                      <option value="">—</option>
                      {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </td>

                  <td className="px-2 py-2 text-right border-l border-pedra/30">
                    {inConjunto ? <div className="flex justify-end">{conjuntoManagedCell}</div> : (
                      pricing.precoSugerido > 0
                        ? <span className="font-sans text-[11px] font-bold text-terracota tabular-nums">R$ {fmt(pricing.precoSugerido)}</span>
                        : <span className="font-sans text-[11px] text-muted/40">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {inConjunto ? <div className="flex justify-end">{conjuntoManagedCell}</div> : (() => {
                      const isAuto = row.preco_praticado === '' && pricing.precoSugerido > 0
                      const display = isAuto ? pricing.precoSugerido.toFixed(2) : row.preco_praticado
                      return (
                        <input type="number" min="0" step="0.01" value={display}
                          onChange={(e) => update(row.id, { preco_praticado: e.target.value })}
                          placeholder="0"
                          title={isAuto ? 'Preenchido automaticamente com o preço sugerido' : undefined}
                          className={`${numInput} border-carvao/30 ${isAuto ? 'text-muted/50' : ''}`} />
                      )
                    })()}
                  </td>

                  {/* Exibir no site — apenas peças avulsas */}
                  <td className="px-1 py-2 text-center border-l border-pedra/30">
                    {inConjunto ? <div className="flex justify-center">{conjuntoManagedCell}</div> : (
                      <div className="flex flex-col items-center gap-0.5">
                        <button type="button" onClick={() => requestExibirPeca(row.id)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.exibir_no_site ? 'bg-terracota' : 'bg-pedra/50'}`}>
                          <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${row.exibir_no_site ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        {row.exibir_no_site && <span className="font-sans text-[7px] text-terracota tracking-wide uppercase leading-none">Sim</span>}
                      </div>
                    )}
                  </td>

                  {/* Exibição em feira — apenas peças avulsas */}
                  <td className="px-1 py-2 text-center">
                    {inConjunto ? <div className="flex justify-center">{conjuntoManagedCell}</div> : (
                      <div className="flex flex-col items-center gap-0.5">
                        <button type="button" onClick={() => update(row.id, { fenearte: !row.fenearte })}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${row.fenearte ? 'bg-amber-500' : 'bg-pedra/50'}`}>
                          <span className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform ${row.fenearte ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        {row.fenearte && <span className="font-sans text-[7px] text-amber-600 tracking-wide uppercase leading-none">Sim</span>}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-1 py-2 text-center">
                    {inConjunto ? (
                      <span className="font-sans text-[9px] text-muted/40">—</span>
                    ) : (
                      <div className={TABLE_ACTION_STACK}>
                        <button type="button" onClick={() => openEditModal(row.id)}
                          className={TABLE_ACTION_EDIT}>
                          Editar
                        </button>
                        <button type="button" onClick={() => openDuplicatePeca(row.id)}
                          className={TABLE_ACTION_DUP}>
                          Duplicar
                        </button>
                        <button type="button" onClick={() => openDeletePecaConfirm(row)}
                          className={TABLE_ACTION_DEL}>
                          Remover
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-16 text-center">
            <svg className="w-10 h-10 text-pedra mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="font-sans text-sm text-muted">Nenhuma peça cadastrada ainda.</p>
          </div>
        )}

        {rows.length > 0 && searchQuery.trim() && filteredRows.length === 0 && (
          <div className="py-12 text-center">
            <p className="font-sans text-sm text-muted">Nenhuma peça encontrada para &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>

      {/* ── Bottom bar (fixa) ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-pedra bg-[#FAFAF8]/95 backdrop-blur-sm shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-5 min-w-0 flex-wrap">
          <button type="button" onClick={() => openAddPecaForm()} className="font-sans text-xs text-terracota hover:text-carvao transition-colors flex items-center gap-2">
            <span className="text-lg leading-none font-light">+</span> Adicionar peça
          </button>
        </div>

        <div className="flex items-center gap-4">
          {saveStatus === 'ok' && <p className="font-sans text-sm text-green-700">Salvo com sucesso!</p>}
          {saveStatus === 'error' && (
            <div className="text-right max-w-sm">
              <p className="font-sans text-sm text-red-600">Erro ao salvar.</p>
              {saveError && <p className="font-sans text-xs text-red-500 mt-0.5 break-words">{saveError}</p>}
            </div>
          )}
          {hasDirty && saveStatus === 'idle' && <p className="font-sans text-xs text-muted/60">Há alterações não salvas</p>}
          <button type="button" onClick={handleSave} disabled={saving || !hasDirty}
            className="inline-flex items-center shrink-0 bg-carvao text-cru font-sans text-sm px-6 py-3 hover:bg-carvao/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? 'Salvando…' : 'Salvar tudo'}
          </button>
        </div>
        </div>
      </div>

      {avulsasPicker && (
        <SelecionarAvulsasModal
          title="Adicionar peça ao conjunto"
          subtitle="Selecione peças já cadastradas (avulsas ou de outros conjuntos) ou cadastre uma nova em branco."
          items={avulsasPickerItems}
          multiSelect
          showCreateBlank
          createBlankLabel="Cadastrar peça nova em branco"
          onConfirm={(ids) => addAvulsasToConjunto(avulsasPicker.conjuntoId, ids)}
          onCreateBlank={() => {
            const conjuntoId = avulsasPicker.conjuntoId
            setAvulsasPicker(null)
            addAnotherPieceInModal(conjuntoId)
          }}
          onCancel={() => setAvulsasPicker(null)}
        />
      )}

      {formConjuntoModal && (
        <FormarConjuntoModal
          key={formConjuntoModal.rowIds.join(',')}
          pieceCount={formConjuntoModal.rowIds.length}
          suggestedCodigo={suggestNewConjuntoCodigo()}
          externalError={formConjuntoError}
          onConfirm={(codigo, nome) => createConjuntoFromSelection(formConjuntoModal.rowIds, codigo, nome)}
          onCancel={() => { setFormConjuntoModal(null); setFormConjuntoError(null) }}
        />
      )}

      {pdfModalOpen && (
        <PecasPdfModal
          totalSelectedCount={totalSelectedCount}
          feiraSelectedCount={feiraSelectedCount}
          onConfirm={handlePdfConfirm}
          onCancel={() => setPdfModalOpen(false)}
        />
      )}

      {vendaModal && (() => {
        const vendaRow = rows.find((r) => r.id === vendaModal.rowId)
        const label = vendaRow
          ? `${vendaRow.codigo ? `${vendaRow.codigo} — ` : ''}${vendaRow.nome || 'Peça'}`
          : 'Peça'
        return (
          <VendaModal
            pecaLabel={label}
            initial={vendaModal.initial}
            onConfirm={confirmVenda}
            onCancel={cancelVendaModal}
          />
        )
      })()}

      {confirmBulkDelete && (
        <BulkDeleteConfirmModal
          plan={bulkDeletionPlan}
          deleting={bulkDeleting}
          onConfirm={handleBulkDelete}
          onCancel={() => !bulkDeleting && setConfirmBulkDelete(false)}
        />
      )}

      {publicationWarning && (
        <PublicationWarningModal
          missingFields={publicationWarning.missingFields}
          onAdjust={publicationWarning.onAdjust}
          onProceed={publicationWarning.onProceed}
          onCancel={() => setPublicationWarning(null)}
        />
      )}

      {exibirSitePrompt && !publicationWarning && (
        <ExibirNoSitePromptModal
          titulo={
            exibirSitePrompt.type === 'peca'
              ? `Deseja exibir ${rows.find((r) => r.id === exibirSitePrompt.id)?.nome || 'esta peça'} no site?`
              : `Deseja exibir o conjunto ${getConjuntoCodigo(exibirSitePrompt.id) || ''} no site?`
          }
          onSim={handleExibirSiteSim}
          onNao={handleExibirSiteNao}
        />
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {fotoPreview && (
        <FotoPreviewModal
          {...fotoPreview}
          onClose={() => setFotoPreview(null)}
        />
      )}

      {/* Fotos de peça */}
      {pecaFotoModal && (
        <FotoModal
          titulo={pecaFotoModal.nome || undefined}
          fotos={pecaFotoModal.fotos}
          fotosNovas={pecaFotoModal.fotosNovas}
          novaPrincipal={pecaFotoModal.novaPrincipal}
          onClose={() => setFotoModal(null)}
          onAddFiles={(files) => addFotos(pecaFotoModal.id, files)}
          onRemoveExisting={(i) => removeExistingFoto(pecaFotoModal.id, i)}
          onRemoveNew={(i) => removeNewFoto(pecaFotoModal.id, i)}
          onSetPrincipal={(i, isNew) => setPrincipalFoto(pecaFotoModal.id, i, isNew)}
          onPreviewPhoto={(index) => {
            const fotos = getPecaFotoSrcs(pecaFotoModal)
            setFotoPreview({
              fotos,
              initialIndex: index,
              titulo: pecaFotoTitulo(pecaFotoModal),
              onManage: () => setFotoModal({ type: 'peca', id: pecaFotoModal.id }),
            })
          }}
        />
      )}

      {/* Fotos do conjunto */}
      {conjuntoFotoModalId && conjuntoFotoModalData && (
        <FotoModal
          titulo={conjuntos.find((c) => c.id === conjuntoFotoModalId)?.nome || conjuntos.find((c) => c.id === conjuntoFotoModalId)?.codigo || 'Conjunto'}
          fotos={conjuntoFotoModalData.fotos}
          fotosNovas={conjuntoFotoModalData.fotosNovas}
          novaPrincipal={conjuntoFotoModalData.novaPrincipal}
          onClose={() => setFotoModal(null)}
          onAddFiles={(files) => { addConjuntoFotos(conjuntoFotoModalId, files); setFotoModal({ type: 'conjunto', id: conjuntoFotoModalId }) }}
          onRemoveExisting={(i) => removeConjuntoExistingFoto(conjuntoFotoModalId, i)}
          onRemoveNew={(i) => removeConjuntoNewFoto(conjuntoFotoModalId, i)}
          onSetPrincipal={(i, isNew) => setConjuntoPrincipalFoto(conjuntoFotoModalId, i, isNew)}
          onPreviewPhoto={(index) => {
            const fotos = getConjuntoFotoSrcs(conjuntoFotoModalData)
            const ref = rows.find((r) => r.conjunto_id === conjuntoFotoModalId)
            const titulo = [ref?.conjunto_codigo, ref?.conjunto_nome].filter(Boolean).join(' — ') || 'Conjunto'
            setFotoPreview({
              fotos,
              initialIndex: index,
              titulo,
              onManage: () => setFotoModal({ type: 'conjunto', id: conjuntoFotoModalId }),
            })
          }}
        />
      )}

      {/* Descrição de peça */}
      {descricaoPecaModal && (
        <DescricaoModal
          titulo={descricaoPecaModal.nome || undefined}
          descricaoAtual={descricaoPecaModal.descricao}
          onClose={() => setDescricaoModal(null)}
          onSave={(texto) => update(descricaoPecaModal.id, { descricao: texto })}
        />
      )}

      {/* Descrição do conjunto */}
      {descricaoConjuntoModalId && descricaoConjuntoData && (
        <DescricaoModal
          titulo={descricaoConjuntoInfo?.nome || descricaoConjuntoInfo?.codigo || 'Conjunto'}
          descricaoAtual={descricaoConjuntoData.descricao}
          onClose={() => setDescricaoModal(null)}
          onSave={(texto) => updateConjuntoData(descricaoConjuntoModalId, { descricao: texto })}
        />
      )}

      {/* Modal de agrupar */}
      {conjuntoRowModal && (
        <ConjuntoModal
          key={conjuntoRowModal.id}
          row={conjuntoRowModal}
          existingConjuntos={conjuntos}
          suggestedCodigo={suggestNewConjuntoCodigo()}
          onClose={() => setConjuntoModal(null)}
          onCreate={createConjunto}
          onJoin={joinConjunto}
          onLeave={leaveConjunto}
        />
      )}

      {/* Modal de detalhes / custos da peça */}
      {editRowModal && (
        <PecaDetalhesModal
          row={editRowModal}
          allRows={rows}
          conjuntoLinks={conjuntoLinks}
          activeConjuntoId={editModalActiveConjuntoId}
          onClose={closeEditModal}
          onUpdatePiece={(id, changes) => update(id, changes)}
          onStatusChangePiece={handleStatusChange}
          pendingVendaRowId={pendingVendaRowId}
          pecaCodigoErrors={codigoErrors}
          onPecaCodigoChange={handlePecaCodigoInput}
          onPecaCodigoCommit={commitPecaCodigo}
          conjuntoCodigoError={
            editModalActiveConjuntoId ? codigoErrors[`conjunto:${editModalActiveConjuntoId}`] : undefined
          }
          onConjuntoCodigoChange={(v) => {
            if (editModalActiveConjuntoId) handleConjuntoCodigoInput(editModalActiveConjuntoId, v)
          }}
          onConjuntoCodigoCommit={(prev) => {
            if (editModalActiveConjuntoId) commitConjuntoCodigo(editModalActiveConjuntoId, prev)
          }}
          onConjuntoCategoriaChange={(c) => {
            if (editModalActiveConjuntoId) handleConjuntoCategoriaChange(editModalActiveConjuntoId, c)
          }}
          onPecaCategoriaChange={handlePecaCategoriaChange}
          conjuntoStatusDisplay={
            editModalActiveConjuntoId
              ? getConjuntoStatusDisplayValue(
                  editModalActiveConjuntoId,
                  conjuntosData.get(editModalActiveConjuntoId)?.status ?? '',
                )
              : ''
          }
          onConjuntoClick={() => { setEditModal(null); setConjuntoModal(editRowModal.id) }}
          onOpenPieceFotos={(id) => setFotoModal({ type: 'peca', id })}
          onPreviewPieceFotos={previewPecaFotos}
          onAddPieceFotos={(id, files) => addFotos(id, files)}
          onAddAnotherPiece={() => {
            if (editModalActiveConjuntoId) openAddPieceToConjuntoPicker(editModalActiveConjuntoId)
          }}
          onRemovePiece={(id) => {
            if (editModalActiveConjuntoId) removePieceFromModal(id, editModalActiveConjuntoId)
          }}
          onUpdateLinkQuantidade={(pecaId, quantidade) => {
            if (editModalActiveConjuntoId) {
              setConjuntoPieceQuantidade(editModalActiveConjuntoId, pecaId, quantidade)
            }
          }}
          lockConjunto={editModalLockedConjunto}
          conjuntoData={editModalActiveConjuntoId ? (conjuntosData.get(editModalActiveConjuntoId) ?? null) : null}
          onCreateConjuntoDraft={() => createConjuntoDraft()}
          onClearConjunto={() => {
            if (editModalConjuntoId && !editRowModal.conjunto_id) clearConjuntoDraft()
            else clearConjuntoOnRow(editRowModal.id)
          }}
          onUpdateConjuntoMeta={(changes) => {
            if (editModalActiveConjuntoId) updateConjunto(editModalActiveConjuntoId, changes)
          }}
          onUpdateConjuntoData={(changes) => {
            if (editModalActiveConjuntoId) updateConjuntoData(editModalActiveConjuntoId, changes)
          }}
          onConjuntoStatusChange={(status) => {
            if (editModalActiveConjuntoId) handleConjuntoStatusChange(editModalActiveConjuntoId, status)
          }}
          onOpenConjuntoFotos={() => {
            if (editModalActiveConjuntoId) setFotoModal({ type: 'conjunto', id: editModalActiveConjuntoId })
          }}
          onPreviewConjuntoFotos={() => {
            if (editModalActiveConjuntoId) previewConjuntoFotos(editModalActiveConjuntoId)
          }}
          onAddConjuntoFotos={(files) => {
            if (editModalActiveConjuntoId) addConjuntoFotos(editModalActiveConjuntoId, files)
          }}
          onSave={handleModalSave}
          onDuplicate={() => {
            if (!editRowModal) return
            if (editModalActiveConjuntoId) openDuplicateConjunto(editModalActiveConjuntoId)
            else openDuplicatePeca(editRowModal.id)
          }}
          saving={modalSaving}
          saveError={modalSaveError}
          migrationWarning={migrationWarning}
          scrollToPieceId={scrollToPieceId}
          highlightPieceId={highlightPieceId}
          onScrollToPieceDone={() => setScrollToPieceId(null)}
          highlightPublicationFields={highlightPublicationFields}
          publicationFocusPieceId={publicationFocusPieceId}
          margemVendaConfig={margemVendaConfig}
          custoHoraFixo={custoHoraFixo}
          custoHoraMO={custoHoraMO}
          embalagemItems={embalagemItems}
          argilaItems={argilaItems}
          esmalteItems={esmalteItems}
          engobeItems={engobeItems}
          tintaItems={tintaItems}
          biscoitoItems={biscoitoItems}
          queimaAltaItems={queimaAltaItems}
        />
      )}

      {duplicatePecaPrompt && (() => {
        const source = rows.find((r) => r.id === duplicatePecaPrompt.rowId)
        if (!source) return null
        return (
          <DuplicatePecaModal
            codigo={source.codigo}
            nome={source.nome}
            onConfirm={(mode) => duplicatePeca(duplicatePecaPrompt.rowId, mode)}
            onCancel={() => setDuplicatePecaPrompt(null)}
          />
        )
      })()}

      {duplicateConjuntoPrompt && (() => {
        const pieces = getConjuntoPiecesFromRows(rows, duplicateConjuntoPrompt.conjuntoId, conjuntoLinks)
        const ref = pieces[0]
        if (!ref) return null
        return (
          <DuplicatePecaModal
            kind="conjunto"
            codigo={ref.conjunto_codigo}
            nome={ref.conjunto_nome}
            detail={`${pieces.length} ${pieces.length === 1 ? 'peça será copiada' : 'peças serão copiadas'}`}
            onConfirm={(mode) => duplicateConjunto(duplicateConjuntoPrompt.conjuntoId, mode)}
            onCancel={() => setDuplicateConjuntoPrompt(null)}
          />
        )
      })()}

      {deleteConfirm && (
        <ConfirmDeleteModal
          title={deleteConfirm.type === 'conjunto' ? 'Excluir conjunto' : 'Excluir peça'}
          message={
            deleteConfirm.type === 'conjunto'
              ? `Deseja excluir o conjunto ${[deleteConfirm.codigo, deleteConfirm.nome].filter(Boolean).join(' — ') || 'selecionado'}? Todas as peças vinculadas serão removidas permanentemente.`
              : `Deseja excluir a peça ${[deleteConfirm.codigo, deleteConfirm.nome].filter(Boolean).join(' — ') || 'selecionada'}? Esta ação não pode ser desfeita.`
          }
          deleting={deleteInProgress}
          onConfirm={() => void executeDeleteConfirm()}
          onCancel={() => !deleteInProgress && setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
