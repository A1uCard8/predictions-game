import type { Category } from "./constants";

export type MarketStatus = "open" | "closed" | "resolved";

export type UserRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  elo: number;
  credits?: number;
  current_streak?: number;
  created_at: string;
};

export type MarketRow = {
  id: string;
  title: string;
  description: string;
  category: Category | string;
  options: string[];
  correct_option: string | null;
  close_date: string;
  resolution_date: string;
  status: MarketStatus;
  external_source: string | null;
  external_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  total_yes_credits?: number;
  total_no_credits?: number;
};

export type PredictionRow = {
  id: string;
  user_id: string;
  market_id: string;
  chosen_option: string;
  is_correct: boolean | null;
  elo_change: number | null;
  credits_wagered?: number;
  pick_implied_p?: number | null;
  created_at: string;
};

export type EloHistoryRow = {
  id: string;
  user_id: string;
  elo_after: number;
  market_id: string | null;
  created_at: string;
};
