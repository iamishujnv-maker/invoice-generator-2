import Link from 'next/link'

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-up">
      <div className="w-20 h-20 rounded-2xl bg-accent-light flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-ink-900 mb-2">No invoices yet</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Create your first invoice and start getting paid professionally.
      </p>
      <Link href="/invoices/new" className="btn-primary">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Create Invoice
      </Link>
    </div>
  )
}
