import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'server', 'data.db');
const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK(target_amount > 0),
  target_date TEXT NOT NULL,
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('deposit','withdrawal')),
  note TEXT,
  transaction_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
);
`);

db.pragma('foreign_keys = ON');

export default db;
