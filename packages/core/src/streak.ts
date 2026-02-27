export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0

  // Sort descending (most recent first)
  const sorted = [...new Set(dates)].sort().reverse()

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function daysBetween(a: string, b: string): number {
    const da = new Date(a + 'T12:00:00') // noon avoids DST edge
    const db = new Date(b + 'T12:00:00')
    return Math.round((da.getTime() - db.getTime()) / 86400000)
  }

  const diffFromToday = daysBetween(todayStr, sorted[0])

  // Streak broken if most recent entry is older than yesterday
  if (diffFromToday > 1) return 0

  let streak = 1

  for (let i = 1; i < sorted.length; i++) {
    const diff = daysBetween(sorted[i - 1], sorted[i])
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}
