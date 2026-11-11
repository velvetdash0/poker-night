import { useCallback, useEffect, useRef, useState } from 'react';
import { uid } from './id';
import {
  NEW_GAME_TEXT,
  addedPlayerText,
  buyInChangeText,
  fieldChangeText,
  paymentText,
  removedPlayerText,
  renamedGameText,
  renamedText,
  undoPaymentText,
} from './logText';
import { wholeDollars } from './money';
import { MAX_DOLLARS, MAX_NAME, MAX_TITLE, normalizeName } from './names';
import { loadGame, saveGame } from './storage';
import { emptyGame, type Game, type LogEntry, type Payment, type Player } from './types';

export function useGame() {
  const [game, setGame] = useState<Game>(emptyGame);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const gameRef = useRef(game);

  const commit = useCallback((next: Game) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGame().then((saved) => {
      if (cancelled) return;
      if (saved) {
        gameRef.current = saved;
        setGame(saved);
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    saveGame(game).then(
      () => {
        if (!cancelled) setSaveError(false);
      },
      () => {
        if (!cancelled) setSaveError(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [game, ready]);

  const addPlayer = useCallback(
    (raw: string): string | null => {
      const name = normalizeName(raw);
      if (!name) return 'Enter a name';
      if (name.length > MAX_NAME) return `Use ${MAX_NAME} characters or fewer`;
      const prev = gameRef.current;
      if (taken(prev.players, name)) return 'That name is already in the game';
      const player: Player = { id: uid(), name, buyIn: 0, cashOut: 0 };
      commit(
        withLog(prev, name, addedPlayerText(name), {
          players: [...prev.players, player],
        }),
      );
      return null;
    },
    [commit],
  );

  const renamePlayer = useCallback(
    (id: string, raw: string): string | null => {
      const name = normalizeName(raw);
      if (!name) return 'Enter a name';
      if (name.length > MAX_NAME) return `Use ${MAX_NAME} characters or fewer`;
      const prev = gameRef.current;
      const player = prev.players.find((item) => item.id === id);
      if (!player) return 'That player is gone';
      if (taken(prev.players, name, id)) return 'That name is already in the game';
      if (player.name === name) return null;
      commit(
        withLog(prev, name, renamedText(player.name, name), {
          players: prev.players.map((item) => (item.id === id ? { ...item, name } : item)),
        }),
      );
      return null;
    },
    [commit],
  );

  const removePlayer = useCallback(
    (id: string) => {
      const prev = gameRef.current;
      const player = prev.players.find((item) => item.id === id);
      if (!player) return;
      const paymentCount = prev.payments.filter((payment) => payment.fromId === id || payment.toId === id).length;
      commit(
        withLog(prev, player.name, removedPlayerText(player.name, player.buyIn, player.cashOut, paymentCount), {
          players: prev.players.filter((item) => item.id !== id),
          payments: prev.payments.filter((payment) => payment.fromId !== id && payment.toId !== id),
        }),
      );
    },
    [commit],
  );

  const addRebuy = useCallback(
    (id: string, amount: number): string | null => {
      const dollars = wholeDollars(amount);
      if (dollars <= 0) return 'Enter an amount';
      const prev = gameRef.current;
      const player = prev.players.find((item) => item.id === id);
      if (!player) return 'That player is gone';
      const after = player.buyIn + dollars;
      if (after > MAX_DOLLARS) return 'That total is too large';
      commit(
        withLog(prev, player.name, buyInChangeText(player.name, player.buyIn, dollars, after), {
          players: replacePlayer(prev.players, id, { buyIn: after }),
        }),
      );
      return null;
    },
    [commit],
  );

  const setBuyIn = useCallback(
    (id: string, amount: number): string | null => {
      const dollars = wholeDollars(amount);
      if (dollars > MAX_DOLLARS) return 'That total is too large';
      const prev = gameRef.current;
      const player = prev.players.find((item) => item.id === id);
      if (!player) return 'That player is gone';
      if (player.buyIn === dollars) return null;
      commit(
        withLog(prev, player.name, fieldChangeText(player.name, 'In', player.buyIn, dollars), {
          players: replacePlayer(prev.players, id, { buyIn: dollars }),
        }),
      );
      return null;
    },
    [commit],
  );

  const setCashOut = useCallback(
    (id: string, amount: number): string | null => {
      const dollars = wholeDollars(amount);
      if (dollars > MAX_DOLLARS) return 'That total is too large';
      const prev = gameRef.current;
      const player = prev.players.find((item) => item.id === id);
      if (!player) return 'That player is gone';
      if (player.cashOut === dollars) return null;
      commit(
        withLog(prev, player.name, fieldChangeText(player.name, 'Out', player.cashOut, dollars), {
          players: replacePlayer(prev.players, id, { cashOut: dollars }),
        }),
      );
      return null;
    },
    [commit],
  );

  const addPayment = useCallback(
    (fromId: string, toId: string, amount: number): string | null => {
      const dollars = wholeDollars(amount);
      if (dollars <= 0) return 'Enter an amount';
      if (fromId === toId) return 'Pick two different players';
      const prev = gameRef.current;
      const from = prev.players.find((item) => item.id === fromId);
      const to = prev.players.find((item) => item.id === toId);
      if (!from || !to) return 'Pick two players';
      const payment: Payment = {
        id: uid(),
        fromId,
        toId,
        amount: dollars,
        at: new Date().toISOString(),
      };
      commit(
        withLog(prev, from.name, paymentText(from.name, to.name, dollars), {
          payments: [...prev.payments, payment],
        }),
      );
      return null;
    },
    [commit],
  );

  const undoPayment = useCallback(
    (id: string) => {
      const prev = gameRef.current;
      const payment = prev.payments.find((item) => item.id === id);
      if (!payment) return;
      const from = prev.players.find((item) => item.id === payment.fromId)?.name ?? 'Someone';
      const to = prev.players.find((item) => item.id === payment.toId)?.name ?? 'someone';
      commit(
        withLog(prev, from, undoPaymentText(from, to, payment.amount), {
          payments: prev.payments.filter((item) => item.id !== id),
        }),
      );
    },
    [commit],
  );

  const renameGame = useCallback(
    (raw: string): string | null => {
      const title = normalizeName(raw);
      if (!title) return 'Enter a name';
      if (title.length > MAX_TITLE) return `Use ${MAX_TITLE} characters or fewer`;
      const prev = gameRef.current;
      if (prev.title === title) return null;
      commit(withLog(prev, title, renamedGameText(prev.title, title), { title }));
      return null;
    },
    [commit],
  );

  const reset = useCallback(() => {
    const prev = gameRef.current;
    const untouched =
      prev.players.length === 0 &&
      prev.payments.length === 0 &&
      prev.log.length === 0 &&
      prev.title === emptyGame().title;
    if (untouched) return;
    commit(withLog(emptyGame(), 'New game', NEW_GAME_TEXT, {}));
  }, [commit]);

  return {
    game,
    ready,
    saveError,
    addPlayer,
    renamePlayer,
    removePlayer,
    addRebuy,
    setBuyIn,
    setCashOut,
    addPayment,
    undoPayment,
    renameGame,
    reset,
  };
}

function withLog(game: Game, subject: string, text: string, patch: Partial<Omit<Game, 'log' | 'version'>>): Game {
  const entry: LogEntry = {
    id: uid(),
    at: new Date().toISOString(),
    subject,
    text,
  };
  return {
    ...game,
    ...patch,
    log: [...game.log, entry],
  };
}

function taken(players: Player[], name: string, exceptId?: string): boolean {
  const key = name.toLowerCase();
  return players.some((player) => player.id !== exceptId && player.name.toLowerCase() === key);
}

function replacePlayer(players: Player[], id: string, patch: Partial<Player>): Player[] {
  return players.map((player) => (player.id === id ? { ...player, ...patch } : player));
}
