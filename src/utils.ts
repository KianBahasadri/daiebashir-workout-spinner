export const formatPercent = (probability: number) => {
  if (!Number.isFinite(probability) || probability <= 0) return '0%'
  const pct = probability * 100
  if (pct >= 10) return `${pct.toFixed(1)}%`
  if (pct >= 1) return `${pct.toFixed(2)}%`
  return `${pct.toFixed(3)}%`
}
