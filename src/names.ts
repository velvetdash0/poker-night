export const MAX_NAME = 24;
export const MAX_TITLE = 40;
export const MAX_DOLLARS = 999_999;

export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}
