import { useColorScheme } from 'react-native';

export type AppColors = {
  background: string;
  card: string;
  accent: string;
  accentLight: string;
  text: string;
  textSecondary: string;
  border: string;
  inputBg: string;
  error: string;
  good: string;
  mid: string;
  low: string;
  onAccent: string;
  shadow: string;
  google: string;
  apple: string;
};

/** Cream blue — soft cream surfaces with blue accents */
export const lightColors: AppColors = {
  background: '#F4F1EA',
  card: '#FFFFFF',
  accent: '#4F7FA8',
  accentLight: '#E4EEF6',
  text: '#1C2A38',
  textSecondary: '#6B7C8C',
  border: '#D9E2EA',
  inputBg: '#FAF8F4',
  error: '#C0392B',
  good: '#2F6B4F',
  mid: '#B8860B',
  low: '#B54A3C',
  onAccent: '#FFFFFF',
  shadow: '#4F7FA8',
  google: '#4285F4',
  apple: '#000000',
};

/** Grey blue — cool slate surfaces with muted blue accents */
export const darkColors: AppColors = {
  background: '#161D26',
  card: '#212B38',
  accent: '#7BA3C4',
  accentLight: '#2A3748',
  text: '#E8EEF4',
  textSecondary: '#9AADC0',
  border: '#334155',
  inputBg: '#1A2330',
  error: '#E57373',
  good: '#5DA882',
  mid: '#D4A017',
  low: '#E07A6C',
  onAccent: '#12202C',
  shadow: '#000000',
  google: '#4285F4',
  apple: '#FFFFFF',
};

export function useThemeColors(): AppColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}

export function useIsDarkMode(): boolean {
  return useColorScheme() === 'dark';
}
