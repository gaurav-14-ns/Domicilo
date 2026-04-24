
-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TYPE public.subscription_plan AS ENUM ('starter', 'growth', 'scale');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'overdue', 'cancelled', 'expired');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_end TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  amount NUMERIC NOT NULL DEFAULT 999,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner reads own sub" ON public.subscriptions
  FOR SELECT TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "owner updates own sub" ON public.subscriptions
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "admin manages all subs" ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- TRANSACTIONS: add method + receipt_no
-- ============================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS method TEXT,
  ADD COLUMN IF NOT EXISTS receipt_no TEXT;

CREATE INDEX IF NOT EXISTS transactions_owner_date_idx ON public.transactions(owner_id, date DESC);
CREATE INDEX IF NOT EXISTS transactions_tenant_idx ON public.transactions(tenant_id);

-- ============================================================
-- PROFILES: suspended flag
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin updates profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin reads audit" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "authenticated writes own audit" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user creates own ticket" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "user reads own ticket" ON public.support_tickets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "admin manages all tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER support_tickets_touch BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- handle_new_user: auto-provision trial subscription for owners
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  _role public.app_role;
  _currency TEXT;
  _amount NUMERIC;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  _role := coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'tenant'::public.app_role);
  insert into public.user_roles (user_id, role) values (new.id, _role);

  _currency := coalesce(new.raw_user_meta_data->>'currency_code', 'INR');

  insert into public.app_settings (user_id, display_name, contact_email, currency_code, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    _currency,
    coalesce(new.raw_user_meta_data->>'locale', 'en-IN')
  );

  if _role = 'tenant' then
    insert into public.tenant_profiles (user_id, email)
    values (new.id, new.email);
  end if;

  if _role = 'owner' then
    -- Default to INR pricing; client can convert later
    _amount := 999;
    insert into public.subscriptions (owner_id, plan, status, trial_end, amount, currency_code)
    values (new.id, 'starter', 'trial', now() + interval '14 days', _amount, _currency);
  end if;

  return new;
end;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
