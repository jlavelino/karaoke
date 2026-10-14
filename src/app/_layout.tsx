import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KaraokeProvider } from '@/context/KaraokeContext';

export default function RootLayout() {
  return (
    <KaraokeProvider>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0B0F19' },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="import"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Import Local Video',
              headerStyle: { backgroundColor: '#151D2F' },
              headerTintColor: '#F8FAFC',
            }}
          />
        </Stack>
      </ThemeProvider>
    </KaraokeProvider>
  );
}
