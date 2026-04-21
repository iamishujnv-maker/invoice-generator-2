'use client'

import { useState } from 'react'
import { generateInvoicePDF } from '@/lib/pdf'
import { Invoice } from '@/types'

export default function DownloadButton({ invoice }: { invoice: Invoice }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    await generateInvoicePDF(invoice)
    setLoading(false)
  }

  return (
    <button onClick={handleDownload} disabled={loading} className="btn-primary">
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  )
}
