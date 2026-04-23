-- Fix function search_path warning
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tighten leads insert policy: require non-empty name + email instead of (true)
drop policy if exists "anyone can submit lead" on public.leads;
create policy "anyone can submit lead" on public.leads
  for insert to anon, authenticated
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 3
    and position('@' in email) > 1
  );