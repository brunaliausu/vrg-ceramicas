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

const COLUMN_WIDTHS: Partial<Record<PdfColumnId, number>> = {
  codigo: 28,
  nome: 42,
  status: 26,
  custo: 22,
  sugerido: 22,
  praticado: 22,
  exibirSite: 18,
  fenearte: 18,
}

const RIGHT_ALIGN: PdfColumnId[] = ['custo', 'sugerido', 'praticado']
const CENTER_ALIGN: PdfColumnId[] = ['exibirSite', 'fenearte']

const PHOTO_COL_WIDTH = 24
const PHOTO_HEIGHT = 20

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

export async function generatePecasPdf(rows: PecasPdfRow[], columns: PdfColumnId[]) {
  const activeColumns = columns.length > 0 ? columns : DEFAULT_PDF_COLUMNS
  const dataLabels = activeColumns.map(
    (id) => PDF_COLUMN_DEFS.find((c) => c.id === id)?.label ?? id,
  )
  const labels = ['Foto', ...dataLabels]

  const imageDataList = await Promise.all(rows.map((r) => resolveImageData(r.imageSrc)))

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(16)
  doc.text('Peças & Estoque — VRG Cerâmicas', 14, 14)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} · ${rows.length} item(ns)`, 14, 20)
  doc.setTextColor(0)

  const columnStyles: Record<number, { cellWidth?: number; minCellHeight?: number; halign?: 'left' | 'center' | 'right' }> = {
    0: { cellWidth: PHOTO_COL_WIDTH, minCellHeight: PHOTO_HEIGHT + 4 },
  }
  activeColumns.forEach((id, idx) => {
    const colIdx = idx + 1
    const style: { cellWidth?: number; halign?: 'left' | 'center' | 'right' } = {}
    if (COLUMN_WIDTHS[id]) style.cellWidth = COLUMN_WIDTHS[id]
    if (RIGHT_ALIGN.includes(id)) style.halign = 'right'
    if (CENTER_ALIGN.includes(id)) style.halign = 'center'
    if (Object.keys(style).length > 0) columnStyles[colIdx] = style
  })

  autoTable(doc, {
    startY: 26,
    head: [labels],
    body: rows.map((r) => ['', ...activeColumns.map((id) => r[id])]),
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [45, 42, 38],
      textColor: [250, 248, 243],
      fontStyle: 'bold',
    },
    columnStyles,
    margin: { left: 14, right: 14 },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 0 || data.row.index < 0) return
      const img = imageDataList[data.row.index]
      if (!img) return
      try {
        const format = imageFormat(img)
        const pad = 2
        doc.addImage(
          img,
          format,
          data.cell.x + pad,
          data.cell.y + pad,
          PHOTO_COL_WIDTH - pad * 2,
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
