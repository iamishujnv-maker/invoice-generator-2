import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DownloadButton from '@/components/DownloadButton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Invoice, InvoiceItem } from '@/types'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!invoice) notFound()

  const { data: items } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', id)

  const full = { ...invoice, items: items || [] } as Invoice & { items: InvoiceItem[] }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar email={user.email} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-ink-900 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-ink-900 font-mono">{invoice.invoice_number}</h1>
                <StatusBadge status={invoice.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Created {formatDate(invoice.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/invoices/${id}/edit`} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Link>
            <DownloadButton invoice={full} />
          </div>
        </div>

        {/* Invoice card */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-ink-900 px-8 py-7 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="text-white font-bold text-xl mb-0.5">{invoice.seller_name}</div>
              <div className="text-slate-400 text-sm">{invoice.seller_email}</div>
              {invoice.seller_address && (
                <div className="text-slate-500 text-xs mt-1 whitespace-pre-line">{invoice.seller_address}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Invoice</div>
              <div className="text-white font-mono font-bold text-lg">{invoice.invoice_number}</div>
              <div className="mt-2 space-y-0.5">
                <div className="text-xs text-slate-400">
                  Issued: <span className="text-slate-200">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Due: <span className="text-slate-200">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Bill To</div>
            <div className="font-semibold text-ink-900">{invoice.client_name}</div>
            {invoice.client_email && <div className="text-sm text-slate-500">{invoice.client_email}</div>}
            {invoice.client_address && (
              <div className="text-sm text-slate-400 whitespace-pre-line">{invoice.client_address}</div>
            )}
          </div>

          {/* Items */}
          <div className="px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</th>
                  <th className="text-center pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Qty</th>
                  <th className="text-right pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Unit Price</th>
                  <th className="text-right pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {full.items.map((item: InvoiceItem, i: number) => (
                  <tr key={i} className="py-2">
                    <td className="py-3 pr-4 text-ink-900 font-medium">{item.name}</td>
                    <td className="py-3 text-center text-slate-500">{item.quantity}</td>
                    <td className="py-3 text-right text-slate-500">{formatCurrency(item.price)}</td>
                    <td className="py-3 text-right font-semibold text-ink-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 pb-6">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tax ({invoice.tax}%)</span>
                  <span>{formatCurrency(invoice.subtotal * invoice.tax / 100)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Discount ({invoice.discount_type === 'percent' ? `${invoice.discount}%` : formatCurrency(invoice.discount)})</span>
                  <span className="text-emerald-600">
                    −{formatCurrency(invoice.discount_type === 'percent' ? invoice.subtotal * invoice.discount / 100 : invoice.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <span className="font-bold text-ink-900">Total</span>
                <span className="text-2xl font-bold text-accent">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-8 pb-8 pt-2">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
