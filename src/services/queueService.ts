import { getDatabase } from '../database/database';
import { QueueItem } from '../types/song';

interface QueueItemRow {
  queue_id: string;
  song_id: string;
  position: number;
  added_at: number;
  song_number: string;
  title: string;
  artist: string | null;
  media_path: string;
  duration_seconds: number | null;
  created_at: number;
  updated_at: number;
  is_favorite: number;
}

function rowToQueueItem(row: QueueItemRow): QueueItem {
  return {
    id: row.queue_id,
    song_id: row.song_id,
    position: row.position,
    added_at: row.added_at,
    song: {
      id: row.song_id,
      song_number: row.song_number,
      title: row.title,
      artist: row.artist,
      media_path: row.media_path,
      duration_seconds: row.duration_seconds,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_favorite: row.is_favorite === 1,
    },
  };
}

const BASE_QUEUE_SELECT = `
  SELECT 
    q.id AS queue_id,
    q.song_id,
    q.position,
    q.added_at,
    s.song_number,
    s.title,
    s.artist,
    s.media_path,
    s.duration_seconds,
    s.created_at,
    s.updated_at,
    CASE WHEN f.song_id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite
  FROM queue_items q
  INNER JOIN songs s ON q.song_id = s.id
  LEFT JOIN favorites f ON s.id = f.song_id
`;

/**
 * Retrieves all items currently in the playback queue, ordered by position ascending.
 */
export async function getQueue(): Promise<QueueItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QueueItemRow>(`
    ${BASE_QUEUE_SELECT}
    ORDER BY q.position ASC;
  `);
  return rows.map(rowToQueueItem);
}

/**
 * Retrieves a single queue item by its unique queue entry identifier.
 */
export async function getQueueItemById(queueItemId: string): Promise<QueueItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QueueItemRow>(
    `
    ${BASE_QUEUE_SELECT}
    WHERE q.id = ?
    LIMIT 1;
    `,
    [queueItemId]
  );
  return row ? rowToQueueItem(row) : null;
}

/**
 * Appends a song to the end of the queue.
 * Calculates next position transactional and preserves leading zero number integrity.
 */
export async function addToQueue(songId: string): Promise<QueueItem> {
  const db = await getDatabase();

  const songExists = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM songs WHERE id = ? LIMIT 1;',
    [songId]
  );
  if (!songExists) {
    throw new Error(`Cannot add to queue: Song with ID "${songId}" does not exist in catalog.`);
  }

  const now = Date.now();
  const queueItemId = `q_${now}_${Math.random().toString(36).substring(2, 7)}`;

  await db.withTransactionAsync(async () => {
    const maxPosRow = await db.getFirstAsync<{ max_pos: number | null }>(
      'SELECT MAX(position) AS max_pos FROM queue_items;'
    );
    const nextPosition = (maxPosRow?.max_pos ?? 0) + 1;

    await db.runAsync(
      `
      INSERT INTO queue_items (id, song_id, position, added_at)
      VALUES (?, ?, ?, ?);
      `,
      [queueItemId, songId, nextPosition, now]
    );
  });

  const created = await getQueueItemById(queueItemId);
  if (!created) {
    throw new Error('Failed to retrieve newly added queue item.');
  }
  return created;
}

/**
 * Appends multiple songs to the queue in a single transaction.
 */
export async function addMultipleToQueue(songIds: string[]): Promise<QueueItem[]> {
  if (songIds.length === 0) return [];
  const db = await getDatabase();
  const now = Date.now();
  const createdIds: string[] = [];

  await db.withTransactionAsync(async () => {
    const maxPosRow = await db.getFirstAsync<{ max_pos: number | null }>(
      'SELECT MAX(position) AS max_pos FROM queue_items;'
    );
    let currentPos = maxPosRow?.max_pos ?? 0;

    for (let i = 0; i < songIds.length; i++) {
      const songId = songIds[i];
      const queueItemId = `q_${now}_${i}_${Math.random().toString(36).substring(2, 7)}`;
      currentPos += 1;
      await db.runAsync(
        `
        INSERT INTO queue_items (id, song_id, position, added_at)
        VALUES (?, ?, ?, ?);
        `,
        [queueItemId, songId, currentPos, now]
      );
      createdIds.push(queueItemId);
    }
  });

  const allItems = await getQueue();
  return allItems.filter((item) => createdIds.includes(item.id));
}

/**
 * Removes a song from the queue by its queue item identifier.
 * Automatically recompacts remaining positions (1..N) to ensure gap-free ordering.
 */
