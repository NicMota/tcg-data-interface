export function Sparkline({
  values,
  positive = true,
}: {
  values: number[];
  positive?: boolean;
}) {
  if (values.length < 2) return <span>—</span>;
  const min = Math.min(...values),
    max = Math.max(...values),
    span = max - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * 120},${34 - ((v - min) / span) * 28}`,
    )
    .join(" ");
  return (
    <svg
      className={`sparkline ${positive ? "positive" : "negative"}`}
      viewBox="0 0 120 40"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
