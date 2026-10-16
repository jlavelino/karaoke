import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const VIDEO_DIRECTORY_NAME = 'karaoke_videos';

/**
 * Returns the base root documents directory path on the current device.
 * Ends with a trailing slash on native platforms.
 */
export function getDocumentDirectory(): string | null {
  return FileSystem.documentDirectory;
}

/**
 * Returns the app-managed directory where offline video files are stored.
 */
export function getVideoDirectory(): string {
  const docDir = FileSystem.documentDirectory;
  if (!docDir) {
    return `${VIDEO_DIRECTORY_NAME}/`;
  }
  return `${docDir}${VIDEO_DIRECTORY_NAME}/`;
}

/**
 * Ensures the internal offline video directory exists.
 */
export async function ensureVideoDirectoryExists(): Promise<string> {
  const dir = getVideoDirectory();
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return dir;
  }

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Resolves a database-stored media path to a full playable URI.
 * Handles app-relative paths, file:// URIs, web/mock URIs, and content:// URIs.
 */
export function resolveMediaUri(storedPath: string): string {
  if (!storedPath) {
    return '';
  }

  // Already a complete URI scheme
  if (
    storedPath.startsWith('http://') ||
    storedPath.startsWith('https://') ||
    storedPath.startsWith('file://') ||
    storedPath.startsWith('content://') ||
    storedPath.startsWith('asset://')
  ) {
    return storedPath;
  }

  // Mock protocol used in sample data (e.g., 'local://my_way.mp4')
  if (storedPath.startsWith('local://')) {
    return storedPath;
  }

  // Relative path within document directory (e.g. 'karaoke_videos/song_123.mp4')
  const docDir = FileSystem.documentDirectory;
  if (docDir) {
    const cleanRelative = storedPath.startsWith('/') ? storedPath.slice(1) : storedPath;
    return `${docDir}${cleanRelative}`;
  }

  return storedPath;
}

/**
 * Checks whether a physical media file exists on disk.
 */
export async function checkMediaFileExists(storedPath: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  // Sample/mock files
  if (storedPath.startsWith('local://')) {
    return true;
  }

  const fullUri = resolveMediaUri(storedPath);
  if (!fullUri || !fullUri.startsWith('file://')) {
    return false;
  }

  try {
    const info = await FileSystem.getInfoAsync(fullUri);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Safely removes a media file from the app's offline storage.
 */
export async function deleteMediaFile(storedPath: string): Promise<boolean> {
  if (Platform.OS === 'web' || storedPath.startsWith('local://')) {
    return true;
  }

  const fullUri = resolveMediaUri(storedPath);
  if (!fullUri || !fullUri.startsWith('file://')) {
    return false;
  }

  try {
    const info = await FileSystem.getInfoAsync(fullUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fullUri, { idempotent: true });
      return true;
    }
    return false;
  } catch (err) {
    console.warn(`Failed to delete media file at ${fullUri}:`, err);
    return false;
  }
}

/**
 * Retrieves the available free disk storage in bytes, or null if unsupported.
 */
export async function getFreeStorageBytes(): Promise<number | null> {
  if (Platform.OS === 'web' || !FileSystem.getFreeDiskStorageAsync) {
    return null;
  }

  try {
    return await FileSystem.getFreeDiskStorageAsync();
  } catch {
    return null;
  }
}

/**
 * Sanitizes a filename to prevent invalid characters and directory traversal.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
