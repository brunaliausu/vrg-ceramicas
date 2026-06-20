import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type PdfColumnId =
  | 'codigo'
  | 'nome'
  | 'status'
  | 'custo'
  | 'sugerido'
  | 'praticado'
  | 'exibirSite'
  | 'fenearte'

export const PDF_COLUMN_DEFS: { id: PdfColumnId; label: string }[] = [
  { id: 'codigo', label: 'Código' },
  { id: 'nome', label: 'Nome' },
  { id: 'status', label: 'Status' },
  { id: 'custo', label: 'Custo' },
  { id: 'sugerido', label: 'Preço sugerido' },
  { id: 'praticado', label: 'Preço praticado' },
  { id: 'exibirSite', label: 'Exibir no site' },
  { id: 'fenearte', label: 'Feira' },
]

export const DEFAULT_PDF_COLUMNS: PdfColumnId[] = PDF_COLUMN_DEFS.map((c) => c.id)

export interface PecasPdfRow {
  codigo: string
  nome: string
  status: string
  custo: string
  sugerido: string
  praticado: string
  exibirSite: string
  fenearte: string
  imageSrc: string | null
}

/** Peso relativo para distribuir largura das colunas na folha inteira. */
const COLUMN_WEIGHTS: Record<PdfColumnId, number> = {
  codigo: 1.1,
  nome: 2.2,
  status: 1.2,
  custo: 1,
  sugerido: 1,
  praticado: 1,
  exibirSite: 0.9,
  fenearte: 0.7,
}

const RIGHT_ALIGN: PdfColumnId[] = ['custo', 'sugerido', 'praticado']
const CENTER_ALIGN: PdfColumnId[] = ['exibirSite', 'fenearte']

const MARGIN = { top: 5, right: 4, left: 4, bottom: 4 }
const PHOTO_WEIGHT = 1.15
const PHOTO_HEIGHT = 16

async function resolveImageData(src: string | null): Promise<string | null> {
  if (!src) return null
  if (src.startsWith('blob:') || src.startsWith('data:')) return src
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function imageFormat(dataUrl: string): 'PNG' | 'JPEG' | 'WEBP' {
  if (dataUrl.includes('image/png')) return 'PNG'
  if (dataUrl.includes('image/webp')) return 'WEBP'
  return 'JPEG'
}

function buildColumnWidths(activeColumns: PdfColumnId[], tableWidth: number): number[] {
  const dataWeight = activeColumns.reduce((sum, id) => sum + (COLUMN_WEIGHTS[id] ?? 1), 0)
  const totalWeight = PHOTO_WEIGHT + dataWeight
  const photoWidth = (tableWidth * PHOTO_WEIGHT) / totalWeight
  const dataTotal = tableWidth - photoWidth
  const widths = [photoWidth]
  for (const id of activeColumns) {
    const w = COLUMN_WEIGHTS[id] ?? 1
    widths.push((dataTotal * w) / dataWeight)
  }
  return widths
}

export async function generatePecasPdf(rows: PecasPdfRow[], columns: PdfColumnId[]) {
  const activeColumns = columns.length > 0 ? columns : DEFAULT_PDF_COLUMNS
  const dataLabels = activeColumns.map(
    (id) => PDF_COLUMN_DEFS.find((c) => c.id === id)?.label ?? id,
  )
  const labels = ['Foto', ...dataLabels]

  const imageDataList = await Promise.all(rows.map((r) => resolveImageData(r.imageSrc)))

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const tableWidth = pageWidth - MARGIN.left - MARGIN.right
  const colWidths = buildColumnWidths(activeColumns, tableWidth)
  const photoColWidth = colWidths[0]

  const columnStyles: Record<number, { cellWidth: number; minCellHeight?: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: photoColWidth, minCellHeight: PHOTO_HEIGHT + 2 },
  }
  activeColumns.forEach((id, idx) => {
    const colIdx = idx + 1
    const style: { cellWidth: number; halign?: 'left' | 'center' | 'right' } = {
      cellWidth: colWidths[colIdx],
    }
    if (RIGHT_ALIGN.includes(id)) style.halign = 'right'
    if (CENTER_ALIGN.includes(id)) style.halign = 'center'
    columnStyles[colIdx] = style
  })

  const generatedAt = new Date().toLocaleString('pt-BR')

  autoTable(doc, {
    startY: MARGIN.top,
    head: [labels],
    body: rows.map((r) => ['', ...activeColumns.map((id) => r[id])]),
    tableWidth,
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
      overflow: 'linebreak',
      minCellHeight: PHOTO_HEIGHT + 2,
    },
    headStyles: {
      fillColor: [45, 42, 38],
      textColor: [250, 248, 243],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 1.4,
    },
    columnStyles,
    margin: MARGIN,
    showHead: 'everyPage',
    rowPageBreak: 'auto',
    didDrawPage: (data) => {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(120)
      doc.text(
        `VRG Cerâmicas · Peças & Estoque · ${rows.length} item(ns) · ${generatedAt}`,
        MARGIN.left,
        pageHeight - 2,
      )
      if (data.pageNumber > 1) {
        doc.text(String(data.pageNumber), pageWidth - MARGIN.right, pageHeight - 2, { align: 'right' })
      }
      doc.setTextColor(0)
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 0 || data.row.index < 0) return
      const img = imageDataList[data.row.index]
      if (!img) return
      try {
        const format = imageFormat(img)
        const pad = 1
        const imgW = photoColWidth - pad * 2
        doc.addImage(
          img,
          format,
          data.cell.x + pad,
          data.cell.y + pad,
          imgW,
          PHOTO_HEIGHT,
        )
      } catch {
        // imagem inválida — ignora
      }
    },
  })

  const date = new Date().toISOString().slice(0, 10)
  doc.save(`pecas-estoque-vrg-${date}.pdf`)
}