export async function removeFromQueue(queueItemId: string): Promise<boolean> {
  const db = await getDatabase();
  let removed = false;

  await db.withTransactionAsync(async () => {
    const target = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM queue_items WHERE id = ? LIMIT 1;',
      [queueItemId]
    );
    if (!target) {
      removed = false;
      return;
    }

    await db.runAsync('DELETE FROM queue_items WHERE id = ?;', [queueItemId]);

    // Recompact remaining positions to guarantee strict 1..N order
    const remaining = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM queue_items ORDER BY position ASC, added_at ASC;'
    );
    for (let i = 0; i < remaining.length; i++) {
      await db.runAsync('UPDATE queue_items SET position = ? WHERE id = ?;', [
        i + 1,
        remaining[i].id,
      ]);
    }
    removed = true;
  });

  return removed;
}

/**
 * Moves a queue item from fromIndex to toIndex (0-based indices) and updates all positions in SQLite.
 */
export async function moveQueueItem(fromIndex: number, toIndex: number): Promise<QueueItem[]> {
  const db = await getDatabase();
  const currentItems = await getQueue();

  if (
    fromIndex < 0 ||
    fromIndex >= currentItems.length ||
    toIndex < 0 ||
    toIndex >= currentItems.length ||
    fromIndex === toIndex
  ) {
    return currentItems;
  }

  const reordered = [...currentItems];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < reordered.length; i++) {
      await db.runAsync('UPDATE queue_items SET position = ? WHERE id = ?;', [
        i + 1,
        reordered[i].id,
      ]);
    }
  });

  return getQueue();
}

/**
 * Sets queue item positions according to an explicit array of queueItem IDs.
 */
export async function reorderQueue(orderedQueueItemIds: string[]): Promise<QueueItem[]> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedQueueItemIds.length; i++) {
      await db.runAsync('UPDATE queue_items SET position = ? WHERE id = ?;', [
        i + 1,
        orderedQueueItemIds[i],
      ]);
    }
  });
  return getQueue();
}

/**
 * Atomically pops the first item in the queue (position = 1),
 * deletes it from SQLite, recompacts remaining items to 1..N,
 * and returns the popped QueueItem (or null if empty).
 */
export async function popNextQueueItem(): Promise<QueueItem | null> {
  const db = await getDatabase();
  let nextItem: QueueItem | null = null;

  await db.withTransactionAsync(async () => {
    const row = await db.getFirstAsync<QueueItemRow>(
      `
      ${BASE_QUEUE_SELECT}
      ORDER BY q.position ASC
      LIMIT 1;
      `
    );

    if (!row) {
      nextItem = null;
      return;
    }

    nextItem = rowToQueueItem(row);

    await db.runAsync('DELETE FROM queue_items WHERE id = ?;', [row.queue_id]);

    const remaining = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM queue_items ORDER BY position ASC, added_at ASC;'
    );
    for (let i = 0; i < remaining.length; i++) {
      await db.runAsync('UPDATE queue_items SET position = ? WHERE id = ?;', [
        i + 1,
        remaining[i].id,
      ]);
    }
  });

  return nextItem;
}

/**
 * Clears all items from the queue.
 */
export async function clearQueue(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM queue_items;');
}

/**
 * Returns total count of items in the queue.
 */
export async function getQueueCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM queue_items;'
  );
  return row?.count ?? 0;
}

/**
 * Recompacts all queue item positions to sequential 1..N.
 * Useful after external cascade deletions or data repairs.
 */
export async function recompactQueuePositions(): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const rows = await db.getAllAsync<{ id: string }>(
      'SELECT id FROM queue_items ORDER BY position ASC, added_at ASC;'
    );
    for (let i = 0; i < rows.length; i++) {
      await db.runAsync('UPDATE queue_items SET position = ? WHERE id = ?;', [i + 1, rows[i].id]);
    }
  });
}

/**
 * Seeds the queue with the first 3 sample songs from the catalog if the queue has never been initialized.
 * Uses an app_settings marker so that if the user explicitly clears the queue, it remains empty across restarts.
 * Returns the current queue items.
 */
export async function seedInitialQueueIfEmpty(): Promise<QueueItem[]> {
  const db = await getDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const setting = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = 'queue_initialized' LIMIT 1;"
  );

  if (setting) {
    return getQueue();
  }

  const songs = await db.getAllAsync<{ id: string }>(
    'SELECT id FROM songs ORDER BY song_number ASC LIMIT 3;'
  );

  if (songs.length === 0) {
    return [];
  }

  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < songs.length; i++) {
      const queueItemId = `q_seed_${now}_${i + 1}`;
      await db.runAsync(
        `
        INSERT INTO queue_items (id, song_id, position, added_at)
        VALUES (?, ?, ?, ?);
        `,
        [queueItemId, songs[i].id, i + 1, now + i * 10]
      );
    }

    await db.runAsync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('queue_initialized', '1');"
    );
  });

  return getQueue();
}
