import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { Song } from '@/types/song';

interface PlayerControlsProps {
  currentSong: Song | null;
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  bufferedSeconds?: number;
  isFullscreen: boolean;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onToggleFullscreen: () => void;
  onSeek?: (seconds: number) => void;
  onRewind?: () => void;
  onFastForward?: () => void;
}

export default function PlayerControls({
  currentSong,
  isPlaying,
  positionSeconds,
  durationSeconds,
  bufferedSeconds = 0,
  isFullscreen,
  onTogglePlayPause,
  onSkipNext,
  onToggleFullscreen,
  onSeek,
  onRewind,
  onFastForward,
}: PlayerControlsProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubPosition, setScrubPosition] = useState<number | null>(null);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.floor(Math.max(0, totalSeconds) % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activeSeconds = scrubPosition !== null ? scrubPosition : positionSeconds;

  const progressPercent =
    durationSeconds > 0
      ? Math.min(100, Math.max(0, (activeSeconds / durationSeconds) * 100))
      : 0;

  const bufferedPercent =
    durationSeconds > 0 && bufferedSeconds > 0
      ? Math.min(100, Math.max(0, (bufferedSeconds / durationSeconds) * 100))
      : 0;

  const calculatePositionFromX = (locationX: number) => {
    if (trackWidth <= 0 || durationSeconds <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    return Math.round(ratio * durationSeconds);
  };

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

          {/* Karaoke Mic FX indicator */}
          <View style={styles.micStatusBadge}>
            <Ionicons name="mic" size={14} color={Colors.dark.accent} />
            <Text style={styles.micStatusText}>ECHO ON</Text>
          </View>
        </View>
      )}

      {/* Interactive Progress Bar & Scrubber */}
      <View style={styles.progressContainer}>
        {/* Scrubbing Preview Tooltip */}
        {isScrubbing && (
          <View
            style={[
              styles.scrubTooltip,
              {
                left: `${progressPercent}%`,
                transform: [{ translateX: -22 }],
              },
            ]}>
            <Text style={styles.scrubTooltipText}>{formatTime(activeSeconds)}</Text>
          </View>
        )}

        {/* Touch Hit Area */}
        <View
          style={styles.scrubHitArea}
          onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            setIsScrubbing(true);
            const pos = calculatePositionFromX(e.nativeEvent.locationX);
            setScrubPosition(pos);
          }}
          onResponderMove={(e) => {
            const pos = calculatePositionFromX(e.nativeEvent.locationX);
            setScrubPosition(pos);
          }}
          onResponderRelease={(e) => {
            const pos = calculatePositionFromX(e.nativeEvent.locationX);
            setIsScrubbing(false);
            setScrubPosition(null);
            onSeek?.(pos);
          }}
          onResponderTerminate={() => {
            setIsScrubbing(false);
            setScrubPosition(null);
          }}>
          {/* Background Track */}
          <View style={styles.trackBackground}>
            {/* Buffered Progress */}
            {bufferedPercent > 0 && (
              <View style={[styles.trackBuffered, { width: `${bufferedPercent}%` }]} />
            )}
            {/* Played Progress */}
            <View style={[styles.trackProgress, { width: `${progressPercent}%` }]} />
          </View>

          {/* Scrubber Knob Thumb */}
          <View
            style={[
              styles.scrubThumb,
              {
                left: `${progressPercent}%`,
                transform: [
                  { translateX: -8 },
                  { scale: isScrubbing ? 1.25 : 1 },
                ],
              },
            ]}
          />
        </View>

        {/* Time Tracking Row */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(activeSeconds)}</Text>
          <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
        </View>
      </View>

      {/* Control Buttons Row */}
      <View style={styles.buttonsRow}>
        {/* Fullscreen Toggle */}
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onToggleFullscreen}
            activeOpacity={0.7}
            accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            <Ionicons
              name={isFullscreen ? 'contract-outline' : 'expand-outline'}
              size={20}
              color={Colors.dark.text}
            />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>{isFullscreen ? 'NORM' : 'FULL'}</Text>
        </View>

        {/* Rewind 10s */}
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onRewind}
            activeOpacity={0.7}
            accessibilityLabel="Rewind 10 seconds">
            <Ionicons name="play-back" size={20} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>-10s</Text>
        </View>

        {/* Play/Pause Main Button */}
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={styles.mainPlayBtn}
            onPress={onTogglePlayPause}
            activeOpacity={0.8}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={32}
              color="#FFFFFF"
              style={{ marginLeft: isPlaying ? 0 : 3 }}
            />
          </TouchableOpacity>
          <Text style={[styles.buttonLabel, { color: isPlaying ? Colors.dark.playGreen : Colors.dark.accent }]}>
            {isPlaying ? 'PLAYING' : 'PAUSED'}
          </Text>
        </View>

        {/* Fast Forward 10s */}
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onFastForward}
            activeOpacity={0.7}
            accessibilityLabel="Fast forward 10 seconds">
            <Ionicons name="play-forward" size={20} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>+10s</Text>
        </View>

        {/* Next / Skip Track */}
        <View style={styles.buttonCol}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSkipNext}
            activeOpacity={0.7}
            accessibilityLabel="Skip to next song">
            <Ionicons name="play-skip-forward" size={20} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>NEXT</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 13,
    fontFamily: 'monospace',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '800',
  },
  artist: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  micStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.dark.accent,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  micStatusText: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  scrubTooltip: {
    position: 'absolute',
    top: -26,
    backgroundColor: '#0F172A',
    borderColor: Colors.dark.accent,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 10,
  },
  scrubTooltipText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  scrubHitArea: {
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBuffered: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  trackProgress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Colors.dark.accent,
  },
  scrubThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.dark.accent,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  buttonCol: {
    alignItems: 'center',
    gap: 4,
  },
  buttonLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
