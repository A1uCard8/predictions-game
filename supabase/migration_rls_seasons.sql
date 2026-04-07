-- Fix Supabase linter: RLS disabled on public.seasons / public.user_season_history
-- Run in Supabase SQL Editor once.
--
-- Writes stay on service_role / SQL only (cron, migrations). Anon + authenticated
-- users get no INSERT/UPDATE/DELETE policies, so the JS client cannot mutate these tables.

-- ── seasons ───────────────────────────────────────────────────────────────
alter table public.seasons enable row level security;

drop policy if exists "seasons_select_all" on public.seasons;
create policy "seasons_select_all"
  on public.seasons
  for select
  to anon, authenticated
  using (true);

-- ── user_season_history ─────────────────────────────────────────────────
alter table public.user_season_history enable row level security;

drop policy if exists "user_season_history_select_own" on public.user_season_history;
create policy "user_season_history_select_own"
  on public.user_season_history
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Optional later: public badges on profiles via server-only reads, or add:
--   for select to anon, authenticated using (true);
-- if you want anyone to read all history rows from the browser (weaker privacy).
