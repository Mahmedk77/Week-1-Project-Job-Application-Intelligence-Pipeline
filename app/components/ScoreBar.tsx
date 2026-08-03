type ScoreBarProps = {
  label: string;
  score: number;
  reasoning: string;
};

function scoreTone(score: number) {
  if (score >= 8) {
    return {
      bar: "#3fb97f",
      badgeBg: "rgba(63, 185, 127, 0.12)",
      badgeText: "#2f9e6c",
    };
  }
  if (score >= 5) {
    return {
      bar: "#e0a63e",
      badgeBg: "rgba(224, 166, 62, 0.14)",
      badgeText: "#c98d24",
    };
  }
  return {
    bar: "#e2604f",
    badgeBg: "rgba(226, 96, 79, 0.13)",
    badgeText: "#d3503e",
  };
}

export function ScoreBar({ label, score, reasoning }: ScoreBarProps) {
  const tone = scoreTone(score);
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-5"
      style={{
        background: "var(--surface-2-tint)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {label}
        </h3>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
          style={{ background: tone.badgeBg, color: tone.badgeText }}
        >
          {score}/10
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--border-subtle)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: tone.bar }}
        />
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {reasoning}
      </p>
    </div>
  );
}
