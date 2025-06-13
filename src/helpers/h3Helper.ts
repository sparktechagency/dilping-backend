export function getResolutionByRadius(radiusMeters: number): number {
  if (radiusMeters > 1000) return 7
  if (radiusMeters > 300) return 8
  if (radiusMeters > 100) return 9
  return 10 // very small radius
}
