-- Allow owners to insert their own subscription
create policy "owner inserts own sub" on public.subscriptions
  for insert to authenticated
  with check (owner_id = auth.uid());
