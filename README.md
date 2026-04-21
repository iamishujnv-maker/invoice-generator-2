# Invoicio — Invoice Generator

A production-ready SaaS invoice generator built with **Next.js 15**, **Supabase**, and deployed on **Vercel**.

## Features

- 🔐 **Auth** — Email/password login & signup via Supabase Auth
- 📊 **Dashboard** — View all invoices with search & filter by status
- 📝 **Create / Edit** — Full invoice form with dynamic line items
- 🧮 **Auto calculations** — Subtotal, tax, discount, grand total
- 📄 **PDF Generation** — Professional branded PDF download (client-side, jsPDF)
- 🔒 **Row Level Security** — Users can only access their own data
- ✅ **Status tracking** — Draft / Unpaid / Paid with inline update
- 📱 **Responsive** — Mobile-friendly layout

## Tech Stack

| Layer    | Tech                         |
|----------|------------------------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Auth/DB  | Supabase (Auth + PostgreSQL + RLS) |
| PDF      | jsPDF + jsPDF-AutoTable (client-side) |
| Deploy   | Vercel                        |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/invoice-generator.git
cd invoice-generator
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. Copy your **Project URL** and **anon key** from Project Settings → API

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import repo
3. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

### Supabase Auth Redirect URL

In Supabase → **Authentication → URL Configuration**, add:

```
https://your-vercel-domain.vercel.app/auth/callback
```

---

## Project Structure

```
invoice-generator/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Redirect to dashboard/login
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── auth/callback/route.ts  # Auth callback handler
│   ├── dashboard/page.tsx      # Invoice dashboard
│   └── invoices/
│       ├── new/page.tsx        # Create invoice
│       └── [id]/
│           ├── page.tsx        # View invoice
│           └── edit/page.tsx   # Edit invoice
├── components/
│   ├── Navbar.tsx
│   ├── InvoiceList.tsx         # Dashboard list + search
│   ├── InvoiceForm.tsx         # Create/edit form
│   ├── DownloadButton.tsx      # PDF download trigger
│   └── ui/
│       ├── StatusBadge.tsx
│       ├── Spinner.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase.ts             # Browser client
│   ├── supabase-server.ts      # Server client
│   ├── pdf.ts                  # jsPDF generation
│   └── utils.ts                # Helpers
├── types/
│   └── index.ts
├── middleware.ts               # Auth route protection
└── supabase-schema.sql         # Full DB schema with RLS
```

---

## Database Schema

### `invoices`

| Column         | Type      | Description                  |
|----------------|-----------|------------------------------|
| id             | UUID      | Primary key                  |
| user_id        | UUID      | FK → auth.users              |
| invoice_number | TEXT      | e.g. INV-2024-4821           |
| status         | TEXT      | draft / unpaid / paid        |
| seller_*       | TEXT      | Seller name/email/address    |
| client_*       | TEXT      | Client name/email/address    |
| issue_date     | DATE      |                              |
| due_date       | DATE      |                              |
| subtotal       | NUMERIC   | Sum of line items            |
| tax            | NUMERIC   | Tax percentage               |
| discount       | NUMERIC   | Discount value               |
| discount_type  | TEXT      | percent or flat              |
| total_amount   | NUMERIC   | Final amount                 |
| notes          | TEXT      |                              |
| created_at     | TIMESTAMPTZ |                            |

### `invoice_items`

| Column     | Type    | Description          |
|------------|---------|----------------------|
| id         | UUID    | Primary key          |
| invoice_id | UUID    | FK → invoices        |
| name       | TEXT    | Description          |
| quantity   | NUMERIC |                      |
| price      | NUMERIC | Unit price           |
| total      | NUMERIC | quantity × price     |

---

## Security

- All routes protected via Next.js `middleware.ts`
- Supabase RLS ensures users only see their own invoices
- `user_id` is always set server-side from `auth.uid()`
- No client-side trust for user identity
