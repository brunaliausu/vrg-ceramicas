/**
 * Proposta C — layout 3 colunas (wireframe do cliente).
 * [ Logo VRG full-height ] [ Contatos — metade inferior ] | [ Foto cerâmica ]
 * Uso: node scripts/generate-cartao-visita-c.mjs
 */

import { jsPDF } from 'jspdf'
import {
  CARD_W,
  CARD_H,
  COLORS,
  displaySite,
  drawCoverImageInRect,
  formatWhatsApp,
  getImageSize,
  loadCardData,
  loadImageDataUrl,
  writePdf,
} from './cartao-visita/shared.mjs'
import { loadSocialIcons } from './cartao-visita/icons.mjs'

const LOGO_BROWN = [26, 18, 11]
const PHOTO_W = 38 // mm — coluna direita da cerâmica

function drawContactRows(doc, rows, iconX, textX, startY, iconSize) {
  const valueSize = 7.8
  const rowGap = 9.5

  rows.forEach(({ icon, value }, i) => {
    const rowCenterY = startY + i * rowGap
    const iconY = rowCenterY - iconSize / 2 + 0.5

    doc.addImage(icon, 'PNG', iconX, iconY, iconSize, iconSize, undefined, 'FAST')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(valueSize)
    doc.setTextColor(...COLORS.cru)
    doc.text(value, textX, rowCenterY + 0.8)
  })
}

async function main() {
  const cardData = await loadCardData()
  const logoDataUrl = await loadImageDataUrl('public/logo-vrg.png')

  const [icons, heroSize, logoSize] = await Promise.all([
    loadSocialIcons(),
    getImageSize(cardData.heroDataUrl),
    getImageSize(logoDataUrl),
  ])

  const { whatsapp, siteUrl, instagram, heroDataUrl } = cardData

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CARD_W, CARD_H],
    compress: true,
  })

  const logoH = CARD_H
  const logoW = logoH * (logoSize.width / logoSize.height)
  const photoX = CARD_W - PHOTO_W
  const centerX = logoW
  const centerW = photoX - logoW

  // ── Coluna 1: logo VRG (marrom, altura total) ──
  doc.setFillColor(...LOGO_BROWN)
  doc.rect(0, 0, logoW, CARD_H, 'F')
  doc.addImage(logoDataUrl, 'PNG', 0, 0, logoW, logoH, undefined, 'FAST')

  // ── Coluna 2: área central (carvao) — contatos na metade inferior ──
  doc.setFillColor(...COLORS.carvao)
  doc.rect(centerX, 0, centerW, CARD_H, 'F')

  const iconX = centerX + 5
  const textX = iconX + 5.2
  const iconSize = 3.8
  const rows = [
    { icon: icons.whatsapp, value: formatWhatsApp(whatsapp) },
    { icon: icons.instagram, value: instagram },
    { icon: icons.globe, value: displaySite(siteUrl) },
  ]

  const rowBlockH = 9.5 * rows.length
  const lowerHalfStart = CARD_H / 2
  const contactsStartY = lowerHalfStart + (CARD_H / 2 - rowBlockH) / 2 + 4

  drawContactRows(doc, rows, iconX, textX, contactsStartY, iconSize)

  // ── Divisor vertical (centro | foto) ──
  doc.setDrawColor(...COLORS.terracota)
  doc.setLineWidth(0.4)
  doc.line(photoX, 0, photoX, CARD_H)

  // ── Coluna 3: foto da cerâmica (proporção real) ──
  drawCoverImageInRect(doc, heroDataUrl, photoX, 0, PHOTO_W, CARD_H, heroSize.width, heroSize.height)

  const outPath = writePdf(doc, 'cartao-visita-vrg-c.pdf')
  console.log(`PDF gerado (Proposta C): ${outPath}`)
  console.log(`Tamanho: 10×6 cm (${CARD_W}×${CARD_H} mm)`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
