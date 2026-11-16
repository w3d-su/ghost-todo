import type { Game } from "./game/engine";

export const SOUNDS = {
  task_complete: "sfx/task_complete.ogg",
  zombie_spawn: "sfx/zombie_spawn.ogg",
  pet_hurt: "sfx/pet_hurt.ogg",
  pet_death: "sfx/pet_death.ogg",
  pet_hatch: "sfx/pet_hatch.ogg",
  pet_evolve: "sfx/pet_evolve.ogg",
} as const;

export type SoundName = keyof typeof SOUNDS;

export function playSound(name: SoundName): void {
  try {
    const audio = new Audio(`${import.meta.env.BASE_URL}${SOUNDS[name]}`);
    audio.volume = 0.6;
    void audio.play().catch(() => {});
  } catch {
    // 瀏覽器不支援或尚未有使用者互動時就安靜略過。
  }
}

const zombieCount = (g: Game) => g.tasks.filter((t) => t.status === "overdue").length;

/** 比較前後兩個狀態，挑出最重要的一個音效。 */
export function soundForChange(prev: Game, next: Game): SoundName | null {
  const a = prev.pet;
  const b = next.pet;
  if (!a.alive) return null;
  if (!b.alive) return "pet_death";
  if (a.stage !== b.stage && b.stage.startsWith("adult")) return "pet_evolve";
  if (a.stage === "egg" && b.stage === "hatchling") return "pet_hatch";
  if (zombieCount(next) > zombieCount(prev)) return "zombie_spawn";
  if (b.totalCompleted > a.totalCompleted) return "task_complete";
  if (b.hp <= a.hp - 1) return "pet_hurt";
  return null;
}
