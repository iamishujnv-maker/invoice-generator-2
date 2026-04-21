import { statusColor } from '@/lib/utils'
import { InvoiceStatus } from '@/types'

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor(status)}`}>
      {status}
    </span>
  )
}
