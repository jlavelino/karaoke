import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';
import SongListItem from '@/components/SongListItem';
import { Song } from '@/types/song';

export default function SongbookScreen() {
  const { songs, playSongNow, addToQueue, toggleFavorite } = useKaraoke();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const filteredSongs = songs.filter((song) => {
    const matchesSearch =
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      song.song_number.includes(searchQuery);

    const matchesFavorite = filterFavorites ? song.is_favorite : true;
    return matchesSearch && matchesFavorite;
  });

  const handlePlayNow = (song: Song) => {
    playSongNow(song);
    router.push('/(tabs)/player');
  };

  const handleAddToQueue = (song: Song) => {
    addToQueue(song);
    Alert.alert('Queued', `"${song.title}" (#${song.song_number}) added to queue!`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={20} color={Colors.dark.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, artist, or number..."
            placeholderTextColor={Colors.dark.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !filterFavorites && styles.filterChipActive]}
            onPress={() => setFilterFavorites(false)}>
            <Text
              style={[
                styles.filterChipText,
                !filterFavorites && styles.filterChipTextActive,
              ]}>
              All Songs ({songs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterFavorites && styles.filterChipActive]}
            onPress={() => setFilterFavorites(true)}>
            <Ionicons
              name="heart"
              size={14}
              color={filterFavorites ? '#000000' : '#EF4444'}
            />
            <Text
              style={[
                styles.filterChipText,
                filterFavorites && styles.filterChipTextActive,
              ]}>
              Favorites ({songs.filter((s) => s.is_favorite).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.importQuickBtn}
            onPress={() => router.push('/import')}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.dark.accent} />
            <Text style={styles.importQuickText}>Import</Text>
          </TouchableOpacity>
        </View>

        {/* Song List */}
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SongListItem
              song={item}
              onPlayNow={handlePlayNow}
              onAddToQueue={handleAddToQueue}
              onToggleFavorite={toggleFavorite}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={44} color={Colors.dark.textSecondary} />
              <Text style={styles.emptyTitle}>No Songs Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No results matching "${searchQuery}"`
                  : 'Your songbook is empty.'}
              </Text>
              <TouchableOpacity
                style={styles.importBtn}
                onPress={() => router.push('/import')}>
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.importBtnText}>Import Video Files</Text>
              </TouchableOpacity>
            </View>
          }
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
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  filterChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#000000',
  },
  importQuickBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    gap: 4,
  },
  importQuickText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.queueBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
