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
