export interface Entry {
  id: string
  date: string       // YYYY-MM-DD local date
  body: string
  createdAt: string
  updatedAt: string
  syncedAt: string | null
  isDeleted: boolean
}

export function todayLocalDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function newEntry(body: string): Entry {
  console.log('[core/entry.ts] newEntry: Creating new entry object.');
  const now = new Date().toISOString();
  console.log('[core/entry.ts] newEntry: Calling crypto.randomUUID...');
  const id = crypto.randomUUID();
  console.log('[core/entry.ts] newEntry: crypto.randomUUID returned:', id);
  const entry = {
    id: id,
    date: todayLocalDate(),
    body,
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    isDeleted: false,
  };
  console.log('[core/entry.ts] newEntry: Returning entry:', entry.id);
  return entry;
}
