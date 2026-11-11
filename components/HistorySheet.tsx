import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatSgtTime } from '../src/time';
import { colors } from '../src/theme';
import type { LogEntry } from '../src/types';
import { AppText } from './AppText';
import { Sheet } from './Sheet';

type Props = {
  visible: boolean;
  entries: LogEntry[];
  onClose: () => void;
};

export function HistorySheet({ visible, entries, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const newestFirst = [...entries].reverse();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <AppText weight="extrabold" style={styles.title}>
          History
        </AppText>
        <AppText weight="medium" color={colors.faint} style={styles.caption}>
          Times are Singapore time
        </AppText>
      </View>
      <ScrollView
        style={{ maxHeight: Math.round(height * 0.72) }}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
        bounces={false}
      >
        {newestFirst.length === 0 ? (
          <AppText weight="medium" color={colors.muted} style={styles.empty}>
            No changes yet. Buy-ins, cash-outs, and payments will show up here.
          </AppText>
        ) : (
          newestFirst.map((entry) => (
            <View key={entry.id} style={styles.row} testID="history-entry">
              <AppText weight="semibold" color={colors.muted} style={styles.time}>
                {formatSgtTime(entry.at)}
              </AppText>
              <AppText weight="medium" style={styles.text}>
                {entry.text}
              </AppText>
            </View>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  caption: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 22,
  },
  empty: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEEEF1',
  },
  time: {
    width: 84,
    fontSize: 13,
    paddingTop: 2,
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
});
