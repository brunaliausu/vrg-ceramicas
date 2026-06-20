/**
 * Gera cartão de visita VRG (10×6 cm) — layout hero escuro + logo.
 * Uso: node scripts/generate-cartao-visita.mjs
 */

import { jsPDF } from 'jspdf'
import {
  CARD_W,
  CARD_H,
  COLORS,
  displaySite,
  drawCoverImage,
  ensureCormorantFonts,
  formatWhatsApp,
  getImageSize,
  loadCardData,
  loadImageDataUrl,
  registerCormorantFonts,
  writePdf,
} from './cartao-visita/shared.mjs'
import { loadSocialIcons } from './cartao-visita/icons.mjs'

// Marrom do fundo da logo PNG
const LOGO_BROWN = [26, 18, 11]

function drawContactRows(doc, rows, iconX, textX, startY, iconSize) {
  const valueSize = 7.8
  const rowGap = 10.2
  const iconTextGap = 2.8

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

  const [fonts, icons, heroSize, logoSize] = await Promise.all([
    ensureCormorantFonts(),
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

  registerCormorantFonts(doc, fonts)

  const logoH = CARD_H
  const logoW = logoH * (logoSize.width / logoSize.height)

  // Hero — proporção real (sem esticar)
  drawCoverImage(doc, heroDataUrl, CARD_W, CARD_H, heroSize.width, heroSize.height)

  // Overlay escuro sobre a foto (faixa da logo fica livre)
  doc.setGState(new doc.GState({ opacity: 0.74 }))
  doc.setFillColor(...COLORS.carvao)
  doc.rect(logoW, 0, CARD_W * 0.62 - logoW, CARD_H, 'F')
  doc.setGState(new doc.GState({ opacity: 0.38 }))
  doc.rect(CARD_W * 0.62, 0, CARD_W * 0.38, CARD_H, 'F')
  doc.setGState(new doc.GState({ opacity: 1 }))

  // Fundo marrom da logo — borda a borda (vertical e esquerda)
  doc.setFillColor(...LOGO_BROWN)
  doc.rect(0, 0, logoW, CARD_H, 'F')

  // Logo VRG — altura total do cartão
  doc.addImage(logoDataUrl, 'PNG', 0, 0, logoW, logoH, undefined, 'FAST')

  const lineX = logoW + 2.5
  const iconX = lineX + 3
  const textX = iconX + 5.2
  const iconSize = 3.8
  const zoneTop = 11
  const zoneBottom = CARD_H - 11

  // Linha terracota
  doc.setDrawColor(...COLORS.terracota)
  doc.setLineWidth(0.35)
  doc.line(lineX, zoneTop, lineX, zoneBottom)

  const rows = [
    { icon: icons.whatsapp, value: formatWhatsApp(whatsapp) },
    { icon: icons.instagram, value: instagram },
    { icon: icons.globe, value: displaySite(siteUrl) },
  ]

  const eyebrowH = 4
  const rowBlockH = 10.2 * rows.length
  const gapAfterEyebrow = 3.5
  const contentH = eyebrowH + gapAfterEyebrow + rowBlockH
  const contentStartY = zoneTop + (zoneBottom - zoneTop - contentH) / 2

  // Eyebrow "Contato"
  const eyebrowY = contentStartY + 3
  doc.setDrawColor(...COLORS.cru)
  doc.setGState(new doc.GState({ opacity: 0.45 }))
  doc.setLineWidth(0.2)
  doc.line(iconX, eyebrowY - 1.2, iconX + 8, eyebrowY - 1.2)
  doc.setGState(new doc.GState({ opacity: 1 }))

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.2)
  doc.setTextColor(...COLORS.cru)
  doc.setGState(new doc.GState({ opacity: 0.65 }))
  doc.text('CONTATO', iconX + 9.5, eyebrowY)
  doc.setGState(new doc.GState({ opacity: 1 }))

  drawContactRows(
    doc,
    rows,
    iconX,
    textX,
    contentStartY + eyebrowH + gapAfterEyebrow + 2,
    iconSize,
  )

  // Tagline inferior direita
  doc.setFont('Cormorant', 'italic')
  doc.setFontSize(6.2)
  doc.setTextColor(...COLORS.cru)
  doc.setGState(new doc.GState({ opacity: 0.6 }))
  doc.text('Cerâmica autoral · feita à mão', CARD_W - 4, CARD_H - 4, { align: 'right' })
  doc.setGState(new doc.GState({ opacity: 1 }))

  const outPath = writePdf(doc, 'cartao-visita-vrg.pdf')
  console.log(`PDF gerado: ${outPath}`)
  console.log(`Tamanho: 10×6 cm (${CARD_W}×${CARD_H} mm)`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
