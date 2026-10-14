import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#0F172A', // We maintain dark videoke aesthetic even in light mode
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    textSecondary: '#94A3B8',
    accent: '#F59E0B', // Amber
    accentGlow: 'rgba(245, 158, 11, 0.2)',
    playGreen: '#10B981',
    queueBlue: '#3B82F6',
    dangerRed: '#EF4444',
    ledText: '#FBBF24',
    ledBackground: '#020617',
    border: '#334155',
    card: '#1E293B',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B0F19',
    backgroundElement: '#151D2F',
    backgroundSelected: '#222F4C',
    textSecondary: '#94A3B8',
    accent: '#F59E0B', // Amber
    accentGlow: 'rgba(245, 158, 11, 0.25)',
    playGreen: '#10B981',
    queueBlue: '#3B82F6',
    dangerRed: '#EF4444',
    ledText: '#FBBF24',
    ledBackground: '#020617',
    border: '#2A374F',
    card: '#131A2B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'Courier',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 75 }) ?? 75;
export const MaxContentWidth = 840;
