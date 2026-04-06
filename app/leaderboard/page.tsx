import { EloExplainPanel } from "@/components/EloExplainPanel";
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-sm text-plains-muted">
        {category
          ? `${category} — ranked by win % (min ${CATEGORY_LEADER_MIN_PREDICTIONS} resolved in category)`
          : "Global — ranked by ELO"}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/leaderboard"
          className={`rounded-md px-3 py-1.5 text-xs font-mono ${
            !category ? "bg-plains-accent/20 text-plains-accent" : "border border-plains-border text-plains-muted"
          }`}
        >
          Global
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/leaderboard?scope=${encodeURIComponent(c)}`}
            className={`rounded-md px-3 py-1.5 text-xs font-mono ${
              category === c ? "bg-plains-accent/20 text-plains-accent" : "border border-plains-border text-plains-muted"
            }`}
          >
            {c}
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
