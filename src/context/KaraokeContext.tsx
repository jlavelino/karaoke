import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Song, QueueItem } from '@/types/song';
import { MOCK_QUEUE } from '@/data/mockSongs';
import {
  getAllSongs,
  insertSong,
  deleteSong as deleteSongService,
  toggleFavoriteSong,
  CreateSongInput,
} from '@/services/songService';

interface KaraokeContextType {
  songs: Song[];
  isLoading: boolean;
  queue: QueueItem[];
  currentSong: Song | null;
  isPlaying: boolean;
  playSongNow: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (queueItemId: string) => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  toggleFavorite: (songId: string) => Promise<void>;
  findSongByNumber: (num: string) => Song | undefined;
  reloadSongs: () => Promise<void>;
  addSong: (input: CreateSongInput) => Promise<Song>;
  removeSong: (songId: string) => Promise<boolean>;
}

const KaraokeContext = createContext<KaraokeContextType | undefined>(undefined);

export function KaraokeProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [queue, setQueue] = useState<QueueItem[]>(MOCK_QUEUE);
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

  useEffect(() => {
    let isMounted = true;
    getAllSongs()
      .then((loaded) => {
        if (!isMounted) return;
        setSongs(loaded);
        setCurrentSong((prev) => prev ?? (loaded.length > 0 ? loaded[0] : null));
      })
      .catch((err) => {
        console.error('Failed to load initial songs from SQLite:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

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

  const addToQueue = (song: Song) => {
    const newItem: QueueItem = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      song_id: song.id,
      song,
      position: queue.length + 1,
      added_at: Date.now(),
    };
    setQueue((prev) => [...prev, newItem]);
  };

  const removeFromQueue = (queueItemId: string) => {
    setQueue((prev) => {
      const filtered = prev.filter((item) => item.id !== queueItemId);
      return filtered.map((item, idx) => ({ ...item, position: idx + 1 }));
    });
  };

  const moveQueueItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= queue.length) return;
    setQueue((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((item, idx) => ({ ...item, position: idx + 1 }));
    });
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const skipNext = () => {
    if (queue.length > 0) {
      const nextItem = queue[0];
      setCurrentSong(nextItem.song);
      setIsPlaying(true);
      setQueue((prev) => prev.slice(1).map((item, idx) => ({ ...item, position: idx + 1 })));
    } else {
      setIsPlaying(false);
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
    const success = await deleteSongService(songId);
    if (success) {
      await reloadSongs();
      setQueue((prev) => prev.filter((item) => item.song_id !== songId));
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
