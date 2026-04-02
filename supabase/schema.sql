-- Plains MVP schema — run in Supabase SQL Editor
-- After: enable Email + Google in Authentication > Providers
-- Create Storage bucket "avatars" (public) — see README
--
-- IMPORTANT — greenfield only:
-- Run this whole file ONLY on a brand-new project with no Plains tables yet.
-- If you already ran an older schema and get "type market_status already exists",
-- do NOT re-run this file. Use the small migrations in supabase/migration_*.sql
-- instead (e.g. migration_markets_external.sql for Valorant external_id columns).

create extension if not exists "pgcrypto";

create type public.market_status as enum ('open', 'closed', 'resolved');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  elo integer not null default 1000,
  created_at timestamptz not null default now()
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null,
  options jsonb not null,
  correct_option text,
  close_date timestamptz not null,
  resolution_date timestamptz not null,
  status public.market_status not null default 'open',
  external_source text,
  external_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index markets_external_unique
  on public.markets (external_source, external_id)
  where external_source is not null and external_id is not null;

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  chosen_option text not null,
  is_correct boolean,
  elo_change integer,
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);

create table public.elo_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  elo_after integer not null,
  market_id uuid references public.markets (id) on delete set null,
  created_at timestamptz not null default now()
);

create index predictions_user_id_idx on public.predictions (user_id);
create index predictions_market_id_idx on public.predictions (market_id);
create index markets_category_idx on public.markets (category);
create index markets_status_close_idx on public.markets (status, close_date);
create index markets_external_lookup_idx on public.markets (external_source, external_id)
  where external_source = 'vlr';

create index markets_metadata_resolver_idx on public.markets ((metadata ->> 'resolver'))
  where metadata ->> 'resolver' is not null;
create index elo_history_user_id_idx on public.elo_history (user_id, created_at);
create index users_elo_idx on public.users (elo desc);

alter table public.users enable row level security;
alter table public.markets enable row level security;
alter table public.predictions enable row level security;
alter table public.elo_history enable row level security;

-- Profiles: anyone can read (leaderboard / public profile)
create policy "users_select_all" on public.users for select using (true);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Markets readable to all
create policy "markets_select_all" on public.markets for select using (true);

-- Predictions: only your rows via client (public profiles use service role on server)
create policy "predictions_select_own" on public.predictions for select using (user_id = auth.uid());

create policy "predictions_insert_own" on public.predictions for insert
  with check (auth.uid() = user_id);

-- Elo history: readable for charts on any profile (aggregate skill signal)
create policy "elo_history_select_all" on public.elo_history for select using (true);

-- New auth user → public.users row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, elo)
  values (
    new.id,
    'user_' || substr(replace(new.id::text, '-', ''), 1, 10),
    1000
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
