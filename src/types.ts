export type Player = {
  id: string;
  name: string;
  buyIn: number;
  cashOut: number;
};

export type Payment = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  at: string;
};

export type LogEntry = {
  id: string;
  at: string;
  subject: string;
  text: string;
};

export type Game = {
  version: 1;
  title: string;
  players: Player[];
  payments: Payment[];
  log: LogEntry[];
};

export function emptyGame(): Game {
  return {
    version: 1,
    title: 'Poker Night',
    players: [],
    payments: [],
    log: [],
  };
}
