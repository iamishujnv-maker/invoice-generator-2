-- ============================================================
-- Invoicio — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── invoices ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  invoice_number  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'unpaid', 'paid')),

  -- Seller
  seller_name     TEXT NOT NULL DEFAULT '',
  seller_email    TEXT NOT NULL DEFAULT '',
  seller_address  TEXT NOT NULL DEFAULT '',

  -- Client
  client_name     TEXT NOT NULL DEFAULT '',
  client_email    TEXT NOT NULL DEFAULT '',
  client_address  TEXT NOT NULL DEFAULT '',

  -- Dates
  issue_date      DATE NOT NULL,
  due_date        DATE NOT NULL,

  -- Financials
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax             NUMERIC(5, 2)  NOT NULL DEFAULT 0,
  discount        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_type   TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'flat')),
  total_amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Extra
  notes           TEXT NOT NULL DEFAULT '',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── invoice_items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,

  name        TEXT NOT NULL,
  quantity    NUMERIC(10, 2) NOT NULL DEFAULT 1,
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total       NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS invoices_user_id_idx       ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx    ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx  ON public.invoice_items(invoice_id);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- invoices: users can only see/touch their own rows
CREATE POLICY "invoices: select own"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "invoices: insert own"
  ON public.invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "invoices: update own"
  ON public.invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "invoices: delete own"
  ON public.invoices FOR DELETE
  USING (auth.uid() = user_id);

-- invoice_items: access is granted through the parent invoice
CREATE POLICY "invoice_items: select via invoice"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items: insert via invoice"
  ON public.invoice_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items: update via invoice"
  ON public.invoice_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY "invoice_items: delete via invoice"
  ON public.invoice_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );
