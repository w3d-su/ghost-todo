import type { Game } from "./game/engine";

const GAME_KEY = "haunted-pet-lite:v1";
const MUTED_KEY = "haunted-pet-lite:muted";

/** 讀不到或格式不對就回傳 null，由呼叫端開新遊戲。 */
export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(GAME_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Game>;
    if (data.version !== 1 || !data.pet || !Array.isArray(data.tasks)) return null;
    return {
      version: 1,
      pet: data.pet,
      tasks: data.tasks,
      graveyard: Array.isArray(data.graveyard) ? data.graveyard : [],
      clockOffsetMs: typeof data.clockOffsetMs === "number" ? data.clockOffsetMs : 0,
    };
  } catch {
    return null;
  }
}

export function saveGame(game: Game): void {
  try {
    localStorage.setItem(GAME_KEY, JSON.stringify(game));
  } catch {
    // 無痕模式或空間不足時存不了，這次開啟仍可以玩。
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(GAME_KEY);
  } catch {
    // 忽略
  }
}

/** 音效預設靜音。 */
export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) !== "false";
  } catch {
    return true;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "true" : "false");
  } catch {
    // 忽略
  }
}
