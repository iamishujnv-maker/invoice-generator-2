'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/pdf'
import EmptyState from '@/components/ui/EmptyState'
import { Invoice } from '@/types'

export default function InvoiceList({ invoices: initial }: { invoices: Invoice[] }) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  async function handleDelete(id: string) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('invoice_items').delete().eq('invoice_id', id)
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    setDeletingId(null)
    router.refresh()
  }

  async function handleDownload(inv: Invoice) {
    setDownloadingId(inv.id)
    const supabase = createClient()
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', inv.id)
    await generateInvoicePDF({ ...inv, items: items || [] })
    setDownloadingId(null)
  }

  async function handleStatusChange(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status: status as Invoice['status'] } : inv))
    )
  }

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    unpaid: invoices.filter((i) => i.status === 'unpaid').length,
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Invoices', value: stats.total.toString(), icon: '📄', color: 'text-ink-900' },
          { label: 'Paid', value: stats.paid.toString(), icon: '✅', color: 'text-emerald-600' },
          { label: 'Unpaid', value: stats.unpaid.toString(), icon: '⏳', color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{s.label}</span>
              <span className="text-base">{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by client or invoice #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'paid', 'unpaid', 'draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === s
                  ? 'bg-accent text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty */}
      {filtered.length === 0 && invoices.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-400 text-sm">
          No invoices match your search.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Invoice #', 'Client', 'Amount', 'Issue Date', 'Due Date', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-accent whitespace-nowrap">
                      {inv.invoice_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-ink-900">{inv.client_name}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink-900 whitespace-nowrap">
                      {formatCurrency(inv.total_amount, inv.currency || 'INR')}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.issue_date)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(inv.due_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 cursor-pointer focus:ring-2 focus:ring-accent/20 border-0 ${
                          inv.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : inv.status === 'unpaid'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <option value="draft">Draft</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-ink-900 transition-colors"
                          title="View"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/invoices/${inv.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-ink-900 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDownload(inv)}
                          disabled={downloadingId === inv.id}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-accent transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === inv.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-accent rounded-full animate-spin block" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === inv.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin block" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
