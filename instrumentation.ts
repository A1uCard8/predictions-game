/**
 * Background auto-ingest (Valorant + Dome + Yahoo finance).
 *
 * - `next dev`: set ENABLE_DEV_AUTO_INGEST=true to poll on an interval (no manual /admin clicks).
 * - Vercel: use Cron on /api/cron/ingest + CRON_SECRET (setInterval does not survive serverless).
 * - Self-hosted `next start` (Docker, VPS): set ENABLE_AUTO_INGEST=true when not on Vercel.
 */

const INTERVAL_DEFAULT_MS = 5 * 60 * 1000;
const START_DELAY_MS = 12_000;

type G = typeof globalThis & { __plainsIngestTimer?: NodeJS.Timeout };

function shouldRunBackgroundIngest(): boolean {
  if (process.env.NEXT_RUNTIME !== "nodejs") return false;

  const vercel = !!process.env.VERCEL;
  const dev =
    process.env.NODE_ENV === "development" &&
    (process.env.ENABLE_DEV_AUTO_INGEST === "1" ||
      process.env.ENABLE_DEV_AUTO_INGEST === "true");

  const prodLongRunning =
    process.env.NODE_ENV === "production" &&
    !vercel &&
    (process.env.ENABLE_AUTO_INGEST === "1" || process.env.ENABLE_AUTO_INGEST === "true");

  return dev || prodLongRunning;
}

async function runIngestOnce(): Promise<void> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { runFullIngest } = await import("@/lib/full-ingest");
  const admin = createAdminClient();
  const r = await runFullIngest(admin);
  console.info("[plains] auto-ingest", new Date().toISOString(), {
    valorant: { created: r.valorant.created, resolved: r.valorant.resolved },
    dome: {
      poly: r.dome.polyCreated,
      kalshi: r.dome.kalshiCreated,
      resolved: r.dome.resolved,
    },
    pokemon: { created: r.pokemon.created, resolved: r.pokemon.resolved },
    finance: { created: r.finance.created, resolved: r.finance.resolved },
    cs2: { created: r.cs2.created, resolved: r.cs2.resolved },
  });
}

export async function register() {
  if (!shouldRunBackgroundIngest()) return;

  const raw = Number(process.env.AUTO_INGEST_INTERVAL_MS);
  const intervalMs = Number.isFinite(raw) && raw >= 60_000 ? raw : INTERVAL_DEFAULT_MS;

  const g = globalThis as G;
  if (g.__plainsIngestTimer) {
    clearInterval(g.__plainsIngestTimer);
    g.__plainsIngestTimer = undefined;
  }

  let locked = false;
  const tick = async () => {
    if (locked) return;
    locked = true;
    try {
      await runIngestOnce();
    } catch (e) {
      console.error("[plains] auto-ingest error", e);
    } finally {
      locked = false;
    }
  };

  console.info(
    `[plains] background ingest every ${intervalMs / 1000}s (set ENABLE_DEV_AUTO_INGEST / ENABLE_AUTO_INGEST to disable)`
  );

  setTimeout(() => {
    void tick();
  }, START_DELAY_MS);

  g.__plainsIngestTimer = setInterval(() => {
    void tick();
  }, intervalMs);
}
