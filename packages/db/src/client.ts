import Database from '@tauri-apps/plugin-sql'

let _db: Database | null = null

export async function getDb(): Promise<Database> {
  console.log('[db/client.ts] getDb: Function called.');
  if (_db) {
    console.log('[db/client.ts] getDb: Returning existing DB instance.');
    return _db;
  }
  console.log('[db/client.ts] getDb: No existing DB instance, calling Database.load...');
  _db = await Database.load('sqlite:twoline.db');
  console.log('[db/client.ts] getDb: Database.load completed. Calling migrate...');
  await migrate(_db);
  console.log('[db/client.ts] getDb: migrate completed. Returning new DB instance.');
  return _db;
}

async function migrate(db: Database): Promise<void> {
  console.log('[db/client.ts] migrate: Starting migration.');
  console.log('[db/client.ts] migrate: Creating entries table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS entries (
      id          TEXT PRIMARY KEY,
      date        TEXT NOT NULL UNIQUE,
      body        TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      synced_at   TEXT,
      is_deleted  INTEGER DEFAULT 0
    )
  `);
  console.log('[db/client.ts] migrate: entries table created.');
  console.log('[db/client.ts] migrate: Creating settings table...');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  console.log('[db/client.ts] migrate: settings table created. Migration finished.');
}
