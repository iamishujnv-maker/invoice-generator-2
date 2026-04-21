'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { generateInvoiceNumber, calculateInvoiceTotals, formatCurrency } from '@/lib/utils'
import { InvoiceFormData, InvoiceItem, Invoice } from '@/types'

const defaultItem = (): InvoiceItem => ({
  name: '',
  quantity: 1,
  price: 0,
  total: 0,
})

const today = new Date().toISOString().split('T')[0]
const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

interface Props {
  userId: string
  existing?: Invoice & { items?: InvoiceItem[] }
}

export default function InvoiceForm({ userId, existing }: Props) {
  const router = useRouter()
  const isEdit = !!existing

  const [form, setForm] = useState<InvoiceFormData>({
    invoice_number: existing?.invoice_number ?? generateInvoiceNumber(),
    seller_name: existing?.seller_name ?? '',
    seller_email: existing?.seller_email ?? '',
    seller_address: existing?.seller_address ?? '',
    client_name: existing?.client_name ?? '',
    client_email: existing?.client_email ?? '',
    client_address: existing?.client_address ?? '',
    issue_date: existing?.issue_date ?? today,
    due_date: existing?.due_date ?? thirtyDays,
    items: existing?.items?.length ? existing.items : [defaultItem()],
    tax: existing?.tax ?? 0,
    discount: existing?.discount ?? 0,
    discount_type: existing?.discount_type ?? 'percent',
    notes: existing?.notes ?? '',
    status: existing?.status ?? 'draft',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { subtotal, total } = calculateInvoiceTotals(
    form.items,
    form.tax,
    form.discount,
    form.discount_type
  )

  const updateItem = useCallback((i: number, field: keyof InvoiceItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items]
      const item = { ...items[i], [field]: value }
      if (field === 'quantity' || field === 'price') {
        item.total = Number(item.quantity) * Number(item.price)
      }
      items[i] = item
      return { ...prev, items }
    })
  }, [])

  const addItem = () => setForm((prev) => ({ ...prev, items: [...prev.items, defaultItem()] }))
  const removeItem = (i: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.items.length === 0) { setError('Add at least one item.'); return }
    setError('')
    setSaving(true)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      invoice_number: form.invoice_number,
      seller_name: form.seller_name,
      seller_email: form.seller_email,
      seller_address: form.seller_address,
      client_name: form.client_name,
      client_email: form.client_email,
      client_address: form.client_address,
      issue_date: form.issue_date,
      due_date: form.due_date,
      tax: form.tax,
      discount: form.discount,
      discount_type: form.discount_type,
      notes: form.notes,
      status: form.status,
      subtotal,
      total_amount: total,
    }

    let invoiceId = existing?.id

    if (isEdit && invoiceId) {
      const { error: err } = await supabase.from('invoices').update(payload).eq('id', invoiceId)
      if (err) { setError(err.message); setSaving(false); return }
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId)
    } else {
      const { data, error: err } = await supabase.from('invoices').insert(payload).select().single()
      if (err || !data) { setError(err?.message ?? 'Failed to create invoice'); setSaving(false); return }
      invoiceId = data.id
    }

    const items = form.items.map((item) => ({
      invoice_id: invoiceId,
      name: item.name,
      quantity: Number(item.quantity),
      price: Number(item.price),
      total: Number(item.quantity) * Number(item.price),
    }))

    const { error: itemsErr } = await supabase.from('invoice_items').insert(items)
    if (itemsErr) { setError(itemsErr.message); setSaving(false); return }

    router.push(`/invoices/${invoiceId}`)
    router.refresh()
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card p-6 space-y-4">
      <h2 className="text-sm font-bold text-ink-700 uppercase tracking-widest pb-3 border-b border-slate-100">
        {title}
      </h2>
      {children}
    </div>
  )

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="label-base">{label}</label>
      {children}
    </div>
  )

  const grid2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Invoice Meta */}
      <Section title="Invoice Details">
        <div className={grid2}>
          <Field label="Invoice Number">
            <div className="flex gap-2">
              <input
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                className="input-base font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, invoice_number: generateInvoiceNumber() })}
                className="btn-secondary px-3 whitespace-nowrap text-xs"
                title="Auto-generate"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceFormData['status'] })}
              className="input-base"
            >
              <option value="draft">Draft</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Issue Date">
            <input type="date" value={form.issue_date}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              className="input-base" required />
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="input-base" required />
          </Field>
        </div>
      </Section>

      {/* Parties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Your Info (Seller)">
          <Field label="Name / Company">
            <input value={form.seller_name} onChange={(e) => setForm({ ...form, seller_name: e.target.value })}
              className="input-base" placeholder="Acme Inc." required />
          </Field>
          <Field label="Email">
            <input type="email" value={form.seller_email}
              onChange={(e) => setForm({ ...form, seller_email: e.target.value })}
              className="input-base" placeholder="billing@acme.com" />
          </Field>
          <Field label="Address">
            <textarea value={form.seller_address}
              onChange={(e) => setForm({ ...form, seller_address: e.target.value })}
              className="input-base resize-none" rows={2} placeholder="123 Main St, City, Country" />
          </Field>
        </Section>

        <Section title="Client Info">
          <Field label="Client Name / Company">
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="input-base" placeholder="Client Corp." required />
          </Field>
          <Field label="Client Email">
            <input type="email" value={form.client_email}
              onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              className="input-base" placeholder="client@example.com" />
          </Field>
          <Field label="Client Address">
            <textarea value={form.client_address}
              onChange={(e) => setForm({ ...form, client_address: e.target.value })}
              className="input-base resize-none" rows={2} placeholder="456 Client Ave, City, Country" />
          </Field>
        </Section>
      </div>

      {/* Line Items */}
      <Section title="Line Items">
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 gap-2 px-1">
            {['Description', 'Qty', 'Unit Price', 'Total', ''].map((h, i) => (
              <div key={i} className={`label-base ${i === 0 ? 'col-span-5' : i === 3 ? 'col-span-2 text-right' : i === 4 ? 'col-span-1' : 'col-span-2'}`}>
                {h}
              </div>
            ))}
          </div>

          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
              <div className="col-span-12 sm:col-span-5">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                  className="input-base"
                  placeholder="Service or product name"
                  required
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number" min="0" step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="input-base text-center"
                  placeholder="1"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <input
                  type="number" min="0" step="0.01"
                  value={item.price}
                  onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                  className="input-base"
                  placeholder="0.00"
                />
              </div>
              <div className="col-span-3 sm:col-span-2 text-right">
                <span className="text-sm font-semibold text-ink-900">{formatCurrency(item.total)}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem}
          className="btn-secondary text-xs mt-1 w-full justify-center border-dashed">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Line Item
        </button>
      </Section>

      {/* Totals & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Notes">
          <Field label="Notes / Payment Terms">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input-base resize-none"
              rows={4}
              placeholder="Payment due within 30 days. Bank transfer details: …"
            />
          </Field>
        </Section>

        <Section title="Totals">
          <div className="space-y-3">
            <div className={grid2}>
              <Field label="Tax (%)">
                <input type="number" min="0" max="100" step="0.1"
                  value={form.tax}
                  onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
                  className="input-base" />
              </Field>
              <Field label="Discount">
                <div className="flex gap-2">
                  <input type="number" min="0" step="0.01"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                    className="input-base" />
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percent' | 'flat' })}
                    className="input-base w-20"
                  >
                    <option value="percent">%</option>
                    <option value="flat">$</option>
                  </select>
                </div>
              </Field>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-ink-900">{formatCurrency(subtotal)}</span>
              </div>
              {form.tax > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tax ({form.tax}%)</span>
                  <span>{formatCurrency(subtotal * form.tax / 100)}</span>
                </div>
              )}
              {form.discount > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Discount</span>
                  <span className="text-emerald-600">
                    −{formatCurrency(form.discount_type === 'percent' ? subtotal * form.discount / 100 : form.discount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-sm font-bold text-ink-900">Total</span>
                <span className="text-xl font-bold text-accent">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary px-6">
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {isEdit ? 'Saving…' : 'Creating…'}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Save Changes' : 'Create Invoice'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
