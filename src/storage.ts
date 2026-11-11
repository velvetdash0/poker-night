import AsyncStorage from '@react-native-async-storage/async-storage';
import { wholeDollars } from './money';
import { MAX_DOLLARS, MAX_NAME, MAX_TITLE, normalizeName } from './names';
import { emptyGame, type Game, type LogEntry, type Payment, type Player } from './types';

const KEY = 'poker-night.game.v1';

export async function loadGame(): Promise<Game | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export async function saveGame(game: Game): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(game));
}

function sanitize(value: unknown): Game | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<Game>;
  if (record.version !== 1) return null;
  if (!Array.isArray(record.players) || !Array.isArray(record.payments) || !Array.isArray(record.log)) {
    return null;
  }

  const players: Player[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  for (const item of record.players) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<Player>;
    if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string') continue;
    if (seenIds.has(candidate.id)) continue;
    const name = normalizeName(candidate.name).slice(0, MAX_NAME);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seenNames.has(key)) continue;
    seenIds.add(candidate.id);
    seenNames.add(key);
    players.push({
      id: candidate.id,
      name,
      buyIn: Math.min(wholeDollars(candidate.buyIn), MAX_DOLLARS),
      cashOut: Math.min(wholeDollars(candidate.cashOut), MAX_DOLLARS),
    });
  }

  const payments: Payment[] = [];
  for (const item of record.payments) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<Payment>;
    if (
      typeof candidate.id !== 'string' ||
      typeof candidate.fromId !== 'string' ||
      typeof candidate.toId !== 'string'
    ) {
      continue;
    }
    if (!seenIds.has(candidate.fromId) || !seenIds.has(candidate.toId)) continue;
    if (candidate.fromId === candidate.toId) continue;
    const amount = Math.min(wholeDollars(candidate.amount), MAX_DOLLARS);
    if (amount <= 0) continue;
    payments.push({
      id: candidate.id,
      fromId: candidate.fromId,
      toId: candidate.toId,
      amount,
      at: typeof candidate.at === 'string' ? candidate.at : new Date(0).toISOString(),
    });
  }

  const log: LogEntry[] = [];
  for (const item of record.log) {
    if (!item || typeof item !== 'object') continue;
    const candidate = item as Partial<LogEntry>;
    if (typeof candidate.id !== 'string' || typeof candidate.at !== 'string' || typeof candidate.text !== 'string') {
      continue;
    }
    log.push({
      id: candidate.id,
      at: candidate.at,
      subject: typeof candidate.subject === 'string' ? candidate.subject : '',
      text: candidate.text,
    });
  }

  const title = typeof record.title === 'string' ? normalizeName(record.title).slice(0, MAX_TITLE) : '';
  return {
    version: 1,
    title: title || emptyGame().title,
    players,
    payments,
    log,
  };
}
