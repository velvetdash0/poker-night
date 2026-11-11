import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function tapLight(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
