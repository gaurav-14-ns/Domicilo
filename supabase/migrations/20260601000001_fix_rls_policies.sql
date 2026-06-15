-- Allow owners to insert their own subscription (idempotent)
drop policy if exists "owner inserts own sub" on public.subscriptions;
create policy "owner inserts own sub" on public.subscriptions
  for insert to authenticated
  with check (owner_id = auth.uid());

-- ============================================================
-- TRANSACTIONS: add currency_code + locale columns
-- The frontend inserts these fields but they were never
-- added to the schema, causing INSERT failures at runtime.
-- ============================================================
alter table public.transactions
  add column if not exists currency_code text not null default 'INR';

alter table public.transactions
  add column if not exists locale text not null default 'en-IN';
