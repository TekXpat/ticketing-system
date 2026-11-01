// A simple bar, 0 to 100. Colours come from the theme variables.
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="bg-surface-2 h-3 w-full overflow-hidden rounded-full"
    >
      <div className="bg-brand h-full rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}
