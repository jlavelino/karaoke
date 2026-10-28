import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Song, QueueItem } from '@/types/song';
import {
  getAllSongs,
  insertSong,
  deleteSong as deleteSongService,
  toggleFavoriteSong,
  CreateSongInput,
} from '@/services/songService';
import {
  getQueue,
  addToQueue as addToQueueService,
  removeFromQueue as removeFromQueueService,
  moveQueueItem as moveQueueItemService,
  clearQueue as clearQueueService,
  popNextQueueItem,
  recompactQueuePositions,
  seedInitialQueueIfEmpty,
} from '@/services/queueService';
import { deleteMediaFile } from '@/platform/mediaStorage';

interface KaraokeContextType {
  songs: Song[];
  isLoading: boolean;
  queue: QueueItem[];
  currentSong: Song | null;
  isPlaying: boolean;
  playSongNow: (song: Song) => void;
  addToQueue: (song: Song) => Promise<void>;
  removeFromQueue: (queueItemId: string) => Promise<void>;
  moveQueueItem: (fromIndex: number, toIndex: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  togglePlayPause: () => void;
  skipNext: () => Promise<void>;
  toggleFavorite: (songId: string) => Promise<void>;
  findSongByNumber: (num: string) => Song | undefined;
  reloadSongs: () => Promise<void>;
  reloadQueue: () => Promise<void>;
  addSong: (input: CreateSongInput) => Promise<Song>;
  removeSong: (songId: string) => Promise<boolean>;
}

const KaraokeContext = createContext<KaraokeContextType | undefined>(undefined);

export function KaraokeProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const reloadSongs = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await getAllSongs();
      setSongs(loaded);
      setCurrentSong((prev) => prev ?? (loaded.length > 0 ? loaded[0] : null));
    } catch (err) {
      console.error('Failed to load songs from SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reloadQueue = useCallback(async () => {
    try {
      const loadedQueue = await getQueue();
      setQueue(loadedQueue);
    } catch (err) {
      console.error('Failed to reload queue from SQLite:', err);
    }
  }, []);

  // Initialize SQLite song catalog and persistent queue on boot
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      try {
        const loadedSongs = await getAllSongs();
        if (!isMounted) return;
        setSongs(loadedSongs);
        setCurrentSong((prev) => prev ?? (loadedSongs.length > 0 ? loadedSongs[0] : null));

        // Load queue from SQLite, seeding initial 3 sample songs on first install
        const loadedQueue = await seedInitialQueueIfEmpty();
        if (!isMounted) return;
        setQueue(loadedQueue);
      } catch (err) {
        console.error('Failed to initialize SQLite data in KaraokeContext:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const findSongByNumber = (num: string) => {
    return songs.find((s) => s.song_number === num);
  };

  const playSongNow = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const addToQueue = async (song: Song) => {
    // Optimistic UI update for instantaneous responsiveness
    const tempId = `temp_${Date.now()}`;
    const optimisticItem: QueueItem = {
      id: tempId,
      song_id: song.id,
      song,
      position: queue.length + 1,
      added_at: Date.now(),
    };
    setQueue((prev) => [...prev, optimisticItem]);

    try {
      await addToQueueService(song.id);
      const updated = await getQueue();
      setQueue(updated);
    } catch (err) {
      console.error('Failed to add song to persistent queue:', err);
      // Revert optimistic item
      setQueue((prev) => prev.filter((item) => item.id !== tempId));
    }
  };

  const removeFromQueue = async (queueItemId: string) => {
    const prevQueue = queue;
    // Optimistic deletion and recompacting
    setQueue((prev) => {
      const filtered = prev.filter((item) => item.id !== queueItemId);
      return filtered.map((item, idx) => ({ ...item, position: idx + 1 }));
    });

    try {
      await removeFromQueueService(queueItemId);
      const updated = await getQueue();
      setQueue(updated);
    } catch (err) {
      console.error('Failed to remove item from persistent queue:', err);
      setQueue(prevQueue);
    }
  };

  const moveQueueItem = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= queue.length || fromIndex === toIndex) return;
    const prevQueue = queue;

    // Optimistic reorder
    const updated = [...queue];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setQueue(updated.map((item, idx) => ({ ...item, position: idx + 1 })));

    try {
      const saved = await moveQueueItemService(fromIndex, toIndex);
      setQueue(saved);
    } catch (err) {
      console.error('Failed to persist move queue item in SQLite:', err);
      setQueue(prevQueue);
    }
  };

  const clearQueue = async () => {
    const prevQueue = queue;
    setQueue([]);
    try {
      await clearQueueService();
    } catch (err) {
      console.error('Failed to clear persistent queue in SQLite:', err);
      setQueue(prevQueue);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipNext = async () => {
    try {
      const nextItem = await popNextQueueItem();
      if (nextItem) {
        setCurrentSong(nextItem.song);
        setIsPlaying(true);
        const remaining = await getQueue();
        setQueue(remaining);
      } else {
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Failed to skip to next song in SQLite queue:', err);
      // Fallback to in-memory pop if database error occurs
      if (queue.length > 0) {
        const fallbackNext = queue[0];
        setCurrentSong(fallbackNext.song);
        setIsPlaying(true);
        setQueue((prev) => prev.slice(1).map((item, idx) => ({ ...item, position: idx + 1 })));
      } else {
        setIsPlaying(false);
      }
    }
  };

  const toggleFavorite = async (songId: string) => {
    // Optimistic UI update for immediate visual feedback
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, is_favorite: !s.is_favorite } : s))
    );

    try {
      const isNowFavorite = await toggleFavoriteSong(songId);
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, is_favorite: isNowFavorite } : s))
      );
    } catch (err) {
      console.error('Failed to toggle favorite in SQLite:', err);
      // Revert on failure
      setSongs((prev) =>
        prev.map((s) => (s.id === songId ? { ...s, is_favorite: !s.is_favorite } : s))
      );
    }
  };

  const addSong = async (input: CreateSongInput): Promise<Song> => {
    const created = await insertSong(input);
    await reloadSongs();
    return created;
  };

  const removeSong = async (songId: string): Promise<boolean> => {
    const songToDelete = songs.find((s) => s.id === songId);
    const mediaPath = songToDelete?.media_path;

    const success = await deleteSongService(songId);
    if (success) {
      if (mediaPath) {
        await deleteMediaFile(mediaPath);
      }
      await reloadSongs();
      // Recompact queue in case this song was in the queue (cascaded by SQLite)
      await recompactQueuePositions();
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      if (currentSong?.id === songId) {
        setCurrentSong(null);
      }
    }
    return success;
  };

  return (
    <KaraokeContext.Provider
      value={{
        songs,
        isLoading,
        queue,
        currentSong,
        isPlaying,
        playSongNow,
        addToQueue,
        removeFromQueue,
        moveQueueItem,
        clearQueue,
        togglePlayPause,
        skipNext,
        toggleFavorite,
        findSongByNumber,
        reloadSongs,
        reloadQueue,
        addSong,
        removeSong,
      }}>
      {children}
    </KaraokeContext.Provider>
  );
}

export function useKaraoke() {
  const context = useContext(KaraokeContext);
  if (!context) {
    throw new Error('useKaraoke must be used within a KaraokeProvider');
  }
  return context;
}
