interface StreakProps {
  count: number
  enabled: boolean
}

export function Streak({ count, enabled }: StreakProps) {
  if (!enabled) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 20 }}>🔥</span>
      <span style={{ fontSize: 15, fontWeight: 600 }}>
        {count} day{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
