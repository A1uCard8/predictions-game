import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EloChart } from "@/components/EloChart";
import { TierBadge } from "@/components/TierBadge";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserGlobalRank } from "@/lib/leaderboard";
import { deriveProfileBadges, eloSharpeRatio, netEloDelta } from "@/lib/profile-stats";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const username = decodeURIComponent(params.username);

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    notFound();
  }

  const { data: profile } = await admin.from("users").select("*").eq("username", username).maybeSingle();
  if (!profile) notFound();

  const rank = await getUserGlobalRank(admin, profile.id);

  const { data: preds } = await admin
    .from("predictions")
    .select("id, market_id, chosen_option, is_correct, elo_change, created_at, pick_implied_p, credits_wagered")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const marketIds = Array.from(new Set((preds ?? []).map((p) => p.market_id)));
  const { data: markets } =
    marketIds.length > 0
      ? await admin
          .from("markets")
          .select("id, title, category, status, correct_option")
          .in("id", marketIds)
      : { data: [] as { id: string; title: string; category: string; status: string; correct_option: string | null }[] };

  const marketById = new Map((markets ?? []).map((m) => [m.id, m]));

  const { data: history } = await admin
    .from("elo_history")
    .select("elo_after, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  const resolved = (preds ?? []).filter((p) => marketById.get(p.market_id)?.status === "resolved");
  const wins = resolved.filter((p) => p.is_correct).length;
  const losses = resolved.filter((p) => p.is_correct === false).length;
  const total = wins + losses;
  const winPct = total === 0 ? 0 : Math.round((wins / total) * 1000) / 10;

  const eloDeltas = resolved
    .map((p) => p.elo_change as number | null)
    .filter((x): x is number => typeof x === "number" && !Number.isNaN(x));
  const netSkill = netEloDelta(eloDeltas);
  const sharpe = eloSharpeRatio(eloDeltas);

  let contrarianWins = 0;
  for (const p of resolved) {
    if (!p.is_correct) continue;
    const imp = p.pick_implied_p as number | null | undefined;
    if (imp != null && imp < 0.5) contrarianWins++;
  }

  const streak = typeof (profile as { current_streak?: number }).current_streak === "number"
    ? (profile as { current_streak: number }).current_streak
    : 0;

  const badges = deriveProfileBadges({
    currentStreak: streak,
    wins,
    resolved: total,
    winPct,
    globalRank: rank,
    contrarianWins,
  });

  const chartData = (history ?? []).map((h) => ({
    t: new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    elo: h.elo_after,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-2xl border-2 border-plains-primary/35 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start sm:p-8">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-plains-border bg-plains-panel sm:h-24 sm:w-24">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-plains-muted">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-plains-muted">
                  @{profile.username}
                </p>
                <h1 className="font-headline mt-1 text-2xl font-bold tracking-tight text-plains-void sm:text-3xl">
                  {profile.username}
                </h1>
              </div>
              <TierBadge elo={profile.elo} globalRank={rank} />
            </div>
            <p className="mt-2 font-mono text-xs text-plains-muted">
              ELO rank <span className="font-bold tabular-nums text-plains-void">{profile.elo.toLocaleString()}</span>
              {rank != null && (
                <>
                  {" "}
                  · Global <span className="font-bold">#{rank}</span>
                </>
              )}
            </p>
            {typeof (profile as { credits?: number }).credits === "number" && (
              <p className="mt-1 font-mono text-xs text-plains-muted">
                Credits{" "}
                <span className="font-bold tabular-nums text-foreground">
                  {(profile as { credits: number }).credits.toLocaleString()}
                </span>
                {streak > 0 && (
                  <>
                    {" "}
                    · Streak <span className="font-bold text-plains-accent">{streak}</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="grid border-t border-plains-border/20 sm:grid-cols-3">
          <div className="border-b border-plains-border/15 p-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-plains-muted">Win rate</p>
            <p className="font-headline mt-2 text-3xl font-black tabular-nums text-plains-primary">{winPct}%</p>
            <p className="mt-1 font-mono text-[10px] text-plains-muted">
              {wins}W / {losses}L · {total} resolved
            </p>
          </div>
          <div className="border-b border-plains-border/15 p-5 sm:border-b-0 sm:border-r">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-plains-muted">Net skill (ΔELO)</p>
            <p
              className={`font-headline mt-2 text-3xl font-black tabular-nums ${
                netSkill >= 0 ? "text-plains-primary" : "text-plains-danger"
              }`}
            >
              {netSkill >= 0 ? "+" : ""}
              {netSkill}
            </p>
            <p className="mt-1 font-mono text-[10px] text-plains-muted">Sum of ELO changes at resolve</p>
          </div>
          <div className="p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-plains-muted">Sharpe (ELO)</p>
            <p className="font-headline mt-2 text-3xl font-black tabular-nums text-plains-void">
              {sharpe != null ? sharpe.toFixed(2) : "—"}
            </p>
            <p className="mt-1 font-mono text-[10px] text-plains-muted">Mean / stdev of per-market ΔELO</p>
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-plains-muted">Proof of talent</h2>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {badges.map((b) => (
              <div
                key={b.id}
                className="min-w-[140px] shrink-0 rounded-xl border border-plains-border bg-plains-panel p-4 text-center shadow-sm"
              >
                <span className="text-2xl" aria-hidden>
                  {b.icon}
                </span>
                <p className="mt-2 font-headline text-[11px] font-bold uppercase tracking-wide text-plains-void">{b.title}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-plains-muted">{b.subtitle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-plains-border bg-plains-panel/60 p-6">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">ELO over time</h2>
        <div className="mt-4">
          <EloChart data={chartData} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Match history</h2>
        <ul className="mt-4 space-y-3">
          {(preds ?? []).length === 0 && <li className="text-plains-muted">No predictions yet.</li>}
          {(preds ?? []).map((p) => {
            const m = marketById.get(p.market_id);
            const showResult = m?.status === "resolved";
            const outcomeClass =
              showResult && p.is_correct === true
                ? "border-l-plains-accent"
                : showResult && p.is_correct === false
                  ? "border-l-plains-danger"
                  : "border-l-plains-border";
            return (
              <li
                key={p.id}
                className={`rounded-lg border border-plains-border border-l-4 bg-plains-panel/50 py-3 pl-4 pr-4 shadow-sm ${outcomeClass}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/markets/${p.market_id}`}
                    className="font-medium hover:text-plains-accent"
                  >
                    {m?.title ?? "Market"}
                  </Link>
                  <span className="text-xs font-mono text-plains-muted">{m?.category}</span>
                </div>
                <p className="mt-1 text-sm text-plains-muted">
                  Picked <span className="text-foreground">{p.chosen_option}</span>
                  {showResult && m?.correct_option && (
                    <>
                      {" "}
                      · Outcome <span className="text-foreground">{m.correct_option}</span>
                    </>
                  )}
                </p>
                {showResult && (
                  <p className="mt-2 font-mono text-xs">
                    {p.is_correct ? (
                      <span className="text-plains-accent">
                        Correct · {p.elo_change != null ? `+${p.elo_change} ELO` : ""}
                      </span>
                    ) : (
                      <span className="text-plains-danger">
                        Incorrect · {p.elo_change != null ? `${p.elo_change} ELO` : ""}
                      </span>
                    )}
                  </p>
                )}
                {!showResult && <p className="mt-2 text-xs text-plains-muted">Awaiting resolution</p>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
