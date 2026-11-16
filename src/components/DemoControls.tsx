import { useState } from "react";
import { HOUR_MS } from "../game/constants";

export function DemoControls({
  offsetMs,
  onForward,
  onWipe,
}: {
  offsetMs: number;
  onForward: (hours: number) => void;
  onWipe: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const hours = Math.round(offsetMs / HOUR_MS);

  return (
    <details className="demo">
      <summary>示範時鐘（已快轉 {hours} 小時）</summary>
      <div className="demo-buttons">
        {[1, 6, 24].map((h) => (
          <button key={h} className="btn" onClick={() => onForward(h)}>
            +{h} 小時
          </button>
        ))}
        <button
          className="btn danger"
          onClick={() => {
            if (!confirming) {
              setConfirming(true);
              return;
            }
            setConfirming(false);
            onWipe();
          }}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? "再按一次確認清除" : "清除存檔"}
        </button>
      </div>
    </details>
  );
}
