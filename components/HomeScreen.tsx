import Ionicons from '@expo/vector-icons/Ionicons';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tapLight } from '../src/haptics';
import { formatDollars } from '../src/money';
import { buildShareText } from '../src/shareText';
import { sharePlainText } from '../src/share';
import { settlement, transferLine } from '../src/settle';
import { formatSgtTime } from '../src/time';
import { colors, font } from '../src/theme';
import { MAX_NAME, MAX_TITLE } from '../src/names';
import { useGame } from '../src/useGame';
import { AmountSheet, type AmountRequest } from './AmountSheet';
import { AppText, FontsReadyContext } from './AppText';
import { ConfirmDialog } from './ConfirmDialog';
import { GreenButton } from './GreenButton';
import { HistorySheet } from './HistorySheet';
import { NameSheet } from './NameSheet';
import { PaymentSheet } from './PaymentSheet';
import { PlayerRow } from './PlayerRow';

type NameEdit = { kind: 'player'; id: string; nonce: number } | { kind: 'title'; nonce: number } | null;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fontsReady = useContext(FontsReadyContext);
  const framed = Platform.OS === 'web' && width >= 640;
  const compact = width < 390;
  const {
    game,
    ready,
    saveError,
    addPlayer,
    renamePlayer,
    removePlayer,
    addRebuy,
    setBuyIn,
    setCashOut,
    addPayment,
    undoPayment,
    renameGame,
    reset,
  } = useGame();

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [amountRequest, setAmountRequest] = useState<AmountRequest | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentNonce, setPaymentNonce] = useState(0);
  const [payerSeed, setPayerSeed] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [nameEdit, setNameEdit] = useState<NameEdit>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [shareDraft, setShareDraft] = useState<string | null>(null);

  const result = useMemo(
    () => settlement(game.players, game.payments),
    [game.players, game.payments],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!ready) {
    return <View style={styles.fill} />;
  }

  const amountPlayer = game.players.find((player) => player.id === amountRequest?.playerId) ?? null;
  const editingPlayer =
    nameEdit?.kind === 'player' ? (game.players.find((player) => player.id === nameEdit.id) ?? null) : null;
  const last = game.log[game.log.length - 1];
  const hasMoney = game.players.some((player) => player.buyIn > 0 || player.cashOut > 0) || game.payments.length > 0;
  const outsUntouched =
    game.players.length > 0 &&
    game.players.every((player) => player.cashOut === 0) &&
    game.players.some((player) => player.buyIn > 0);
  const dirty =
    game.players.length > 0 || game.payments.length > 0 || game.log.length > 0 || game.title !== 'Poker Night';

  function closeSheets() {
    setPaymentOpen(false);
    setHistoryOpen(false);
    setAmountRequest(null);
    setNameEdit(null);
  }

  function openAmount(mode: AmountRequest['mode'], playerId: string) {
    Keyboard.dismiss();
    closeSheets();
    setAmountRequest({ nonce: Date.now(), playerId, mode });
  }

  function openPayments(seed?: string) {
    Keyboard.dismiss();
    closeSheets();
    setPayerSeed(seed ?? null);
    setPaymentNonce((nonce) => nonce + 1);
    setPaymentOpen(true);
  }

  async function onShare() {
    tapLight();
    const text = buildShareText(game);
    const outcome = await sharePlainText(text);
    if (outcome === 'copied') setToast('Summary copied');
    if (outcome === 'failed') setShareDraft(text);
  }

  return (
    <View style={[styles.page, framed && styles.pageFramed]}>
      <KeyboardAvoidingView
        style={[styles.frame, framed && styles.frameFramed]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + (compact ? 8 : 16), paddingBottom: insets.bottom + 28 },
          ]}
        >
          {saveError ? (
            <View style={styles.banner}>
              <AppText weight="medium" color={colors.warning} style={styles.bannerText}>
                Couldn’t save on this phone. Changes may be lost if you close the app.
              </AppText>
            </View>
          ) : null}

          <View style={styles.header}>
            <Pressable
              testID="game-title"
              onPress={() => {
                Keyboard.dismiss();
                closeSheets();
                setNameEdit({ kind: 'title', nonce: Date.now() });
              }}
              style={styles.titleHit}
              accessibilityRole="button"
              accessibilityLabel={`${game.title}. Edit game name`}
            >
              <AppText weight="extrabold" numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>
                {game.title}
              </AppText>
            </Pressable>
            <Pressable
              testID="share-icon"
              onPress={onShare}
              style={styles.shareIcon}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Share summary"
            >
              <Ionicons name="share-social" size={26} color={colors.accent} />
            </Pressable>
          </View>

          {game.players.length === 0 && !adding ? (
            <AppText weight="medium" color={colors.muted} style={styles.empty}>
              Add everyone at the table. In is the buy-in. Out is what they have at the end.
            </AppText>
          ) : null}

          {game.players.map((player) => (
            <PlayerRow
              key={player.id}
              player={player}
              compact={compact}
              onRename={() => {
                Keyboard.dismiss();
                closeSheets();
                setNameEdit({ kind: 'player', id: player.id, nonce: Date.now() });
              }}
              onPay={() => openPayments(player.id)}
              onRebuy={() => openAmount('rebuy', player.id)}
              onEditBuyIn={() => openAmount('buyIn', player.id)}
              onCashOut={() => openAmount('cashOut', player.id)}
            />
          ))}

          {adding ? (
            <View style={styles.addBox}>
              <TextInput
                testID="player-name-input"
                value={draft}
                onChangeText={(value) => {
                  setDraft(value);
                  setNameError(null);
                }}
                placeholder="Player name"
                placeholderTextColor={colors.faint}
                autoFocus
                autoCorrect={false}
                autoCapitalize="words"
                maxLength={MAX_NAME}
                returnKeyType="done"
                onSubmitEditing={() => {
                  const message = addPlayer(draft);
                  if (message) {
                    setNameError(message);
                    return;
                  }
                  setDraft('');
                  setAdding(false);
                  Keyboard.dismiss();
                }}
                selectionColor={colors.accent}
                underlineColorAndroid="transparent"
                style={[styles.addInput, fontsReady ? { fontFamily: font.semibold } : null]}
              />
              <Pressable
                testID="confirm-add-player"
                onPress={() => {
                  const message = addPlayer(draft);
                  if (message) {
                    setNameError(message);
                    return;
                  }
                  setDraft('');
                  setAdding(false);
                  Keyboard.dismiss();
                }}
                accessibilityRole="button"
              >
                <AppText weight="bold" color={colors.accentText}>
                  Add
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setAdding(false);
                  setDraft('');
                  setNameError(null);
                  Keyboard.dismiss();
                }}
                accessibilityRole="button"
              >
                <AppText weight="semibold" color={colors.muted}>
                  Cancel
                </AppText>
              </Pressable>
              {nameError ? (
                <AppText weight="medium" color={colors.danger} style={styles.addError}>
                  {nameError}
                </AppText>
              ) : null}
            </View>
          ) : (
            <Pressable
              testID="add-player"
              onPress={() => {
                setNameError(null);
                setDraft('');
                setAdding(true);
              }}
              style={styles.addRow}
              accessibilityRole="button"
            >
              <AppText weight="semibold" color={colors.muted} style={styles.addLabel}>
                +  Add player
              </AppText>
            </Pressable>
          )}

          <View style={styles.utility}>
            <Pressable testID="paid-during-game" onPress={() => openPayments()} accessibilityRole="button">
              <AppText weight="semibold" color={colors.accentText} style={styles.utilityText}>
                Paid during game
              </AppText>
            </Pressable>
            <Pressable
              testID="history-button"
              onPress={() => {
                Keyboard.dismiss();
                closeSheets();
                setHistoryOpen(true);
              }}
              accessibilityRole="button"
            >
              <AppText weight="semibold" color={colors.muted} style={styles.utilityText}>
                History
              </AppText>
            </Pressable>
          </View>

          <View style={styles.settle} testID="settle-section">
            <AppText weight="extrabold" style={styles.settleTitle}>
              Settle up
            </AppText>
            <AppText weight="medium" color={colors.faint} style={styles.auto}>
              auto-updating
            </AppText>
            {game.payments.length > 0 ? (
              <AppText weight="medium" color={colors.faint} style={styles.includes}>
                Includes payments made during the game
              </AppText>
            ) : null}

            {game.players.length === 0 ? (
              <AppText weight="medium" color={colors.muted} style={styles.placeholder} testID="balance-status">
                Add players to settle up.
              </AppText>
            ) : !hasMoney ? (
              <AppText weight="medium" color={colors.muted} style={styles.placeholder} testID="balance-status">
                Buy-ins and cash-outs will settle here.
              </AppText>
            ) : (
              <>
                {outsUntouched ? (
                  <AppText weight="medium" color={colors.muted} style={styles.placeholder}>
                    Out is what each player has when the game ends.
                  </AppText>
                ) : null}
                {result.transfers.map((transfer, index) => (
                  <AppText
                    key={`${transfer.fromId}-${transfer.toId}-${index}`}
                    weight="bold"
                    style={styles.transfer}
                    testID="transfer-line"
                  >
                    {transferLine(transfer)}
                  </AppText>
                ))}
                {result.balanced && result.transfers.length === 0 ? (
                  <AppText weight="bold" style={styles.transfer}>
                    No one owes anyone.
                  </AppText>
                ) : null}
                {result.balanced ? (
                  <View style={styles.balance} testID="balance-status">
                    <View style={styles.check}>
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    </View>
                    <AppText weight="semibold" color={colors.accentText} style={styles.balanceText}>
                      Balanced
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.balance} testID="balance-status">
                    <View style={styles.warnBadge}>
                      <AppText weight="bold" color={colors.warning} style={styles.warnMark}>
                        !
                      </AppText>
                    </View>
                    <AppText weight="semibold" color={colors.warning} style={styles.balanceText}>
                      Off by {formatDollars(result.offBy)}
                    </AppText>
                  </View>
                )}
              </>
            )}

            <View style={styles.shareButton}>
              <GreenButton label="Share" onPress={onShare} testID="share-button" />
            </View>
          </View>

          {last ? (
            <AppText weight="medium" color={colors.faint} style={styles.lastEdit} testID="last-edit">
              Last edit: {last.subject ? `${last.subject}, ` : ''}
              {formatSgtTime(last.at)}
            </AppText>
          ) : null}
          {dirty ? (
            <Pressable
              testID="new-game"
              onPress={() => setConfirmNew(true)}
              style={styles.newGame}
              accessibilityRole="button"
            >
              <AppText weight="semibold" color={colors.muted} style={styles.newGameText}>
                New game
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>

        {toast ? (
          <View style={[styles.toast, { bottom: insets.bottom + 18 }]} pointerEvents="none">
            <AppText weight="semibold" color={colors.white}>
              {toast}
            </AppText>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <AmountSheet
        request={amountRequest}
        player={amountPlayer}
        onClose={() => setAmountRequest(null)}
        onSubmit={(request, amount) => {
          tapLight();
          if (request.mode === 'rebuy') return addRebuy(request.playerId, amount);
          if (request.mode === 'buyIn') return setBuyIn(request.playerId, amount);
          return setCashOut(request.playerId, amount);
        }}
      />
      <PaymentSheet
        visible={paymentOpen}
        openNonce={paymentNonce}
        seedPayerId={payerSeed}
        players={game.players}
        payments={game.payments}
        onClose={() => setPaymentOpen(false)}
        onRecord={(fromId, toId, amount) => {
          const message = addPayment(fromId, toId, amount);
          if (!message) tapLight();
          return message;
        }}
        onUndo={(id) => {
          tapLight();
          undoPayment(id);
        }}
      />
      <HistorySheet visible={historyOpen} entries={game.log} onClose={() => setHistoryOpen(false)} />
      <NameSheet
        visible={nameEdit !== null && (nameEdit.kind === 'title' || editingPlayer !== null)}
        nonce={nameEdit?.nonce ?? 0}
        title={nameEdit?.kind === 'player' ? 'Player name' : 'Game name'}
        initial={nameEdit?.kind === 'player' ? (editingPlayer?.name ?? '') : game.title}
        placeholder={nameEdit?.kind === 'player' ? 'Player name' : 'Game name'}
        maxLength={nameEdit?.kind === 'player' ? MAX_NAME : MAX_TITLE}
        allowRemove={nameEdit?.kind === 'player'}
        onClose={() => setNameEdit(null)}
        onSave={(name) => {
          if (nameEdit?.kind === 'player') return renamePlayer(nameEdit.id, name);
          if (nameEdit?.kind === 'title') return renameGame(name);
          return null;
        }}
        onRemove={
          nameEdit?.kind === 'player'
            ? () => {
                removePlayer(nameEdit.id);
              }
            : undefined
        }
      />
      <ConfirmDialog
        visible={confirmNew}
        title="Start a new game?"
        body="This clears players, payments, and the edit history stored on this phone."
        confirmLabel="Start new game"
        cancelLabel="Keep this game"
        destructive
        confirmTestID="confirm-new-game"
        onCancel={() => setConfirmNew(false)}
        onConfirm={() => {
          reset();
          setConfirmNew(false);
          setAdding(false);
          setDraft('');
          closeSheets();
        }}
      />
      <Modal
        visible={shareDraft !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShareDraft(null)}
        statusBarTranslucent
      >
        <View style={styles.shareWrap}>
          <Pressable style={styles.shareBackdrop} onPress={() => setShareDraft(null)} />
          <View style={styles.shareCard}>
            <AppText weight="extrabold" style={styles.shareTitle}>
              Summary
            </AppText>
            <AppText selectable style={styles.shareBody}>
              {shareDraft}
            </AppText>
            <GreenButton label="Close" onPress={() => setShareDraft(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      web: { minHeight: '100vh' as unknown as number },
    }),
  },
  pageFramed: {
    backgroundColor: colors.page,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  frameFramed: {
    maxWidth: 440,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E3E5EA',
  },
  content: {
    paddingHorizontal: 22,
    flexGrow: 1,
  },
  banner: {
    backgroundColor: colors.warningSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 18,
  },
  header: {
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 26,
  },
  titleHit: {
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  title: {
    fontSize: 34,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 30,
  },
  shareIcon: {
    position: 'absolute',
    right: -6,
    top: 0,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 22,
  },
  addBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  addInput: {
    flexGrow: 1,
    flexBasis: 140,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.pill,
    paddingHorizontal: 14,
    fontSize: 17,
    color: colors.ink,
    ...Platform.select({
      web: { outlineStyle: 'none' } as object,
    }),
  },
  addError: {
    width: '100%',
    fontSize: 14,
  },
  addRow: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 4,
  },
  addLabel: {
    fontSize: 16,
  },
  utility: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  utilityText: {
    fontSize: 15,
  },
  settle: {
    marginTop: 28,
  },
  settleTitle: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  auto: {
    fontSize: 14,
    marginTop: 2,
  },
  includes: {
    fontSize: 13,
    marginTop: 4,
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 22,
    marginTop: 16,
  },
  transfer: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
    marginTop: 14,
  },
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  warnBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  warnMark: {
    fontSize: 14,
    lineHeight: 16,
  },
  balanceText: {
    fontSize: 16,
  },
  shareButton: {
    marginTop: 22,
  },
  lastEdit: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
  },
  newGame: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  newGameText: {
    fontSize: 13,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.toast,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  shareWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  shareBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  shareCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 22,
  },
  shareTitle: {
    fontSize: 22,
    marginBottom: 12,
  },
  shareBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
});
