import { describe, expect, it } from 'vitest';
import { buyInChangeText } from './logText';
import { backspaceDigit, formatDollars, parseEntry, pushDigit } from './money';
import { buildShareText } from './shareText';
import { formatSgtTime, historyLine } from './time';

describe('history wording', () => {
  it('matches the rebuy line used in the edit log', () => {
    expect(historyLine('10:42 PM', buyInChangeText('Ann', 100, 50, 150))).toBe(
      '10:42 PM  Ann rebuy +$50 (In $100 -> $150)',
    );
    expect(buyInChangeText('Ann', 0, 100, 100)).toBe('Ann buy-in +$100 (In $0 -> $100)');
  });
});

describe('Singapore time', () => {
  it('formats 14:42 UTC as 10:42 PM in Singapore', () => {
    expect(formatSgtTime('2026-11-10T14:42:00.000Z')).toBe('10:42 PM');
  });

  it('formats noon and midnight', () => {
    expect(formatSgtTime('2026-11-10T04:00:00.000Z')).toBe('12:00 PM');
    expect(formatSgtTime('2026-11-10T16:00:00.000Z')).toBe('12:00 AM');
  });
});

describe('keypad entry', () => {
  it('builds whole-dollar amounts and refuses a seventh digit', () => {
    let value = '0';
    value = pushDigit(value, '0');
    expect(value).toBe('0');
    value = pushDigit(value, '2');
    value = pushDigit(value, '0');
    expect(value).toBe('20');
    expect(parseEntry(value)).toBe(20);
    value = backspaceDigit(value);
    expect(value).toBe('2');
    value = backspaceDigit(value);
    expect(value).toBe('0');
    expect(pushDigit('999999', '1')).toBe('999999');
    expect(pushDigit('12', 'a')).toBe('12');
  });
});

describe('share text', () => {
  it('includes the example nets, the mid-game payment, and the transfers', () => {
    expect(
      buildShareText({
        title: 'Poker Night',
        players: [
          { id: 'ann', name: 'Ann', buyIn: 100, cashOut: 40 },
          { id: 'ben', name: 'Ben', buyIn: 100, cashOut: 190 },
          { id: 'cal', name: 'Cal', buyIn: 100, cashOut: 70 },
        ],
        payments: [{ fromId: 'ann', toId: 'ben', amount: 20 }],
      }),
    ).toBe(
      [
        'Poker Night',
        '',
        'Ann: in $100, out $40, net -$40',
        'Ben: in $100, out $190, net +$70',
        'Cal: in $100, out $70, net -$30',
        '',
        'Mid-game',
        'Ann paid Ben $20',
        '',
        'Settle up',
        'Ann pays Ben $40',
        'Cal pays Ben $30',
        '',
        'Balanced',
      ].join('\n'),
    );
  });

  it('says when the table is off', () => {
    const text = buildShareText({
      title: 'Poker Night',
      players: [{ id: 'ann', name: 'Ann', buyIn: 100, cashOut: 40 }],
      payments: [],
    });
    expect(text).toContain('No transfers.');
    expect(text.endsWith('Off by $60')).toBe(true);
    expect(formatDollars(1000)).toBe('$1,000');
  });
});
