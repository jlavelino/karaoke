import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import { seedInitialSongsIfEmpty } from './seed';

export const DATABASE_NAME = 'numberkanta.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLiteDatabase instance for NumberKanta.
 * Ensures WAL journal mode and foreign key constraint enforcement.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Configure WAL journal mode for concurrency & enable foreign keys
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Run database migrations to ensure schema is up-to-date
  await runMigrations(db);

  // Seed default sample songs if database is freshly initialized
  await seedInitialSongsIfEmpty(db);

  dbInstance = db;
  return dbInstance;
}

/**
 * Closes the active database connection and resets the singleton instance.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
