-- Run once: JSON rules for automated resolution (news / finance).
alter table public.markets
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists markets_metadata_resolver_idx
  on public.markets ((metadata ->> 'resolver'))
  where metadata ->> 'resolver' is not null;
