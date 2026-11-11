import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { backspaceDigit, formatDollars, parseEntry, pushDigit } from '../src/money';
import { formatSgtTime } from '../src/time';
import { colors } from '../src/theme';
import type { Payment, Player } from '../src/types';
import { AppText } from './AppText';
import { GreenButton } from './GreenButton';
import { Keypad } from './Keypad';
import { Sheet } from './Sheet';

type Props = {
  visible: boolean;
  openNonce: number;
  seedPayerId: string | null;
  players: Player[];
  payments: Payment[];
  onClose: () => void;
  onRecord: (fromId: string, toId: string, amount: number) => string | null;
  onUndo: (paymentId: string) => void;
};

export function PaymentSheet({
  visible,
  openNonce,
  seedPayerId,
  players,
  payments,
  onClose,
  onRecord,
  onUndo,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [payerId, setPayerId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [digits, setDigits] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const payer = players.find((player) => player.id === seedPayerId) ?? players[0];
    const receiver = players.find((player) => player.id !== payer?.id);
    setPayerId(payer?.id ?? null);
    setReceiverId(receiver?.id ?? null);
    setDigits('0');
    setError(null);
    // Players are read at open time. Recording a payment should not reset the keypad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, openNonce]);

  const amount = parseEntry(digits);
  const names = new Map(players.map((player) => [player.id, player.name]));
  const canRecord = players.length >= 2 && amount > 0 && payerId !== null && receiverId !== null && payerId !== receiverId;

  function choosePayer(id: string) {
    setPayerId(id);
    if (id === receiverId) {
      setReceiverId(players.find((player) => player.id !== id)?.id ?? null);
    }
  }

  function chooseReceiver(id: string) {
    setReceiverId(id);
    if (id === payerId) {
      setPayerId(players.find((player) => player.id !== id)?.id ?? null);
    }
  }

  const listed = [...payments].reverse();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        style={{ maxHeight: Math.round(height * 0.86) }}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <AppText weight="extrabold" style={styles.title}>
          Paid during game
        </AppText>
        {players.length < 2 ? (
          <AppText weight="medium" color={colors.muted} style={styles.needTwo}>
            Add at least two players to record a payment.
          </AppText>
        ) : (
          <>
            <View style={styles.picker}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.chipScroll}
              >
                {players.map((player) => (
                  <Chip
                    key={`from-${player.id}`}
                    label={player.name}
                    selected={player.id === payerId}
                    onPress={() => choosePayer(player.id)}
                    testID={`payer-${player.name}`}
                  />
                ))}
              </ScrollView>
              <AppText weight="medium" color={colors.faint} style={styles.arrow}>
                →
              </AppText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
                style={styles.chipScroll}
              >
                {players.map((player) => (
                  <Chip
                    key={`to-${player.id}`}
                    label={player.name}
                    selected={player.id === receiverId}
                    onPress={() => chooseReceiver(player.id)}
                    testID={`receiver-${player.name}`}
                  />
                ))}
              </ScrollView>
            </View>
            <AppText weight="extrabold" style={styles.amount}>
              {formatDollars(amount)}
            </AppText>
            <AppText weight="medium" color={error ? colors.danger : colors.faint} style={styles.hint}>
              {error ?? 'Use the keypad below to enter the amount'}
            </AppText>
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
                label="Record payment"
                disabled={!canRecord}
                testID="record-payment"
                onPress={() => {
                  if (!payerId || !receiverId) return;
                  const message = onRecord(payerId, receiverId, amount);
                  if (message) {
                    setError(message);
                    return;
                  }
                  setDigits('0');
                  setError(null);
                }}
              />
            </View>
          </>
        )}
        {listed.length > 0 ? (
          <View style={styles.paid}>
            <AppText weight="bold" style={styles.paidTitle}>
              Already paid
            </AppText>
            {listed.map((payment) => {
              const from = names.get(payment.fromId) ?? 'Someone';
              const to = names.get(payment.toId) ?? 'someone';
              return (
                <View key={payment.id} style={styles.paidRow}>
                  <View style={styles.paidText}>
                    <AppText weight="bold" style={styles.paidNames}>
                      {from} → {to}
                    </AppText>
                    <AppText weight="medium" color={colors.faint} style={styles.paidTime}>
                      {formatSgtTime(payment.at)}
                    </AppText>
                  </View>
                  <AppText weight="bold" color={colors.accentText} style={styles.paidAmount}>
                    {formatDollars(payment.amount)}
                  </AppText>
                  <Pressable
                    onPress={() => onUndo(payment.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Undo ${from} paid ${to}`}
                    testID={`undo-${payment.id}`}
                  >
                    <AppText weight="semibold" color={colors.accentText} style={styles.undo}>
                      Undo
                    </AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <AppText weight="semibold" color={selected ? colors.white : colors.chipText} style={styles.chipLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  needTwo: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipScroll: {
    flex: 1,
  },
  chips: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.accent,
  },
  chipLabel: {
    fontSize: 15,
  },
  arrow: {
    fontSize: 18,
    marginHorizontal: 6,
  },
  amount: {
    fontSize: 52,
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: -1.2,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 20,
  },
  button: {
    marginTop: 6,
  },
  paid: {
    marginTop: 22,
  },
  paidTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  paidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paidText: {
    flex: 1,
    marginRight: 8,
  },
  paidNames: {
    fontSize: 16,
  },
  paidTime: {
    fontSize: 13,
    marginTop: 2,
  },
  paidAmount: {
    fontSize: 16,
    marginRight: 14,
  },
  undo: {
    fontSize: 16,
  },
});
