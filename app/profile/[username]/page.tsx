import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EloChart } from "@/components/EloChart";
import { TierBadge } from "@/components/TierBadge";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserGlobalRank } from "@/lib/leaderboard";

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
    .select("id, market_id, chosen_option, is_correct, elo_change, created_at")
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

  const chartData = (history ?? []).map((h) => ({
    t: new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    elo: h.elo_after,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-plains-border bg-plains-panel">
          {profile.avatar_url ? (
            <Image src={profile.avatar_url} alt="" fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-2xl text-plains-muted">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold">{profile.username}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl text-plains-accent">{profile.elo}</span>
            <TierBadge elo={profile.elo} globalRank={rank} />
            {rank != null && (
              <span className="font-mono text-sm text-plains-muted">Global #{rank}</span>
            )}
          </div>
          <p className="mt-2 font-mono text-sm text-plains-muted">
            {wins}W / {losses}L · {winPct}% over {total} resolved
          </p>
        </div>
      </div>

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
