const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");
require("dotenv").config();

// Always store the DB in a 'data' folder inside the project root.
// This path works both locally and on Railway.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "../../data"));
const DB_PATH  = path.join(DATA_DIR, "finance.db");

// Create the data directory if it doesn't exist yet
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'viewer'  CHECK(role IN ('admin','analyst','viewer')),
      status      TEXT    NOT NULL DEFAULT 'active'  CHECK(status IN ('active','inactive')),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      amount      REAL    NOT NULL CHECK(amount > 0),
      type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT    NOT NULL,
      date        TEXT    NOT NULL,
      notes       TEXT,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      is_deleted  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_deleted  ON transactions(is_deleted);
  `);
}

module.exports = { getDb };