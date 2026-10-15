import { getDatabase } from '../database/database';
import { Song } from '../types/song';

interface SongRow {
  id: string;
  song_number: string;
  title: string;
  artist: string | null;
  media_path: string;
  duration_seconds: number | null;
  created_at: number;
  updated_at: number;
  is_favorite: number;
}

export type CreateSongInput = {
  id?: string;
  song_number: string;
  title: string;
  artist?: string | null;
  media_path: string;
  duration_seconds?: number | null;
  created_at?: number;
  updated_at?: number;
  is_favorite?: boolean;
};

export type UpdateSongInput = Partial<
  Pick<Song, 'song_number' | 'title' | 'artist' | 'media_path' | 'duration_seconds' | 'is_favorite'>
>;

function rowToSong(row: SongRow): Song {
  return {
    id: row.id,
    song_number: row.song_number,
    title: row.title,
    artist: row.artist,
    media_path: row.media_path,
    duration_seconds: row.duration_seconds,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_favorite: row.is_favorite === 1,
  };
}

const BASE_SONG_SELECT = `
  SELECT 
    s.id,
    s.song_number,
    s.title,
    s.artist,
    s.media_path,
    s.duration_seconds,
    s.created_at,
    s.updated_at,
    CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
  FROM songs s
  LEFT JOIN favorites f ON s.id = f.song_id
`;

/**
 * Retrieves all songs in the catalog sorted alphabetically by title.
 */
export async function getAllSongs(): Promise<Song[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SongRow>(`
    ${BASE_SONG_SELECT}
    ORDER BY s.title COLLATE NOCASE ASC;
  `);
  return rows.map(rowToSong);
}

/**
 * Looks up a song by exact song number string.
 * Preserves leading zeros (e.g., '0012' does not match '12').
 */
export async function getSongByNumber(songNumber: string): Promise<Song | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SongRow>(
    `
    ${BASE_SONG_SELECT}
    WHERE s.song_number = ?
    LIMIT 1;
    `,
    [songNumber]
  );
  return row ? rowToSong(row) : null;
}

/**
 * Looks up a song by internal identifier.
 */
export async function getSongById(id: string): Promise<Song | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SongRow>(
    `
    ${BASE_SONG_SELECT}
    WHERE s.id = ?
    LIMIT 1;
    `,
    [id]
  );
  return row ? rowToSong(row) : null;
}

/**
 * Searches songs by title, artist, or song number matching the query string.
 */
export async function searchSongs(query: string): Promise<Song[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return getAllSongs();
  }

  const db = await getDatabase();
  const pattern = `%${trimmed}%`;
  const rows = await db.getAllAsync<SongRow>(
    `
    ${BASE_SONG_SELECT}
    WHERE s.song_number LIKE ? 
       OR s.title LIKE ? 
       OR (s.artist IS NOT NULL AND s.artist LIKE ?)
    ORDER BY s.title COLLATE NOCASE ASC;
    `,
    [pattern, pattern, pattern]
  );
  return rows.map(rowToSong);
}

/**
 * Retrieves all favorited songs.
 */
export async function getFavoriteSongs(): Promise<Song[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SongRow>(`
    ${BASE_SONG_SELECT}
    WHERE f.song_id IS NOT NULL
    ORDER BY s.title COLLATE NOCASE ASC;
  `);
  return rows.map(rowToSong);
}

/**
 * Inserts a new song into the catalog.
 * Validates uniqueness of song_number before insertion.
 */
