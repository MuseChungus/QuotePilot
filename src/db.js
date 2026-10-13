const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let db = null;

function getDb(dbPath) {
  if (db) return db;
  const resolved = dbPath || process.env.DATABASE_PATH || './data/quotepilot.db';
  const dir = path.dirname(resolved);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(resolved);
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

function migrate(conn) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const row = conn.prepare('SELECT MAX(version) as v FROM schema_migrations').get();
  const current = row && row.v ? row.v : 0;

  if (current < 1) {
    conn.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS qualifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL DEFAULT '',
        project_type TEXT NOT NULL,
        budget_range TEXT NOT NULL,
        timeline TEXT NOT NULL,
        scope_notes TEXT NOT NULL DEFAULT '',
        score INTEGER NOT NULL,
        band TEXT NOT NULL,
        reasons TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        public_id TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        project_type TEXT NOT NULL DEFAULT '',
        expiry TEXT NOT NULL DEFAULT '',
        deposit_pct REAL NOT NULL DEFAULT 50,
        discount_pct REAL NOT NULL DEFAULT 0,
        terms TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','lost')),
        follow_up_date TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS proposal_tiers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_id INTEGER NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS proposal_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tier_id INTEGER NOT NULL REFERENCES proposal_tiers(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        qty REAL NOT NULL DEFAULT 1,
        price REAL NOT NULL DEFAULT 0,
        is_addon INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_qual_user ON qualifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_prop_user ON proposals(user_id);
      CREATE INDEX IF NOT EXISTS idx_prop_public ON proposals(public_id);
      CREATE INDEX IF NOT EXISTS idx_tiers_prop ON proposal_tiers(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_items_tier ON proposal_items(tier_id);
    `);
    conn.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
  }
}

function closeDb() {
  if (db) { try { db.close(); } catch {} db = null; }
}

module.exports = { getDb, migrate, closeDb };
