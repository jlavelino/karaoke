import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useKaraoke } from '@/context/KaraokeContext';
import SongQueue from '@/components/SongQueue';

export default function QueueScreen() {
  const {
    currentSong,
    isPlaying,
    queue,
    playSongNow,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    skipNext,
  } = useKaraoke();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SongQueue
          currentSong={currentSong}
          isPlaying={isPlaying}
          queue={queue}
          onPlayNow={playSongNow}
          onRemove={removeFromQueue}
          onMoveUp={(index) => moveQueueItem(index, index - 1)}
          onMoveDown={(index) => moveQueueItem(index, index + 1)}
          onClearQueue={clearQueue}
          onSkipNext={skipNext}
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
  },
});
