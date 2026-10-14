import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '@/types/song';
import { Colors } from '@/constants/theme';

interface SongListItemProps {
  song: Song;
  onPlayNow: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onToggleFavorite?: (songId: string) => void;
}

export default function SongListItem({
  song,
  onPlayNow,
  onAddToQueue,
  onToggleFavorite,
}: SongListItemProps) {
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.card}>
      {/* Golden Videoke Song Number Badge */}
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{song.song_number}</Text>
      </View>

      {/* Song Metadata */}
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {song.title}
        </Text>
        <View style={styles.subInfo}>
          <Text style={styles.artist} numberOfLines={1}>
            {song.artist || 'Unknown Artist'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.duration}>{formatDuration(song.duration_seconds)}</Text>
        </View>
      </View>

      {/* Favorite Toggle */}
      {onToggleFavorite && (
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => onToggleFavorite(song.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons
            name={song.is_favorite ? 'heart' : 'heart-outline'}
            size={22}
            color={song.is_favorite ? '#EF4444' : Colors.dark.textSecondary}
          />
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.queueBtn]}
          onPress={() => onAddToQueue(song)}
          activeOpacity={0.7}>
          <Ionicons name="add" size={16} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.playBtn]}
          onPress={() => onPlayNow(song)}
          activeOpacity={0.7}>
          <Ionicons name="play" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  numberBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  artist: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  dot: {
    color: Colors.dark.textSecondary,
    marginHorizontal: 6,
    fontSize: 10,
  },
  duration: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  favBtn: {
    padding: 6,
    marginRight: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueBtn: {
    backgroundColor: Colors.dark.queueBlue,
  },
  playBtn: {
    backgroundColor: Colors.dark.playGreen,
  },
});
