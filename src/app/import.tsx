import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';

export default function ImportScreen() {
  const { findSongByNumber, addSong } = useKaraoke();

  const [selectedFileName, setSelectedFileName] = useState<string>('sweet_caroline_karaoke.mp4');
  const [songNumber, setSongNumber] = useState<string>('0999');
  const [title, setTitle] = useState<string>('Sweet Caroline');
  const [artist, setArtist] = useState<string>('Neil Diamond');

  const handleSimulateFilePicker = () => {
    // In Phase 3, this invokes expo-document-picker.
    // For Phase 1 prototype, it simulates choosing a sample file and auto-parsing metadata.
    Alert.alert(
      'Local File Selected',
      'Selected: "9911 - Don\'t Stop Believin\' - Journey.mp4"\nAuto-filling metadata...',
      [
        {
          text: 'Apply',
          onPress: () => {
            setSelectedFileName("9911 - Don't Stop Believin' - Journey.mp4");
            setSongNumber('9911');
            setTitle("Don't Stop Believin'");
            setArtist('Journey');
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!songNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a song number.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a song title.');
      return;
    }

    // Check duplicate
    const existing = findSongByNumber(songNumber.trim());
    if (existing) {
      Alert.alert(
        'Duplicate Song Number',
        `Song number #${songNumber} is already used by "${existing.title}". Please choose a different number.`
      );
      return;
    }

    try {
      const created = await addSong({
        song_number: songNumber.trim(),
        title: title.trim(),
        artist: artist.trim() || 'Unknown Artist',
        media_path: `local://${selectedFileName}`,
        duration_seconds: 210,
        is_favorite: false,
      });

      Alert.alert('Success', `Imported "${created.title}" as #${created.song_number}!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import song.';
      Alert.alert('Error', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* File Picker Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOCAL VIDEO FILE</Text>
        <TouchableOpacity
          style={styles.pickerBox}
          onPress={handleSimulateFilePicker}
          activeOpacity={0.7}>
          <Ionicons name="film-outline" size={32} color={Colors.dark.accent} />
          <View style={styles.pickerDetails}>
            <Text style={styles.fileName}>{selectedFileName}</Text>
            <Text style={styles.fileHint}>Tap to change or select from device storage</Text>
          </View>
          <Ionicons name="folder-open-outline" size={20} color={Colors.dark.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.formatNote}>
          Supported formats for offline playback: MP4 (H.264 video, AAC audio)
        </Text>
      </View>

      {/* Metadata Inputs */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SONG NUMBER (REQUIRED)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="keypad-outline" size={20} color={Colors.dark.accent} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. 0012 (leading zeros are preserved)"
            placeholderTextColor={Colors.dark.textSecondary}
            value={songNumber}
            onChangeText={setSongNumber}
            keyboardType="number-pad"
          />
        </View>
        <Text style={styles.inputHelp}>
          This is the number singers type on the keypad to start this song.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SONG TITLE (REQUIRED)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="musical-notes-outline" size={20} color={Colors.dark.accent} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Bohemian Rhapsody"
            placeholderTextColor={Colors.dark.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ARTIST (OPTIONAL)</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={Colors.dark.accent} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Queen"
            placeholderTextColor={Colors.dark.textSecondary}
            value={artist}
            onChangeText={setArtist}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save to Library</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.dark.accent,
    padding: 14,
    gap: 12,
  },
  pickerDetails: {
    flex: 1,
  },
  fileName: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  fileHint: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  formatNote: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 6,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    height: '100%',
  },
  inputHelp: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundElement,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cancelBtnText: {
    color: Colors.dark.textSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.dark.playGreen,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.dark.playGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
