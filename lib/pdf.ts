import { Invoice } from '@/types'
import { DEJAVU_SANS_REGULAR, DEJAVU_SANS_BOLD } from './fonts/dejavu'

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Embed Unicode-capable font (DejaVu Sans) ─────────────────
  // This is what lets us render ₹, €, £, etc. Helvetica (default)
  // doesn't include these glyphs so they show as □ (tofu).
  doc.addFileToVFS('DejaVuSans.ttf', DEJAVU_SANS_REGULAR)
  doc.addFileToVFS('DejaVuSans-Bold.ttf', DEJAVU_SANS_BOLD)
  doc.addFont('DejaVuSans.ttf', 'DejaVu', 'normal')
  doc.addFont('DejaVuSans-Bold.ttf', 'DejaVu', 'bold')

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const ML = 18
  const MR = 18
  const CW = W - ML - MR

  // Colors
  const BLACK: [number, number, number] = [25, 25, 25]
  const DARK: [number, number, number] = [55, 55, 55]
  const GRAY: [number, number, number] = [120, 120, 120]
  const LIGHT: [number, number, number] = [220, 220, 220]
  const BG: [number, number, number] = [247, 247, 248]
  const ACCENT: [number, number, number] = [34, 83, 173]

  const sym = getCurrencySymbol(invoice.currency || 'INR')
  const locale = (invoice.currency || 'INR') === 'INR' ? 'en-IN' : 'en-US'
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
  const money = (n: number) => `${sym}${fmt(n)}`

  const setFont = (
    size: number,
    style: 'normal' | 'bold' = 'normal',
    color: [number, number, number] = DARK
  ) => {
    doc.setFont('DejaVu', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }

  const drawInfoCard = (x: number, top: number, width: number, label: string, value: string): void => {
    doc.setFillColor(...BG)
    doc.setDrawColor(...LIGHT)
    doc.rect(x, top, width, 15, 'FD')
    setFont(7.5, 'bold', GRAY)
    doc.text(label, x + 4, top + 5.5)
    setFont(10.5, 'bold', BLACK)
    doc.text(value, x + 4, top + 11)
  }

  const drawPartyCard = (
    x: number,
    top: number,
    width: number,
    title: string,
    name: string,
    rows: string[]
  ): number => {
    const contentWidth = width - 8
    const wrappedRows = rows.flatMap((row) => doc.splitTextToSize(row, contentWidth))
    const contentHeight = wrappedRows.length * 4.5
    const cardHeight = 18 + contentHeight

    doc.setDrawColor(...LIGHT)
    doc.setFillColor(...BG)
    doc.rect(x, top, width, cardHeight, 'FD')

    setFont(8, 'bold', GRAY)
    doc.text(title, x + 4, top + 5.5)
    setFont(11, 'bold', BLACK)
    doc.text(name || '—', x + 4, top + 11)
    setFont(9, 'normal', DARK)
    if (wrappedRows.length > 0) {
      doc.text(wrappedRows, x + 4, top + 16)
    }

    return cardHeight
  }

  // ── HEADER ────────────────────────────────────────────────────
  let y = 18
  doc.setFillColor(...ACCENT)
  doc.rect(ML, y, CW, 1.8, 'F')
  y += 8

  setFont(26, 'bold', BLACK)
  doc.text('INVOICE', ML, y)

  setFont(10, 'normal', GRAY)
  doc.text(`Invoice #${invoice.invoice_number}`, W - MR, y - 3, { align: 'right' })
  doc.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, W - MR, y + 2, { align: 'right' })

  y += 10

  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.3)
  doc.line(ML, y, W - MR, y)
  y += 7

  // ── PARTY DETAILS ─────────────────────────────────────────────
  const colGap = 6
  const cardW = (CW - colGap) / 2
  const sellerRows = [
    invoice.seller_pan ? `PAN: ${invoice.seller_pan}` : '',
    invoice.seller_gstin ? `GSTIN: ${invoice.seller_gstin}` : '',
    invoice.seller_mobile ? `Mob: ${invoice.seller_mobile}` : '',
    invoice.seller_email || '',
    invoice.seller_address || '',
  ].filter(Boolean)
  const clientRows = [
    invoice.client_gstin ? `GSTIN: ${invoice.client_gstin}` : '',
    invoice.client_mobile ? `Mob: ${invoice.client_mobile}` : '',
    invoice.client_email ? `Email: ${invoice.client_email}` : '',
    invoice.client_address || '',
  ].filter(Boolean)

  const sellerCardHeight = drawPartyCard(ML, y, cardW, 'FROM', invoice.seller_name, sellerRows)
  const clientCardHeight = drawPartyCard(ML + cardW + colGap, y, cardW, 'BILL TO', invoice.client_name, clientRows)
  y += Math.max(sellerCardHeight, clientCardHeight) + 8

  // ── DATE / DUE / BALANCE STRIP ────────────────────────────────
  const infoGap = 4
  const infoW = (CW - infoGap * 2) / 3
  drawInfoCard(ML, y, infoW, 'ISSUE DATE', formatDate(invoice.issue_date))
  drawInfoCard(ML + infoW + infoGap, y, infoW, 'DUE DATE', formatDate(invoice.due_date))
  drawInfoCard(ML + (infoW + infoGap) * 2, y, infoW, 'BALANCE DUE', money(invoice.total_amount))
  y += 23

  // ── ITEMS TABLE ───────────────────────────────────────────────
  const rows = (invoice.items || []).map((item) => [
    item.name,
    item.quantity % 1 === 0 ? String(item.quantity) : item.quantity.toFixed(2),
    money(item.price),
    money(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Quantity', 'Rate', 'Amount']],
    body: rows,
    margin: { left: ML, right: MR },
    styles: {
      font: 'DejaVu',
      fontStyle: 'normal',
      fontSize: 9.5,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      textColor: DARK,
      lineColor: LIGHT,
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: BLACK,
      textColor: [255, 255, 255],
      font: 'DejaVu',
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 4, right: 5, bottom: 4, left: 5 },
      lineColor: BLACK,
      lineWidth: 0,
    },
    bodyStyles: {
      font: 'DejaVu',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 32 },
      3: { halign: 'right', cellWidth: 32, fontStyle: 'bold', textColor: BLACK },
    },
    alternateRowStyles: { fillColor: [252, 252, 253] },
    tableLineColor: LIGHT,
    tableLineWidth: 0.15,
  })

  // @ts-expect-error jsPDF-autotable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 8

  // ── TOTALS ────────────────────────────────────────────────────
  const totX = W - MR - 70
  const totW = 70

  const totalRow = (label: string, value: string, bold = false) => {
    setFont(bold ? 10 : 9, bold ? 'bold' : 'normal', bold ? BLACK : GRAY)
    doc.text(label, totX, y)
    setFont(bold ? 10 : 9, bold ? 'bold' : 'normal', bold ? BLACK : DARK)
    doc.text(value, W - MR, y, { align: 'right' })
    y += bold ? 7 : 5.5
  }

  totalRow('Subtotal', money(invoice.subtotal))

  if (invoice.tax > 0) {
    totalRow(`Tax (${invoice.tax}%)`, money((invoice.subtotal * invoice.tax) / 100))
  }

  if (invoice.discount > 0) {
    const d =
      invoice.discount_type === 'percent'
        ? (invoice.subtotal * invoice.discount) / 100
        : invoice.discount
    const dLabel =
      invoice.discount_type === 'percent'
        ? `Discount (${invoice.discount}%)`
        : 'Discount'
    setFont(9, 'normal', GRAY)
    doc.text(dLabel, totX, y)
    setFont(9, 'normal', [16, 150, 100])
    doc.text(`− ${money(d)}`, W - MR, y, { align: 'right' })
    y += 5.5
  }

  // Divider
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.3)
  doc.line(totX, y - 1, W - MR, y - 1)
  y += 2.5

  // Total row — black background bar
  doc.setFillColor(...BLACK)
  doc.rect(totX - 4, y - 5, totW + 4, 10, 'F')
  setFont(11, 'bold', [255, 255, 255])
  doc.text('Total', totX, y + 1.5)
  doc.text(money(invoice.total_amount), W - MR - 1, y + 1.5, { align: 'right' })
  y += 16

  // ── NOTES ─────────────────────────────────────────────────────
  if (invoice.notes) {
    setFont(8, 'bold', GRAY)
    doc.text('NOTES', ML, y)
    y += 5

    setFont(9, 'normal', DARK)
    const nl = doc.splitTextToSize(invoice.notes, CW)
    doc.text(nl, ML, y)
    y += nl.length * 4.5
  }

  // ── FOOTER ────────────────────────────────────────────────────
  const fY = H - 12
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.2)
  doc.line(ML, fY - 5, W - MR, fY - 5)

  setFont(8, 'normal', GRAY)
  doc.text(`Invoice #${invoice.invoice_number}`, ML, fY)
  doc.text('Thank you for your business', W - MR, fY, { align: 'right' })

  doc.save(`invoice-${invoice.invoice_number}.pdf`)
}

function getCurrencySymbol(code: string): string {
  const map: Record<string, string> = {
    INR: '\u20B9',
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    AED: 'AED ',
    SGD: 'S$',
    CAD: 'CA$',
    AUD: 'A$',
  }
  return map[code] ?? code + ' '
}

function formatDate(d: string): string {
  if (!d) return '—'
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return d
  }
}
