import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Invoicio — Professional Invoice Generator',
  description: 'Create, manage and send professional invoices in seconds.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-ink-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
