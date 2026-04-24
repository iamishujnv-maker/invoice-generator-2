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

  // ── HEADER BAND ───────────────────────────────────────────────
  let y = 22
  setFont(26, 'bold', BLACK)
  doc.text('INVOICE', ML, y)

  setFont(11, 'normal', GRAY)
  doc.text(`# ${invoice.invoice_number}`, W - MR, y - 2, { align: 'right' })

  y += 12

  // Divider
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.3)
  doc.line(ML, y, W - MR, y)
  y += 8

  // ── FROM (seller) ────────────────────────────────────────────
  setFont(8, 'bold', GRAY)
  doc.text('FROM', ML, y)
  y += 5

  setFont(12, 'bold', BLACK)
  doc.text(invoice.seller_name || '—', ML, y)
  y += 5.5

  setFont(9, 'normal', DARK)
  if (invoice.seller_pan) {
    doc.text(`PAN: ${invoice.seller_pan}`, ML, y)
    y += 4.5
  }
  if (invoice.seller_gstin) {
    doc.text(`GSTIN: ${invoice.seller_gstin}`, ML, y)
    y += 4.5
  }
  if (invoice.seller_mobile) {
    doc.text(`Mob: ${invoice.seller_mobile}`, ML, y)
    y += 4.5
  }
  if (invoice.seller_email) {
    doc.text(invoice.seller_email, ML, y)
    y += 4.5
  }
  if (invoice.seller_address) {
    const lines = doc.splitTextToSize(invoice.seller_address, CW - 20)
    doc.text(lines, ML, y)
    y += lines.length * 4.5
  }

  y += 8

  // ── BILL TO ───────────────────────────────────────────────────
  setFont(8, 'bold', GRAY)
  doc.text('BILL TO', ML, y)
  y += 5

  setFont(12, 'bold', BLACK)
  doc.text(invoice.client_name || '—', ML, y)
  y += 5.5

  setFont(9, 'normal', DARK)
  if (invoice.client_gstin) {
    doc.text(`GSTIN: ${invoice.client_gstin}`, ML, y)
    y += 4.5
  }
  if (invoice.client_address) {
    const lines = doc.splitTextToSize(invoice.client_address, CW - 20)
    doc.text(lines, ML, y)
    y += lines.length * 4.5
  }
  if (invoice.client_mobile) {
    doc.text(`Mob: ${invoice.client_mobile}`, ML, y)
    y += 4.5
  }
  if (invoice.client_email) {
    doc.text(`Email: ${invoice.client_email}`, ML, y)
    y += 4.5
  }

  y += 8

  // ── DATE / BALANCE DUE strip ──────────────────────────────────
  const box1X = ML
  const box2X = ML + CW / 2 + 4
  const boxW = CW / 2 - 4
  const boxH = 16

  doc.setFillColor(...BG)
  doc.rect(box1X, y, boxW, boxH, 'F')
  doc.rect(box2X, y, boxW, boxH, 'F')

  setFont(7.5, 'bold', GRAY)
  doc.text('DATE', box1X + 4, y + 6)
  doc.text('BALANCE DUE', box2X + 4, y + 6)

  setFont(11, 'bold', BLACK)
  doc.text(formatDate(invoice.issue_date), box1X + 4, y + 12)
  doc.text(money(invoice.total_amount), box2X + 4, y + 12)

  y += boxH + 10

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
