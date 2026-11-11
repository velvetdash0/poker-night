import { useContext, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font } from '../src/theme';
import { AppText, FontsReadyContext } from './AppText';
import { GreenButton } from './GreenButton';
import { Sheet } from './Sheet';

type Props = {
  visible: boolean;
  nonce: number;
  title: string;
  initial: string;
  placeholder: string;
  maxLength: number;
  allowRemove?: boolean;
  onClose: () => void;
  onSave: (name: string) => string | null;
  onRemove?: () => void;
};

export function NameSheet({
  visible,
  nonce,
  title,
  initial,
  placeholder,
  maxLength,
  allowRemove = false,
  onClose,
  onSave,
  onRemove,
}: Props) {
  const insets = useSafeAreaInsets();
  const fontsReady = useContext(FontsReadyContext);
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValue(initial);
    setError(null);
    setConfirming(false);
    // Fresh fields each time the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, nonce]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {confirming ? (
          <>
            <AppText weight="extrabold" style={styles.title}>
              Remove {initial}?
            </AppText>
            <AppText weight="medium" color={colors.muted} style={styles.body}>
              Their buy-in, cash-out, and any mid-game payments with them will be deleted.
            </AppText>
            <GreenButton
              label="Remove"
              tone="danger"
              testID="confirm-remove"
              onPress={() => {
                onRemove?.();
                onClose();
              }}
            />
            <Pressable onPress={() => setConfirming(false)} style={styles.cancel} accessibilityRole="button">
              <AppText weight="semibold" color={colors.muted}>
                Keep player
              </AppText>
            </Pressable>
          </>
        ) : (
          <>
            <AppText weight="extrabold" style={styles.title}>
              {title}
            </AppText>
            <TextInput
              testID="name-input"
              value={value}
              onChangeText={(next) => {
                setValue(next);
                setError(null);
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.faint}
              autoFocus
              autoCorrect={false}
              autoCapitalize="words"
              maxLength={maxLength}
              returnKeyType="done"
              onSubmitEditing={() => {
                const message = onSave(value);
                if (message) setError(message);
                else onClose();
              }}
              selectionColor={colors.accent}
              underlineColorAndroid="transparent"
              style={[styles.input, fontsReady ? { fontFamily: font.semibold } : null]}
            />
            {error ? (
              <AppText weight="medium" color={colors.danger} style={styles.error}>
                {error}
              </AppText>
            ) : null}
            <GreenButton
              label="Save"
              testID="save-name"
              onPress={() => {
                const message = onSave(value);
                if (message) setError(message);
                else onClose();
              }}
            />
            {allowRemove ? (
              <Pressable
                onPress={() => setConfirming(true)}
                style={styles.cancel}
                accessibilityRole="button"
                testID="remove-player"
              >
                <AppText weight="semibold" color={colors.danger}>
                  Remove player
                </AppText>
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
                <AppText weight="semibold" color={colors.muted}>
                  Cancel
                </AppText>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  input: {
    marginTop: 18,
    marginBottom: 14,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.pill,
    paddingHorizontal: 16,
    fontSize: 18,
    color: colors.ink,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
    }),
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 12,
  },
  cancel: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
