import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent, useEventListener } from 'expo';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';
import PlayerControls from '@/components/PlayerControls';
import { resolveMediaUri, checkMediaFileExists } from '@/platform/mediaStorage';

export default function PlayerScreen() {
  const { currentSong, isPlaying, togglePlayPause, skipNext, queue } = useKaraoke();
  const [positionSeconds, setPositionSeconds] = useState(0);
  const [bufferedSeconds, setBufferedSeconds] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileExists, setFileExists] = useState<boolean | null>(null);

  // Check if current song uses mock storage protocol or has a physical video
  const isMockSong = !currentSong || currentSong.media_path.startsWith('local://');
  const videoSource = !isMockSong ? resolveMediaUri(currentSong.media_path) : null;

  // Initialize native expo-video player
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 1.0;
    if (videoSource && isPlaying) {
      p.play();
    }
  });

  const playerStatus = useEvent(player, 'statusChange', { status: player.status });

  // Verify file existence on device asynchronously for non-mock tracks
  useEffect(() => {
    let isMounted = true;
    const path = currentSong?.media_path;

    if (!path || path.startsWith('local://')) {
      Promise.resolve().then(() => {
        if (isMounted) setFileExists(false);
      });
      return () => {
        isMounted = false;
      };
    }

    checkMediaFileExists(path)
      .then((exists) => {
        if (isMounted) setFileExists(exists);
      })
      .catch(() => {
        if (isMounted) setFileExists(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSong?.media_path]);

  // Reset progress, buffering, and duration when song changes
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setPositionSeconds(0);
      setBufferedSeconds(0);
      setVideoDuration(null);
    });
    return () => cancelAnimationFrame(handle);
  }, [currentSong?.id]);

  // Sync play/pause state from KaraokeContext to native player
  useEffect(() => {
    if (!player || !videoSource) return;
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, isPlaying, videoSource]);

  // Listen to time updates and buffering from native video player
  useEventListener(player, 'timeUpdate', ({ currentTime, bufferedPosition }) => {
    if (videoSource) {
      setPositionSeconds(Math.floor(currentTime));
      if (bufferedPosition !== undefined && bufferedPosition >= 0) {
        setBufferedSeconds(Math.floor(bufferedPosition));
      }
    }
  });

  // Extract true container duration once video source metadata loads
  useEventListener(player, 'sourceLoad', () => {
    if (player.duration > 0) {
      setVideoDuration(Math.round(player.duration));
    }
  });

  // Auto-advance when video naturally finishes
  useEventListener(player, 'playToEnd', () => {
    skipNext();
  });

  const duration = videoDuration || currentSong?.duration_seconds || 240;

  // Seeking handlers supporting both native video and mock catalog tracks
  const handleSeek = (targetSeconds: number) => {
    const clamped = Math.max(0, Math.min(targetSeconds, duration));
    setPositionSeconds(clamped);
    if (videoSource && player) {
      if (clamped === 0) {
        player.replay();
      } else {
        // eslint-disable-next-line react-hooks/immutability -- expo-video VideoPlayer uses property setter for frame-accurate seeking
        player.currentTime = clamped;
      }
    }
  };

  const handleRewind = () => {
    const target = Math.max(0, positionSeconds - 10);
    setPositionSeconds(target);
    if (videoSource && player) {
      player.seekBy(-10);
    }
  };

  const handleFastForward = () => {
    const target = Math.min(duration, positionSeconds + 10);
    setPositionSeconds(target);
    if (videoSource && player) {
      player.seekBy(10);
    }
  };

  // Simulated playback time increment for mock/sample catalog songs
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && currentSong && !videoSource) {
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
  }, [isPlaying, currentSong, videoSource, skipNext]);

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

  const isVideoMissing = !isMockSong && fileExists === false;
  const isVideoError = playerStatus?.status === 'error';
  const showRetroStage = isMockSong || isVideoMissing || isVideoError;
  const canRenderNativeVideo = Boolean(videoSource && !isVideoMissing && !isVideoError);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
        {/* Video Canvas / Karaoke Display */}
        <View style={[styles.videoCanvas, isFullscreen && styles.fullscreenVideoCanvas]}>
          {/* Native Video Surface */}
          {canRenderNativeVideo && (
            <VideoView
              style={StyleSheet.absoluteFill}
              player={player}
              nativeControls={false}
              contentFit="contain"
            />
          )}

          {/* Buffering/Loading Indicator */}
          {canRenderNativeVideo && playerStatus?.status === 'loading' && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.dark.accent} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}

          {/* Top Stage Bar HUD */}
          <View style={styles.stageTopBar} pointerEvents="box-none">
            <View style={styles.videokeBadge}>
              <Text style={styles.videokeBadgeText}>NUMBERKANTA STEREO</Text>
            </View>

            {/* Media Mode Badge */}
            <View
              style={[
                styles.mediaTypeBadge,
                canRenderNativeVideo ? styles.mediaTypeBadgeMp4 : styles.mediaTypeBadgeMock,
              ]}>
              <Ionicons
                name={canRenderNativeVideo ? 'videocam' : 'disc'}
                size={12}
                color={canRenderNativeVideo ? Colors.dark.playGreen : Colors.dark.accent}
              />
              <Text
                style={[
                  styles.mediaTypeBadgeText,
                  canRenderNativeVideo ? styles.mediaTypeBadgeTextMp4 : styles.mediaTypeBadgeTextMock,
                ]}>
                {canRenderNativeVideo ? 'LOCAL MP4' : 'SAMPLE TRACK'}
              </Text>
            </View>

            <View style={styles.songNumberDisplay}>
              <Text style={styles.songNumberDisplayText}>#{currentSong.song_number}</Text>
            </View>
          </View>

          {/* Center Stage: Title, Mock Lyrics & Status (Only shown for mock or unavailable tracks) */}
          {showRetroStage && (
            <View style={styles.lyricStage}>
              {isVideoMissing && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                  <Text style={styles.warningBannerText}>
                    Video file missing from storage. Playing mock stage.
                  </Text>
                </View>
              )}

              {isVideoError && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.errorBannerText}>
                    Video decode error. Playing mock stage.
                  </Text>
                </View>
              )}

              <Text style={styles.stageTitle}>{currentSong.title}</Text>
              <Text style={styles.stageArtist}>{currentSong.artist || 'Unknown Artist'}</Text>

              <View style={styles.lyricBox}>
                <Text style={styles.lyricLinePast}>{"♪ I've lived a life that's full ♪"}</Text>
                <Text style={styles.lyricLineActive}>
                  ★ I TRAVELED EACH AND EVERY HIGHWAY ★
                </Text>
                <Text style={styles.lyricLineFuture}>And more, much more than this...</Text>
              </View>

              <View style={styles.bouncingBallRow}>
                <View
                  style={[
                    styles.bouncingBall,
                    { transform: [{ scale: isPlaying ? 1.2 : 1 }] },
                  ]}
                />
                <Text style={styles.singAlongPrompt}>
                  {isPlaying ? 'SING WITH THE MUSIC!' : 'PAUSED'}
                </Text>
              </View>
            </View>
          )}

          {/* Bottom Stage Info HUD */}
          <View style={styles.stageBottomBar} pointerEvents="box-none">
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
          bufferedSeconds={bufferedSeconds}
          isFullscreen={isFullscreen}
          onTogglePlayPause={togglePlayPause}
          onSkipNext={skipNext}
          onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
          onSeek={handleSeek}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
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
    backgroundColor: 'rgba(7, 13, 27, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    zIndex: 10,
  },
  videokeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  videokeBadgeText: {
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  mediaTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  mediaTypeBadgeMp4: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.dark.playGreen,
  },
  mediaTypeBadgeMock: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.dark.accent,
  },
  mediaTypeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mediaTypeBadgeTextMp4: {
    color: Colors.dark.playGreen,
  },
  mediaTypeBadgeTextMock: {
    color: Colors.dark.accent,
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
    fontSize: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 13, 27, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
    gap: 10,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    gap: 6,
  },
  warningBannerText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    gap: 6,
  },
  errorBannerText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '600',
  },
  lyricStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 5,
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
    backgroundColor: 'rgba(7, 13, 27, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 10,
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

