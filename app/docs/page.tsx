import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation — Plains",
};

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-plains-void">API documentation</h1>
      <p className="mt-2 text-sm">
        <a href="/docs/markets" className="font-medium text-plains-primaryHi hover:underline">
          How markets &amp; events work on Plains →
        </a>
      </p>
      <p className="mt-2 text-plains-muted">
        Product vision for a public <strong className="font-medium text-plains-void">Plains data API</strong> (below), plus
        operator routes and integration hooks for this deployment.
      </p>

      {/* —— Commercial / product API —— */}
      <section className="mt-12 space-y-6 border-t border-plains-border pt-10">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">Plains data API — overview</h2>
        <p className="text-sm leading-relaxed text-plains-muted">
          Plains runs <strong className="font-medium text-plains-void">reputation-only prediction markets</strong>: users
          lock <strong className="font-medium text-plains-void">one</strong> side per market; outcomes and{" "}
          <strong className="font-medium text-plains-void">ELO</strong> turn that into a long-lived signal of{" "}
          <strong className="font-medium text-plains-void">who was right</strong>, not just what the crowd said at one
          instant.
        </p>
        <p className="text-sm leading-relaxed text-plains-muted">
          A <strong className="font-medium text-plains-void">Plains API</strong> (separate from internal admin/cron keys)
          would sell <strong className="font-medium text-plains-void">aggregated market intelligence</strong>: how
          conviction is distributed, how it moves, and how it lines up with{" "}
          <strong className="font-medium text-plains-void">categories</strong> (macro, politics, esports, CS2 skins, and
          more). Typical buyers: traders who already think in base rates and cross-venue context — e.g.{" "}
          <strong className="font-medium text-plains-void">Kalshi</strong> and{" "}
          <strong className="font-medium text-plains-void">Polymarket</strong> participants — and{" "}
          <strong className="font-medium text-plains-void">quant / prop</strong> desks that want another{" "}
          <strong className="font-medium text-plains-void">belief layer</strong> beyond price and volume on those venues.
        </p>
        <p className="text-sm leading-relaxed text-plains-muted">
          <strong className="font-medium text-plains-void">Not sold by default:</strong> raw PII, individual identities, or
          exact per-user positions for external use — unless a separate tier adds explicit consent and compliance review.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">What the data represents</h2>
        <div className="overflow-x-auto rounded-xl border border-plains-border">
          <table className="w-full text-left text-sm text-plains-muted">
            <thead>
              <tr className="border-b border-plains-border bg-plains-mist/60 font-mono text-[11px] uppercase tracking-wider text-plains-void">
                <th className="px-4 py-2.5">Concept</th>
                <th className="px-4 py-2.5">Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plains-border">
              <tr>
                <td className="px-4 py-3 font-medium text-plains-void">Belief / allocation</td>
                <td className="px-4 py-3">
                  Share of locked picks on each outcome (Yes/No or multi-option), optionally time-sliced.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-plains-void">Activity</td>
                <td className="px-4 py-3">
                  Distinct participants, pick velocity, or short-window “pulse” — attention and conviction flow.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-plains-void">Resolution truth</td>
                <td className="px-4 py-3">Final outcome and timestamp — for backtesting “did this cohort beat baseline?”</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-plains-void">Skill overlay</td>
                <td className="px-4 py-3">
                  Optional tier: aggregates by ELO band or leaderboard slice (“high-skill cohort skew” vs everyone).
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-plains-void">Cross-section</td>
                <td className="px-4 py-3">Same structure across categories and tags for panel-style research.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm italic text-plains-muted">
          Quant positioning: structured panel data on stated probabilities and flows, with resolved labels for supervised
          learning and calibration.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">How the API could work</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-plains-muted">
          <li>
            <strong className="font-medium text-plains-void">Versioned base URL</strong> — e.g.{" "}
            <code className="rounded bg-plains-mist px-1 font-mono text-xs text-plains-void">https://api.plains.com/v1</code>
          </li>
          <li>
            <strong className="font-medium text-plains-void">Auth</strong> — API keys per customer (
            <code className="font-mono text-xs">Authorization: Bearer &lt;key&gt;</code> or{" "}
            <code className="font-mono text-xs">X-Plains-Key</code>); optional scopes (
            <code className="font-mono text-xs">read:markets</code>, <code className="font-mono text-xs">read:aggregates</code>
            , <code className="font-mono text-xs">read:history</code>).
          </li>
          <li>
            <strong className="font-medium text-plains-void">Formats</strong> — JSON; optional CSV on heavy endpoints for
            research desks.
          </li>
          <li>
            <strong className="font-medium text-plains-void">Rate limits</strong> — per key (e.g. 60–300 rpm hobby, higher
            enterprise); <code className="font-mono text-xs">429</code> + <code className="font-mono text-xs">Retry-After</code>.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Illustrative endpoints</h2>
        <p className="text-sm text-plains-muted">
          Names below are product-level; some overlap with today’s public routes (e.g. pulse, leaderboard). Others imply
          snapshots, history, or cohorts you may add later.
        </p>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Discovery &amp; metadata</h3>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /v1/markets
