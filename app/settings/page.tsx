import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Navbar from '@/components/Navbar'
import SettingsForm from '@/components/SettingsForm'
import { UserSettings } from '@/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar email={user.email} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Set your defaults — they&apos;ll auto-fill every new invoice.
          </p>
        </div>
        <SettingsForm userId={user.id} initial={settings as UserSettings | null} />
      </main>
    </div>
  )
}
