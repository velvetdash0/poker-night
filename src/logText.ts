import { formatDollars } from './money';

export function buyInChangeText(name: string, before: number, added: number, after: number): string {
  const kind = before === 0 ? 'buy-in' : 'rebuy';
  return `${name} ${kind} +${formatDollars(added)} (In ${formatDollars(before)} -> ${formatDollars(after)})`;
}

export function fieldChangeText(name: string, field: 'In' | 'Out', before: number, after: number): string {
  return `${name} ${field} ${formatDollars(before)} -> ${formatDollars(after)}`;
}

export function paymentText(from: string, to: string, amount: number): string {
  return `${from} paid ${to} ${formatDollars(amount)}`;
}

export function undoPaymentText(from: string, to: string, amount: number): string {
  return `Undid ${from} paid ${to} ${formatDollars(amount)}`;
}

export function addedPlayerText(name: string): string {
  return `Added ${name}`;
}

export function removedPlayerText(name: string, buyIn: number, cashOut: number, paymentCount: number): string {
  const payments =
    paymentCount === 0 ? '' : paymentCount === 1 ? ', 1 payment' : `, ${paymentCount} payments`;
  return `Removed ${name} (In ${formatDollars(buyIn)}, Out ${formatDollars(cashOut)}${payments})`;
}

export function renamedText(before: string, after: string): string {
  return `Renamed ${before} -> ${after}`;
}

export function renamedGameText(before: string, after: string): string {
  return `Renamed game "${before}" -> "${after}"`;
}

export const NEW_GAME_TEXT = 'New game started';
