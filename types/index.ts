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
  // Seller
  seller_name: string
  seller_email: string
  seller_address: string
  seller_pan: string
  seller_gstin: string
  seller_mobile: string
  // Client
  client_name: string
  client_email: string
  client_address: string
  client_gstin: string
  client_mobile: string
  // Dates
  issue_date: string
  due_date: string
  // Financials
  currency: string
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
  seller_pan: string
  seller_gstin: string
  seller_mobile: string
  client_name: string
  client_email: string
  client_address: string
  client_gstin: string
  client_mobile: string
  issue_date: string
  due_date: string
  currency: string
  items: InvoiceItem[]
  tax: number
  discount: number
  discount_type: 'percent' | 'flat'
  notes: string
  status: InvoiceStatus
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'AED', symbol: 'AED', label: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
]
