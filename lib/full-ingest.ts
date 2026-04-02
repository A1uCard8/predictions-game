import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceSyncReport } from "./finance-sync";
import { runFinanceSync } from "./finance-sync";
import type { NewsSyncReport } from "./news-sync";
import { runNewsSync } from "./news-sync";
import type { ValorantSyncReport } from "./valorant-sync";
import { runValorantSync } from "./valorant-sync";

export type FullIngestReport = {
  valorant: ValorantSyncReport;
  news: NewsSyncReport;
  finance: FinanceSyncReport;
};

/**
 * Valorant (vlrggapi) + NewsAPI headline follow-up markets + Yahoo daily/monthly finance/crypto.
 * Safe to run on a schedule (Vercel Cron) with service role via API route.
 */
export async function runFullIngest(admin: SupabaseClient): Promise<FullIngestReport> {
  const valorant = await runValorantSync(admin);
  const news = await runNewsSync(admin);
  const finance = await runFinanceSync(admin);
  return { valorant, news, finance };
}
