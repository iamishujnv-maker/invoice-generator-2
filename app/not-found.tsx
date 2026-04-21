import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center animate-fade-up">
        <div className="text-7xl font-bold text-slate-100 mb-4">404</div>
        <h2 className="text-xl font-bold text-ink-900 mb-2">Page not found</h2>
        <p className="text-slate-500 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  )
}
