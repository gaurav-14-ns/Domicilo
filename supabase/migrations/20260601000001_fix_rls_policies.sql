-- Allow owners to insert their own subscription (idempotent)
drop policy if exists "owner inserts own sub" on public.subscriptions;
create policy "owner inserts own sub" on public.subscriptions
  for insert to authenticated
  with check (owner_id = auth.uid());
