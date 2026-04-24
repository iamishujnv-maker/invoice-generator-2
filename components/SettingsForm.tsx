'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { CURRENCIES, UserSettings } from '@/types'

// Define Section/Field OUTSIDE so inputs don't lose focus
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="pb-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-ink-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
    </div>
  )
}

const defaultSettings: Omit<UserSettings, 'user_id' | 'created_at' | 'updated_at'> = {
  default_currency: 'INR',
  default_tax: 0,
  default_notes: '',
  seller_name: '',
  seller_email: '',
  seller_address: '',
  seller_pan: '',
  seller_gstin: '',
  seller_mobile: '',
}

interface Props {
  userId: string
  initial: UserSettings | null
}

export default function SettingsForm({ userId, initial }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(() => ({
    default_currency: initial?.default_currency ?? 'INR',
    default_tax: initial?.default_tax ?? 0,
    default_notes: initial?.default_notes ?? '',
    seller_name: initial?.seller_name ?? '',
    seller_email: initial?.seller_email ?? '',
    seller_address: initial?.seller_address ?? '',
    seller_pan: initial?.seller_pan ?? '',
    seller_gstin: initial?.seller_gstin ?? '',
    seller_mobile: initial?.seller_mobile ?? '',
  }))

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const set = <K extends keyof typeof form>(key: K, val: typeof form[K]) =>
    setForm(p => ({ ...p, [key]: val }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    const supabase = createClient()
    const payload = { ...form, user_id: userId }

    const { error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })

    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Settings saved.' })
      router.refresh()
    }
    setSaving(false)
  }

  const g2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-fade-up">
      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          msg.type === 'success'
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
            : 'bg-red-50 border border-red-100 text-red-600'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Defaults */}
      <Section title="Invoice Defaults" subtitle="Applied automatically to new invoices">
        <div className={g2}>
          <Field label="Default Currency">
            <select value={form.default_currency} onChange={e => set('default_currency', e.target.value)}
              className="input-base">
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Default Tax (%)">
            <input type="number" min="0" max="100" step="0.1" value={form.default_tax}
              onChange={e => set('default_tax', parseFloat(e.target.value) || 0)}
              className="input-base" />
          </Field>
        </div>
        <Field label="Default Notes / Payment Terms">
          <textarea value={form.default_notes} onChange={e => set('default_notes', e.target.value)}
            className="input-base resize-none" rows={3}
            placeholder="e.g. Payment due within 30 days. Bank: HDFC, A/C: XXXXX, IFSC: HDFC0000001" />
        </Field>
      </Section>

      {/* Your info */}
      <Section title="Your Business Info" subtitle="This will appear in the 'From' section of every invoice">
        <Field label="Name / Company">
          <input value={form.seller_name} onChange={e => set('seller_name', e.target.value)}
            className="input-base" placeholder="Your Name / Company" />
        </Field>

        <div className={g2}>
          <Field label="PAN Number">
            <input value={form.seller_pan}
              onChange={e => set('seller_pan', e.target.value.toUpperCase())}
              className="input-base font-mono" placeholder="ABCDE1234F" maxLength={10} />
          </Field>
          <Field label="GSTIN">
            <input value={form.seller_gstin}
              onChange={e => set('seller_gstin', e.target.value.toUpperCase())}
              className="input-base font-mono" placeholder="22ABCDE1234F1Z5" maxLength={15} />
          </Field>
        </div>

        <div className={g2}>
          <Field label="Mobile">
            <input value={form.seller_mobile} onChange={e => set('seller_mobile', e.target.value)}
              className="input-base" type="tel" placeholder="9XXXXXXXXX" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.seller_email} onChange={e => set('seller_email', e.target.value)}
              className="input-base" placeholder="you@example.com" />
          </Field>
        </div>

        <Field label="Address">
          <textarea value={form.seller_address} onChange={e => set('seller_address', e.target.value)}
            className="input-base resize-none" rows={3}
            placeholder="Street, City, State, PIN" />
        </Field>
      </Section>

      <div className="flex justify-end pt-2">
        <button type="submit" disabled={saving} className="btn-primary px-6">
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}
