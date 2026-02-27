import Database from '@tauri-apps/plugin-sql'

let _dbPromise: Promise<Database> | null = null

export function getDb(): Promise<Database> {
  if (_dbPromise) return _dbPromise

  _dbPromise = (async () => {
    const db = await Database.load('sqlite:twoline.db')
    await migrate(db)
    return db
  })()

  return _dbPromise
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
    // Note: id is stored as TEXT column (not content_rowid) because entries.id is TEXT (UUID)
    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        id,
        body,
        content='entries',
        tokenize='porter unicode61'
      )
    `)
    // Triggers to keep FTS index synced
    // Note: Use id column directly instead of rowid
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)

    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (2, ?)',
      [new Date().toISOString()]
    )
  }

  if (currentVersion < 3) {
    // Fix for previous FTS corruption/datatype mismatch: Recreate the index correctly
    await db.execute('DROP TRIGGER IF EXISTS entries_ai')
    await db.execute('DROP TRIGGER IF EXISTS entries_ad')
    await db.execute('DROP TRIGGER IF EXISTS entries_au')
    await db.execute('DROP TABLE IF EXISTS entries_fts')

    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        id,
        body,
        content='entries',
        tokenize='porter unicode61'
      )
    `)

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)

    // Backfill the FTS table from existing entries
    await db.execute(`INSERT INTO entries_fts(id, body) SELECT id, body FROM entries WHERE is_deleted = 0`)

    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (3, ?)',
      [new Date().toISOString()]
    )
  }

  if (currentVersion < 4) {
    // Switch to trigram tokenizer to support substring matching (e.g., "mg" matches "omg")
    await db.execute('DROP TRIGGER IF EXISTS entries_ai')
    await db.execute('DROP TRIGGER IF EXISTS entries_ad')
    await db.execute('DROP TRIGGER IF EXISTS entries_au')
    await db.execute('DROP TABLE IF EXISTS entries_fts')

    await db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS entries_fts USING fts5(
        id,
        body,
        content='entries',
        tokenize='trigram'
      )
    `)

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries BEGIN
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ad AFTER DELETE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
      END;
    `)
    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)

    await db.execute(`INSERT INTO entries_fts(id, body) SELECT id, body FROM entries WHERE is_deleted = 0`)

    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (4, ?)',
      [new Date().toISOString()]
    )
  }

  if (currentVersion < 5) {
    // Fix triggers to properly handle the is_deleted flag
    await db.execute('DROP TRIGGER IF EXISTS entries_ai')
    await db.execute('DROP TRIGGER IF EXISTS entries_au')

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_ai AFTER INSERT ON entries WHEN new.is_deleted = 0 BEGIN
        INSERT INTO entries_fts(id, body) VALUES (new.id, new.body);
      END;
    `)

    await db.execute(`
      CREATE TRIGGER IF NOT EXISTS entries_au AFTER UPDATE ON entries BEGIN
        -- Always remove the old version from FTS index
        INSERT INTO entries_fts(entries_fts, id, body) VALUES('delete', old.id, old.body);
        -- Re-insert only if not deleted
        INSERT INTO entries_fts(id, body) SELECT new.id, new.body WHERE new.is_deleted = 0;
      END;
    `)

    await db.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (5, ?)',
      [new Date().toISOString()]
    )
  }
}
