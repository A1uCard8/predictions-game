-- Credits (Twitch-style), pool totals, snapshots, seasons, and atomic bet/resolve RPCs.
-- Run in Supabase SQL Editor after prior migrations. Safe to re-run fragments manually if needed.

-- ── Columns ─────────────────────────────────────────────────────────────
alter table public.users add column if not exists credits bigint not null default 1000;
alter table public.users add column if not exists current_streak integer not null default 0;

alter table public.markets add column if not exists total_yes_credits bigint not null default 0;
alter table public.markets add column if not exists total_no_credits bigint not null default 0;

alter table public.predictions add column if not exists credits_wagered bigint not null default 0;
alter table public.predictions add column if not exists pick_implied_p double precision;

-- ── Seasons & history ─────────────────────────────────────────────────────
create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_active boolean not null default false
);

create table if not exists public.user_season_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  season_id uuid not null references public.seasons (id) on delete cascade,
  final_elo integer not null,
  final_rank integer,
  badge text,
  created_at timestamptz not null default now(),
  unique (user_id, season_id)
);

create index if not exists user_season_history_user_idx on public.user_season_history (user_id);

insert into public.seasons (slug, start_at, end_at, is_active)
select 'season-1', now(), now() + interval '2 months', true
where not exists (select 1 from public.seasons);

-- ── Snapshots (written on each credit bet) ───────────────────────────────
create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  total_yes_credits bigint not null,
  total_no_credits bigint not null,
  created_at timestamptz not null default now()
);

create index if not exists market_snapshots_market_created_idx
  on public.market_snapshots (market_id, created_at desc);

alter table public.market_snapshots enable row level security;

drop policy if exists "market_snapshots_select_all" on public.market_snapshots;
create policy "market_snapshots_select_all" on public.market_snapshots for select using (true);

-- ── Block direct INSERT on two-outcome markets (must use place_prediction_bet) ──
create or replace function public.predictions_insert_market_check()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  opts jsonb;
  n int;
begin
  select options into opts from public.markets where id = new.market_id;
  if opts is null then
    raise exception 'Market not found';
  end if;
  if jsonb_typeof(opts) = 'array' then
    n := jsonb_array_length(opts);
  else
    n := 0;
  end if;
  -- Allow insert when running inside place_prediction_bet (same transaction; set_config is LOCAL).
  if current_setting('plains.place_prediction_bet', true) = 'on' then
    return NEW;
  end if;
  if n = 2 then
    raise exception 'Two-outcome markets must use place_prediction_bet()';
  end if;
  return NEW;
end;
$$;

drop trigger if exists predictions_no_direct_binary on public.predictions;
create trigger predictions_no_direct_binary
  before insert on public.predictions
  for each row execute function public.predictions_insert_market_check();

-- ── place_prediction_bet: deduct credits, add to pool, snapshot, insert row ──
create or replace function public.place_prediction_bet(
  p_market_id uuid,
  p_chosen_option text,
  p_credits bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  m public.markets%rowtype;
  opts jsonb;
  opt0 text;
  opt1 text;
  is_yes boolean;
  bal bigint;
  ty bigint;
  tn bigint;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'Unauthorized');
  end if;

  if p_credits is null or p_credits < 1 then
    return jsonb_build_object('ok', false, 'error', 'Invalid credits amount');
  end if;

  select * into m from public.markets where id = p_market_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Market not found');
  end if;

  if m.status is distinct from 'open'::public.market_status then
    return jsonb_build_object('ok', false, 'error', 'Market not open');
  end if;

  if m.close_date <= now() then
    return jsonb_build_object('ok', false, 'error', 'Market closed');
  end if;

  opts := m.options;
  if jsonb_typeof(opts) != 'array' or jsonb_array_length(opts) != 2 then
    return jsonb_build_object('ok', false, 'error', 'Credits only for two-outcome markets');
  end if;

  opt0 := opts ->> 0;
  opt1 := opts ->> 1;

  if p_chosen_option is distinct from opt0 and p_chosen_option is distinct from opt1 then
    return jsonb_build_object('ok', false, 'error', 'Invalid option');
  end if;

  if exists (select 1 from public.predictions where user_id = uid and market_id = p_market_id) then
    return jsonb_build_object('ok', false, 'error', 'Already predicted');
  end if;

  select credits into bal from public.users where id = uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Profile not found');
  end if;

  if bal < p_credits then
    return jsonb_build_object('ok', false, 'error', 'Insufficient credits');
  end if;

  perform set_config('plains.place_prediction_bet', 'on', true);

  is_yes := p_chosen_option = opt0;

  update public.users set credits = credits - p_credits where id = uid;

  if is_yes then
    update public.markets
    set total_yes_credits = total_yes_credits + p_credits
    where id = p_market_id
    returning total_yes_credits, total_no_credits into ty, tn;
  else
    update public.markets
    set total_no_credits = total_no_credits + p_credits
    where id = p_market_id
    returning total_yes_credits, total_no_credits into ty, tn;
  end if;

  insert into public.predictions (user_id, market_id, chosen_option, credits_wagered)
  values (uid, p_market_id, p_chosen_option, p_credits);

  insert into public.market_snapshots (market_id, total_yes_credits, total_no_credits)
  values (p_market_id, ty, tn);

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.place_prediction_bet(uuid, text, bigint) from public;
grant execute on function public.place_prediction_bet(uuid, text, bigint) to authenticated;
grant execute on function public.place_prediction_bet(uuid, text, bigint) to service_role;