export async function insertSong(input: CreateSongInput): Promise<Song> {
  const trimmedNumber = input.song_number.trim();
  const trimmedTitle = input.title.trim();

  if (!trimmedNumber) {
    throw new Error('Song number is required.');
  }
  if (!trimmedTitle) {
    throw new Error('Song title is required.');
  }

  const db = await getDatabase();

  // Validate unique song number
  const existing = await getSongByNumber(trimmedNumber);
  if (existing) {
    throw new Error(`Song number "${trimmedNumber}" is already in use by "${existing.title}".`);
  }

  const now = Date.now();
  const songId = input.id || `song_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const createdAt = input.created_at ?? now;
  const updatedAt = input.updated_at ?? now;

  await db.runAsync(
    `
    INSERT INTO songs (
      id, song_number, title, artist, media_path, duration_seconds, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      songId,
      trimmedNumber,
      trimmedTitle,
      input.artist?.trim() || null,
      input.media_path,
      input.duration_seconds ?? null,
      createdAt,
      updatedAt,
    ]
  );

  if (input.is_favorite) {
    await db.runAsync(
      `
      INSERT OR IGNORE INTO favorites (song_id, created_at)
      VALUES (?, ?);
      `,
      [songId, now]
    );
  }

  const inserted = await getSongById(songId);
  if (!inserted) {
    throw new Error('Failed to retrieve newly created song.');
  }
  return inserted;
}

/**
 * Updates an existing song's metadata and/or favorite status.
 */
export async function updateSong(id: string, updates: UpdateSongInput): Promise<Song> {
  const db = await getDatabase();
  const existing = await getSongById(id);
  if (!existing) {
    throw new Error(`Song with ID "${id}" does not exist.`);
  }

  // If changing song_number, check for uniqueness conflicts
  if (updates.song_number !== undefined && updates.song_number !== existing.song_number) {
    const trimmedNumber = updates.song_number.trim();
    if (!trimmedNumber) {
      throw new Error('Song number cannot be empty.');
    }
    const conflict = await getSongByNumber(trimmedNumber);
    if (conflict && conflict.id !== id) {
      throw new Error(`Song number "${trimmedNumber}" is already in use by "${conflict.title}".`);
    }
  }

  const now = Date.now();
  const newNumber = updates.song_number !== undefined ? updates.song_number.trim() : existing.song_number;
  const newTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
  const newArtist = (updates.artist !== undefined ? (updates.artist ? updates.artist.trim() : null) : existing.artist) ?? null;
  const newMediaPath = updates.media_path !== undefined ? updates.media_path : existing.media_path;
  const newDuration = (updates.duration_seconds !== undefined ? updates.duration_seconds : existing.duration_seconds) ?? null;

  await db.runAsync(
    `
    UPDATE songs
    SET song_number = ?,
        title = ?,
        artist = ?,
        media_path = ?,
        duration_seconds = ?,
        updated_at = ?
    WHERE id = ?;
    `,
    [newNumber, newTitle, newArtist, newMediaPath, newDuration, now, id]
  );

  if (updates.is_favorite !== undefined) {
    if (updates.is_favorite) {
      await db.runAsync(
        `INSERT OR IGNORE INTO favorites (song_id, created_at) VALUES (?, ?);`,
        [id, now]
      );
    } else {
      await db.runAsync(`DELETE FROM favorites WHERE song_id = ?;`, [id]);
    }
  }

  const updated = await getSongById(id);
  if (!updated) {
    throw new Error('Failed to retrieve updated song.');
  }
  return updated;
}

/**
 * Toggles a song's favorite state.
 * Returns the new favorite status (true if now favorited, false if removed).
 */
export async function toggleFavoriteSong(songId: string): Promise<boolean> {
  const db = await getDatabase();
  const favoriteRow = await db.getFirstAsync<{ song_id: string }>(
    `SELECT song_id FROM favorites WHERE song_id = ? LIMIT 1;`,
    [songId]
  );

  if (favoriteRow) {
    await db.runAsync(`DELETE FROM favorites WHERE song_id = ?;`, [songId]);
    return false;
  } else {
    await db.runAsync(`INSERT INTO favorites (song_id, created_at) VALUES (?, ?);`, [
      songId,
      Date.now(),
    ]);
    return true;
  }
}

/**
 * Deletes a song from the database.
 * Cascades automatically to queue_items and favorites via foreign key.
 */
export async function deleteSong(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(`DELETE FROM songs WHERE id = ?;`, [id]);
  return result.changes > 0;
}
