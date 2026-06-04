-- Add status column to leads table for admin lead triage workflow
alter table public.leads
  add column if not exists status text not null default 'new'
  check (status in ('new', 'contacted', 'closed'));
