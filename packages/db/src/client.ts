import Database from '@tauri-apps/plugin-sql'

let _db: Database | null = null

export async function getDb(): Promise<Database> {
  if (_db) return _db
  _db = await Database.load('sqlite:twoline.db')
  await migrate(_db)
  return _db
}

async function migrate(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)

  const rows = await db.select<{ version: number }[]>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
  )
  const currentVersion = rows.length > 0 ? rows[0].version : 0

  if (currentVersion < 1) {
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
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `)
    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (1, ?)',
      [new Date().toISOString()]
    )
  }
  if (currentVersion < 2) {
    // FTS5 Virtual Table for full-text search
    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        body,
        content='entries',
        content_rowid='id',
        tokenize='porter unicode61'
      )
    `)
    // Triggers to keep FTS index synced
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(rowid, body) VALUES (new.id, new.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, body) VALUES('delete', old.id, old.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, rowid, body) VALUES('delete', old.id, old.body);
        INSERT INTO entries_fts(rowid, body) VALUES (new.id, new.body);
      END;
    `)

    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)',
      [new Date().toISOString()]
    )
  }
}
