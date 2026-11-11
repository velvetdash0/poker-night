import { Pressable, StyleSheet } from 'react-native';
import { colors } from '../src/theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger';
  testID?: string;
};

export function GreenButton({ label, onPress, disabled = false, tone = 'accent', testID }: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'danger' ? styles.danger : styles.accent,
        disabled && styles.disabled,
        pressed && !disabled && (tone === 'danger' ? styles.dangerPressed : styles.pressed),
      ]}
    >
      <AppText weight="bold" color={colors.white} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    backgroundColor: colors.accentPressed,
  },
  dangerPressed: {
    backgroundColor: '#A8443F',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 18,
  },
});
