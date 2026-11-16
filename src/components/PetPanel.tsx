import { useEffect, useRef, useState } from "react";
import { STAGE_NAMES, type Pet, type Task } from "../game/engine";
import { petSpeech } from "../game/speech";
import { StatBar } from "./StatBar";

function spriteFor(pet: Pet): { src: string; big: boolean } {
  if (pet.stage === "egg") return { src: "sprites/egg_idle.png", big: false };
  if (pet.stage === "hatchling") {
    const file = pet.mood >= 80 ? "hatchling_happy.png" : "hatchling_idle.png";
    return { src: `sprites/${file}`, big: false };
  }
  if (pet.stage === "adult") {
    const file = pet.hunger < 30 ? "adult_hungry.png" : "adult_idle.png";
    return { src: `sprites/${file}`, big: true };
  }
  return { src: `sprites/${pet.stage}_idle.png`, big: true };
}

export function PetPanel({ pet, tasks, now }: { pet: Pet; tasks: Task[]; now: number }) {
  const sprite = spriteFor(pet);
  const line = petSpeech(pet, tasks, now);
  const [hurt, setHurt] = useState(false);
  const lastHp = useRef(pet.hp);

  // HP 掉了至少 1 點就閃紅。
  useEffect(() => {
    const dropped = pet.hp <= lastHp.current - 1;
    lastHp.current = pet.hp;
    if (!dropped || !pet.alive) return;
    setHurt(true);
    const timer = window.setTimeout(() => setHurt(false), 300);
    return () => window.clearTimeout(timer);
  }, [pet.hp, pet.alive]);

  return (
    <section className="pet" aria-label="寵物">
      <p className="stage-name">{STAGE_NAMES[pet.stage]}</p>
      {/* key 換了就重播出場動畫，孵化和進化時會閃一下。 */}
      <div key={pet.stage} className={`sprite-wrap ${hurt ? "hurt" : ""}`}>
        <img
          className={`pixel sprite ${sprite.big ? "big" : ""}`}
          src={`${import.meta.env.BASE_URL}${sprite.src}`}
          alt={`幽靈寵物，${STAGE_NAMES[pet.stage]}`}
        />
      </div>
      {line ? (
        <p className="speech" role="status">
          {line}
        </p>
      ) : (
        <p className="hint">完成第一件任務來孵蛋。</p>
      )}
      {pet.stage !== "egg" ? (
        <div className="stats">
          <StatBar label="生命" value={pet.hp} tone="hp" />
          <StatBar label="飽足" value={pet.hunger} tone="hunger" />
          <StatBar label="心情" value={pet.mood} tone="mood" />
          <p className="streak">
            連續 {pet.streak} 天 · 已完成 {pet.totalCompleted} 件
          </p>
        </div>
      ) : null}
    </section>
  );
}
