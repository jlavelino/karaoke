export interface Song {
  id: string;
  song_number: string; // Preserves leading zeros (e.g., "0012")
  title: string;
  artist?: string | null;
  media_path: string;
  duration_seconds?: number | null;
  created_at: number;
  updated_at: number;
  is_favorite?: boolean;
}

export interface QueueItem {
  id: string;
  song_id: string;
  song: Song;
  position: number;
  added_at: number;
}

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  positionMillis: number;
  durationMillis: number;
  isFullscreen: boolean;
}
