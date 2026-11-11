const MAX_ENTRY_DIGITS = 6;

/** Whole dollars, zero when the value is missing, negative, or not a number. */
export function wholeDollars(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.trunc(n);
}

export function formatDollars(amount: number): string {
  const n = Math.trunc(Number.isFinite(amount) ? amount : 0);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US')}`;
}

export function formatSignedDollars(amount: number): string {
  const n = Math.trunc(Number.isFinite(amount) ? amount : 0);
  if (n > 0) return `+$${n.toLocaleString('en-US')}`;
  if (n < 0) return `-$${Math.abs(n).toLocaleString('en-US')}`;
  return '$0';
}

export function formatCount(amount: number): string {
  const n = Math.trunc(Number.isFinite(amount) ? amount : 0);
  return Math.abs(n).toLocaleString('en-US');
}

export function pushDigit(current: string, digit: string): string {
  if (!/^[0-9]$/.test(digit)) return current;
  if (current === '0') return digit;
  if (current.length >= MAX_ENTRY_DIGITS) return current;
  return current + digit;
}

export function backspaceDigit(current: string): string {
  if (current.length <= 1) return '0';
  return current.slice(0, -1);
}

export function parseEntry(current: string): number {
  return wholeDollars(current);
}
