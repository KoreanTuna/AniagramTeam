import { TypeId } from "../../types";
import { TYPES } from "../../data/enneagram";
import { ANIMALS } from "../../data/animals";
import { C } from "../../data/design";

type Props = {
  scores: Record<TypeId, number>;
  highlightType?: TypeId;
  size?: number; // SVG 논리 크기 (viewBox)
};

const ALL: TypeId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * 9축 레이더 차트. 라벨은 8비트 동물 미니 스프라이트 + 유형 번호.
 */
export function RadarChart({ scores, highlightType, size = 320 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const maxScore = Math.max(...ALL.map((t) => scores[t]), 1);
  const pad = size * 0.1;

  const angleFor = (i: number) => (Math.PI * 2 * i) / 9 - Math.PI / 2;

  const axisPoint = (i: number, r: number) => {
    const a = angleFor(i);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1].map((f) =>
    ALL.map((_, i) => axisPoint(i, radius * f).join(",")).join(" ")
  );

  const dataPts = ALL.map((t, i) => {
    const r = (scores[t] / maxScore) * radius;
    return axisPoint(i, r).join(",");
  }).join(" ");

  const labelR = radius + size * 0.1;
  const spriteSize = size * 0.08;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${size + pad * 2} ${size + pad * 2}`}
      className="w-full h-auto max-w-sm mx-auto block"
      role="img"
      aria-label="애니어그램 유형 레이더 차트"
    >
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={C.border} strokeWidth={1} />
      ))}
      {ALL.map((_, i) => {
        const [x, y] = axisPoint(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={C.bg2} strokeWidth={1} />;
      })}
      <polygon
        points={dataPts}
        fill={C.primary}
        fillOpacity={0.25}
        stroke={C.primary}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {ALL.map((t, i) => {
        const r = (scores[t] / maxScore) * radius;
        const [x, y] = axisPoint(i, r);
        const isTop = t === highlightType;
        return (
          <circle
            key={t}
            cx={x}
            cy={y}
            r={isTop ? 5 : 3}
            fill={isTop ? C.primaryHi : C.primary}
            stroke={C.surface}
            strokeWidth={isTop ? 2 : 1}
          />
        );
      })}
      {ALL.map((t, i) => {
        const [x, y] = axisPoint(i, labelR);
        const info = TYPES[t];
        const sprite = ANIMALS[t].sprite;
        const cols = sprite.pixels[0].length;
        const rows = sprite.pixels.length;
        const px = spriteSize / Math.max(cols, rows);
        const spriteW = cols * px;
        const spriteH = rows * px;
        const isTop = t === highlightType;
        return (
          <g key={`lbl-${t}`}>
            <g transform={`translate(${x - spriteW / 2}, ${y - spriteH - 2})`}>
              {sprite.pixels.map((row, rr) =>
                row.split("").map((ch, cc) => {
                  const col = sprite.palette[ch];
                  if (!col || col === "transparent") return null;
                  return (
                    <rect
                      key={`${rr}-${cc}`}
                      x={cc * px}
                      y={rr * px}
                      width={px}
                      height={px}
                      fill={col}
                      shapeRendering="crispEdges"
                    />
                  );
                })
              )}
            </g>
            <text
              x={x}
              y={y + size * 0.04}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.032}
              fontWeight={isTop ? 700 : 500}
              fill={isTop ? info.color : C.textL}
              style={{ fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              {t}번
            </text>
          </g>
        );
      })}
    </svg>
  );
}
