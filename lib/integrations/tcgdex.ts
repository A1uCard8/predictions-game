/**
 * Pokémon TCG data via TCGdex (pricing embedded on card objects).
 * @see https://tcgdex.dev/markets-prices
 *
 * Ingest for prediction markets lives in `lib/pokemon-tcg-sync.ts` (full ingest).
 */

export { fetchTcgdexCard as fetchCardMarketPrice } from "@/lib/pokemon-tcg-sync";
