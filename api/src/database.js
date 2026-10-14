import Database from "better-sqlite3";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function openDatabase(databasePath = process.env.DATABASE_PATH) {
  const resolvedPath = databasePath === ":memory:"
    ? ":memory:"
    : databasePath
      ? path.resolve(process.cwd(), databasePath)
      : path.join(apiRoot, "data", "workspaces.sqlite");

  if (resolvedPath !== ":memory:") {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path.dirname(resolvedPath), { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  await applyMigrations(db);
  return db;
}

export async function applyMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const migrationsPath = path.join(apiRoot, "migrations");
  const files = (await readdir(migrationsPath))
    .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/i.test(name))
    .sort();

  for (const name of files) {
    const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE name = ?").get(name);
    if (applied) continue;

    const sql = await readFile(path.join(migrationsPath, name), "utf8");
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(name, new Date().toISOString());
    });
    apply();
  }
}
