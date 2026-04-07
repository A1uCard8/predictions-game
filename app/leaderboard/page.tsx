import { EloExplainPanel } from "@/components/EloExplainPanel";
import { LeaderboardMeCard } from "@/components/LeaderboardMeCard";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { CATEGORIES, CATEGORY_LEADER_MIN_PREDICTIONS } from "@/lib/constants";
import { getCategoryLeaderboard, getGlobalLeaderboard } from "@/lib/leaderboard";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const scope = searchParams.scope;
  const category =
    scope && scope !== "global" && CATEGORIES.includes(scope as (typeof CATEGORIES)[number])
      ? scope
      : null;

  let rows: Awaited<ReturnType<typeof getGlobalLeaderboard>> = [];
  const globalRanks = new Map<string, number>();

  try {
    const admin = createAdminClient();
    if (category) {
      rows = await getCategoryLeaderboard(admin, category);
      const global = await getGlobalLeaderboard(admin);
      global.forEach((r) => globalRanks.set(r.user_id, r.rank));
    } else {
      rows = await getGlobalLeaderboard(admin);
      rows.forEach((r) => globalRanks.set(r.user_id, r.rank));
    }
  } catch {
    rows = [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const myRow = user ? rows.find((r) => r.user_id === user.id) : undefined;
  const myGlobalRank = user ? globalRanks.get(user.id) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-plains-muted">Plains</p>
          <h1 className="font-headline mt-2 text-3xl font-bold tracking-tight text-plains-void sm:text-4xl">
            Global rankings
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-plains-muted">
            Competitive skill ladder: ELO from contrarian-weighted resolution on your picks, plus seasonal credits on
            two-outcome markets. Category boards use win % with at least {CATEGORY_LEADER_MIN_PREDICTIONS} resolved in
            that category.
          </p>
        </div>
        {myRow && myGlobalRank != null ? (
          <div className="w-full max-w-[280px] shrink-0">
            <LeaderboardMeCard row={myRow} globalRank={myGlobalRank} />
          </div>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="mr-2 font-mono text-[10px] font-bold uppercase tracking-wider text-plains-muted">Scope</span>
        <Link
          href="/leaderboard"
          className={`rounded-full px-3 py-1.5 text-xs font-mono font-semibold ${
            !category ? "bg-plains-primary text-white" : "border border-plains-border text-plains-muted hover:bg-plains-mist"
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/leaderboard?scope=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1.5 text-xs font-mono font-semibold ${
              category === c
                ? "bg-plains-primary text-white"
                : "border border-plains-border text-plains-muted hover:bg-plains-mist"
            }`}
          >
            {c.split("/")[0]}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <EloExplainPanel />
      </div>

      <div className="mt-8">
        <LeaderboardTable rows={rows} highlightUserId={user?.id} globalRanks={globalRanks} />
      </div>
    </div>
  );
}
