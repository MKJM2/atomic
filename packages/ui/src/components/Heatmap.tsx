// TODO: re-enable for history view — currently not imported by App.tsx
interface HeatmapProps {
  activeDates: Set<string>
}

function getDaysInRange(): string[] {
  const days: string[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    days.push(`${year}-${month}-${day}`)
  }
  return days
}

export function Heatmap({ activeDates }: HeatmapProps) {
  const days = getDaysInRange()

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'repeat(7, 12px)',
          gridAutoFlow: 'column',
          gap: 3,
          width: 'fit-content',
        }}
      >
        {days.map((date) => (
          <div
            key={date}
            title={date}
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: activeDates.has(date) ? '#111827' : '#e5e7eb',
            }}
          />
        ))}
      </div>
    </div>
  )
}
