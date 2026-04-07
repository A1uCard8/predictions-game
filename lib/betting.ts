/**
 * Pool-based credit betting (options[0] = yes pool, options[1] = no pool).
 * Payout if your side wins: wager + (wager / winning_pool) * losing_pool (integer floor).
 */

export function poolProbabilities(totalYes: number, totalNo: number): { yes: number; no: number } {
  const t = totalYes + totalNo;
  if (t <= 0) return { yes: 0.5, no: 0.5 };
  return { yes: totalYes / t, no: totalNo / t };
}

/** Estimated return if this side wins and no one else bets after you (Polymarket-style hint). */
export function estimatedPayoutOnWin(
  wager: number,
  totalYes: number,
  totalNo: number,
  pickFirstOption: boolean,
): number {
  if (wager < 1) return 0;
  if (pickFirstOption) {
    const newWin = totalYes + wager;
    const lose = totalNo;
    if (newWin <= 0) return wager;
    return wager + Math.floor((wager / newWin) * lose);
  }
  const newWin = totalNo + wager;
  const lose = totalYes;
  if (newWin <= 0) return wager;
  return wager + Math.floor((wager / newWin) * lose);
}

export function isBinaryMarket(options: string[]): boolean {
  return Array.isArray(options) && options.length === 2;
}
