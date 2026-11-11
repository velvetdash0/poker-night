import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../src/theme';
import { AppText } from './AppText';

type Props = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['—', '0', 'del'],
] as const;

export function Keypad({ onDigit, onBackspace }: Props) {
  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row.join('')} style={styles.row}>
          {row.map((key) => {
            if (key === '—') {
              return (
                <View key={key} style={styles.key} accessibilityElementsHidden>
                  <AppText weight="medium" color={colors.faint} style={styles.dash}>
                    —
                  </AppText>
                </View>
              );
            }
            if (key === 'del') {
              return (
                <Pressable
                  key={key}
                  testID="keypad-backspace"
                  accessibilityRole="button"
                  accessibilityLabel="Delete"
                  onPress={onBackspace}
                  style={({ pressed }) => [styles.key, pressed && styles.pressed]}
                >
                  <Ionicons name="backspace-outline" size={26} color={colors.ink} />
                </Pressable>
              );
            }
            return (
              <Pressable
                key={key}
                testID={`keypad-${key}`}
                accessibilityRole="button"
                accessibilityLabel={key}
                onPress={() => onDigit(key)}
                style={({ pressed }) => [styles.key, pressed && styles.pressed]}
              >
                <AppText weight="semibold" style={styles.digit}>
                  {key}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  key: {
    flex: 1,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  pressed: {
    backgroundColor: colors.pill,
  },
  digit: {
    fontSize: 28,
  },
  dash: {
    fontSize: 28,
  },
});
