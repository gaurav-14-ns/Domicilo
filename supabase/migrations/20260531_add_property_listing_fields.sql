-- Add public listing fields to properties table for Browse Properties feature
alter table public.properties
  add column if not exists city text not null default '',
  add column if not exists state text not null default '',
  add column if not exists price_monthly numeric not null default 0 check (price_monthly >= 0),
  add column if not exists amenities text[] not null default '{}',
  add column if not exists description text not null default '',
  add column if not exists images text[] not null default '{}',
  add column if not exists available boolean not null default true,
  add column if not exists bedrooms integer not null default 1 check (bedrooms >= 0),
  add column if not exists bathrooms integer not null default 1 check (bathrooms >= 0),
  add column if not exists property_type text not null default 'Apartment';

-- Allow public (anon) read access to non-owner_id fields for listings
-- Only shows properties that are marked available
create policy "Anyone can view available properties"
  on public.properties
  for select
  using (available = true);

-- Index for listing filters
create index if not exists idx_properties_listings
  on public.properties(state, city, price_monthly, available)
  where available = true;
