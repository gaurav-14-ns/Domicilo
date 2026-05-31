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
