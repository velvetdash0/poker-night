import { describe, expect, it } from 'vitest';
import {
  playerNet,
  settlement,
  transferLines,
  type LedgerPayment,
  type LedgerPlayer,
  type PlayerNet,
  type Transfer,
} from './settle';

const ann = (over: Partial<LedgerPlayer> = {}): LedgerPlayer => ({
  id: 'ann',
  name: 'Ann',
  buyIn: 100,
  cashOut: 40,
  ...over,
});
const ben = (over: Partial<LedgerPlayer> = {}): LedgerPlayer => ({
  id: 'ben',
  name: 'Ben',
  buyIn: 100,
  cashOut: 190,
  ...over,
});
const cal = (over: Partial<LedgerPlayer> = {}): LedgerPlayer => ({
  id: 'cal',
  name: 'Cal',
  buyIn: 100,
  cashOut: 70,
  ...over,
});

function applyTransfers(nets: readonly PlayerNet[], transfers: readonly Transfer[]): Map<string, number> {
  const remaining = new Map(nets.map((player) => [player.id, player.net]));
  for (const transfer of transfers) {
    remaining.set(transfer.fromId, (remaining.get(transfer.fromId) ?? 0) + transfer.amount);
    remaining.set(transfer.toId, (remaining.get(transfer.toId) ?? 0) - transfer.amount);
  }
  return remaining;
}

describe('playerNet', () => {
  it('uses out - in + paid - received', () => {
    expect(playerNet(100, 40, 20, 0)).toBe(-40);
    expect(playerNet(100, 190, 0, 20)).toBe(70);
    expect(playerNet(100, 70, 0, 0)).toBe(-30);
  });
});

