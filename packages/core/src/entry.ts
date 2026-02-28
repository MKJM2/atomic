export interface Entry {
  id: string
  date: string       // YYYY-MM-DD local date
  body: string
  createdAt: string
  updatedAt: string
  syncedAt: string | null
  isDeleted: boolean
  isMissing?: boolean;
}

export function todayLocalDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function newEntry(body: string): Entry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    date: todayLocalDate(),
    body,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    isDeleted: false,
  };
}
