import { getDb } from './client'
import type { Entry } from '@twoline/core'

export async function upsertEntry(entry: Entry): Promise<void> {
  console.log('[db/entries.ts] upsertEntry: Upserting entry:', entry.id);
  console.log('[db/entries.ts] upsertEntry: Calling getDb...');
  const db = await getDb();
  console.log('[db/entries.ts] upsertEntry: getDb returned.');
  console.log('[db/entries.ts] upsertEntry: Executing INSERT/UPDATE...');
  await db.execute(
    `INSERT INTO entries (id, date, body, created_at, updated_at, synced_at, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
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
  );
  console.log('[db/entries.ts] upsertEntry: INSERT/UPDATE completed.');
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

export async function getLast365Dates(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ date: string }[]>(
    `SELECT date FROM entries
     WHERE is_deleted = 0
       AND date >= date('now', '-365 days')
     ORDER BY date ASC`
  )
  return rows.map((r) => r.date)
}

export async function getAllEntries(): Promise<Entry[]> {
  const db = await getDb()
  const rows = await db.select<any[]>(
    `SELECT * FROM entries
     WHERE is_deleted = 0
     ORDER BY date DESC`
  )
  return rows.map(rowToEntry)
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