describe('settlement', () => {
  it('settles the home-game example: Ann pays Ben $40, Cal pays Ben $30', () => {
    const players = [ann(), ben(), cal()];
    const payments: LedgerPayment[] = [{ fromId: 'ann', toId: 'ben', amount: 20 }];
    const result = settlement(players, payments);

    expect(result.nets.map((player) => [player.name, player.net])).toEqual([
      ['Ann', -40],
      ['Ben', 70],
      ['Cal', -30],
    ]);
    expect(result.total).toBe(0);
    expect(result.balanced).toBe(true);
    expect(result.offBy).toBe(0);
    expect(transferLines(result.transfers)).toEqual(['Ann pays Ben $40', 'Cal pays Ben $30']);
  });

  it('asks Ann for the full $60 when the mid-game payment has not happened', () => {
    const result = settlement([ann(), ben(), cal()], []);
    expect(transferLines(result.transfers)).toEqual(['Ann pays Ben $60', 'Cal pays Ben $30']);
    expect(result.balanced).toBe(true);
  });

  it('reports an unbalanced table and still pays what it can', () => {
    const players = [ann({ cashOut: 40 }), ben({ buyIn: 50, cashOut: 80 })];
    const result = settlement(players, []);

    expect(result.nets.map((player) => player.net)).toEqual([-60, 30]);
    expect(result.balanced).toBe(false);
    expect(result.total).toBe(-30);
    expect(result.offBy).toBe(30);
    expect(transferLines(result.transfers)).toEqual(['Ann pays Ben $30']);

    const remaining = applyTransfers(result.nets, result.transfers);
    expect(remaining.get('ben')).toBe(0);
    expect(remaining.get('ann')).toBe(-30);
  });

  it('is balanced with no transfers when every stack is zero', () => {
    const players = [
      ann({ buyIn: 0, cashOut: 0 }),
      ben({ buyIn: 0, cashOut: 0 }),
      cal({ buyIn: 0, cashOut: 0 }),
    ];
    const result = settlement(players, []);
    expect(result.balanced).toBe(true);
    expect(result.offBy).toBe(0);
    expect(result.total).toBe(0);
    expect(result.transfers).toEqual([]);
    expect(result.nets.every((player) => player.net === 0)).toBe(true);
  });

  it('is balanced with no transfers when everyone cashes their buy-in', () => {
    const players = [
      ann({ buyIn: 100, cashOut: 100 }),
      ben({ buyIn: 50, cashOut: 50 }),
      cal({ buyIn: 200, cashOut: 200 }),
    ];
    const result = settlement(players, []);
    expect(result.balanced).toBe(true);
    expect(result.transfers).toEqual([]);
  });

  it('leaves a single player off by their whole result and creates no transfer', () => {
    const result = settlement([ann({ buyIn: 100, cashOut: 40 })], []);
    expect(result.balanced).toBe(false);
    expect(result.offBy).toBe(60);
    expect(result.transfers).toEqual([]);
  });

  it('settles many players, including ties, zeros, and a mid-game payment', () => {
    const players: LedgerPlayer[] = [
      { id: 'ann', name: 'Ann', buyIn: 200, cashOut: 50 },
      { id: 'ben', name: 'Ben', buyIn: 100, cashOut: 300 },
      { id: 'cal', name: 'Cal', buyIn: 100, cashOut: 40 },
      { id: 'dee', name: 'Dee', buyIn: 50, cashOut: 120 },
      { id: 'eve', name: 'Eve', buyIn: 100, cashOut: 100 },
      { id: 'finn', name: 'Finn', buyIn: 80, cashOut: 10 },
      { id: 'gia', name: 'Gia', buyIn: 40, cashOut: 50 },
      { id: 'hal', name: 'Hal', buyIn: 30, cashOut: 30 },
    ];
    const payments: LedgerPayment[] = [
      { fromId: 'ann', toId: 'ben', amount: 20 },
      { fromId: 'ben', toId: 'cal', amount: 10 },
    ];
    const result = settlement(players, payments);

    expect(result.nets.map((player) => [player.name, player.net])).toEqual([
      ['Ann', -130],
      ['Ben', 190],
      ['Cal', -70],
      ['Dee', 70],
      ['Eve', 0],
      ['Finn', -70],
      ['Gia', 10],
      ['Hal', 0],
    ]);
    expect(result.balanced).toBe(true);
    expect(transferLines(result.transfers)).toEqual([
      'Ann pays Ben $130',
      'Cal pays Dee $70',
      'Finn pays Ben $60',
      'Finn pays Gia $10',
    ]);

    const remaining = applyTransfers(result.nets, result.transfers);
    for (const net of remaining.values()) expect(net).toBe(0);
  });

  it('breaks amount ties by name so the same table always settles the same way', () => {
    const players: LedgerPlayer[] = [
      { id: 'ben', name: 'Ben', buyIn: 10, cashOut: 0 },
      { id: 'ann', name: 'Ann', buyIn: 10, cashOut: 0 },
      { id: 'cal', name: 'Cal', buyIn: 0, cashOut: 20 },
    ];
    const result = settlement(players, []);
    expect(transferLines(result.transfers)).toEqual(['Ann pays Cal $10', 'Ben pays Cal $10']);

    const creditors: LedgerPlayer[] = [
      { id: 'cal', name: 'Cal', buyIn: 0, cashOut: 10 },
      { id: 'bea', name: 'Bea', buyIn: 0, cashOut: 10 },
      { id: 'ann', name: 'Ann', buyIn: 20, cashOut: 0 },
    ];
    expect(transferLines(settlement(creditors, []).transfers)).toEqual([
      'Ann pays Bea $10',
      'Ann pays Cal $10',
    ]);
  });

  it('lets one debtor pay several creditors, largest first', () => {
    const players: LedgerPlayer[] = [
      { id: 'ann', name: 'Ann', buyIn: 100, cashOut: 0 },
      { id: 'ben', name: 'Ben', buyIn: 0, cashOut: 60 },
      { id: 'cal', name: 'Cal', buyIn: 0, cashOut: 40 },
    ];
    expect(transferLines(settlement(players, []).transfers)).toEqual([
      'Ann pays Ben $60',
      'Ann pays Cal $40',
    ]);
  });

  it('drops a debt completely when a mid-game payment already covered it', () => {
    const players = [ann({ cashOut: 40 }), ben({ cashOut: 160 })];
    const result = settlement(players, [{ fromId: 'ann', toId: 'ben', amount: 60 }]);
    expect(result.nets.map((player) => player.net)).toEqual([0, 0]);
    expect(result.balanced).toBe(true);
    expect(result.transfers).toEqual([]);
  });

  it('ignores zero, negative, self, and unknown payments', () => {
    const players = [ann(), ben(), cal()];
    const payments: LedgerPayment[] = [
      { fromId: 'ann', toId: 'ann', amount: 50 },
      { fromId: 'ann', toId: 'ben', amount: 0 },
      { fromId: 'ann', toId: 'ben', amount: -10 },
      { fromId: 'ghost', toId: 'ben', amount: 40 },
      { fromId: 'ann', toId: 'ben', amount: 20 },
    ];
    expect(transferLines(settlement(players, payments).transfers)).toEqual([
      'Ann pays Ben $40',
      'Cal pays Ben $30',
    ]);
  });

  it('does not mutate the ledger handed in', () => {
    const players = [ann(), ben(), cal()];
    const payments: LedgerPayment[] = [{ fromId: 'ann', toId: 'ben', amount: 20 }];
    const before = JSON.stringify({ players, payments });
    settlement(players, payments);
    expect(JSON.stringify({ players, payments })).toBe(before);
  });

  it('treats fractional dollars as whole dollars', () => {
    const result = settlement([ann({ buyIn: 100.9, cashOut: 40.2 })], []);
    expect(result.nets[0]?.net).toBe(-60);
    expect(result.offBy).toBe(60);
  });

  it('keeps an empty table balanced', () => {
    const result = settlement([], [{ fromId: 'ann', toId: 'ben', amount: 20 }]);
    expect(result.balanced).toBe(true);
    expect(result.transfers).toEqual([]);
    expect(result.nets).toEqual([]);
  });

  it('clears the smaller side when the table is off', () => {
    const players: LedgerPlayer[] = [
      { id: 'ann', name: 'Ann', buyIn: 40, cashOut: 0 },
      { id: 'ben', name: 'Ben', buyIn: 10, cashOut: 0 },
      { id: 'cal', name: 'Cal', buyIn: 0, cashOut: 20 },
    ];
    const result = settlement(players, []);
    expect(result.offBy).toBe(30);
    expect(transferLines(result.transfers)).toEqual(['Ann pays Cal $20']);
    const remaining = [...applyTransfers(result.nets, result.transfers).values()];
    expect(remaining.reduce((sum, net) => sum + net, 0)).toBe(result.total);
    expect(remaining.filter((net) => net > 0)).toEqual([]);
  });
});
