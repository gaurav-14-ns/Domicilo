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
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='owners CRUD own documents') then
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
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='admins read all documents') then
    create policy "admins read all documents"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'documents'
        and public.has_role(auth.uid(), 'admin')
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='tenants read linked documents') then
    create policy "tenants read linked documents"
      on storage.objects for select
      to authenticated
      using (
        bucket_id = 'documents'
        and public.has_role(auth.uid(), 'tenant')
      );
  end if;
end
$$;
