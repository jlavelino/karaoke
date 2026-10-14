import React, { createContext, useContext, useState } from 'react';
import { Song, QueueItem } from '@/types/song';
import { MOCK_SONGS, MOCK_QUEUE } from '@/data/mockSongs';

interface KaraokeContextType {
  songs: Song[];
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
  toggleFavorite: (songId: string) => void;
  findSongByNumber: (num: string) => Song | undefined;
}

const KaraokeContext = createContext<KaraokeContextType | undefined>(undefined);

export function KaraokeProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>(MOCK_SONGS);
  const [queue, setQueue] = useState<QueueItem[]>(MOCK_QUEUE);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

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

  const toggleFavorite = (songId: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, is_favorite: !s.is_favorite } : s))
    );
  };

  return (
    <KaraokeContext.Provider
      value={{
        songs,
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
