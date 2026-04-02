# Plains

Ranked, blind prediction platform: Next.js 14 (App Router), Supabase (Postgres, Auth, Storage), Tailwind. Deploy on [Vercel](https://vercel.com).

## Setup

1. **Supabase** — New project → SQL Editor: run `supabase/schema.sql`, then `supabase/storage-avatars.sql` (after creating the `avatars` bucket if the insert fails, create the bucket in Dashboard → Storage, mark public, then re-run policies only).

   **If you created the DB from an older `schema.sql` without `external_*` columns**, also run `supabase/migration_markets_external.sql` once.

2. **Auth** — Authentication → Providers: enable Email and Google. Add redirect URL: `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).

3. **Env** — Copy `.env.example` to `.env.local` (this file is gitignored). Never commit real keys.

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project Settings → API.
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only; used for public leaderboard/profile reads and admin resolution (bypasses RLS).
   - `ADMIN_PASSWORD` — shared secret for `/admin` API routes (`X-Admin-Password` header).
   - `CRON_SECRET` — random string; Vercel Cron calls `GET /api/cron/valorant` with `Authorization: Bearer <CRON_SECRET>` (Vercel injects this when the env var is set).
   - `VLRGGAPI_BASE_URL` — base URL for [vlrggapi](https://github.com/axsddlr/vlrggapi) (e.g. `http://127.0.0.1:3001` locally). The public `vlrggapi.vercel.app` host is often over quota; **self-host** or deploy that API for production.

4. **Optional seed** — `supabase/seed.sql` inserts sample markets.

5. **Run** — `npm install` && `npm run dev`.

## Valorant / VLR.gg auto markets

1. Run **vlrggapi** locally or deploy it ([repo](https://github.com/axsddlr/vlrggapi)): `python main.py` → default `http://127.0.0.1:3001`.
2. Set `VLRGGAPI_BASE_URL` in `.env.local` to that base URL.
3. **Plains** will:
   - **Create** `Esports` markets from `GET /v2/match?q=upcoming` (one market per match: team A vs team B, options = both teams). Deduplicated by VLR match id (`external_source` + `external_id`).
   - **Resolve** markets from `GET /v2/match?q=results` when series scores show a winner (`score1` ≠ `score2`), then run the same ELO logic as manual admin resolve.

**Triggers**

- **Vercel**: `vercel.json` runs `GET /api/cron/valorant` every 15 minutes. Set `CRON_SECRET` in Vercel env vars (must match what the handler expects).
- **Manual**: `/admin` → **Run Valorant sync now** (uses `X-Admin-Password`), or `POST /api/admin/valorant-sync` with that header.

**Note:** Vercel cannot call `http://127.0.0.1:3001`. For production, deploy vlrggapi to a public URL (Railway, Fly, your VPS, etc.) and set `VLRGGAPI_BASE_URL` there.

## Deploy (Vercel)

- Connect the repo; set the same env vars in Vercel Project → Settings → Environment Variables.
- Production URL: add it to Supabase Auth → URL configuration (Site URL + redirect allow list).

## Admin

- Visit `/admin` (must be logged in). Enter `ADMIN_PASSWORD` in the form, create markets, resolve manually, or run Valorant sync.

## Security notes

- Do not commit `.env`, `.env.local`, or API keys. This repo ignores `.env` and `.env*` except `.env.example`.
- Rotate any key that was ever pasted into chat or committed by mistake.
