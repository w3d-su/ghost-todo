import { useCallback, useEffect, useRef, useState } from "react";
import * as engine from "./game/engine";
import type { Game, TaskDraft } from "./game/engine";
import { clearGame, loadGame, loadMuted, saveGame, saveMuted } from "./storage";
import { playSound, soundForChange } from "./sound";

/** 背景每 30 秒補算一次。實際衰減依時間差計算，間隔只影響畫面更新。 */
const TICK_MS = 30_000;

const gameNow = (g: Game) => Date.now() + g.clockOffsetMs;

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useGame() {
  const [game, setGame] = useState<Game>(() => {
    const loaded = loadGame() ?? engine.newGame(Date.now());
    return engine.catchUp(loaded, gameNow(loaded));
  });
  const [muted, setMuted] = useState(loadMuted);
  const gameRef = useRef(game);
  const mutedRef = useRef(muted);

  // 所有狀態變更都走這裡：計算、存檔、挑音效。
  const apply = useCallback((change: (g: Game, now: number) => Game) => {
    const prev = gameRef.current;
    const next = change(prev, gameNow(prev));
    if (next === prev) return;
    gameRef.current = next;
    setGame(next);
    saveGame(next);
    const sound = soundForChange(prev, next);
    if (sound && !mutedRef.current) playSound(sound);
  }, []);

  useEffect(() => {
    saveGame(gameRef.current);
    const tick = () => apply((g, now) => engine.catchUp(g, now));
    const timer = window.setInterval(tick, TICK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apply]);

  return {
    game,
    now: gameNow(game),
    muted,
    toggleMuted: useCallback(() => {
      const next = !mutedRef.current;
      mutedRef.current = next;
      setMuted(next);
      saveMuted(next);
    }, []),
    addTask: useCallback(
      (draft: TaskDraft) => apply((g, now) => engine.addTask(g, draft, newId(), now)),
      [apply],
    ),
    completeTask: useCallback(
      (id: string) => apply((g, now) => engine.completeTask(g, id, now)),
      [apply],
    ),
    deleteTask: useCallback(
      (id: string) => apply((g, now) => engine.deleteTask(g, id, now)),
      [apply],
    ),
    rebirth: useCallback(() => apply((g, now) => engine.rebirth(g, now)), [apply]),
    fastForward: useCallback(
      (hours: number) => apply((g) => engine.fastForward(g, hours, Date.now())),
      [apply],
    ),
    wipe: useCallback(() => {
      clearGame();
      const fresh = engine.newGame(Date.now());
      gameRef.current = fresh;
      setGame(fresh);
      saveGame(fresh);
    }, []),
  };
}
