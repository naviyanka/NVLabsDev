export function MetricBar({
  label, value, unit = "%", critical, warning,
}: { label: string; value: number; unit?: string; critical?: number; warning?: number }) {
  const color =
    critical !== undefined && value >= critical
      ? "var(--crit)"
      : warning !== undefined && value >= warning
        ? "var(--warn)"
        : "var(--teal)";
  return (
    <div>
      <div className="flex items-baseline justify-between pb-1.5">
        <span className="eyebrow">{label}</span>
        <span className="mono text-[12px] font-semibold" style={{ color }}>
          {value.toFixed(0)}
          <span className="text-[var(--text-sub)]">{unit}</span>
        </span>
      </div>
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${Math.min(100, value)}%`, background: color, boxShadow: `0 0 7px ${color}66` }} />
      </div>
    </div>
  );
}
