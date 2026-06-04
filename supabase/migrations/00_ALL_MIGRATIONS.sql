-- Roles enum (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'app_role'
      and n.nspname = 'public'
  ) then
    create type public.app_role as enum ('owner', 'tenant', 'admin');
  end if;
end
$$;

-- Profiles table
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text,
 email text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can view their own profile'
  ) then
    create policy "Users can view their own profile" on public.profiles
      for select to authenticated using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile" on public.profiles
      for update to authenticated using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile" on public.profiles
      for insert to authenticated with check (auth.uid() = id);
  end if;
end
$$;

-- User roles table
create table if not exists public.user_roles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.app_role not null,
 created_at timestamptz not null default now(),
 unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
 select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Users can view their own roles'
  ) then
    create policy "Users can view their own roles" on public.user_roles
      for select to authenticated using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Admins can view all roles'
  ) then
    create policy "Admins can view all roles" on public.user_roles
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

-- Auto-create profile + default role on signup
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

 return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
 after insert on auth.users
 for each row execute function public.handle_new_user();

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
-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'subscription_plan'
      and n.nspname = 'public'
  ) then
    create type public.subscription_plan as enum ('starter', 'growth', 'scale');
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'subscription_status'
      and n.nspname = 'public'
  ) then
    create type public.subscription_status as enum ('trial', 'active', 'overdue', 'cancelled', 'expired');
  end if;
end
$$;

create table if not exists public.subscriptions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null unique,
 plan public.subscription_plan not null default 'starter',
 status public.subscription_status not null default 'trial',
 trial_end timestamptz,
 current_period_end timestamptz,
 amount numeric not null default 999,
 currency_code text not null default 'INR',
 cancelled_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='subscriptions' and policyname='owner reads own sub'
  ) then
    create policy "owner reads own sub" on public.subscriptions
      for select to authenticated using (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='subscriptions' and policyname='owner updates own sub'
  ) then
    create policy "owner updates own sub" on public.subscriptions
      for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='subscriptions' and policyname='admin manages all subs'
  ) then
    create policy "admin manages all subs" on public.subscriptions
      for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions
 for each row execute function public.touch_updated_at();

-- ============================================================
-- TRANSACTIONS: add method + receipt_no
-- ============================================================
alter table public.transactions
 add column if not exists method text,
 add column if not exists receipt_no text;

create index if not exists transactions_owner_date_idx on public.transactions(owner_id, date desc);
create index if not exists transactions_tenant_idx on public.transactions(tenant_id);

-- ============================================================
-- PROFILES: suspended flag
-- ============================================================
alter table public.profiles
 add column if not exists suspended boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='admin reads all profiles'
  ) then
    create policy "admin reads all profiles" on public.profiles
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles' and policyname='admin updates profiles'
  ) then
    create policy "admin updates profiles" on public.profiles
      for update to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

-- ============================================================
-- AUDIT LOGS
-- ============================================================
create table if not exists public.audit_logs (
 id uuid primary key default gen_random_uuid(),
 actor_id uuid,
 actor_email text,
 action text not null,
 target_type text,
 target_id text,
 meta jsonb,
 created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_logs' and policyname='admin reads audit'
  ) then
    create policy "admin reads audit" on public.audit_logs
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='audit_logs' and policyname='authenticated writes own audit'
  ) then
    create policy "authenticated writes own audit" on public.audit_logs
      for insert to authenticated
      with check (actor_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
create table if not exists public.support_tickets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid,
 email text not null,
 subject text not null,
 body text not null,
 status text not null default 'open',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_tickets' and policyname='user creates own ticket'
  ) then
    create policy "user creates own ticket" on public.support_tickets
      for insert to authenticated with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_tickets' and policyname='user reads own ticket'
  ) then
    create policy "user reads own ticket" on public.support_tickets
      for select to authenticated using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='support_tickets' and policyname='admin manages all tickets'
  ) then
    create policy "admin manages all tickets" on public.support_tickets
      for all to authenticated
      using (public.has_role(auth.uid(), 'admin'))
      with check (public.has_role(auth.uid(), 'admin'));
  end if;
end
$$;

drop trigger if exists support_tickets_touch on public.support_tickets;
create trigger support_tickets_touch before update on public.support_tickets
 for each row execute function public.touch_updated_at();

