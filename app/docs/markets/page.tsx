import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Markets & events — Plains",
  description: "How Plains structures prediction markets, outcomes, and credit pools.",
};

export default function MarketsConceptsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-plains-muted">Concepts</p>
      <h1 className="font-headline mt-2 text-3xl font-bold tracking-tight text-plains-void">Markets &amp; events</h1>
      <p className="mt-3 text-sm leading-relaxed text-plains-muted">
        Plains is a <strong className="font-medium text-plains-void">competitive prediction</strong> layer: you lock
        positions before resolution, climb a skill ladder (ELO), and on two-outcome questions you allocate{" "}
        <strong className="font-medium text-plains-void">seasonal credits</strong> into pools that drive the live
        probability chart — similar in spirit to how{" "}
        <a
          href="https://docs.polymarket.com/concepts/markets-events"
          className="text-plains-primaryHi underline-offset-2 hover:underline"
        >
          Polymarket separates markets and events
        </a>
        , but with <strong className="font-medium text-plains-void">no real money</strong> and no on-chain settlement.
      </p>

      <section className="mt-12 space-y-4 border-t border-plains-border pt-10">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">Markets</h2>
        <p className="text-sm leading-relaxed text-plains-muted">
          A <strong className="font-medium text-plains-void">market</strong> is one question with one or more{" "}
          <strong className="font-medium text-plains-void">outcomes</strong> stored as an options list. When there are
          exactly <strong className="font-medium text-plains-void">two outcomes</strong>, we treat the first as the
          &quot;yes-side&quot; credit pool and the second as the &quot;no-side&quot; pool for charting and parimutuel-style
          payouts at resolve. Labels can be anything (e.g. team names) — the pool mapping is positional.
        </p>
        <p className="text-sm leading-relaxed text-plains-muted">
          Markets move through <strong className="font-medium text-plains-void">open → closed → resolved</strong>. You
          can pick while status is open and before the close time. Resolution sets the correct option and settles credit
          pools and ELO.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">Events (grouping)</h2>
        <p className="text-sm leading-relaxed text-plains-muted">
          Unlike Polymarket&apos;s explicit <strong className="font-medium text-plains-void">event</strong> container for
          multiple related binaries, Plains today groups related questions by{" "}
          <strong className="font-medium text-plains-void">category</strong> and hub navigation. A single feed market is
          equivalent to a one-market event; multi-outcome questions are one market with many options (no per-option
          credit pool — picks only).
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">Credits &amp; charts</h2>
        <p className="text-sm leading-relaxed text-plains-muted">
          <strong className="font-medium text-plains-void">Credits</strong> reset each season, are not purchasable, and lock
          in the pool until resolve. Implied probability is{" "}
          <code className="rounded bg-plains-mist px-1 font-mono text-xs">yes_pool / (yes_pool + no_pool)</code>. We
          append a row to <strong className="font-medium text-plains-void">market_snapshots</strong> on each wager so the
          UI can render Kalshi/Polymarket-style history.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">Skill (ELO)</h2>
        <p className="text-sm leading-relaxed text-plains-muted">
          <strong className="font-medium text-plains-void">ELO</strong> is separate from credits: it measures prediction
          skill using a contrarian-weighted update (reward is higher when the crowd leaned against your side) and streak
          multipliers on wins. Leaderboards rank by ELO globally; category boards use win rate with a minimum resolved
          count.
        </p>
      </section>

      <p className="mt-12 text-sm text-plains-muted">
        <Link href="/docs" className="font-medium text-plains-primaryHi hover:underline">
          ← API &amp; operator docs
        </Link>
      </p>
    </div>
  );
}
