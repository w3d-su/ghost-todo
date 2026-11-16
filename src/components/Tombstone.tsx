import { useEffect, useState } from "react";
import { HOUR_MS } from "../game/constants";
import { FALLBACK_EPITAPH, STAGE_NAMES, type Pet } from "../game/engine";

export function Tombstone({ pet, onRebirth }: { pet: Pet; onRebirth: () => void }) {
  const [ready, setReady] = useState(false);

  // 停一下再出現按鈕，避免連點直接跳過墓碑。
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const lived = Math.max(0, Math.round(((pet.diedAt ?? pet.lastTickAt) - pet.bornAt) / HOUR_MS));

  return (
    <div className="tombstone" role="dialog" aria-modal="true" aria-label="寵物墓碑">
      <img
        className="pixel stone"
        src={`${import.meta.env.BASE_URL}sprites/tombstone.png`}
        alt="幽靈寵物的墓碑"
      />
      <p className="epitaph">{pet.epitaph ?? FALLBACK_EPITAPH}</p>
      <p className="hint">
        {STAGE_NAMES[pet.stage]} · 活了 {lived} 小時 · 完成 {pet.totalCompleted} 件任務
      </p>
      {ready ? (
        <button className="btn primary" autoFocus onClick={onRebirth}>
          孵一顆新蛋
        </button>
      ) : (
        <p className="hint">墓碑還在安放……</p>
      )}
    </div>
  );
}
