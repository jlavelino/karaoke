import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import {
  ensureVideoDirectoryExists,
  getVideoDirectory,
  VIDEO_DIRECTORY_NAME,
  sanitizeFilename,
  getFreeStorageBytes,
  deleteMediaFile,
} from '../platform/mediaStorage';
import { insertSong, getSongByNumber } from './songService';
import { Song } from '../types/song';

export interface ParsedVideoMetadata {
  suggestedNumber: string;
  suggestedTitle: string;
  suggestedArtist: string;
}

export interface ImportVideoParams {
  sourceUri: string;
  originalFilename: string;
  songNumber: string;
  title: string;
  artist?: string;
  durationSeconds?: number | null;
  fileSizeBytes?: number;
}

/**
 * Parses song number, title, and artist suggestions from a standard videoke filename.
 * Examples:
 * - "0012 - Bohemian Rhapsody - Queen.mp4" -> { suggestedNumber: "0012", suggestedTitle: "Bohemian Rhapsody", suggestedArtist: "Queen" }
 * - "9911 - Don't Stop Believin'.mp4" -> { suggestedNumber: "9911", suggestedTitle: "Don't Stop Believin'", suggestedArtist: "" }
 * - "Neil Diamond - Sweet Caroline.mp4" -> { suggestedNumber: "", suggestedTitle: "Sweet Caroline", suggestedArtist: "Neil Diamond" }
 */
export function parseFilenameMetadata(filename: string): ParsedVideoMetadata {
  // Strip file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').trim();

  // Split on standard separators like " - "
  const parts = nameWithoutExt.split(/\s*-\s*/).map((p) => p.trim()).filter(Boolean);

  let suggestedNumber = '';
  let suggestedTitle = nameWithoutExt;
  let suggestedArtist = '';

  if (parts.length >= 3) {
    // Format: [Number] - [Title] - [Artist]
    if (/^\d+$/.test(parts[0])) {
      suggestedNumber = parts[0];
      suggestedTitle = parts[1];
      suggestedArtist = parts[2];
    } else {
      // Format: [Artist] - [Title] - [Extra]
      suggestedArtist = parts[0];
      suggestedTitle = parts[1];
    }
  } else if (parts.length === 2) {
    if (/^\d+$/.test(parts[0])) {
      // Format: [Number] - [Title]
      suggestedNumber = parts[0];
      suggestedTitle = parts[1];
    } else {
      // Format: [Artist] - [Title]
      suggestedArtist = parts[0];
      suggestedTitle = parts[1];
    }
  } else if (parts.length === 1) {
    suggestedTitle = parts[0];
  }

  return {
    suggestedNumber,
    suggestedTitle,
    suggestedArtist,
  };
}

/**
 * Imports a picked video file into app-managed offline storage and creates a SQLite song record.
 * Implements atomic rollback: if the database insertion fails, the newly copied video file is deleted.
 */
export async function importVideoFile(params: ImportVideoParams): Promise<Song> {
  const trimmedNumber = params.songNumber.trim();
  const trimmedTitle = params.title.trim();

  if (!trimmedNumber) {
    throw new Error('Song number is required.');
  }
  if (!trimmedTitle) {
    throw new Error('Song title is required.');
  }

  // Check duplicate song number prior to copying
  const existing = await getSongByNumber(trimmedNumber);
  if (existing) {
    throw new Error(`Song number "${trimmedNumber}" is already used by "${existing.title}".`);
  }

  // Validate available storage if on native platform and file size is known
  if (Platform.OS !== 'web' && params.fileSizeBytes && params.fileSizeBytes > 0) {
    const freeSpace = await getFreeStorageBytes();
    const safetyMargin = 50 * 1024 * 1024; // 50MB safety buffer
    if (freeSpace !== null && freeSpace < params.fileSizeBytes + safetyMargin) {
      throw new Error(
        'Insufficient device storage space to store this video offline. Please free up space and try again.'
      );
    }
  }

  // Ensure internal video directory exists
  await ensureVideoDirectoryExists();

  // Create safe destination filename: <number>_<timestamp>_<clean_filename>
  const cleanBaseName = sanitizeFilename(params.originalFilename);
  const now = Date.now();
  const uniqueFilename = `${trimmedNumber}_${now}_${cleanBaseName}`;
  const destinationDir = getVideoDirectory();
  const destinationUri = `${destinationDir}${uniqueFilename}`;
  const relativeMediaPath = `${VIDEO_DIRECTORY_NAME}/${uniqueFilename}`;

  // Copy file into app-managed storage if running on native
  if (Platform.OS !== 'web') {
    try {
      await FileSystem.copyAsync({
        from: params.sourceUri,
        to: destinationUri,
      });
    } catch (copyErr) {
      console.error('Failed to copy video to app storage:', copyErr);
      throw new Error('Failed to copy video file into local storage. Please check permissions.');
    }
  }

  // Insert metadata into SQLite with rollback cleanup on error
  try {
    const songId = `s_${now}_${Math.random().toString(36).substring(2, 6)}`;
    const createdSong = await insertSong({
      id: songId,
      song_number: trimmedNumber,
      title: trimmedTitle,
      artist: params.artist?.trim() || null,
      media_path: Platform.OS === 'web' ? params.sourceUri : relativeMediaPath,
      duration_seconds: params.durationSeconds ?? null,
      created_at: now,
      updated_at: now,
      is_favorite: false,
    });

    return createdSong;
  } catch (dbErr) {
    // Rollback: delete copied video file so no orphaned files remain
    if (Platform.OS !== 'web') {
      await deleteMediaFile(relativeMediaPath);
    }
    throw dbErr;
  }
}
