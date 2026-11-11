import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../src/theme';
import { AppText } from './AppText';
import { GreenButton } from './GreenButton';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmTestID?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  confirmTestID,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.fill}>
        <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel="Dismiss" />
        <View style={styles.card}>
          <AppText weight="extrabold" style={styles.title}>
            {title}
          </AppText>
          <AppText color={colors.muted} style={styles.body}>
            {body}
          </AppText>
          <GreenButton
            label={confirmLabel}
            onPress={onConfirm}
            tone={destructive ? 'danger' : 'accent'}
            testID={confirmTestID}
          />
          <Pressable onPress={onCancel} style={styles.cancelHit} accessibilityRole="button">
            <AppText weight="semibold" color={colors.muted}>
              {cancelLabel}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 20,
  },
  cancelHit: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 4,
  },
});
