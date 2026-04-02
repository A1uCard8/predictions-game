-- Run once in Supabase SQL Editor if you already applied schema.sql before external columns existed.
alter table public.markets
  add column if not exists external_source text,
  add column if not exists external_id text;

create unique index if not exists markets_external_unique
  on public.markets (external_source, external_id)
  where external_source is not null and external_id is not null;

create index if not exists markets_external_lookup_idx
  on public.markets (external_source, external_id)
  where external_source = 'vlr';
