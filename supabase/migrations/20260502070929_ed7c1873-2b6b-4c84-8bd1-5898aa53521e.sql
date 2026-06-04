do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='user_roles' and policyname='Users can insert their own role'
  ) then
    CREATE POLICY "Users can insert their own role"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  end if;
end
$$;