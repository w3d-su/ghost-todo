import { describe, expect, it } from "vitest";
import { HOUR_MS } from "./constants";
import {
  addTask,
  catchUp,
  completeTask,
  FALLBACK_EPITAPH,
  fastForward,
  newGame,
  rebirth,
  resolveEvolvedForm,
  type Game,
} from "./engine";

// 用當地時間建構，測試不受時區影響。
const T0 = new Date(2026, 10, 16, 12, 0).getTime();

function hatched(): Game {
  let g = addTask(newGame(T0), { title: "暖身", category: "other", dueAt: null }, "t0", T0);
  g = completeTask(g, "t0", T0);
  return g;
}

describe("成長", () => {
  it("完成第一件任務時蛋孵化", () => {
    const g = hatched();
    expect(g.pet.stage).toBe("hatchling");
    expect(g.pet.totalCompleted).toBe(1);
    expect(g.pet.streak).toBe(1);
  });

  it("同一天完成多件任務，連續天數只加一", () => {
    let g = hatched();
    g = addTask(g, { title: "再一件", category: "other", dueAt: null }, "t1", T0 + 1000);
    g = completeTask(g, "t1", T0 + 2000);
    expect(g.pet.streak).toBe(1);
    expect(g.pet.totalCompleted).toBe(2);
  });

  it("7 件任務且連續 3 天後長成成靈", () => {
    // 跨 3 個日曆日，每次間隔都短於寵物餓死的時間。
    const times = [
      new Date(2026, 10, 16, 23, 0),
      new Date(2026, 10, 16, 23, 1),
      new Date(2026, 10, 17, 1, 0),
      new Date(2026, 10, 17, 1, 1),
      new Date(2026, 10, 17, 12, 0),
      new Date(2026, 10, 17, 12, 1),
      new Date(2026, 10, 18, 0, 30),
    ].map((d) => d.getTime());
    let g = newGame(times[0]!);
    for (let i = 0; i < times.length; i += 1) {
      const at = times[i]!;
      g = addTask(g, { title: `任務${i}`, category: "work", dueAt: null }, `t${i}`, at);
      g = completeTask(g, `t${i}`, at);
    }
    expect(g.pet.stage).toBe("adult");
  });
});

describe("衰減與殭屍", () => {
  it("蛋不扣 HP，但會餓", () => {
    const g = catchUp(newGame(T0), T0 + 2 * HOUR_MS);
    expect(g.pet.hp).toBe(100);
    expect(g.pet.hunger).toBe(84);
  });

  it("殭屍從期限那一刻開始吸血", () => {
    let g = hatched();
    g = addTask(g, { title: "報告", category: "work", dueAt: T0 + HOUR_MS }, "r", T0);
    g = catchUp(g, T0 + 3 * HOUR_MS);
    // 3 小時自然衰減 15，加上逾期 2 小時 × 3 = 6
    expect(g.tasks.find((t) => t.id === "r")?.status).toBe("overdue");
    expect(g.pet.hp).toBeCloseTo(100 - 15 - 6);
  });

  it("分多次推進和一次推進結果相同", () => {
    let base = hatched();
    base = addTask(base, { title: "報告", category: "work", dueAt: T0 + HOUR_MS }, "r", T0);
    const once = catchUp(base, T0 + 10 * HOUR_MS);
    let split = base;
    for (let h = 1; h <= 10; h += 1) split = catchUp(split, T0 + h * HOUR_MS);
    expect(split.pet.hp).toBeCloseTo(once.pet.hp);
    expect(split.pet.hunger).toBeCloseTo(once.pet.hunger);
  });
});

describe("死亡與重生", () => {
  it("HP 歸零時死亡，記錄精確死亡時間，墓誌銘提到逾期任務", () => {
    let g = hatched();
    g = addTask(g, { title: "繳房租", category: "life", dueAt: T0 }, "rent", T0);
    // HP 100，每小時 5 + 3 = 8，12.5 小時後死亡
    g = fastForward(g, 24, T0);
    expect(g.pet.alive).toBe(false);
    expect(g.pet.diedAt).toBe(T0 + 12.5 * HOUR_MS);
    expect(g.pet.epitaph).toContain("繳房租");
  });

  it("沒有未完成任務時使用預設墓誌銘", () => {
    const g = fastForward(hatched(), 48, T0);
    expect(g.pet.epitaph).toBe(FALLBACK_EPITAPH);
  });

  it("重生後舊寵物進墓園，換新蛋", () => {
    const dead = fastForward(hatched(), 48, T0);
    const g = rebirth(dead, T0 + dead.clockOffsetMs);
    expect(g.pet.stage).toBe("egg");
    expect(g.pet.alive).toBe(true);
    expect(g.graveyard).toHaveLength(1);
    expect(g.graveyard[0]?.stage).toBe("hatchling");
  });

  it("活著的寵物不能重生", () => {
    const g = hatched();
    expect(rebirth(g, T0).graveyard).toHaveLength(0);
  });
});

describe("進化型態", () => {
  const at = (hour: number) => new Date(2026, 10, 16, hour).getTime();

  it("多數在深夜完成 → 夜貓子", () => {
    const recent = [23, 1, 2, 14].map((h) => ({ at: at(h), category: "life" as const }));
    expect(resolveEvolvedForm(recent)).toBe("adult_night_owl");
  });

  it("多數在早上完成 → 早起鳥", () => {
    const recent = [7, 8, 9, 20].map((h) => ({ at: at(h), category: "life" as const }));
    expect(resolveEvolvedForm(recent)).toBe("adult_early_bird");
  });

  it("多數是讀書或工作 → 學者", () => {
    const recent = [14, 15, 16].map((h) => ({ at: at(h), category: "study" as const }));
    expect(resolveEvolvedForm(recent)).toBe("adult_scholar");
  });

  it("沒有明顯傾向 → 作祟鬼", () => {
    const recent = [14, 15].map((h) => ({ at: at(h), category: "life" as const }));
    expect(resolveEvolvedForm(recent)).toBe("adult_haunter");
  });
});
