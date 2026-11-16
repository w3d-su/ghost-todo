import * as C from "./constants";

/**
 * 遊戲核心：全部是純函式。時間一律由呼叫端傳入 `now`（Unix ms），
 * 這裡不讀 Date.now()，所以快轉和測試都能重現。
 */

export const STAGES = [
  "egg",
  "hatchling",
  "adult",
  "adult_night_owl",
  "adult_early_bird",
  "adult_scholar",
  "adult_haunter",
] as const;
export type Stage = (typeof STAGES)[number];
export type EvolvedStage = Exclude<Stage, "egg" | "hatchling" | "adult">;

export const CATEGORIES = ["study", "work", "life", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export type TaskStatus = "todo" | "overdue" | "done";

export interface Task {
  id: string;
  title: string;
  category: Category;
  dueAt: number | null;
  createdAt: number;
  completedAt: number | null;
  status: TaskStatus;
}

export interface Completion {
  at: number;
  category: Category;
}

export interface Pet {
  stage: Stage;
  alive: boolean;
  hp: number;
  hunger: number;
  mood: number;
  /** 有完成任務的連續天數。 */
  streak: number;
  totalCompleted: number;
  lastCompletionAt: number | null;
  becameAdultAt: number | null;
  /** 最近 10 次完成紀錄，新的在前。決定進化型態。 */
  recent: Completion[];
  bornAt: number;
  lastTickAt: number;
  diedAt: number | null;
  epitaph: string | null;
}

export interface Tombstone {
  id: string;
  stage: Stage;
  bornAt: number;
  diedAt: number;
  totalCompleted: number;
  epitaph: string;
}

export interface Game {
  version: 1;
  pet: Pet;
  tasks: Task[];
  graveyard: Tombstone[];
  /** 示範快轉累積的時間。遊戲時間 = 真實時間 + offset。 */
  clockOffsetMs: number;
}

export const STAGE_NAMES: Record<Stage, string> = {
  egg: "蛋",
  hatchling: "幼靈",
  adult: "成靈",
  adult_night_owl: "夜貓子",
  adult_early_bird: "早起鳥",
  adult_scholar: "學者",
  adult_haunter: "作祟鬼",
};

export const CATEGORY_NAMES: Record<Category, string> = {
  study: "讀書",
  work: "工作",
  life: "生活",
  other: "其他",
};

const clamp = (value: number) => Math.min(C.MAX_STAT, Math.max(0, value));

/** 當地日曆日 YYYY-MM-DD，用來算連續天數。 */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function newPet(now: number): Pet {
  return {
    stage: "egg",
    alive: true,
    hp: C.MAX_STAT,
    hunger: C.MAX_STAT,
    mood: C.MAX_STAT,
    streak: 0,
    totalCompleted: 0,
    lastCompletionAt: null,
    becameAdultAt: null,
    recent: [],
    bornAt: now,
    lastTickAt: now,
    diedAt: null,
    epitaph: null,
  };
}

export function newGame(now: number): Game {
  return { version: 1, pet: newPet(now), tasks: [], graveyard: [], clockOffsetMs: 0 };
}

/* ---------- 時間推進 ---------- */

function markOverdue(tasks: Task[], now: number): Task[] {
  let changed = false;
  const next = tasks.map((task) => {
    if (task.status === "todo" && task.dueAt !== null && task.dueAt <= now) {
      changed = true;
      return { ...task, status: "overdue" as const };
    }
    return task;
  });
  return changed ? next : tasks;
}

/** 一段殭屍數量不變的區間。HP 歸零時算出精確的死亡時間。 */
function applySegment(pet: Pet, from: number, to: number, zombies: number): Pet {
  const hpRate = pet.stage === "egg" ? 0 : C.DECAY_HP + zombies * C.ZOMBIE_DRAIN;
  const fullHours = (to - from) / C.HOUR_MS;
  const dies = hpRate > 0 && pet.hp - hpRate * fullHours <= 1e-9;
  const diedAt = dies ? Math.round(from + (pet.hp / hpRate) * C.HOUR_MS) : null;
  const hours = diedAt !== null ? (diedAt - from) / C.HOUR_MS : fullHours;
  return {
    ...pet,
    hp: dies ? 0 : clamp(pet.hp - hpRate * hours),
    hunger: clamp(pet.hunger - C.DECAY_HUNGER * hours),
    mood: clamp(pet.mood - C.DECAY_MOOD * hours),
    alive: !dies,
    diedAt,
  };
}

function advancePet(pet: Pet, tasks: Task[], now: number): Pet {
  const from = pet.lastTickAt;
  // 每個逾期任務從期限那一刻開始放出一隻殭屍。蛋不會被殭屍攻擊。
  const dues =
    pet.stage === "egg"
      ? []
      : tasks.flatMap((t) => (t.status === "overdue" && t.dueAt !== null ? [t.dueAt] : []));
  const points = [...new Set([from, now, ...dues.filter((d) => d > from && d < now)])].sort(
    (a, b) => a - b,
  );

  let next = pet;
  for (let i = 0; i < points.length - 1 && next.alive; i += 1) {
    const segFrom = points[i]!;
    const zombies = dues.filter((d) => d <= segFrom).length;
    next = applySegment(next, segFrom, points[i + 1]!, zombies);
  }

  if (
    next.alive &&
    next.streak > 0 &&
    next.lastCompletionAt !== null &&
    now - next.lastCompletionAt > C.STREAK_BREAK_HOURS * C.HOUR_MS
  ) {
    next = { ...next, streak: 0, mood: clamp(next.mood - C.STREAK_BREAK_MOOD) };
  }
  return { ...next, lastTickAt: now };
}

/** 把遊戲推進到 `now`：標記逾期、衰減、殭屍吸血、死亡時刻上墓誌銘。 */
export function catchUp(game: Game, now: number): Game {
  const tasks = markOverdue(game.tasks, now);
  let pet = game.pet;
  if (pet.alive && now > pet.lastTickAt) pet = advancePet(pet, tasks, now);
  if (!pet.alive && pet.epitaph === null) pet = { ...pet, epitaph: writeEpitaph(pet, tasks) };
  if (pet === game.pet && tasks === game.tasks) return game;
  return { ...game, pet, tasks };
}

/* ---------- 進化 ---------- */

/** 最近完成紀錄過半符合某條件時決定型態。優先序：夜貓子 > 早起鳥 > 學者 > 作祟鬼。 */
export function resolveEvolvedForm(recent: Completion[]): EvolvedStage {
  const n = Math.min(10, recent.length);
  if (n === 0) return "adult_haunter";
  let night = 0;
  let early = 0;
  let scholar = 0;
  for (const c of recent.slice(0, n)) {
    const hour = new Date(c.at).getHours();
    if (hour >= 22 || hour < 6) night += 1;
    else if (hour < 11) early += 1;
    if (c.category === "study" || c.category === "work") scholar += 1;
  }
  const majority = Math.floor(n / 2) + 1;
  if (night >= majority) return "adult_night_owl";
  if (early >= majority) return "adult_early_bird";
  if (scholar >= majority) return "adult_scholar";
  return "adult_haunter";
}

function grow(pet: Pet, now: number): Pet {
  if (pet.stage === "egg") return { ...pet, stage: "hatchling" };
  if (
    pet.stage === "hatchling" &&
    pet.totalCompleted >= C.ADULT_TASKS &&
    pet.streak >= C.ADULT_STREAK
  ) {
    return { ...pet, stage: "adult", becameAdultAt: now };
  }
  if (
    pet.stage === "adult" &&
    pet.streak >= C.EVOLVE_STREAK &&
    pet.becameAdultAt !== null &&
    now - pet.becameAdultAt >= C.EVOLVE_HOURS_AS_ADULT * C.HOUR_MS
  ) {
    return { ...pet, stage: resolveEvolvedForm(pet.recent) };
  }
  return pet;
}

/* ---------- 玩家動作 ---------- */

export interface TaskDraft {
  title: string;
  category: Category;
  dueAt: number | null;
}

export function addTask(game: Game, draft: TaskDraft, id: string, now: number): Game {
  const title = draft.title.trim().slice(0, C.TITLE_MAX);
  if (!title) return game;
  const task: Task = {
    id,
    title,
    category: draft.category,
    dueAt: draft.dueAt,
    createdAt: now,
    completedAt: null,
    status: "todo",
  };
  const g = catchUp(game, now);
  return catchUp({ ...g, tasks: [...g.tasks, task] }, now);
}

export function completeTask(game: Game, id: string, now: number): Game {
  const g = catchUp(game, now);
  const task = g.tasks.find((t) => t.id === id);
  if (!task || task.status === "done") return g;

  const tasks = g.tasks.map((t) =>
    t.id === id ? { ...t, status: "done" as const, completedAt: now } : t,
  );
  if (!g.pet.alive) return { ...g, tasks };

  const late = task.status === "overdue";
  const pet = g.pet;
  const newDay = pet.lastCompletionAt === null || dayKey(pet.lastCompletionAt) !== dayKey(now);
  const fed: Pet = {
    ...pet,
    hp: clamp(pet.hp + (late ? C.COMPLETE_OVERDUE_HP : C.COMPLETE_HP)),
    hunger: clamp(pet.hunger + (late ? C.COMPLETE_OVERDUE_HUNGER : C.COMPLETE_HUNGER)),
    mood: clamp(pet.mood + C.COMPLETE_MOOD),
    streak: newDay ? pet.streak + 1 : pet.streak,
    totalCompleted: pet.totalCompleted + 1,
    lastCompletionAt: now,
    recent: [{ at: now, category: task.category }, ...pet.recent].slice(0, 10),
  };
  return { ...g, tasks, pet: grow(fed, now) };
}

export function deleteTask(game: Game, id: string, now: number): Game {
  const g = catchUp(game, now);
  return { ...g, tasks: g.tasks.filter((t) => t.id !== id) };
}

/** 寵物死後才能重生：舊的進墓園，換一顆新蛋。任務清單保留。 */
export function rebirth(game: Game, now: number): Game {
  const g = catchUp(game, now);
  const pet = g.pet;
  if (pet.alive) return g;
  const diedAt = pet.diedAt ?? now;
  const stone: Tombstone = {
    id: `${diedAt}`,
    stage: pet.stage,
    bornAt: pet.bornAt,
    diedAt,
    totalCompleted: pet.totalCompleted,
    epitaph: pet.epitaph ?? FALLBACK_EPITAPH,
  };
  return { ...g, pet: newPet(now), graveyard: [stone, ...g.graveyard] };
}

/** 示範快轉。offset 只會往前加，接著照一般流程補算。 */
export function fastForward(game: Game, hours: number, realNow: number): Game {
  const clockOffsetMs = game.clockOffsetMs + hours * C.HOUR_MS;
  return catchUp({ ...game, clockOffsetMs }, realNow + clockOffsetMs);
}

/* ---------- 墓誌銘（模板，不用 AI） ---------- */

export const FALLBACK_EPITAPH = "這裡躺著一張待辦清單。\n它從來沒有勝算。";

const short = (title: string) => (title.length > 12 ? `${title.slice(0, 12)}…` : title);

export function writeEpitaph(pet: Pet, tasks: Task[]): string {
  const unfinished = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.status === "overdue" ? 0 : 1) - (b.status === "overdue" ? 0 : 1))
    .map((t) => short(t.title));
  const [a, b] = unfinished;
  if (!a) return FALLBACK_EPITAPH;
  const name = STAGE_NAMES[pet.stage];
  const options = [
    `這裡長眠著一隻${name}。\n它到最後都在等\n「${a}」。`,
    `生前最大的心願：\n看你完成「${a}」。\n願望終究沒有實現。`,
  ];
  if (b) options.push(`「${a}」沒做，\n「${b}」也沒做。\n它就這樣餓成一縷煙。`);
  return options[(pet.diedAt ?? 0) % options.length]!;
}
