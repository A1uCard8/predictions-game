export const CATEGORIES = [
  "Finance/Markets",
  "Politics",
  "Geopolitics",
  "Sports",
  "Esports",
  "Science/Tech",
  "Culture",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const ELO_WIN = 25;
export const ELO_LOSS = 15;
export const ELO_START = 1000;

export const CATEGORY_LEADER_MIN_PREDICTIONS = 3;
