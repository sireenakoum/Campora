const DEFAULT_SIZE = 120;
const DEFAULT_STROKE = 10;

export default function ProgressRing({
  value,
  size = DEFAULT_SIZE,
  stroke = DEFAULT_STROKE,
  children,
}) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="progress-ring"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-container-highest, #e3e2e7)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--campora-navy, #002d62)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2, 0.9, 0.3, 1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}