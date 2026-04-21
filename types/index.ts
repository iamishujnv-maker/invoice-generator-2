export type InvoiceStatus = 'draft' | 'unpaid' | 'paid'

export interface InvoiceItem {
  id?: string
  invoice_id?: string
  name: string
  quantity: number
  price: number
  total: number
}

export interface Invoice {
  id: string
  user_id: string
  invoice_number: string
  client_name: string
  client_email: string
  client_address: string
  seller_name: string
  seller_email: string
  seller_address: string
  issue_date: string
  due_date: string
  notes: string
  tax: number
  discount: number
  discount_type: 'percent' | 'flat'
  subtotal: number
  total_amount: number
  status: InvoiceStatus
  created_at: string
  updated_at: string
  items?: InvoiceItem[]
}

export interface InvoiceFormData {
  invoice_number: string
  seller_name: string
  seller_email: string
  seller_address: string
  client_name: string
  client_email: string
  client_address: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  tax: number
  discount: number
  discount_type: 'percent' | 'flat'
  notes: string
  status: InvoiceStatus
}
