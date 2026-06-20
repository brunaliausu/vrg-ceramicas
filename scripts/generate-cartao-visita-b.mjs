/**
 * Proposta B — cartão editorial (10×6 cm).
 * Direção: luxo refinado, fundo cru, tipografia Cormorant, foto como faixa lateral.
 * Uso: node scripts/generate-cartao-visita-b.mjs
 */

import { jsPDF } from 'jspdf'
import {
  CARD_W,
  CARD_H,
  COLORS,
  displaySite,
  drawCoverImageInRect,
  ensureCormorantFonts,
  formatWhatsApp,
  getImageSize,
  loadCardData,
  loadImageDataUrl,
  registerCormorantFonts,
  writePdf,
} from './cartao-visita/shared.mjs'

const SPLIT = 0.61 // faixa da foto à direita

function drawContactBlock(doc, { label, value, x, y }) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(...COLORS.muted)
  doc.text(label.toUpperCase(), x, y)

  doc.setFontSize(7.4)
  doc.setTextColor(...COLORS.carvao)
  doc.text(value, x, y + 3.6)
}

async function main() {
  const { whatsapp, siteUrl, instagram, heroDataUrl } = await loadCardData()
  const [fonts, heroSize] = await Promise.all([
    ensureCormorantFonts(),
    getImageSize(heroDataUrl),
  ])

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_W, CARD_H],
    compress: true,
  })

  registerCormorantFonts(doc, fonts)

  const splitX = CARD_W * SPLIT
  const frame = 2.8

  // Moldura externa terracota (sutil)
  doc.setDrawColor(...COLORS.terracota)
  doc.setLineWidth(0.25)
  doc.rect(frame, frame, CARD_W - frame * 2, CARD_H - frame * 2, 'S')

  // Fundo cru — painel editorial
  doc.setFillColor(...COLORS.cru)
  doc.rect(frame, frame, splitX - frame, CARD_H - frame * 2, 'F')

  // Faixa de foto à direita
  drawCoverImageInRect(doc, heroDataUrl, splitX, 0, CARD_W - splitX, CARD_H, heroSize.width, heroSize.height)

  // Divisor vertical + filete argila
  doc.setDrawColor(...COLORS.terracota)
  doc.setLineWidth(0.35)
  doc.line(splitX, frame, splitX, CARD_H - frame)
  doc.setDrawColor(...COLORS.argila)
  doc.setLineWidth(0.12)
  doc.line(splitX + 0.55, frame + 1, splitX + 0.55, CARD_H - frame - 1)

  const padL = frame + 5.5
  let y = frame + 8

  // Marca tipográfica (como no header do site — sem PNG de fundo escuro)
  doc.setTextColor(...COLORS.carvao)
  doc.setFont('Cormorant', 'normal')
  doc.setFontSize(24)
  doc.text('VRG', padL, y)

  y += 4.8
  doc.setFont('Cormorant', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.terracota)
  doc.text('Cerâmicas', padL, y)

  // Linha + eyebrow (padrão do hero do site)
  y += 5.5
  doc.setDrawColor(...COLORS.pedra)
  doc.setLineWidth(0.2)
  doc.line(padL, y, padL + 10, y)

  y += 3.8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(...COLORS.muted)
  doc.text('CERÂMICA AUTORAL · FEITA À MÃO · BRASIL', padL, y)

  // Bloco de acento terracota
  doc.setFillColor(...COLORS.terracota)
  doc.rect(padL, y + 2.8, 9, 0.5, 'F')

  // Contatos
  y += 9.5
  drawContactBlock(doc, { label: 'WhatsApp', value: formatWhatsApp(whatsapp), x: padL, y })

  y += 9.2
  const col2 = padL + 27
  drawContactBlock(doc, { label: 'Instagram', value: instagram, x: padL, y })
  drawContactBlock(doc, { label: 'Site', value: displaySite(siteUrl), x: col2, y })

  // Assinatura inferior
  doc.setFont('Cormorant', 'italic')
  doc.setFontSize(7.2)
  doc.setTextColor(...COLORS.argila)
  doc.text('Peças únicas · ateliê VRG', padL, CARD_H - frame - 2.8)

  const outPath = writePdf(doc, 'cartao-visita-vrg-b.pdf')
  console.log(`PDF gerado (Proposta B): ${outPath}`)
  console.log(`Tamanho: 10×6 cm (${CARD_W}×${CARD_H} mm)`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
