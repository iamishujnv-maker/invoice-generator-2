import { Invoice } from '@/types'

export async function generateInvoicePDF(invoice: Invoice): Promise<void> {
  // Dynamic import to avoid SSR issues
  const jsPDF = (await import('jspdf')).default
  const autoTable = (await import('jspdf-autotable')).default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  const colRight = pageW - margin

  // ── Palette ──────────────────────────────────────────────────────────────
  const INK = [15, 17, 23] as [number, number, number]
  const ACCENT = [79, 110, 247] as [number, number, number]
  const LIGHT = [245, 245, 247] as [number, number, number]
  const MID = [168, 168, 184] as [number, number, number]
  const WHITE = [255, 255, 255] as [number, number, number]

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...ACCENT)
  doc.rect(0, 0, pageW, 42, 'F')

  // Company / seller name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...WHITE)
  doc.text(invoice.seller_name || 'Your Company', margin, 18)

  // "INVOICE" label right side
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(200, 210, 255)
  doc.text('INVOICE', colRight, 14, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...WHITE)
  doc.text(`#${invoice.invoice_number}`, colRight, 22, { align: 'right' })

  // Seller email + address below name
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(200, 210, 255)
  const sellerLines = [invoice.seller_email, invoice.seller_address].filter(Boolean)
  doc.text(sellerLines.join('  ·  '), margin, 28)

  // Status pill top-right
  const statusColors: Record<string, [number, number, number]> = {
    paid: [16, 185, 129],
    unpaid: [245, 158, 11],
    draft: [168, 168, 184],
  }
  const sc = statusColors[invoice.status] ?? MID
  doc.setFillColor(...sc)
  doc.roundedRect(colRight - 28, 30, 28, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...WHITE)
  doc.text(invoice.status.toUpperCase(), colRight - 14, 35.5, { align: 'center' })

  // ── Dates row ────────────────────────────────────────────────────────────
  doc.setFillColor(...LIGHT)
  doc.rect(0, 42, pageW, 18, 'F')

  const dateFields = [
    { label: 'Issue Date', value: formatDate(invoice.issue_date) },
    { label: 'Due Date', value: formatDate(invoice.due_date) },
  ]
  dateFields.forEach((f, i) => {
    const x = margin + i * 70
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MID)
    doc.text(f.label.toUpperCase(), x, 50)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...INK)
    doc.text(f.value, x, 56)
  })

  // ── Bill To / From ───────────────────────────────────────────────────────
  let y = 72

  const drawParty = (label: string, name: string, email: string, address: string, x: number) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...ACCENT)
    doc.text(label, x, y)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...INK)
    doc.text(name || '—', x, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MID)
    const lines = [email, address].filter(Boolean)
    lines.forEach((l, i) => doc.text(l, x, y + 13 + i * 5))
  }

  drawParty('FROM', invoice.seller_name, invoice.seller_email, invoice.seller_address, margin)
  drawParty('BILL TO', invoice.client_name, invoice.client_email, invoice.client_address, pageW / 2)

  y += 42

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...LIGHT)
  doc.setLineWidth(0.4)
  doc.line(margin, y, colRight, y)
  y += 8

  // ── Items table ───────────────────────────────────────────────────────────
  const items = (invoice.items || []).map((item) => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: items,
    margin: { left: margin, right: margin },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: INK },
    headStyles: {
      fillColor: INK,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 28 },
    },
    tableLineColor: [230, 230, 235],
    tableLineWidth: 0.2,
  })

  // @ts-expect-error jsPDF-autotable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 10

  // ── Totals block ──────────────────────────────────────────────────────────
  const totalsX = pageW / 2 + 10
  const totalsW = colRight - totalsX

  const drawTotalRow = (label: string, value: string, bold = false, big = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(big ? 11 : 9)
    const rowColor = (bold && big) ? INK : MID
    doc.setTextColor(...rowColor)
    doc.text(label, totalsX, y)
    doc.setTextColor(...rowColor)
    doc.text(value, totalsX + totalsW, y, { align: 'right' })
    y += big ? 8 : 6
  }

  drawTotalRow('Subtotal', formatCurrency(invoice.subtotal))
  if (invoice.tax > 0) drawTotalRow(`Tax (${invoice.tax}%)`, formatCurrency(invoice.subtotal * invoice.tax / 100))
  if (invoice.discount > 0) {
    const discVal = invoice.discount_type === 'percent'
      ? invoice.subtotal * invoice.discount / 100
      : invoice.discount
    drawTotalRow(`Discount (${invoice.discount_type === 'percent' ? invoice.discount + '%' : formatCurrency(invoice.discount)})`, `−${formatCurrency(discVal)}`)
  }

  // Total divider
  doc.setDrawColor(...ACCENT)
  doc.setLineWidth(0.5)
  doc.line(totalsX, y, totalsX + totalsW, y)
  y += 5

  // Bold total
  doc.setFillColor(...ACCENT)
  doc.roundedRect(totalsX - 4, y - 4, totalsW + 8, 12, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...WHITE)
  doc.text('TOTAL', totalsX, y + 4)
  doc.text(formatCurrency(invoice.total_amount), totalsX + totalsW, y + 4, { align: 'right' })
  y += 18

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...ACCENT)
    doc.text('NOTES', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...INK)
    const noteLines = doc.splitTextToSize(invoice.notes, pageW - margin * 2)
    doc.text(noteLines, margin, y)
    y += noteLines.length * 5 + 8
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 12
  doc.setDrawColor(...LIGHT)
  doc.line(margin, footerY - 4, colRight, footerY - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MID)
  doc.text(`Invoice #${invoice.invoice_number}  ·  Generated ${new Date().toLocaleDateString()}`, margin, footerY)
  doc.text('Thank you for your business', colRight, footerY, { align: 'right' })

  doc.save(`invoice-${invoice.invoice_number}.pdf`)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
