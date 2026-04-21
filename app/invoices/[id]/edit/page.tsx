import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import InvoiceForm from '@/components/InvoiceForm'
import { Invoice, InvoiceItem } from '@/types'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Edit Invoice</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-mono">{invoice.invoice_number}</p>
        </div>
        <InvoiceForm userId={user.id} existing={full} />
      </main>
    </div>
  )
}
