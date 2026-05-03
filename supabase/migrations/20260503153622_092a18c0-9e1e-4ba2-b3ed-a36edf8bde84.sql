
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
