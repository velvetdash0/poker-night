import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backspaceDigit, formatDollars, parseEntry, pushDigit } from '../src/money';
import { colors } from '../src/theme';
import type { Player } from '../src/types';
import { AppText } from './AppText';
import { GreenButton } from './GreenButton';
import { Keypad } from './Keypad';
import { Sheet } from './Sheet';

export type AmountMode = 'rebuy' | 'buyIn' | 'cashOut';

export type AmountRequest = {
  nonce: number;
  playerId: string;
  mode: AmountMode;
};

type Props = {
  request: AmountRequest | null;
  player: Player | null;
  onClose: () => void;
  onSubmit: (request: AmountRequest, amount: number) => string | null;
};

export function AmountSheet({ request, player, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [digits, setDigits] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const visible = request !== null && player !== null;

  useEffect(() => {
    if (!request || !player) return;
    if (request.mode === 'rebuy') setDigits('0');
    else if (request.mode === 'buyIn') setDigits(String(player.buyIn));
    else setDigits(String(player.cashOut));
    setError(null);
    // Reset only when a sheet is opened, not when the saved total changes underneath.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.nonce]);

  const amount = parseEntry(digits);
  const mode = request?.mode ?? 'rebuy';
  const unchanged =
    mode === 'buyIn' ? amount === player?.buyIn : mode === 'cashOut' ? amount === player?.cashOut : false;
  const disabled = mode === 'rebuy' ? amount <= 0 : unchanged;

  const title =
    mode === 'cashOut'
      ? `Cash out · ${player?.name ?? ''}`
      : mode === 'buyIn'
        ? `Buy-in · ${player?.name ?? ''}`
        : player && player.buyIn === 0
          ? `Buy-in · ${player.name}`
          : `Rebuy · ${player?.name ?? ''}`;
  const subtitle =
    mode === 'cashOut'
      ? 'Chips or cash they have at the end'
      : mode === 'buyIn'
        ? 'Correct the total if it was entered wrong'
        : `In now ${formatDollars(player?.buyIn ?? 0)}`;
  const buttonLabel = mode === 'rebuy' ? (amount > 0 ? `Add ${formatDollars(amount)}` : 'Add') : 'Save';

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={{ maxHeight: Math.round(height * 0.86) }}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <AppText weight="extrabold" style={styles.title}>
          {title}
        </AppText>
        <AppText weight="medium" color={colors.muted} style={styles.subtitle}>
          {subtitle}
        </AppText>
        <AppText weight="extrabold" style={styles.amount}>
          {formatDollars(amount)}
        </AppText>
        {error ? (
          <AppText weight="medium" color={colors.danger} style={styles.error}>
            {error}
          </AppText>
        ) : (
          <AppText weight="medium" color={colors.faint} style={styles.hint}>
            Whole dollars
          </AppText>
        )}
        <Keypad
          onDigit={(digit) => {
            setDigits((current) => pushDigit(current, digit));
            setError(null);
          }}
          onBackspace={() => {
            setDigits((current) => backspaceDigit(current));
            setError(null);
          }}
        />
        <View style={styles.button}>
          <GreenButton
            label={buttonLabel}
            disabled={disabled}
            testID="amount-save"
            onPress={() => {
              if (!request) return;
              const message = onSubmit(request, amount);
              if (message) {
                setError(message);
                return;
              }
              onClose();
            }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
  amount: {
    fontSize: 48,
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: -1,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
});
