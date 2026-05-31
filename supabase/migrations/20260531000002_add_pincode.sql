-- Add pincode to properties for browse listings
alter table public.properties
  add column if not exists pincode text not null default '';
