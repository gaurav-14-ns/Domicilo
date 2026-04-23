-- =========================================================================
-- PROPERTIES
-- =========================================================================
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null default '',
  units integer not null default 1 check (units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_properties_owner on public.properties(owner_id);
alter table public.properties enable row level security;

-- =========================================================================
-- TENANTS
-- =========================================================================
create table public.tenants (
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
create index idx_tenants_owner on public.tenants(owner_id);
create index idx_tenants_property on public.tenants(property_id);
create index idx_tenants_email on public.tenants(lower(email));
alter table public.tenants enable row level security;

-- =========================================================================
-- TRANSACTIONS
-- =========================================================================
create table public.transactions (
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
create index idx_tx_owner on public.transactions(owner_id);
create index idx_tx_tenant on public.transactions(tenant_id);
create index idx_tx_property on public.transactions(property_id);
create index idx_tx_date on public.transactions(date desc);
alter table public.transactions enable row level security;

-- =========================================================================
-- APP SETTINGS (one row per user)
-- =========================================================================
create table public.app_settings (
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
create table public.tenant_profiles (
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
create table public.leads (
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
create table public.admin_orgs (
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

create trigger trg_properties_updated before update on public.properties
  for each row execute function public.touch_updated_at();
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.touch_updated_at();
create trigger trg_tx_updated before update on public.transactions
  for each row execute function public.touch_updated_at();
create trigger trg_settings_updated before update on public.app_settings
  for each row execute function public.touch_updated_at();
create trigger trg_tprofiles_updated before update on public.tenant_profiles
  for each row execute function public.touch_updated_at();
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
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'tenant'::public.app_role);
  insert into public.user_roles (user_id, role) values (new.id, _role);

  insert into public.app_settings (user_id, display_name, contact_email, currency_code, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'currency_code', 'INR'),
    coalesce(new.raw_user_meta_data->>'locale', 'en-IN')
  );

  if _role = 'tenant' then
    insert into public.tenant_profiles (user_id, email)
    values (new.id, new.email);
  end if;

  return new;
end;
$$;

-- Make sure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- RLS POLICIES
-- =========================================================================

-- Properties: owner full CRUD; tenant SELECT if linked; admin all
create policy "owner manages own properties" on public.properties
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin manages all properties" on public.properties
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "tenant reads linked property" on public.properties
  for select to authenticated using (
    exists (
      select 1 from public.tenants t
      where t.property_id = properties.id
        and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
    )
  );

-- Tenants
create policy "owner manages own tenants" on public.tenants
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin manages all tenants" on public.tenants
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "tenant reads own record" on public.tenants
  for select to authenticated using (
    lower(email) = lower(coalesce((auth.jwt()->>'email'),''))
  );

-- Transactions
create policy "owner manages own transactions" on public.transactions
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "admin manages all transactions" on public.transactions
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "tenant reads own transactions" on public.transactions
  for select to authenticated using (
    exists (
      select 1 from public.tenants t
      where t.id = transactions.tenant_id
        and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
    )
  );

-- App settings: own row only; admin all
create policy "user manages own settings" on public.app_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin reads all settings" on public.app_settings
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Tenant profiles
create policy "user manages own tenant profile" on public.tenant_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin reads tenant profiles" on public.tenant_profiles
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Leads: anyone can insert; only admins can read
create policy "anyone can submit lead" on public.leads
  for insert to anon, authenticated with check (true);
create policy "admin reads leads" on public.leads
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Admin orgs: admin-only
create policy "admin manages orgs" on public.admin_orgs
  for all to authenticated using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));