-- ── admin_resolve_market: payouts, contrarian ELO, streak multipliers ───────
-- K = 25. Win: round(K * (1-p) * streak_mult). Loss: round(-K * p). Streak mult: 1 / 1.2 / 1.5 at 1–2 / 3–4 / 5+ after win.
create or replace function public.admin_resolve_market(p_market_id uuid, p_correct_option text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.markets%rowtype;
  opts jsonb;
  nopts int;
  opt0 text;
  opt1 text;
  ty bigint;
  tn bigint;
  tpool numeric;
  yes_count int;
  total_preds int;
  side_count int;
  win_is_yes boolean;
  win_pool bigint;
  lose_pool bigint;
  pr public.predictions%rowtype;
  u public.users%rowtype;
  correct boolean;
  p numeric;
  k numeric := 25;
  base_delta numeric;
  mult numeric := 1;
  elo_delta int;
  new_elo int;
  payout bigint;
  new_streak int;
  updated int := 0;
begin
  select * into m from public.markets where id = p_market_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Market not found');
  end if;

  if m.status = 'resolved'::public.market_status then
    return jsonb_build_object('ok', true, 'updated', 0);
  end if;

  opts := m.options;
  if jsonb_typeof(opts) != 'array' or jsonb_array_length(opts) < 1 then
    return jsonb_build_object('ok', false, 'error', 'invalid market options');
  end if;

  if not exists (select 1 from jsonb_array_elements_text(opts) as o where o = p_correct_option) then
    return jsonb_build_object('ok', false, 'error', 'correct option not in options');
  end if;

  ty := coalesce(m.total_yes_credits, 0);
  tn := coalesce(m.total_no_credits, 0);
  tpool := (ty + tn)::numeric;
  nopts := jsonb_array_length(opts);

  if nopts >= 2 then
    opt0 := opts ->> 0;
    opt1 := opts ->> 1;
  end if;

  win_is_yes := (nopts = 2 and p_correct_option = opt0);

  if nopts = 2 then
    win_pool := case when win_is_yes then ty else tn end;
    lose_pool := case when win_is_yes then tn else ty end;
  else
    win_pool := 0;
    lose_pool := 0;
  end if;

  select count(*)::int into total_preds from public.predictions where market_id = p_market_id;

  if nopts = 2 then
    select count(*)::int into yes_count
    from public.predictions
    where market_id = p_market_id and chosen_option = opt0;
  else
    yes_count := 0;
  end if;

  for pr in select * from public.predictions where market_id = p_market_id order by user_id
  loop
    correct := (pr.chosen_option = p_correct_option);

    if nopts = 2 and tpool > 0 then
      if pr.chosen_option = opt0 then
        p := ty::numeric / tpool;
      elsif pr.chosen_option = opt1 then
        p := tn::numeric / tpool;
      else
        p := 0.5;
      end if;
    elsif nopts = 2 and total_preds > 0 then
      if pr.chosen_option = opt0 then
        p := yes_count::numeric / total_preds;
      elsif pr.chosen_option = opt1 then
        p := (total_preds - yes_count)::numeric / total_preds;
      else
        p := 0.5;
      end if;
    else
      select count(*)::int into side_count
      from public.predictions
      where market_id = p_market_id and chosen_option = pr.chosen_option;
      if total_preds > 0 then
        p := side_count::numeric / total_preds;
      else
        p := 0.5;
      end if;
    end if;

    p := greatest(least(p, 0.999), 0.001);

    select * into u from public.users where id = pr.user_id for update;

    mult := 1;
    payout := 0;

    if correct then
      base_delta := k * (1 - p);
      new_streak := u.current_streak + 1;
      if new_streak >= 5 then
        mult := 1.5;
      elsif new_streak >= 3 then
        mult := 1.2;
      end if;
      elo_delta := round(base_delta * mult)::int;

      if nopts = 2 and pr.credits_wagered > 0 and win_pool > 0
         and ((win_is_yes and pr.chosen_option = opt0) or ((not win_is_yes) and pr.chosen_option = opt1))
      then
        payout := pr.credits_wagered
          + floor((pr.credits_wagered::numeric / win_pool::numeric) * lose_pool::numeric);
      end if;

      new_elo := greatest(0, u.elo + elo_delta);
      update public.users
      set
        elo = new_elo,
        credits = u.credits + payout,
        current_streak = new_streak
      where id = pr.user_id;
    else
      base_delta := -k * p;
      elo_delta := round(base_delta)::int;
      new_elo := greatest(0, u.elo + elo_delta);
      update public.users
      set elo = new_elo, current_streak = 0
      where id = pr.user_id;
    end if;

    update public.predictions
    set
      is_correct = correct,
      elo_change = elo_delta,
      pick_implied_p = p
    where id = pr.id;

    insert into public.elo_history (user_id, elo_after, market_id)
    values (pr.user_id, new_elo, p_market_id);

    updated := updated + 1;
  end loop;

  update public.markets
  set status = 'resolved', correct_option = p_correct_option
  where id = p_market_id;

  return jsonb_build_object('ok', true, 'updated', updated);
end;
$$;

revoke all on function public.admin_resolve_market(uuid, text) from public;
grant execute on function public.admin_resolve_market(uuid, text) to service_role;
