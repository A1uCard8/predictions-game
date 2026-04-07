export const CATEGORIES = [
  "Finance/Markets",
  "Politics",
  "Geopolitics",
  "Sports",
  "Esports",
  "Valorant",
  "CS2",
  "Pokemon Cards",
  "Science/Tech",
  "Culture",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Legacy flat deltas — resolution now uses contrarian formula in DB (K ≈ ELO_K). */
export const ELO_WIN = 25;
export const ELO_LOSS = 15;
export const ELO_START = 1000;
export const ELO_K = 25;

/** Season reset target (matches users.elo default). */
export const SEASON_STARTING_CREDITS = 1000;
/** Minimum stake on two-outcome credit markets. */
export const MIN_WAGER_CREDITS = 10;

export const CATEGORY_LEADER_MIN_PREDICTIONS = 3;
