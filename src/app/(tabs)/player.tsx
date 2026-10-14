import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';
import PlayerControls from '@/components/PlayerControls';

export default function PlayerScreen() {
  const { currentSong, isPlaying, togglePlayPause, skipNext, queue } = useKaraoke();
  const [positionSeconds, setPositionSeconds] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset position when song changes
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setPositionSeconds(15);
    });
    return () => cancelAnimationFrame(handle);
  }, [currentSong?.id]);

  // Simulated playback time increment
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setPositionSeconds((prev) => {
          const max = currentSong.duration_seconds || 240;
          if (prev >= max) {
            skipNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSong, skipNext]);

  const duration = currentSong?.duration_seconds || 240;

  if (!currentSong) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.noSongContainer}>
          <Ionicons name="musical-notes-outline" size={54} color={Colors.dark.textSecondary} />
          <Text style={styles.noSongTitle}>No Song Selected</Text>
          <Text style={styles.noSongSubtitle}>
            Enter a number on the Keypad or pick a song from the Songbook to start singing!
          </Text>
          <TouchableOpacity
            style={styles.goToKeypadBtn}
            onPress={() => router.push('/(tabs)')}>
            <Ionicons name="keypad" size={16} color="#FFFFFF" />
            <Text style={styles.goToKeypadText}>Go to Keypad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        {/* Video Canvas / Karaoke Display Mockup */}
        <View style={[styles.videoCanvas, isFullscreen && styles.fullscreenVideoCanvas]}>
          {/* Top Stage Bar */}
          <View style={styles.stageTopBar}>
            <View style={styles.videokeBadge}>
              <Text style={styles.videokeBadgeText}>NUMBERKANTA STEREO</Text>
            </View>
            <View style={styles.songNumberDisplay}>
              <Text style={styles.songNumberDisplayText}>#{currentSong.song_number}</Text>
            </View>
          </View>

          {/* Center Stage: Title & Lyric Mockup */}
          <View style={styles.lyricStage}>
            <Text style={styles.stageTitle}>{currentSong.title}</Text>
            <Text style={styles.stageArtist}>{currentSong.artist}</Text>

            <View style={styles.lyricBox}>
              <Text style={styles.lyricLinePast}>{"♪ I've lived a life that's full ♪"}</Text>
              <Text style={styles.lyricLineActive}>
                ★ I TRAVELED EACH AND EVERY HIGHWAY ★
              </Text>
              <Text style={styles.lyricLineFuture}>And more, much more than this...</Text>
            </View>

            <View style={styles.bouncingBallRow}>
              <View style={[styles.bouncingBall, { transform: [{ scale: isPlaying ? 1.2 : 1 }] }]} />
              <Text style={styles.singAlongPrompt}>
                {isPlaying ? 'SING WITH THE MUSIC!' : 'PAUSED'}
              </Text>
            </View>
          </View>

          {/* Bottom Stage Info */}
          <View style={styles.stageBottomBar}>
            <Text style={styles.nextUpInfo}>
              {queue.length > 0
                ? `NEXT: #${queue[0].song.song_number} ${queue[0].song.title}`
                : 'QUEUE EMPTY — ADD MORE SONGS'}
            </Text>
          </View>
        </View>

        {/* Player Controls Panel */}
        <PlayerControls
          currentSong={currentSong}
          isPlaying={isPlaying}
          positionSeconds={positionSeconds}
          durationSeconds={duration}
          isFullscreen={isFullscreen}
          onTogglePlayPause={togglePlayPause}
          onSkipNext={skipNext}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: '#000000',
  },
  videoCanvas: {
    flex: 1,
    backgroundColor: '#070D1B',
    margin: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1E293B',
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: 16,
  },
  fullscreenVideoCanvas: {
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  stageTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videokeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  videokeBadgeText: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  songNumberDisplay: {
    backgroundColor: Colors.dark.ledBackground,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  songNumberDisplayText: {
    color: Colors.dark.ledText,
    fontFamily: 'monospace',
    fontWeight: '800',
    fontSize: 13,
  },
  lyricStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  stageTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  stageArtist: {
    color: Colors.dark.accent,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  lyricBox: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  lyricLinePast: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  lyricLineActive: {
    color: '#38BDF8',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  lyricLineFuture: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  bouncingBallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  bouncingBall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  singAlongPrompt: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  stageBottomBar: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  nextUpInfo: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  noSongContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noSongTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
  },
  noSongSubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  goToKeypadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.playGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  goToKeypadText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
