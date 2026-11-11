export const colors = {
  background: '#FFFFFF',
  ink: '#1B1E23',
  muted: '#8E919A',
  faint: '#B4B7C0',
  label: '#B0B3BC',
  pill: '#F2F3F5',
  accent: '#5FCB86',
  accentPressed: '#49B572',
  accentText: '#2F9D5C',
  accentSoft: '#E5F6EC',
  chipText: '#3AAA68',
  warning: '#C4841D',
  warningSoft: '#F8E7C8',
  danger: '#C2554F',
  white: '#FFFFFF',
  page: '#E7E9EE',
  toast: '#1B1E23',
};

export const font = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export type FontWeight = keyof typeof font;
