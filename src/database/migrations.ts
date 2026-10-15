import type { SQLiteDatabase } from 'expo-sqlite';

export const CURRENT_DATABASE_VERSION = 1;

/**
 * Executes database migrations sequentially based on PRAGMA user_version.
 * Guarantees that tables, foreign keys, and search indices are initialized.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= CURRENT_DATABASE_VERSION) {
    return;
  }

  // Version 1: Initial schema setup
  if (currentVersion < 1) {
    await db.execAsync(`
      -- Songs Table: Primary offline videoke song catalog
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY NOT NULL,
        song_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        media_path TEXT NOT NULL,
        duration_seconds INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      -- Indexes for fast number lookup and text searching
      CREATE INDEX IF NOT EXISTS idx_songs_song_number ON songs(song_number);
      CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
      CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);

      -- Queue Items Table: Playback queue with positions
      CREATE TABLE IF NOT EXISTS queue_items (
        id TEXT PRIMARY KEY NOT NULL,
        song_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_queue_position ON queue_items(position);
      CREATE INDEX IF NOT EXISTS idx_queue_song_id ON queue_items(song_id);

      -- Favorites Table: Quick-access bookmarked songs
      CREATE TABLE IF NOT EXISTS favorites (
        song_id TEXT PRIMARY KEY NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      PRAGMA user_version = 1;
    `);
  }
}

/**
 * Drops all application tables and resets user_version to 0.
 * Intended for testing and full database resets.
 */
export async function resetDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS queue_items;
    DROP TABLE IF EXISTS songs;
    PRAGMA user_version = 0;
  `);
}
