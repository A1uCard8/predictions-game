import type { SupabaseClient } from "@supabase/supabase-js";
import type { DomeSyncReport } from "./dome-sync";
import { runDomeSync } from "./dome-sync";
import type { FinanceSyncReport } from "./finance-sync";
import { runFinanceSync } from "./finance-sync";
import type { Cs2SteamSyncReport } from "./cs2-steamanalyst-sync";
import { runCs2SteamAnalystSync } from "./cs2-steamanalyst-sync";
import type { PokemonTcgSyncReport } from "./pokemon-tcg-sync";
import { runPokemonTcgSync } from "./pokemon-tcg-sync";
import type { ValorantSyncReport } from "./valorant-sync";
import { runValorantSync } from "./valorant-sync";

export type FullIngestReport = {
  valorant: ValorantSyncReport;
  dome: DomeSyncReport;
  pokemon: PokemonTcgSyncReport;
  finance: FinanceSyncReport;
  cs2: Cs2SteamSyncReport;
};

/**
 * Valorant + Dome + Pokémon TCG + Yahoo finance/crypto + CS2 (SteamAnalyst, optional).
 * Vercel Cron: GET /api/cron/ingest with Authorization: Bearer CRON_SECRET
 */
export async function runFullIngest(admin: SupabaseClient): Promise<FullIngestReport> {
  const valorant = await runValorantSync(admin);
  const dome = await runDomeSync(admin);
  const pokemon = await runPokemonTcgSync(admin);
  const finance = await runFinanceSync(admin);
  const cs2 = await runCs2SteamAnalystSync(admin);
  return { valorant, dome, pokemon, finance, cs2 };
}
