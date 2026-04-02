# Plains

Ranked, blind prediction platform: Next.js 14 (App Router), Supabase (Postgres, Auth, Storage), Tailwind. Deploy on [Vercel](https://vercel.com).

## Setup

1. **Supabase** — New project → SQL Editor: run `supabase/schema.sql`, then `supabase/storage-avatars.sql` (after creating the `avatars` bucket if the insert fails, create the bucket in Dashboard → Storage, mark public, then re-run policies only).

   **If you created the DB from an older `schema.sql`**, also run these **once** in SQL Editor as needed:
   - `supabase/migration_markets_external.sql` — Valorant dedupe columns
   - `supabase/migration_markets_metadata.sql` — JSON rules for News/Yahoo auto resolution

2. **Auth** — Authentication → Providers: enable Email and Google. Add redirect URL: `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).

3. **Env** — Copy `.env.example` to `.env.local` (this file is gitignored). Never commit real keys.

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only; used for public leaderboard/profile reads and admin resolution (bypasses RLS).
   - `ADMIN_PASSWORD` — shared secret for `/admin` API routes (`X-Admin-Password` header).
   - `CRON_SECRET` — Vercel Cron hits `GET /api/cron/ingest` with `Authorization: Bearer <CRON_SECRET>`.
   - `VLRGGAPI_BASE_URL` — [vlrggapi](https://github.com/axsddlr/vlrggapi) base URL (often self-hosted).
   - `NEWS_API_KEY` — [NewsAPI](https://newsapi.org) for headline follow-up markets.
   - Optional: `AUTO_STOCK_SYMBOLS`, `AUTO_CRYPTO_SYMBOLS`, `AUTO_MONTHLY_CRYPTO` — Yahoo-backed daily/monthly markets (no extra key; same data family as **yfinance**).

4. **Optional seed** — `supabase/seed.sql` inserts sample markets.

5. **Run** — `npm install` && `npm run dev`.

## Auto markets (News + finance + Valorant)

1. **`NEWS_API_KEY`** — Creates Yes/No markets from US top headlines (business, tech, general). Resolution uses NewsAPI “everything” search: **Yes** if enough distinct follow-up articles appear after the seed story (see `metadata` on the row). Heuristic, not legal/financial advice.
2. **Yahoo Finance chart** (no API key) — **Daily** US stocks (weekdays) and **daily** crypto: “close above prior close”. Optional **`AUTO_MONTHLY_CRYPTO`** (e.g. `BTC-USD,ETH-USD`) adds end-of-month “above target” markets in the first days of each month. In production this uses the same unofficial Yahoo endpoints Python **yfinance** uses; respect rate limits.
3. **Valorant** — unchanged; still needs vlrggapi.

**Automatic runs**

- **Vercel (production):** Set `CRON_SECRET` in the project env. Vercel Cron calls `GET /api/cron/ingest` with `Authorization: Bearer <CRON_SECRET>`. **`vercel.json` uses once daily (`0 12 * * *` = 12:00 UTC)** so it works on the **Hobby** plan (Hobby allows only daily crons). On **Pro**, you can change the schedule to e.g. `*/10 * * * *` for every 10 minutes. For more frequent runs on Hobby, use a free external pinger (e.g. [cron-job.org](https://cron-job.org)) to `GET` your `/api/cron/ingest` with header `Authorization: Bearer YOUR_CRON_SECRET` every N minutes.
- **Local `npm run dev`:** Add `ENABLE_DEV_AUTO_INGEST=true` to `.env.local`. The dev server runs full ingest on a timer (default **5 minutes**, override with `AUTO_INGEST_INTERVAL_MS`, minimum 60000). Restart dev after changing env. Keep **vlrggapi** running if you want Valorant sync locally.
- **Self-hosted Node** (`next start`, not Vercel): set `ENABLE_AUTO_INGEST=true` (and the same Supabase/service keys). Ignored on Vercel to avoid duplicate work with Cron.

**Manual:** `/admin` → **Run full ingest now**, or `POST /api/admin/full-sync` with `X-Admin-Password`.

## Valorant / VLR.gg auto markets

1. Run **vlrggapi** locally or deploy it ([repo](https://github.com/axsddlr/vlrggapi)): `python main.py` → default `http://127.0.0.1:3001`.
2. Set `VLRGGAPI_BASE_URL` in `.env.local` to that base URL.
3. **Plains** will:
   - **Create** `Esports` markets from `GET /v2/match?q=upcoming` (one market per match: team A vs team B, options = both teams). Deduplicated by VLR match id (`external_source` + `external_id`).
   - **Resolve** markets from `GET /v2/match?q=results` when series scores show a winner (`score1` ≠ `score2`), then run the same ELO logic as manual admin resolve.

**Triggers**

- **Vercel**: `vercel.json` runs `GET /api/cron/ingest` **once per day** (12:00 UTC) on Hobby-compatible schedule; set `CRON_SECRET`. Upgrade to Pro for sub-daily Vercel Cron, or use an external cron service for more frequent pings.
- **Local / long-running**: see **Automatic runs** above.
- **Manual**: `/admin` → **Run Valorant sync only** or **Run full ingest now**.

**Note:** Vercel cannot call `http://127.0.0.1:3001`. For production, deploy vlrggapi to a public URL (Railway, Fly, your VPS, etc.) and set `VLRGGAPI_BASE_URL` there.

## Deploy (Vercel)

- Connect the repo; set the same env vars in Vercel Project → Settings → Environment Variables.
- Production URL: add it to Supabase Auth → URL configuration (Site URL + redirect allow list).

## Admin

- Visit `/admin` (must be logged in). Enter `ADMIN_PASSWORD` in the form, create markets, resolve manually, or run Valorant sync.

## Security notes

- Do not commit `.env`, `.env.local`, or API keys. This repo ignores `.env` and `.env*` except `.env.example`.
- Rotate any key that was ever pasted into chat or committed by mistake.
