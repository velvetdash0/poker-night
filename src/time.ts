/** Clock time in Asia/Singapore, e.g. "10:42 PM". */
export function formatSgtTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Singapore',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const raw = (parts.find((part) => part.type === 'dayPeriod')?.value ?? '').replace(/\./g, '').toUpperCase();
  const period = raw.startsWith('A') ? 'AM' : raw.startsWith('P') ? 'PM' : raw;
  return `${hour}:${minute} ${period}`.trim();
}

export function historyLine(time: string, text: string): string {
  return `${time}  ${text}`;
}
