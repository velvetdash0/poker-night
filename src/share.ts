import { Platform, Share } from 'react-native';

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'failed';

export async function sharePlainText(message: string): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator === 'undefined' ? undefined : navigator;
    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ text: message });
        return 'shared';
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return 'dismissed';
      }
    }
    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(message);
        return 'copied';
      }
    } catch {
      return 'failed';
    }
    return 'failed';
  }

  try {
    const result = await Share.share({ message });
    if (result.action === Share.dismissedAction) return 'dismissed';
    return 'shared';
  } catch {
    return 'failed';
  }
}
