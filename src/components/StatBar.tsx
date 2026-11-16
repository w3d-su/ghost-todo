export function StatBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "hp" | "hunger" | "mood";
}) {
  const shown = tone === "hp" ? Math.ceil(value - 1e-9) : Math.round(value);
  const low = tone === "hp" && value < 25;
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <div
        className="stat-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shown}
      >
        <div className={`stat-fill ${tone} ${low ? "low" : ""}`} style={{ width: `${value}%` }} />
      </div>
      <span className="stat-value">{shown}</span>
    </div>
  );
}
