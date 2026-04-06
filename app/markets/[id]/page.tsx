import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketPredictForm } from "@/components/MarketPredictForm";
import { batchMarketPickStats } from "@/lib/market-stats";
import { marketImageUrl, marketResolutionCriteria, formatTimeRemaining } from "@/lib/market-display";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MarketRow } from "@/lib/types";

type ActivityRow = {
  created_at: string;
  chosen_option: string;
  username: string;
};

export default async function MarketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: market } = await supabase.from("markets").select("*").eq("id", params.id).single();

  if (!market) notFound();

  const m = market as MarketRow;
  const options = m.options as string[];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let chosen: string | null = null;
  if (user) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("chosen_option")
      .eq("market_id", m.id)
      .eq("user_id", user.id)
      .maybeSingle();
    chosen = pred?.chosen_option ?? null;
  }

  const closedByTime = Date.now() >= new Date(m.close_date).getTime();
  const canPredict = !!user && m.status === "open" && !closedByTime && !chosen;

  let activity: ActivityRow[] = [];
  let pickStats = { count: 0, topOption: null as string | null, topPct: null as number | null };
  const dist: { option: string; pct: number; count: number }[] = [];

  try {
    const admin = createAdminClient();
    pickStats = (await batchMarketPickStats(admin, [m.id])).get(m.id) ?? pickStats;

    const { data: allChoices } = await admin.from("predictions").select("chosen_option").eq("market_id", m.id);

    const { data: preds } = await admin
      .from("predictions")
      .select("created_at, chosen_option, user_id")
      .eq("market_id", m.id)
      .order("created_at", { ascending: false })
      .limit(40);

    const userIds = Array.from(new Set((preds ?? []).map((p) => p.user_id as string)));
    let userMap = new Map<string, string>();
    if (userIds.length) {
      const { data: users } = await admin.from("users").select("id, username").in("id", userIds);
      userMap = new Map((users ?? []).map((u) => [u.id as string, u.username as string]));
    }

    activity = (preds ?? []).map((p) => ({
      created_at: p.created_at as string,
      chosen_option: p.chosen_option as string,
      username: userMap.get(p.user_id as string) ?? "player",
    }));

    const byOpt = new Map<string, number>();
    for (const o of options) byOpt.set(o, 0);
    for (const p of allChoices ?? []) {
      const k = p.chosen_option as string;
      byOpt.set(k, (byOpt.get(k) ?? 0) + 1);
    }
    const total = Math.max(pickStats.count, (allChoices ?? []).length);
    for (const o of options) {
      const c = byOpt.get(o) ?? 0;
      dist.push({
        option: o,
        count: c,
        pct: total > 0 ? Math.round((c / total) * 1000) / 10 : 0,
      });
    }
  } catch {
    activity = [];
  }

  const criteria = marketResolutionCriteria(m);
  const img = marketImageUrl(m);
  const timeLeft = formatTimeRemaining(m.close_date);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/markets" className="text-plains-muted transition hover:text-plains-accent">
          ← All markets
        </Link>
        {user ? (
          <Link href="/dashboard" className="text-plains-muted transition hover:text-plains-accent">
            Desk
          </Link>
        ) : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-plains-border bg-plains-panel shadow-sm">
        <div className="relative h-44 w-full bg-plains-mist sm:h-52">
          {img ? (
            img.includes("supabase.co") ? (
              <Image src={img} alt="" fill className="object-cover" sizes="100vw" priority />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-plains-heaven to-white">
              <span className="font-mono text-6xl font-bold text-plains-accent/25">?</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plains-void/80 to-transparent px-4 pb-3 pt-12">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-white/85">
              <span>{m.category}</span>
              <span>·</span>
              <span>{m.status}</span>
              {m.status === "open" && (
                <>
                  <span>·</span>
                  <span>{timeLeft}</span>
                </>
              )}
            </div>
            <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">{m.title}</h1>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {m.status === "open" && pickStats.count > 0 && (
            <section>
              <h2 className="font-mono text-xs uppercase tracking-wider text-plains-muted">Crowd snapshot</h2>
              <p className="mt-1 text-sm text-plains-muted">
                {pickStats.count} locked picks · lean {pickStats.topPct}% {pickStats.topOption}
              </p>
              <ul className="mt-3 space-y-2">
                {dist.map((row) => (
                  <li key={row.option}>
                    <div className="flex justify-between font-mono text-xs text-plains-muted">
                      <span className="text-foreground">{row.option}</span>
                      <span>
                        {row.pct}% <span className="text-plains-muted">({row.count})</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-plains-border/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-plains-accentDim to-plains-accent"
                        style={{ width: `${Math.min(100, row.pct)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-plains-muted">Description</h2>
            <p className="mt-2 leading-relaxed text-plains-muted">{m.description}</p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-plains-muted">Resolution criteria</h2>
            <p className="mt-2 leading-relaxed text-plains-muted">{criteria}</p>
            {m.status === "resolved" && m.correct_option && (
              <p className="mt-3 rounded-lg border border-plains-accent/30 bg-plains-accent/5 px-3 py-2 font-mono text-sm text-plains-accent">
                Resolved: {m.correct_option}
              </p>
            )}
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-plains-muted">Timeline</h2>
            <ol className="mt-3 space-y-3 border-l-2 border-plains-border pl-4">
              <li>
                <p className="font-mono text-[10px] uppercase text-plains-muted">Created</p>
                <p className="text-sm">{new Date(m.created_at).toLocaleString()}</p>
              </li>
              <li>
                <p className="font-mono text-[10px] uppercase text-plains-muted">Closes for predictions</p>
                <p className="text-sm">{new Date(m.close_date).toLocaleString()}</p>
              </li>
              <li>
                <p className="font-mono text-[10px] uppercase text-plains-muted">Scheduled resolution</p>
                <p className="text-sm">{new Date(m.resolution_date).toLocaleString()}</p>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-wider text-plains-muted">Activity</h2>
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
              {activity.length === 0 && <li className="text-plains-muted">No picks yet.</li>}
              {activity.map((a, i) => (
                <li
                  key={`${a.created_at}-${i}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-plains-border/80 bg-plains-mist/50 px-3 py-2"
                >
                  <span className="font-medium text-plains-void">{a.username}</span>
                  <span className="text-plains-muted">
                    chose <span className="text-foreground">{a.chosen_option}</span>
                  </span>
                  <span className="w-full font-mono text-[10px] text-plains-muted sm:w-auto sm:text-right">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-plains-border pt-8">
            {!user && (
              <p className="text-sm text-plains-muted">
                <Link href="/login" className="text-plains-accent hover:underline">
                  Log in
                </Link>{" "}
                to submit your pick.
              </p>
            )}
            {user && m.status !== "open" && (
              <p className="text-sm text-plains-muted">This market is no longer accepting predictions.</p>
            )}
            {user && closedByTime && m.status === "open" && !chosen && (
              <p className="text-sm text-plains-danger">Close date passed — no new picks.</p>
            )}
            {user && (canPredict || chosen) && (
              <MarketPredictForm
                marketId={m.id}
                options={options}
                locked={!!chosen || !canPredict}
                chosen={chosen}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
