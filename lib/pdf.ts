import { Invoice } from '@/types'

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const ML = 18
  const MR = 18
  const CW = W - ML - MR

  // Colors
  const BLACK: [number, number, number] = [20, 20, 20]
  const DARK: [number, number, number] = [50, 50, 50]
  const GRAY: [number, number, number] = [120, 120, 120]
  const LIGHT: [number, number, number] = [230, 230, 230]
  const BG: [number, number, number] = [248, 248, 248]

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
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
  }

  // ── HEADER: "INVOICE" title + invoice number ──────────────────
  let y = 22

  setFont(28, 'bold', BLACK)
  doc.text('INVOICE', ML, y)

  setFont(12, 'normal', GRAY)
  doc.text(`# ${invoice.invoice_number}`, W - MR, y, { align: 'right' })

  y += 14

  // ── FROM BLOCK (seller) ──────────────────────────────────────
  setFont(13, 'bold', BLACK)
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
    doc.text(`Mob No: ${invoice.seller_mobile}`, ML, y)
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

  y += 6

  // ── BILL TO ───────────────────────────────────────────────────
  setFont(9, 'bold', DARK)
  doc.text('Bill To:', ML, y)
  y += 5.5

  setFont(11, 'bold', BLACK)
  doc.text(invoice.client_name || '—', ML, y)
  y += 5

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
    doc.text(`Mob No: ${invoice.client_mobile}`, ML, y)
    y += 4.5
  }
  if (invoice.client_email) {
    doc.text(`Email: ${invoice.client_email}`, ML, y)
    y += 4.5
  }

  y += 8

  // ── DATE & BALANCE DUE — two-column layout ────────────────────
  const col2X = W / 2 + 10

  setFont(9, 'normal', DARK)
  doc.text('Date:', ML, y)
  doc.text('Balance Due:', col2X, y)

  y += 5.5
  setFont(11, 'bold', BLACK)
  doc.text(formatDate(invoice.issue_date), ML, y)
  doc.text(money(invoice.total_amount), col2X, y)

  y += 10

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
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: { top: 3.5, right: 4, bottom: 3.5, left: 4 },
      textColor: DARK,
      lineColor: LIGHT,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: BG,
      textColor: DARK,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: LIGHT,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    tableLineColor: LIGHT,
    tableLineWidth: 0.2,
  })

  // @ts-expect-error jsPDF-autotable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 6

  // ── TOTALS ROW ────────────────────────────────────────────────
  const totX = W - MR - 70

  // Subtotal/tax/discount rows (only if needed)
  if (invoice.tax > 0 || invoice.discount > 0) {
    setFont(9, 'normal', GRAY)
    doc.text('Subtotal', totX, y)
    setFont(9, 'normal', DARK)
    doc.text(money(invoice.subtotal), W - MR, y, { align: 'right' })
    y += 5.5

    if (invoice.tax > 0) {
      setFont(9, 'normal', GRAY)
      doc.text(`Tax (${invoice.tax}%)`, totX, y)
      setFont(9, 'normal', DARK)
      doc.text(money((invoice.subtotal * invoice.tax) / 100), W - MR, y, { align: 'right' })
      y += 5.5
    }

    if (invoice.discount > 0) {
      const d =
        invoice.discount_type === 'percent'
          ? (invoice.subtotal * invoice.discount) / 100
          : invoice.discount
      setFont(9, 'normal', GRAY)
      doc.text('Discount', totX, y)
      setFont(9, 'normal', DARK)
      doc.text(`−${money(d)}`, W - MR, y, { align: 'right' })
      y += 5.5
    }

    y += 1
  }

  // Final Total row — right-aligned, bold
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.3)
  doc.line(totX, y, W - MR, y)
  y += 5.5

  setFont(11, 'bold', BLACK)
  doc.text('Total:', totX, y)
  doc.text(money(invoice.total_amount), W - MR, y, { align: 'right' })
  y += 12

  // ── NOTES ─────────────────────────────────────────────────────
  if (invoice.notes) {
    setFont(9, 'bold', DARK)
    doc.text('Notes', ML, y)
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
