import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';
import { router } from 'expo-router';

export default function NumberKeypad() {
  const [inputNumber, setInputNumber] = useState<string>('');
  const { findSongByNumber, playSongNow, addToQueue } = useKaraoke();
  const { width } = useWindowDimensions();

  const isTablet = width >= 600;
  const matchedSong = inputNumber ? findSongByNumber(inputNumber) : undefined;

  const handlePressDigit = (digit: string) => {
    if (inputNumber.length < 6) {
      setInputNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputNumber('');
  };

  const handlePlayNow = () => {
    if (matchedSong) {
      playSongNow(matchedSong);
      setInputNumber('');
      router.push('/(tabs)/player');
    }
  };

  const handleAddToQueue = () => {
    if (matchedSong) {
      addToQueue(matchedSong);
      Alert.alert('Added to Queue', `"${matchedSong.title}" is in the queue!`);
      setInputNumber('');
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', '⌫'];

  return (
    <View style={[styles.container, isTablet && styles.containerTablet]}>
      {/* LED Digital Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayLabel}>ENTER SONG NUMBER</Text>
        <View style={styles.ledBox}>
          <Text style={styles.ledText}>
            {inputNumber || '____'}
          </Text>
          {inputNumber.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBadge}>
              <Ionicons name="close-circle" size={20} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Song Preview Card or Not Found notice */}
      <View style={styles.previewArea}>
        {matchedSong ? (
          <View style={styles.songCard}>
            <View style={styles.songNumberBadge}>
              <Text style={styles.songNumberBadgeText}>{matchedSong.song_number}</Text>
            </View>
            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={1}>
                {matchedSong.title}
              </Text>
              <Text style={styles.songArtist} numberOfLines={1}>
                {matchedSong.artist || 'Unknown Artist'}
              </Text>
            </View>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.playBtn]}
                onPress={handlePlayNow}
                activeOpacity={0.7}>
                <Ionicons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>PLAY</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.queueBtn]}
                onPress={handleAddToQueue}
                activeOpacity={0.7}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>QUEUE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : inputNumber.length >= 2 ? (
          <View style={styles.notFoundBox}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.dark.accent} />
            <Text style={styles.notFoundText}>No song found for #{inputNumber}</Text>
          </View>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Try numbers: <Text style={styles.highlight}>0001</Text>,{' '}
              <Text style={styles.highlight}>0012</Text>,{' '}
              <Text style={styles.highlight}>0340</Text>,{' '}
              <Text style={styles.highlight}>8888</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Large Touch Keypad Grid */}
      <View style={styles.grid}>
        {keys.map((k) => {
          const isClr = k === 'CLR';
          const isDel = k === '⌫';
          const isActionKey = isClr || isDel;

          return (
            <TouchableOpacity
              key={k}
              style={[
                styles.key,
                isActionKey && styles.actionKey,
                isClr && styles.clrKey,
                isTablet && styles.keyTablet,
              ]}
              onPress={() => {
                if (isClr) handleClear();
                else if (isDel) handleBackspace();
                else handlePressDigit(k);
              }}
              activeOpacity={0.6}>
              <Text
                style={[
                  styles.keyText,
                  isActionKey && styles.actionKeyText,
                  isTablet && styles.keyTextTablet,
                ]}>
                {k}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Jump to Songbook */}
      <TouchableOpacity
        style={styles.songbookShortcut}
        onPress={() => router.push('/(tabs)/songbook')}
        activeOpacity={0.7}>
        <Ionicons name="book-outline" size={18} color={Colors.dark.accent} />
        <Text style={styles.songbookShortcutText}>Open Digital Songbook</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.dark.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  containerTablet: {
    maxWidth: 550,
    alignSelf: 'center',
    width: '100%',
  },
  displayContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  displayLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 6,
  },
  ledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.ledBackground,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    minWidth: 220,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  ledText: {
    color: Colors.dark.ledText,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  clearBadge: {
    marginLeft: 10,
    padding: 4,
  },
  previewArea: {
    minHeight: 84,
    justifyContent: 'center',
    marginVertical: 8,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  songNumberBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  songNumberBadgeText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 13,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
  },
  songArtist: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  playBtn: {
    backgroundColor: Colors.dark.playGreen,
  },
  queueBtn: {
    backgroundColor: Colors.dark.queueBlue,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  notFoundBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  notFoundText: {
    color: '#F87171',
    fontWeight: '600',
    fontSize: 14,
  },
  hintBox: {
    alignItems: 'center',
    padding: 8,
  },
  hintText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  highlight: {
    color: Colors.dark.accent,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    width: '30%',
    aspectRatio: 1.35,
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  keyTablet: {
    aspectRatio: 1.5,
  },
  keyText: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '700',
  },
  keyTextTablet: {
    fontSize: 32,
  },
  actionKey: {
    backgroundColor: Colors.dark.backgroundSelected,
  },
  clrKey: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  actionKeyText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.accent,
  },
  songbookShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 8,
  },
  songbookShortcutText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '700',
  },
});
