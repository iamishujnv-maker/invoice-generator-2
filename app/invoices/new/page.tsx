import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import InvoiceForm from '@/components/InvoiceForm'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar email={user.email} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">New Invoice</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to create a new invoice.</p>
        </div>
        <InvoiceForm userId={user.id} />
      </main>
    </div>
  )
}
