import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QueueItem, Song } from '@/types/song';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

interface SongQueueProps {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: QueueItem[];
  onPlayNow: (song: Song) => void;
  onRemove: (queueItemId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onClearQueue: () => void;
  onSkipNext: () => void;
}

export default function SongQueue({
  currentSong,
  isPlaying,
  queue,
  onPlayNow,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClearQueue,
  onSkipNext,
}: SongQueueProps) {
  const confirmClearQueue = () => {
    Alert.alert(
      'Clear Queue',
      'Are you sure you want to remove all songs from the queue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearQueue },
      ]
    );
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === queue.length - 1;

    return (
      <View style={styles.queueCard}>
        {/* Position Number */}
        <View style={styles.positionBox}>
          <Text style={styles.positionText}>#{item.position}</Text>
        </View>

        {/* Song Details */}
        <View style={styles.songDetails}>
          <View style={styles.numberRow}>
            <Text style={styles.songNumberText}>{item.song.song_number}</Text>
          </View>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.song.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.song.artist || 'Unknown Artist'}
          </Text>
        </View>

        {/* Reordering and Controls */}
        <View style={styles.reorderControls}>
          <TouchableOpacity
            style={[styles.arrowBtn, isFirst && styles.disabledArrow]}
            onPress={() => onMoveUp(index)}
            disabled={isFirst}>
            <Ionicons
              name="chevron-up"
              size={18}
              color={isFirst ? '#475569' : Colors.dark.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.arrowBtn, isLast && styles.disabledArrow]}
            onPress={() => onMoveDown(index)}
            disabled={isLast}>
            <Ionicons
              name="chevron-down"
              size={18}
              color={isLast ? '#475569' : Colors.dark.text}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.playNowSmallBtn}
            onPress={() => {
              onPlayNow(item.song);
              router.push('/(tabs)/player');
            }}>
            <Ionicons name="play" size={14} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(item.id)}>
            <Ionicons name="trash-outline" size={16} color={Colors.dark.dangerRed} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Currently Playing Card */}
      {currentSong && (
        <View style={styles.nowPlayingBox}>
          <View style={styles.nowPlayingHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.nowPlayingLabel}>NOW SINGING</Text>
            </View>
            <TouchableOpacity
              style={styles.goToPlayerBtn}
              onPress={() => router.push('/(tabs)/player')}>
              <Text style={styles.goToPlayerText}>View Player</Text>
              <Ionicons name="arrow-forward" size={12} color={Colors.dark.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.nowPlayingBody}>
            <View style={styles.nowPlayingBadge}>
              <Text style={styles.nowPlayingBadgeText}>{currentSong.song_number}</Text>
            </View>
            <View style={styles.nowPlayingInfo}>
              <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                {currentSong.title}
              </Text>
              <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                {currentSong.artist || 'Unknown Artist'}
              </Text>
            </View>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkipNext}>
              <Ionicons name="play-skip-forward" size={18} color="#FFFFFF" />
              <Text style={styles.skipBtnText}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Queue Header */}
      <View style={styles.queueHeaderRow}>
        <Text style={styles.sectionTitle}>
          Up Next ({queue.length})
        </Text>
        {queue.length > 0 && (
          <TouchableOpacity onPress={confirmClearQueue} style={styles.clearAllBtn}>
            <Ionicons name="trash-bin-outline" size={14} color={Colors.dark.dangerRed} />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Queue List / Empty State */}
      {queue.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="musical-notes-outline" size={48} color={Colors.dark.textSecondary} />
          <Text style={styles.emptyTitle}>Queue is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Add songs using the Keypad or browse the Songbook to keep the party singing!
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(tabs)/songbook')}>
            <Ionicons name="book" size={16} color="#FFFFFF" />
            <Text style={styles.browseBtnText}>Browse Songbook</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={renderQueueItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nowPlayingBox: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.dark.accent,
    padding: 14,
    marginBottom: 16,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.playGreen,
  },
  nowPlayingLabel: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  goToPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goToPlayerText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  nowPlayingBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowPlayingBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  nowPlayingBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
  },
  nowPlayingArtist: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSelected,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  skipBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  clearAllText: {
    color: Colors.dark.dangerRed,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  positionBox: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    color: Colors.dark.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  songDetails: {
    flex: 1,
    marginLeft: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songNumberText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  songTitle: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  songArtist: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  reorderControls: {
    flexDirection: 'column',
    gap: 2,
    marginRight: 6,
  },
  arrowBtn: {
    padding: 3,
  },
  disabledArrow: {
    opacity: 0.25,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playNowSmallBtn: {
    backgroundColor: Colors.dark.playGreen,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.queueBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
    gap: 8,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
