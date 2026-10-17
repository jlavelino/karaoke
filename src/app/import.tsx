import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';
import { parseFilenameMetadata, importVideoFile } from '@/services/mediaImportService';

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) {
    return `(${(bytes / 1024).toFixed(1)} KB)`;
  }
  return `(${(bytes / (1024 * 1024)).toFixed(1)} MB)`;
}

export default function ImportScreen() {
  const { findSongByNumber, reloadSongs } = useKaraoke();

  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  } | null>(null);

  const [songNumber, setSongNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handlePickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*', 'video/mp4', 'video/m4v', 'video/mkv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size,
        mimeType: asset.mimeType,
      });

      // Auto-extract metadata from the filename
      const parsed = parseFilenameMetadata(asset.name);
      if (parsed.suggestedNumber && !songNumber) {
        setSongNumber(parsed.suggestedNumber);
      }
      if (parsed.suggestedTitle) {
        setTitle(parsed.suggestedTitle);
      }
      if (parsed.suggestedArtist) {
        setArtist(parsed.suggestedArtist);
      }
    } catch (err: unknown) {
      console.error('File pick error:', err);
      Alert.alert(
        'File Picker Error',
        'Could not open the system file picker. Please verify permissions and try again.'
      );
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      Alert.alert('No Video Selected', 'Please tap the file box to pick a local video file.');
      return;
    }
    if (!songNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a song number.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a song title.');
      return;
    }

    const trimmedNumber = songNumber.trim();

    // Check duplicate song number
    const existing = findSongByNumber(trimmedNumber);
    if (existing) {
      Alert.alert(
        'Duplicate Song Number',
        `Song number #${trimmedNumber} is already used by "${existing.title}". Please choose a different number.`
      );
      return;
    }

    try {
      setIsImporting(true);

      const created = await importVideoFile({
        sourceUri: selectedFile.uri,
        originalFilename: selectedFile.name,
        songNumber: trimmedNumber,
        title: title.trim(),
        artist: artist.trim() || undefined,
        fileSizeBytes: selectedFile.size,
      });

      // Refresh the context library so the new song is immediately searchable
      await reloadSongs();

      Alert.alert('Success', `Imported "${created.title}" as #${created.song_number}!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import song.';
      Alert.alert('Import Failed', message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* File Picker Section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LOCAL VIDEO FILE</Text>
        <TouchableOpacity
          style={styles.pickerBox}
          onPress={handlePickVideo}
          activeOpacity={0.7}
          disabled={isImporting}>
          <Ionicons name="film-outline" size={32} color={Colors.dark.accent} />
          <View style={styles.pickerDetails}>
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
              {selectedFile ? selectedFile.name : 'Choose a Video File'}
            </Text>
            <Text style={styles.fileHint}>
              {selectedFile
                ? `Selected ${formatFileSize(selectedFile.size)} • Tap to change`
                : 'Tap to browse local device storage for MP4 video'}
            </Text>
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
            editable={!isImporting}
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
            editable={!isImporting}
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
            editable={!isImporting}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={isImporting}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, (!selectedFile || isImporting) && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={!selectedFile || isImporting}>
          {isImporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.saveBtnText}>
            {isImporting ? 'Saving to Storage...' : 'Save to Library'}
          </Text>
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
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
