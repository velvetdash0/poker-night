import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme';
import { WebOverlay } from './Portal';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ visible, onClose, children }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const generation = useRef(0);
  const renderedRef = useRef(visible);

  useEffect(() => {
    if (!visible && !renderedRef.current) return;
    const token = ++generation.current;
    if (visible) {
      renderedRef.current = true;
      setRendered(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (!finished || token !== generation.current) return;
      renderedRef.current = false;
      setRendered(false);
    });
  }, [progress, visible]);

  if (!rendered) return null;

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.max(height, 640), 0],
  });
  const sheetWidth = Platform.OS === 'web' && width >= 640 ? 440 : '100%';
  const sheet = (
    <View
      style={[
        styles.sheet,
        {
          width: sheetWidth,
          maxHeight: Math.round(height * 0.92),
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      <View style={styles.handle} />
      {children}
    </View>
  );

  if (Platform.OS === 'web') {
    return <WebOverlay onClose={onClose}>{sheet}</WebOverlay>;
  }

  const backdrop = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={styles.backdropPress} onPress={onClose} accessibilityLabel="Dismiss" />
        </Animated.View>
        <Animated.View style={{ width: '100%', transform: [{ translateY }] }}>{sheet}</Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 22, 26, 0.38)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E1E2E6',
    marginTop: 10,
    marginBottom: 6,
  },
});
