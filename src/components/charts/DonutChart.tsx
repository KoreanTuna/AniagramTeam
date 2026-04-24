import { C } from "../../data/design";

export type DonutSegment = {
  key: string;
  label: string;
  emoji?: string;
  value: number;
  color: string;
};

type Props = {
  segments: DonutSegment[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
};

export function DonutChart({ segments, size = 160, centerLabel, centerSub }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const innerR = size * 0.27;

  // 세그먼트 path 계산 (SVG arc)
  let accAngle = -Math.PI / 2;

  const arcPaths = segments.map((seg) => {
    if (total === 0) return null;
    const portion = seg.value / total;
    const start = accAngle;
    const end = accAngle + portion * Math.PI * 2;
    accAngle = end;
    // 세그먼트가 전체이면 원 전체를 그려야 함
    if (portion >= 0.9999) {
      return (
        <g key={seg.key}>
          <circle cx={cx} cy={cy} r={r} fill={seg.color} />
          <circle cx={cx} cy={cy} r={innerR} fill={C.surface} />
        </g>
      );
    }
    if (portion === 0) return null;
    const largeArc = portion > 0.5 ? 1 : 0;
    const x1 = cx + Math.cos(start) * r;
    const y1 = cy + Math.sin(start) * r;
    const x2 = cx + Math.cos(end) * r;
    const y2 = cy + Math.sin(end) * r;
    const xi1 = cx + Math.cos(end) * innerR;
    const yi1 = cy + Math.sin(end) * innerR;
    const xi2 = cx + Math.cos(start) * innerR;
    const yi2 = cy + Math.sin(start) * innerR;
    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${xi1} ${yi1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2}`,
      "Z",
    ].join(" ");
    return <path key={seg.key} d={d} fill={seg.color} />;
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size, maxWidth: "100%" }}
        role="img"
      >
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill={C.surfaceActive} />
        ) : (
          arcPaths
        )}
        {total > 0 && <circle cx={cx} cy={cy} r={innerR} fill={C.surface} />}
        {centerLabel && (
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.14}
            fontWeight={700}
            fill={C.text}
          >
            {centerLabel}
          </text>
        )}
        {centerSub && (
          <text
            x={cx}
            y={cy + size * 0.1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.07}
            fill={C.textL}
          >
            {centerSub}
          </text>
        )}
      </svg>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 w-full">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: s.color }}
            />
            <span style={{ color: C.text, fontWeight: 500 }}>
              {s.label}
            </span>
            <span style={{ color: C.textL }}>
              {s.value}
              {total > 0 && ` (${Math.round((s.value / total) * 100)}%)`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
