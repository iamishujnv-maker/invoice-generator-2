export function generateInvoiceNumber(): string {
  const prefix = 'INV'
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${year}-${random}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function calculateInvoiceTotals(
  items: { quantity: number; price: number; total: number }[],
  tax: number,
  discount: number,
  discountType: 'percent' | 'flat'
) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = (subtotal * tax) / 100
  const discountAmount =
    discountType === 'percent' ? (subtotal * discount) / 100 : discount
  const total = subtotal + taxAmount - discountAmount
  return { subtotal, taxAmount, discountAmount, total: Math.max(0, total) }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    case 'unpaid':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    case 'draft':
    default:
      return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
  }
}