GET /v1/markets/{id}
GET /v1/categories`}
        </pre>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Belief &amp; flow</h3>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /v1/markets/{id}/distribution
GET /v1/markets/{id}/pulse
GET /v1/markets/{id}/history?granularity=1h|1d`}
        </pre>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Resolved / research</h3>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /v1/markets/resolved?from=&to=&category=
GET /v1/markets/{id}/resolution`}
        </pre>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Leaderboard / skill (optional tier)</h3>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /v1/leaderboard/global?limit=
GET /v1/markets/{id}/distribution?cohort=top_decile   # future`}
        </pre>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Batch / quant-friendly</h3>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`POST /v1/query/markets
GET /v1/snapshots/daily`}
        </pre>

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wider text-plains-void">Real-time (later)</h3>
        <p className="text-sm text-plains-muted">
          WebSocket or SSE: e.g. subscribe <code className="font-mono text-xs">market.{"{id}"}</code> for pushed
          distribution updates.
        </p>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Who it’s for</h2>
        <ul className="space-y-3 text-sm text-plains-muted">
          <li>
            <strong className="font-medium text-plains-void">Kalshi / Polymarket-style traders.</strong> Another market’s
            view of <strong className="font-medium text-plains-void">belief</strong>: Plains-only flows and skews to compare
            with your venue’s price and depth when categories overlap.
          </li>
          <li>
            <strong className="font-medium text-plains-void">Quant / prop / research.</strong> Resolved labels plus
            cross-sectional features — option shares, participant counts, category tags — and optional skill-segmented
            panels for calibration, ensembles, and event studies.
          </li>
        </ul>
        <blockquote className="rounded-xl border border-plains-border bg-plains-mist/50 px-4 py-3 text-sm italic text-plains-void">
          Plains API is the programmatic feed of how our prediction-market crowd allocates across outcomes — with history
          and resolutions — built for traders and researchers who already trade belief on Kalshi, Polymarket, and
          elsewhere.
        </blockquote>
      </section>

      <section className="mt-12 space-y-4 border-t border-plains-border pt-10">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-accent">This deployment — operator routes</h2>
        <p className="text-sm text-plains-muted">
          Internal HTTP routes and integration hooks. Authenticated app flows use Supabase from the client where RLS
          applies.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Cron — full ingest</h2>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /api/cron/ingest
Authorization: Bearer $CRON_SECRET

Runs Valorant + Dome (Polymarket + Kalshi) + Pokémon TCG (TCGdex) + Yahoo finance/crypto + CS2 SteamAnalyst (optional key).
See lib/full-ingest.ts.`}
        </pre>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Public reads (no key)</h2>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`GET /api/public/leaderboard/top?limit=10
GET /api/public/markets/{id}/pulse`}
        </pre>
        <p className="text-sm text-plains-muted">
          Pulse returns aggregate pick counts and recent option tags (no usernames). Useful preview of a future{" "}
          <code className="font-mono text-xs">/v1/markets/…/distribution</code> style surface.
        </p>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Predictions (session cookie)</h2>
        <pre className="overflow-x-auto rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-xs text-plains-void">
          {`POST /api/predictions
Content-Type: application/json
{ "market_id": "<uuid>", "chosen_option": "<string>" }`}
        </pre>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">External feeds (env)</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-plains-muted">
          <li>
            <code className="rounded bg-plains-mist px-1 font-mono text-plains-void">DOME_API_KEY</code> —{" "}
            <a href="https://docs.domeapi.io/" className="text-plains-accent hover:underline">
              Dome API
            </a>{" "}
            for Polymarket + Kalshi mirrors (<code className="font-mono">lib/dome-sync.ts</code>). Optional:{" "}
            <code className="font-mono">DOME_INGEST_LIMIT</code>, <code className="font-mono">DOME_INGEST_PAGES</code>,{" "}
            <code className="font-mono">DOME_POLY_MIN_VOLUME</code>, <code className="font-mono">DOME_KALSHI_MIN_VOLUME</code>
            .
          </li>
          <li>
            <code className="rounded bg-plains-mist px-1 font-mono text-plains-void">STEAMANALYST_API_KEY</code> — CS2 skin
            price-target markets (<code className="font-mono">lib/cs2-steamanalyst-sync.ts</code>).
          </li>
          <li>
            <code className="rounded bg-plains-mist px-1 font-mono text-plains-void">PRODUCEIQ_API_BASE</code>,{" "}
            <code className="rounded bg-plains-mist px-1 font-mono text-plains-void">PRODUCEIQ_API_KEY</code> — Parse /
            ProduceIQ commodity endpoints (<code className="font-mono">lib/integrations/produceiq.ts</code>).
          </li>
          <li>
            Pokémon TCG — TCGdex card pricing (no key): <code className="font-mono">lib/pokemon-tcg-sync.ts</code>, env{" "}
            <code className="font-mono">POKEMON_TCG_CARD_IDS</code> (optional; defaults to a small chase list).
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-mono text-sm uppercase tracking-wider text-plains-muted">Market metadata conventions</h2>
        <p className="text-sm text-plains-muted">
          Optional <code className="font-mono">metadata</code> fields:{" "}
          <code className="font-mono">image_url</code> (card art),{" "}
          <code className="font-mono">resolution_criteria</code> (string override for resolution copy). The market detail
          page surfaces these automatically.
        </p>
      </section>
    </div>
  );
}
