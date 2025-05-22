export function calculateComplianceScore(compliant: number, total: number): number {
  if (total === 0) return 0
  return (compliant / total) * 100
}

export function getComplianceTrend(
  currentScore: number,
  previousScore: number
): 'up' | 'down' | 'stable' {
  const difference = currentScore - previousScore
  if (Math.abs(difference) < 1) return 'stable'
  return difference > 0 ? 'up' : 'down'
} 