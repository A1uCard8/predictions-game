import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketPredictForm } from "@/components/MarketPredictForm";
import { createClient } from "@/lib/supabase/server";

export default async function MarketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: market } = await supabase.from("markets").select("*").eq("id", params.id).single();

  if (!market) notFound();

  const options = market.options as string[];
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let chosen: string | null = null;
  if (user) {
    const { data: pred } = await supabase
      .from("predictions")
      .select("chosen_option")
      .eq("market_id", market.id)
      .eq("user_id", user.id)
      .maybeSingle();
    chosen = pred?.chosen_option ?? null;
  }

  const closedByTime = Date.now() >= new Date(market.close_date).getTime();
  const canPredict =
    !!user && market.status === "open" && !closedByTime && !chosen;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/dashboard" className="text-sm text-plains-muted hover:text-plains-accent">
        ← Dashboard
      </Link>
      <div className="mt-6 rounded-2xl border border-plains-border bg-plains-panel/80 p-6 sm:p-8">
        <div className="flex flex-wrap gap-2 text-xs font-mono uppercase text-plains-muted">
          <span>{market.category}</span>
          <span>·</span>
          <span>Status {market.status}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{market.title}</h1>
        <p className="mt-4 text-plains-muted leading-relaxed">{market.description}</p>
        <dl className="mt-6 grid gap-2 text-sm font-mono text-plains-muted sm:grid-cols-2">
          <div>
            <dt>Closes</dt>
            <dd className="text-foreground">{new Date(market.close_date).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Resolution</dt>
            <dd className="text-foreground">{new Date(market.resolution_date).toLocaleString()}</dd>
          </div>
        </dl>

        <div className="mt-10 border-t border-plains-border pt-8">
          {!user && (
            <p className="text-sm text-plains-muted">
              <Link href="/login" className="text-plains-accent hover:underline">
                Log in
              </Link>{" "}
              to submit your pick.
            </p>
          )}
          {user && market.status !== "open" && (
            <p className="text-sm text-plains-muted">This market is no longer accepting predictions.</p>
          )}
          {user && closedByTime && market.status === "open" && !chosen && (
            <p className="text-sm text-plains-danger">Close date passed — no new picks.</p>
          )}
          {user && (canPredict || chosen) && (
            <MarketPredictForm
              marketId={market.id}
              options={options}
              locked={!!chosen || !canPredict}
              chosen={chosen}
            />
          )}
        </div>
      </div>
    </div>
  );
}
