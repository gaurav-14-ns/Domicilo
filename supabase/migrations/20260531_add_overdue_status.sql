-- ============================================================
-- 1. Fix: add "overdue" to transactions status check constraint
-- The original constraint only allows completed/pending/paused/refund
-- but the frontend escalates stale pending charges to "overdue"
-- ============================================================

alter table public.transactions
  drop constraint if exists transactions_status_check;

alter table public.transactions
  add constraint transactions_status_check
  check (status in ('completed','pending','paused','refund','overdue'));

-- ============================================================
-- 2. Add currency_code and locale columns to tenants table
-- These are already referenced by the frontend code and RLS
-- but were missing from the original migration
-- ============================================================

alter table public.tenants
  add column if not exists currency_code text not null default 'INR';

alter table public.tenants
  add column if not exists locale text not null default 'en-IN';
