import { HOUR_MS } from "./constants";
import type { Pet, Task } from "./engine";

/** 寵物目前要說的一句話。蛋和死掉的寵物不說話。 */
export function petSpeech(pet: Pet, tasks: Task[], now: number): string | null {
  if (pet.stage === "egg" || !pet.alive) return null;

  const oldest = tasks
    .filter((t) => t.status === "overdue" && t.dueAt !== null)
    .sort((a, b) => a.dueAt! - b.dueAt!)[0];
  const lateHours = oldest ? (now - oldest.dueAt!) / HOUR_MS : 0;

  if (pet.stage === "hatchling") {
    if (oldest) return "不要……逾期壞壞 😢";
    if (pet.hunger < 40) return "肚子餓……做事嘛";
    if (pet.totalCompleted > 0) return "耶！！你做到了！！✨";
    return "嗚……👻 有任務嗎？";
  }

  if (oldest && lateHours > 6) {
    const title = oldest.title.slice(0, 40);
    return `「${title}」的鬼魂還在這屋子裡遊蕩，不肯安息 💀`;
  }
  if (oldest && lateHours >= 1) return "嗚哇，都過了好幾個小時，任務還是沒做完 😱👻";
  if (oldest) return "噓……你的任務就放在那邊，慢慢變涼了 🌙";
  if (pet.hunger < 30) return "上次的任務之後我就沒吃過東西……我快消失了 🌫️";
  if (pet.mood < 30) return "我現在的心情是：星期一的鬼屋。救救我。";
  if (pet.stage !== "adult") return "我是因為你才進化的。別讓我後悔 👑👻";
  return "你今天超順的，幽靈夥伴 ✨ 我感覺力量湧上來了！";
}
