export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  // Sort descending (most recent first)
  const sorted = [...dates].sort().reverse()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const mostRecent = new Date(sorted[0] + 'T00:00:00')

  const diffFromToday = Math.round(
    (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Streak broken if most recent entry is older than yesterday
  if (diffFromToday > 1) return 0

  let streak = 1

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00')
    const curr = new Date(sorted[i] + 'T00:00:00')
    const diff = Math.round(
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
