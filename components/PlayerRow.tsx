import { Pressable, StyleSheet, View } from 'react-native';
import { formatCount } from '../src/money';
import { colors } from '../src/theme';
import type { Player } from '../src/types';
import { AppText } from './AppText';

type Props = {
  player: Player;
  compact: boolean;
  onRename: () => void;
  onPay: () => void;
  onRebuy: () => void;
  onEditBuyIn: () => void;
  onCashOut: () => void;
};

export function PlayerRow({ player, compact, onRename, onPay, onRebuy, onEditBuyIn, onCashOut }: Props) {
  const inWidth = compact ? 118 : 138;
  const outWidth = compact ? 96 : 112;
  return (
    <View style={styles.row} testID={`player-row-${player.name}`}>
      <Pressable
        testID={`player-name-${player.name}`}
        style={styles.nameHit}
        onPress={onRename}
        onLongPress={onPay}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityLabel={player.name}
        accessibilityHint="Opens rename. Long press to record a payment."
      >
        <AppText weight="bold" numberOfLines={1} style={styles.name}>
          {player.name}
        </AppText>
      </Pressable>
      <View style={[styles.field, { width: inWidth }]}>
        <AppText weight="medium" color={colors.label} style={styles.label}>
          In
        </AppText>
        <View style={styles.pill}>
          <View style={styles.balance} />
          <Pressable
            testID={`buyin-${player.name}`}
            style={styles.amountHit}
            onPress={onEditBuyIn}
            accessibilityRole="button"
            accessibilityLabel={`Set ${player.name}'s buy-in, currently ${formatCount(player.buyIn)} dollars`}
          >
            <AppText weight="semibold" style={styles.amount}>
              {formatCount(player.buyIn)}
            </AppText>
          </Pressable>
          <Pressable
            testID={`rebuy-${player.name}`}
            style={styles.plus}
            onPress={onRebuy}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Add rebuy for ${player.name}`}
          >
            <AppText weight="bold" color={colors.white} style={styles.plusText}>
              +
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={[styles.field, { width: outWidth, marginLeft: compact ? 8 : 12 }]}>
        <AppText weight="medium" color={colors.label} style={styles.label}>
          Out
        </AppText>
        <Pressable
          testID={`cashout-${player.name}`}
          style={[styles.pill, styles.outPill]}
          onPress={onCashOut}
          accessibilityRole="button"
          accessibilityLabel={`Set ${player.name}'s cash out, currently ${formatCount(player.cashOut)} dollars`}
        >
          <AppText weight="semibold" style={[styles.amount, styles.outAmount]}>
            {formatCount(player.cashOut)}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 22,
  },
  nameHit: {
    flex: 1,
    height: 54,
    justifyContent: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  field: {},
  label: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 6,
  },
  pill: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  balance: {
    width: 32,
  },
  amountHit: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 18,
    textAlign: 'center',
  },
  outPill: {
    justifyContent: 'center',
  },
  outAmount: {
    flex: 1,
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 22,
    lineHeight: 24,
  },
});
