-- ============================================================
-- TENANTS: allow tenant to update own profile fields
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='tenants' and policyname='tenant updates own record'
  ) then
    create policy "tenant updates own record"
    on public.tenants
    for update
    to authenticated
    using (
      lower(email) = lower(coalesce((auth.jwt()->>'email'), ''))
    )
    with check (
      lower(email) = lower(coalesce((auth.jwt()->>'email'), ''))
    );
  end if;
end
$$;
