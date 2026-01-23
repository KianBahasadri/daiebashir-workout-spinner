/**
 * Utility functions for workout roulette mathematics
 */

/**
 * Calculate the smallest number of spins k such that the cumulative probability
 * P(X ≤ k) ≥ targetCdf for a geometric distribution with success probability p.
 */
export const spinsForCdf = (p: number, targetCdf: number): number => {
  if (!Number.isFinite(p) || p <= 0) return Number.POSITIVE_INFINITY
  if (p >= 1) return 1
  const clampedTarget = Math.max(0, Math.min(0.999999, targetCdf))
  // Smallest k such that 1 - (1 - p)^k >= targetCdf
  return Math.max(1, Math.ceil(Math.log(1 - clampedTarget) / Math.log(1 - p)))
}

/**
 * Calculate the cumulative distribution function P(X ≤ spins) for a geometric distribution
 */
export const geometricCdf = (p: number, spins: number): number => {
  if (p <= 0) return 0
  if (spins <= 0) return 0
  return 1 - Math.pow(1 - p, spins)
}

/**
 * Calculate the probability mass function P(X = k) for a geometric distribution
 */
export const geometricPmf = (p: number, k: number): number => {
  if (p <= 0 || k < 1) return 0
  return Math.pow(1 - p, k - 1) * p
}