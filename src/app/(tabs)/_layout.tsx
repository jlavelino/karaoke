import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useKaraoke } from '@/context/KaraokeContext';

export default function TabLayout() {
  const { queue } = useKaraoke();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerTitleStyle: {
          color: '#F8FAFC',
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: 0.5,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: '#0B0F19',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.dark.accent,
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
        },
        headerRight: () => (
          <TouchableOpacity
            style={styles.headerImportBtn}
            onPress={() => router.push('/import')}
            activeOpacity={0.7}>
            <Ionicons name="cloud-upload-outline" size={18} color={Colors.dark.accent} />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keypad',
          headerTitle: 'NumberKanta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="keypad" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="songbook"
        options={{
          title: 'Songbook',
          headerTitle: 'Digital Songbook',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          headerTitle: 'Playback Queue',
          tabBarBadge: queue.length > 0 ? queue.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: Colors.dark.queueBlue,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '800',
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="player"
        options={{
          title: 'Player',
          headerTitle: 'Now Singing',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerImportBtn: {
    marginRight: 16,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
});
