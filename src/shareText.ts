import { formatDollars, formatSignedDollars, wholeDollars } from './money';
import { settlement, transferLines, type LedgerPayment, type LedgerPlayer } from './settle';

export type ShareInput = {
  title: string;
  players: readonly LedgerPlayer[];
  payments: readonly LedgerPayment[];
};

/** Plain text for WhatsApp, Telegram, or any share sheet. */
export function buildShareText(input: ShareInput): string {
  const title = input.title.trim() || 'Poker Night';
  const result = settlement(input.players, input.payments);
  const lines: string[] = [title, ''];

  if (input.players.length === 0) {
    lines.push('No players.');
  } else {
    for (const player of input.players) {
      const net = result.nets.find((entry) => entry.id === player.id)?.net ?? 0;
      lines.push(
        `${player.name}: in ${formatDollars(player.buyIn)}, out ${formatDollars(player.cashOut)}, net ${formatSignedDollars(net)}`,
      );
    }
  }

  const names = new Map(input.players.map((player) => [player.id, player.name]));
  const payments = input.payments.flatMap((payment) => {
    const amount = wholeDollars(payment.amount);
    if (amount <= 0 || payment.fromId === payment.toId) return [];
    const from = names.get(payment.fromId);
    const to = names.get(payment.toId);
    if (!from || !to) return [];
    return [`${from} paid ${to} ${formatDollars(amount)}`];
  });
  if (payments.length > 0) {
    lines.push('', 'Mid-game', ...payments);
  }

  lines.push('', 'Settle up');
  const transfers = transferLines(result.transfers);
  lines.push(...(transfers.length > 0 ? transfers : ['No transfers.']));
  lines.push('', result.balanced ? 'Balanced' : `Off by ${formatDollars(result.offBy)}`);
  return lines.join('\n');
}
