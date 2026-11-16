import { useEffect, useState } from "react";
import type { Task } from "../game/engine";

const FRAMES = ["zombie_walk_0.png", "zombie_walk_1.png", "zombie_walk_2.png"];

function hash(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** 每個逾期任務一隻殭屍，在畫面底部由右往左爬。 */
export function Zombies({ overdue }: { overdue: Task[] }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (overdue.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 180);
    return () => window.clearInterval(timer);
  }, [overdue.length]);

  return (
    <div className="zombies" aria-hidden="true">
      {overdue.map((task) => {
        const h = hash(task.id);
        return (
          <img
            key={task.id}
            className="pixel zombie"
            src={`${import.meta.env.BASE_URL}sprites/${FRAMES[frame]}`}
            alt=""
            style={{ top: `${70 + (h % 24)}%`, animationDelay: `-${h % 24}s` }}
          />
        );
      })}
    </div>
  );
}
