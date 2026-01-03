/**
 * Belgian rounding - rounds cash payments to the nearest 5 cents
 * This is a legal requirement in Belgium for cash transactions
 * 
 * Examples:
 * - 12.41€ → 12.40€
 * - 12.42€ → 12.40€
 * - 12.43€ → 12.45€
 * - 12.44€ → 12.45€
 * - 12.46€ → 12.45€
 * - 12.47€ → 12.45€
 * - 12.48€ → 12.50€
 */
export function calculateBelgianRounding(amount: number): {
  originalAmount: number;
  roundedAmount: number;
  difference: number;
} {
  // Round to nearest 5 cents
  const roundedAmount = Math.round(amount * 20) / 20;
  const difference = roundedAmount - amount;

  return {
    originalAmount: amount,
    roundedAmount,
    difference
  };
}

/**
 * Format the rounding difference for display
 */
export function formatRoundingDifference(difference: number): string {
  if (difference === 0) return '';
  const sign = difference > 0 ? '+' : '';
  return `${sign}${difference.toFixed(2)}€`;
}
