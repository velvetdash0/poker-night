import { formatDollars, wholeDollars } from './money';

/**
 * Settlement for one home game on one phone.
 *
 * Net = cash out − buy-in + paid mid-game − received mid-game.
 * Positive net: the table owes this player.
 * Negative net: this player owes the table.
 *
 * Mid-game payments are cash already handed across the table. They move
 * who is owed what, and they cancel out of the table total. The game is
 * balanced exactly when the cash-outs sum to the buy-ins.
 *
 * Transfers use a greedy pass: repeatedly match the largest debtor with
 * the largest creditor and move the smaller of the two amounts. Equal
 * amounts break toward the earlier name (then id) so the result is stable.
 *
 * Kept free of UI and storage so shared editing, PayNow, or stats can
 * call the same function later.
 */

export type LedgerPlayer = {
  id: string;
  name: string;
  buyIn: number;
  cashOut: number;
};

export type LedgerPayment = {
  fromId: string;
  toId: string;
  amount: number;
};

export type PlayerNet = {
  id: string;
  name: string;
  /** Positive when the player is owed money, negative when they owe. */
  net: number;
};

export type Transfer = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
};

export type Settlement = {
  nets: PlayerNet[];
  /** Sum of every net. Zero when the table reconciles. */
  total: number;
  balanced: boolean;
  /** Absolute imbalance, in dollars. */
  offBy: number;
  transfers: Transfer[];
};

export function playerNet(buyIn: number, cashOut: number, paid: number, received: number): number {
  return wholeDollars(cashOut) - wholeDollars(buyIn) + wholeDollars(paid) - wholeDollars(received);
}

export function settlement(players: readonly LedgerPlayer[], payments: readonly LedgerPayment[]): Settlement {
  const ids = new Set(players.map((player) => player.id));
  const paid = new Map<string, number>();
  const received = new Map<string, number>();

  for (const payment of payments) {
    const amount = wholeDollars(payment.amount);
    if (amount <= 0) continue;
    if (payment.fromId === payment.toId) continue;
    if (!ids.has(payment.fromId) || !ids.has(payment.toId)) continue;
    paid.set(payment.fromId, (paid.get(payment.fromId) ?? 0) + amount);
    received.set(payment.toId, (received.get(payment.toId) ?? 0) + amount);
  }

  const nets: PlayerNet[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    net: playerNet(player.buyIn, player.cashOut, paid.get(player.id) ?? 0, received.get(player.id) ?? 0),
  }));

  const total = nets.reduce((sum, player) => sum + player.net, 0);
  return {
    nets,
    total,
    balanced: total === 0,
    offBy: Math.abs(total),
    transfers: greedyTransfers(nets),
  };
}

export function transferLine(transfer: Transfer): string {
  return `${transfer.fromName} pays ${transfer.toName} ${formatDollars(transfer.amount)}`;
}

export function transferLines(transfers: readonly Transfer[]): string[] {
  return transfers.map(transferLine);
}

function greedyTransfers(nets: readonly PlayerNet[]): Transfer[] {
  const debtors = nets.filter((player) => player.net < 0).map((player) => ({ ...player }));
  const creditors = nets.filter((player) => player.net > 0).map((player) => ({ ...player }));
  const transfers: Transfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byLargestThenName);
    creditors.sort(byLargestThenName);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(-debtor.net, creditor.net);
    if (amount <= 0) break;
    transfers.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount,
    });
    debtor.net += amount;
    creditor.net -= amount;
    if (debtor.net === 0) debtors.shift();
    if (creditor.net === 0) creditors.shift();
  }

  return transfers;
}

function byLargestThenName(a: PlayerNet, b: PlayerNet): number {
  const magnitude = Math.abs(b.net) - Math.abs(a.net);
  if (magnitude !== 0) return magnitude;
  const name = a.name.localeCompare(b.name);
  if (name !== 0) return name;
  return a.id.localeCompare(b.id);
}
