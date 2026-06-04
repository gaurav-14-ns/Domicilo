-- =========================================================================
-- MAINTENANCE REQUESTS
-- =========================================================================
create table if not exists public.maintenance_requests (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 tenant_id uuid references public.tenants(id) on delete set null,
 title text not null,
 description text not null,
 priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
 status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists idx_mr_owner on public.maintenance_requests(owner_id);
create index if not exists idx_mr_tenant on public.maintenance_requests(tenant_id);
create index if not exists idx_mr_status on public.maintenance_requests(status);
alter table public.maintenance_requests enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='maintenance_requests' and policyname='owners manage own maintenance') then
    create policy "owners manage own maintenance" on public.maintenance_requests
      for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='maintenance_requests' and policyname='tenants create own requests') then
    create policy "tenants create own requests" on public.maintenance_requests
      for insert to authenticated with check (
        exists (
          select 1 from public.tenants t
          where t.id = tenant_id
            and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='maintenance_requests' and policyname='tenants read own requests') then
    create policy "tenants read own requests" on public.maintenance_requests
      for select to authenticated using (
        exists (
          select 1 from public.tenants t
          where t.id = tenant_id
            and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='maintenance_requests' and policyname='admin manages all maintenance') then
    create policy "admin manages all maintenance" on public.maintenance_requests
      for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

drop trigger if exists trg_mr_updated on public.maintenance_requests;
create trigger trg_mr_updated before update on public.maintenance_requests
 for each row execute function public.touch_updated_at();
