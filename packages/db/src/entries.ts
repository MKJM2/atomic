import { getDb } from './client'
import type { Entry } from '@twoline/core'

export async function upsertEntry(entry: Entry): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO entries (id, date, body, created_at, updated_at, synced_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       id = excluded.id,
       body = excluded.body,
       updated_at = excluded.updated_at`,
    [
      entry.id,
      entry.date,
      entry.body,
      entry.createdAt,
      entry.updatedAt,
      entry.syncedAt,
      entry.isDeleted ? 1 : 0,
    ]
  )
}

export async function getEntryByDate(date: string): Promise<Entry | null> {
  const db = await getDb()
  const rows = await db.select<any[]>(
    'SELECT * FROM entries WHERE date = ? AND is_deleted = 0',
    [date]
  )
  if (rows.length === 0) return null
  return rowToEntry(rows[0])
}

export async function getAllDates(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ date: string }[]>(
    'SELECT date FROM entries WHERE is_deleted = 0 ORDER BY date DESC'
  )
  return rows.map((r) => r.date)
}

export async function getAllEntrySkeletons(): Promise<{ id: string, date: string }[]> {
  const db = await getDb()
  const rows = await db.select<{ id: string, date: string }[]>(
    'SELECT id, date FROM entries WHERE is_deleted = 0 ORDER BY date DESC'
  )
  return rows
}

export async function getEntriesByDates(dates: string[]): Promise<Entry[]> {
  if (dates.length === 0) return []
  const db = await getDb()
  const placeholders = dates.map(() => '?').join(',')
  const rows = await db.select<any[]>(
    `SELECT * FROM entries WHERE is_deleted = 0 AND date IN (${placeholders})`,
    dates
  )
  return rows.map(rowToEntry)
}

export async function searchEntries(query: string): Promise<string[]> {
  if (!query.trim()) return []
  const db = await getDb()
  // FTS5 MATCH clause requires special escaping if user types invalid characters,
  // but simpler queries usually work as-is. We append a wildcard for partial matches.
  // Note: fts5 uses rowid to map back to original table id. Since our id is TEXT, we mapped rowid='id'
  const rows = await db.select<{ id: string }[]>(
    `SELECT rowid as id FROM entries_fts WHERE entries_fts MATCH ? ORDER BY rank`,
    [`${query}*`]
  )
  return rows.map(r => r.id)
}

export async function getLast365Dates(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ date: string }[]>(
    `SELECT date FROM entries
     WHERE is_deleted = 0
       AND date >= date('now', 'localtime', '-365 days')
     ORDER BY date ASC`
  )
  return rows.map((r) => r.date)
}

export async function getAllEntries(limit: number = 50, offset: number = 0): Promise<Entry[]> {
  const db = await getDb()
  const rows = await db.select<any[]>(
    `SELECT * FROM entries
     WHERE is_deleted = 0
     ORDER BY date DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  return rows.map(rowToEntry)
}

export async function getEntryCount(): Promise<number> {
  const db = await getDb()
  const rows = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM entries WHERE is_deleted = 0'
  )
  return rows[0].count
}

function rowToEntry(row: any): Entry {
  return {
    id: row.id,
    date: row.date,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
    isDeleted: row.is_deleted === 1,
  }
}
