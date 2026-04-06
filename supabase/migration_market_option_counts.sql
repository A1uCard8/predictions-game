-- Exact per-option pick counts for a market (used by public pulse API).
create or replace function public.market_option_counts(p_market_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_object_agg(chosen_option, cnt)
      from (
        select chosen_option, count(*)::bigint as cnt
        from public.predictions
        where market_id = p_market_id
        group by chosen_option
      ) s
    ),
    '{}'::jsonb
  );
$$;

revoke all on function public.market_option_counts(uuid) from public;
grant execute on function public.market_option_counts(uuid) to service_role;
