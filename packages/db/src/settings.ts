import { getDb } from './client'

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb()
  const rows = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  )
  const result = rows.length > 0 ? rows[0].value : null
  console.debug(`[settings] GET "${key}" → ${result === null ? 'null' : `"${result}"`}`)
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb()
  console.debug(`[settings] SET "${key}" = "${value}"`)
  await db.execute(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  )
}
