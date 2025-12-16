/**
 * Format a token balance for display
 * Handles large numbers (M, K suffixes) and respects decimals
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  const num = parseFloat(balance);
  if (isNaN(num)) return balance;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  if (decimals === 0) return Math.floor(num).toLocaleString();
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
