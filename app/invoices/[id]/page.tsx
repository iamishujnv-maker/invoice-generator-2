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
  const curr = invoice.currency || 'INR'
  const money = (n: number) => formatCurrency(n, curr)

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
                <h1 className="text-xl font-bold text-ink-900 font-mono">#{invoice.invoice_number}</h1>
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

        {/* Invoice card — Chanderpati-style clean layout */}
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="px-10 py-10 border-b border-slate-100">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-ink-900 tracking-tight mb-1">INVOICE</h2>
                <p className="text-slate-400 text-sm font-mono"># {invoice.invoice_number}</p>
              </div>
              <div className="text-right space-y-2">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Date</div>
                  <div className="text-sm font-semibold text-ink-900">{formatDate(invoice.issue_date)}</div>
                </div>
                {invoice.due_date && (
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Due Date</div>
                    <div className="text-sm font-semibold text-ink-900">{formatDate(invoice.due_date)}</div>
                  </div>
                )}
                <div className="pt-2">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Balance Due</div>
                  <div className="text-lg font-bold text-ink-900">{money(invoice.total_amount)}</div>
                </div>
              </div>
            </div>

            {/* Seller block */}
            <div className="mb-6">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">From</div>
              <div className="font-bold text-ink-900 text-base">{invoice.seller_name || '—'}</div>
              <div className="text-sm text-slate-600 mt-0.5 space-y-0.5">
                {invoice.seller_pan && <div>PAN: <span className="font-mono">{invoice.seller_pan}</span></div>}
                {invoice.seller_gstin && <div>GSTIN: <span className="font-mono">{invoice.seller_gstin}</span></div>}
                {invoice.seller_mobile && <div>Mob No: {invoice.seller_mobile}</div>}
                {invoice.seller_email && <div>{invoice.seller_email}</div>}
                {invoice.seller_address && (
                  <div className="whitespace-pre-line text-slate-500">{invoice.seller_address}</div>
                )}
              </div>
            </div>

            {/* Client block */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bill To</div>
              <div className="font-bold text-ink-900 text-base">{invoice.client_name || '—'}</div>
              <div className="text-sm text-slate-600 mt-0.5 space-y-0.5">
                {invoice.client_gstin && <div>GSTIN: <span className="font-mono">{invoice.client_gstin}</span></div>}
                {invoice.client_mobile && <div>Mob No: {invoice.client_mobile}</div>}
                {invoice.client_email && <div>Email: {invoice.client_email}</div>}
                {invoice.client_address && (
                  <div className="whitespace-pre-line text-slate-500">{invoice.client_address}</div>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="px-10 py-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Item</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20">Quantity</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Rate</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                {full.items.map((item, i) => (
                  <tr key={i} className="border-x border-b border-slate-200">
                    <td className="px-4 py-3 text-ink-900">{item.name}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-mono text-xs">{money(item.price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-ink-900 font-mono text-xs">{money(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono">{money(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Tax ({invoice.tax}%)</span>
                    <span className="font-mono">{money(invoice.subtotal * invoice.tax / 100)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Discount {invoice.discount_type === 'percent' ? `(${invoice.discount}%)` : ''}</span>
                    <span className="text-emerald-600 font-mono">
                      −{money(invoice.discount_type === 'percent' ? invoice.subtotal * invoice.discount / 100 : invoice.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t-2 border-ink-900">
                  <span className="font-bold text-ink-900">Total</span>
                  <span className="text-lg font-bold text-ink-900 font-mono">{money(invoice.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="px-10 pb-10 pt-2">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
