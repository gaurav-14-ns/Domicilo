-- ============================================================
-- TENANTS: allow tenant to update own profile fields
-- ============================================================

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