-- ============================================================
-- handle_new_user: auto-provision trial subscription for owners
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
 _role public.app_role;
 _currency text;
 _amount numeric;
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

 _currency := coalesce(new.raw_user_meta_data->>'currency_code', 'INR');

 insert into public.app_settings (user_id, display_name, contact_email, currency_code, locale)
 values (
   new.id,
   coalesce(new.raw_user_meta_data->>'full_name', ''),
   new.email,
   _currency,
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

 if _role = 'owner' then
   _amount := 999;
   insert into public.subscriptions (owner_id, plan, status, trial_end, amount, currency_code)
   values (new.id, 'starter', 'trial', now() + interval '14 days', _amount, _currency)
   on conflict (owner_id) do update
   set plan = excluded.plan,
       status = excluded.status,
       trial_end = excluded.trial_end,
       amount = excluded.amount,
       currency_code = excluded.currency_code,
       updated_at = now();
 end if;

 return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
 after insert on auth.users
 for each row execute function public.handle_new_user();

CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow anyone (anon + authenticated) to check if an admin exists
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- Prevent more than one admin from ever existing
CREATE OR REPLACE FUNCTION public.prevent_second_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin'::app_role THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE role = 'admin'::app_role
        AND user_id <> NEW.user_id
    ) THEN
      RAISE EXCEPTION 'An admin already exists for this site';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_second_admin ON public.user_roles;
CREATE TRIGGER trg_prevent_second_admin
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_second_admin();

-- Prevent suspending the admin
CREATE OR REPLACE FUNCTION public.prevent_admin_suspend()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.suspended = true AND public.has_role(NEW.id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin account cannot be suspended';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_suspend ON public.profiles;
CREATE TRIGGER trg_prevent_admin_suspend
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_suspend();

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

-- Add pincode to properties for browse listings
alter table public.properties
  add column if not exists pincode text not null default '';

-- Add public listing fields to properties table for Browse Properties feature
alter table public.properties
  add column if not exists city text not null default '',
  add column if not exists state text not null default '',
  add column if not exists price_monthly numeric not null default 0 check (price_monthly >= 0),
  add column if not exists pincode text not null default '',
  add column if not exists amenities text[] not null default '{}',
  add column if not exists description text not null default '',
  add column if not exists images text[] not null default '{}',
  add column if not exists available boolean not null default true,
  add column if not exists bedrooms integer not null default 1 check (bedrooms >= 0),
  add column if not exists bathrooms integer not null default 1 check (bathrooms >= 0),
  add column if not exists property_type text not null default 'Apartment';

-- Allow public (anon) read access to non-owner_id fields for listings
-- Only shows properties that are marked available
drop policy if exists "Anyone can view available properties" on public.properties;
create policy "Anyone can view available properties"
  on public.properties
  for select
  using (available = true);

-- Index for listing filters
create index if not exists idx_properties_listings
  on public.properties(state, city, price_monthly, available)
  where available = true;

-- Allow owners to insert their own subscription (idempotent)
drop policy if exists "owner inserts own sub" on public.subscriptions;
create policy "owner inserts own sub" on public.subscriptions
  for insert to authenticated
  with check (owner_id = auth.uid());

-- =========================================================================
-- DOCUMENTS TABLE
-- =========================================================================
create table if not exists public.documents (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 file_path text not null,
 file_size integer not null default 0,
 mime_type text not null default 'application/octet-stream',
 category text not null default 'other' check (category in ('lease','receipt','noc','other')),
 reference_type text default 'general' check (reference_type in ('property','tenant','general')),
 reference_id uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists idx_documents_owner on public.documents(owner_id);
create index if not exists idx_documents_reference on public.documents(reference_type, reference_id);
alter table public.documents enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='owners manage own documents') then
    create policy "owners manage own documents" on public.documents
      for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='admin reads all documents') then
    create policy "admin reads all documents" on public.documents
      for select to authenticated using (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='documents' and policyname='tenant reads linked documents') then
    create policy "tenant reads linked documents" on public.documents
      for select to authenticated using (
        reference_type = 'tenant'
        and exists (
          select 1 from public.tenants t
          where t.id = reference_id
            and lower(t.email) = lower(coalesce((auth.jwt()->>'email'),''))
        )
      );
  end if;
end
$$;

drop trigger if exists trg_documents_updated on public.documents;
create trigger trg_documents_updated before update on public.documents
 for each row execute function public.touch_updated_at();

-- =========================================================================
-- STORAGE BUCKET: documents
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS: owners can CRUD their own folder, admins can read all
create policy "owners CRUD own documents"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admins read all documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'admin')
  );

create policy "tenants read linked documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and public.has_role(auth.uid(), 'tenant')
  );

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

