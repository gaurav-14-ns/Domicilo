-- =========================================================================
-- PROPERTIES
-- =========================================================================
create table if not exists public.properties (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 address text not null default '',
 units integer not null default 1 check (units >= 0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_properties_owner on public.properties(owner_id);
alter table public.properties enable row level security;

-- =========================================================================
-- TENANTS
-- =========================================================================
create table if not exists public.tenants (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 property_id uuid references public.properties(id) on delete set null,
 name text not null,
 room text not null default '',
 rent numeric(14,2) not null default 0 check (rent >= 0),
 deposit numeric(14,2) not null default 0 check (deposit >= 0),
 email text not null default '',
 phone text not null default '',
 start_date date not null default current_date,
 status text not null default 'active' check (status in ('active','paused','deactivated','moved_out')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_tenants_owner on public.tenants(owner_id);
create index if not exists idx_tenants_property on public.tenants(property_id);
create index if not exists idx_tenants_email on public.tenants(lower(email));
alter table public.tenants enable row level security;

-- =========================================================================
-- TRANSACTIONS
-- =========================================================================
create table if not exists public.transactions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 tenant_id uuid references public.tenants(id) on delete set null,
 property_id uuid references public.properties(id) on delete set null,
 date date not null default current_date,
 type text not null default 'Rent',
 amount numeric(14,2) not null default 0,
 status text not null default 'completed' check (status in ('completed','pending','paused','refund')),
 note text,
 auto boolean not null default false,
 month_key text, -- 'YYYY-MM' for rent dedup
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (tenant_id, type, month_key)
);
create index if not exists idx_tx_owner on public.transactions(owner_id);
create index if not exists idx_tx_tenant on public.transactions(tenant_id);
create index if not exists idx_tx_property on public.transactions(property_id);
create index if not exists idx_tx_date on public.transactions(date desc);
alter table public.transactions enable row level security;

-- =========================================================================
-- APP SETTINGS (one row per user)
-- =========================================================================
create table if not exists public.app_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 company_name text not null default 'Domicilo',
 contact_email text not null default '',
 currency_code text not null default 'INR',
 locale text not null default 'en-IN',
 theme text not null default 'system' check (theme in ('light','dark','system')),
 email_notifications boolean not null default true,
 sms_notifications boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- =========================================================================
-- TENANT PROFILES (tenant-side personal info)
-- =========================================================================
create table if not exists public.tenant_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 phone text not null default '',
 emergency text not null default '',
 email text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.tenant_profiles enable row level security;

-- =========================================================================
-- LEADS (public marketing form)
-- =========================================================================
create table if not exists public.leads (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 email text not null,
 company text,
 message text,
 source text not null default 'contact',
 created_at timestamptz not null default now()
);
alter table public.leads enable row level security;

-- =========================================================================
-- ADMIN ORGS
-- =========================================================================
create table if not exists public.admin_orgs (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 owner text not null default '',
 plan text not null default 'Startup',
 users integer not null default 0,
 mrr numeric(14,2) not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.admin_orgs enable row level security;

-- =========================================================================
-- updated_at trigger function
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
 new.updated_at = now();
 return new;
end;
$$;

drop trigger if exists trg_properties_updated on public.properties;
create trigger trg_properties_updated before update on public.properties
 for each row execute function public.touch_updated_at();

drop trigger if exists trg_tenants_updated on public.tenants;
create trigger trg_tenants_updated before update on public.tenants
 for each row execute function public.touch_updated_at();

drop trigger if exists trg_tx_updated on public.transactions;
create trigger trg_tx_updated before update on public.transactions
 for each row execute function public.touch_updated_at();

drop trigger if exists trg_settings_updated on public.app_settings;
create trigger trg_settings_updated before update on public.app_settings
 for each row execute function public.touch_updated_at();

drop trigger if exists trg_tprofiles_updated on public.tenant_profiles;
create trigger trg_tprofiles_updated before update on public.tenant_profiles
 for each row execute function public.touch_updated_at();

drop trigger if exists trg_admin_orgs_updated on public.admin_orgs;
create trigger trg_admin_orgs_updated before update on public.admin_orgs
 for each row execute function public.touch_updated_at();

-- =========================================================================
-- Auto-create settings row on signup (extend existing handle_new_user)
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
 _role public.app_role;
begin
 insert into public.profiles (id, full_name, email)
 values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
 on conflict (id) do update
 set full_name = excluded.full_name,
     email = excluded.email,
     updated_at = now();

 _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'tenant'::public.app_role);
 insert into public.user_roles (user_id, role)
 values (new.id, _role)
 on conflict (user_id, role) do nothing;

 insert into public.app_settings (user_id, display_name, contact_email, currency_code, locale)
 values (
   new.id,
   coalesce(new.raw_user_meta_data->>'full_name', ''),
   new.email,
   coalesce(new.raw_user_meta_data->>'currency_code', 'INR'),
   coalesce(new.raw_user_meta_data->>'locale', 'en-IN')
 )
 on conflict (user_id) do update
 set display_name = excluded.display_name,
     contact_email = excluded.contact_email,
     currency_code = excluded.currency_code,
     locale = excluded.locale,
     updated_at = now();

 if _role = 'tenant' then
   insert into public.tenant_profiles (user_id, email)
   values (new.id, new.email)
   on conflict (user_id) do update
   set email = excluded.email,
       updated_at = now();
 end if;

 return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
 after insert on auth.users
 for each row execute function public.handle_new_user();

-- =========================================================================
-- RLS POLICIES (idempotent guards)
-- =========================================================================
do $$
begin
  -- Properties
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='properties' and policyname='owner manages own properties') then
    create policy "owner manages own properties" on public.properties
      for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='properties' and policyname='admin manages all properties') then
    create policy "admin manages all properties" on public.properties
      for all to authenticated using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='properties' and policyname='tenant reads linked property') then
    create policy "tenant reads linked property" on public.properties
      for select to authenticated using (
        exists (
          select 1 from public.tenants t
          where t.property_id = properties.id
            and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
        )
      );
  end if;

  -- Tenants
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='owner manages own tenants') then
    create policy "owner manages own tenants" on public.tenants
      for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='admin manages all tenants') then
    create policy "admin manages all tenants" on public.tenants
      for all to authenticated using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='tenant reads own record') then
    create policy "tenant reads own record" on public.tenants
      for select to authenticated using (
        lower(email) = lower(coalesce((auth.jwt()->>'email'),''))
      );
  end if;

  -- Transactions
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='transactions' and policyname='owner manages own transactions') then
    create policy "owner manages own transactions" on public.transactions
      for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='transactions' and policyname='admin manages all transactions') then
    create policy "admin manages all transactions" on public.transactions
      for all to authenticated using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='transactions' and policyname='tenant reads own transactions') then
    create policy "tenant reads own transactions" on public.transactions
      for select to authenticated using (
        exists (
          select 1 from public.tenants t
          where t.id = transactions.tenant_id
            and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
        )
      );
  end if;

  -- App settings
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='user manages own settings') then
    create policy "user manages own settings" on public.app_settings
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='admin reads all settings') then
    create policy "admin reads all settings" on public.app_settings
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  -- Tenant profiles
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenant_profiles' and policyname='user manages own tenant profile') then
    create policy "user manages own tenant profile" on public.tenant_profiles
      for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='tenant_profiles' and policyname='admin reads tenant profiles') then
    create policy "admin reads tenant profiles" on public.tenant_profiles
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  -- Leads
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='anyone can submit lead') then
    create policy "anyone can submit lead" on public.leads
      for insert to anon, authenticated with check (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='admin reads leads') then
    create policy "admin reads leads" on public.leads
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  -- Admin orgs
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='admin_orgs' and policyname='admin manages orgs') then
    create policy "admin manages orgs" on public.admin_orgs
      for all to authenticated using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;
