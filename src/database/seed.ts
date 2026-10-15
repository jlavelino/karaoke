import type { SQLiteDatabase } from 'expo-sqlite';
import { MOCK_SONGS } from '../data/mockSongs';

/**
 * Seeds the database with default sample songs if the songs catalog is currently empty.
 * This ensures the user has immediate playable/searchable songs on first launch.
 */
export async function seedInitialSongsIfEmpty(db: SQLiteDatabase): Promise<boolean> {
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM songs;'
  );

  if (countRow && countRow.count > 0) {
    return false; // Already populated
  }

  // Populate using a transaction
  await db.withTransactionAsync(async () => {
    for (const song of MOCK_SONGS) {
      await db.runAsync(
        `
        INSERT INTO songs (
          id, song_number, title, artist, media_path, duration_seconds, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          song.id,
          song.song_number,
          song.title,
          song.artist ?? null,
          song.media_path,
          song.duration_seconds ?? null,
          song.created_at,
          song.updated_at,
        ]
      );

      if (song.is_favorite) {
        await db.runAsync(
          `
          INSERT OR IGNORE INTO favorites (song_id, created_at)
          VALUES (?, ?);
          `,
          [song.id, song.created_at]
        );
      }
    }
  });

  return true;
}
