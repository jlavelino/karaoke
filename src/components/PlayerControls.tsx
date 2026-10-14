import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Song } from '@/types/song';

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onToggleFullscreen: () => void;
  onSeek?: (seconds: number) => void;
}

export default function PlayerControls({
  currentSong,
  isPlaying,
  positionSeconds,
  durationSeconds,
  isFullscreen,
  onTogglePlayPause,
  onSkipNext,
  onToggleFullscreen,
}: PlayerControlsProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressPercent =
    durationSeconds > 0
      ? Math.min(100, Math.max(0, (positionSeconds / durationSeconds) * 100))
      : 0;

  return (
    <View style={styles.container}>
      {/* Song Header Info */}
      {currentSong && (
        <View style={styles.headerInfo}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{currentSong.song_number}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artist || 'Unknown Artist'}
            </Text>
          </View>
        </View>
      )}

      {/* Progress Bar (Mock Scrubber) */}
      <View style={styles.progressContainer}>
        <View style={styles.trackBackground}>
          <View style={[styles.trackProgress, { width: `${progressPercent}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionSeconds)}</Text>
          <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
        </View>
      </View>

      {/* Control Buttons Row */}
      <View style={styles.buttonsRow}>
        {/* Fullscreen Toggle */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onToggleFullscreen}
          activeOpacity={0.7}>
          <Ionicons
            name={isFullscreen ? 'contract-outline' : 'expand-outline'}
            size={22}
            color={Colors.dark.text}
          />
        </TouchableOpacity>

        {/* Rewind 10s */}
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7}>
          <Ionicons name="play-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>

        {/* Play/Pause Main Button */}
        <TouchableOpacity
          style={styles.mainPlayBtn}
          onPress={onTogglePlayPause}
          activeOpacity={0.8}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={34}
            color="#FFFFFF"
            style={{ marginLeft: isPlaying ? 0 : 3 }}
          />
        </TouchableOpacity>

        {/* Next / Skip */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSkipNext}
          activeOpacity={0.7}>
          <Ionicons name="play-skip-forward" size={24} color={Colors.dark.text} />
        </TouchableOpacity>

        {/* Mic / Audio FX Mock */}
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.7}>
          <Ionicons name="mic-outline" size={22} color={Colors.dark.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  numberBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  numberText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
  },
  artist: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  progressContainer: {
    marginBottom: 12,
  },
  trackBackground: {
    height: 6,
    backgroundColor: Colors.dark.backgroundSelected,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackProgress: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  secondaryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundElement,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.playGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.dark.playGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
