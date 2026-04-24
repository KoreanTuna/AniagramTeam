import { C } from "../../data/design";
import { TYPES } from "../../data/enneagram";
import { pairScore } from "../../lib/analysis";
import { Member } from "../../types";

type ChemistryStyle = { color: string; width: number; opacity: number };

function chemistryStyle(score: number): ChemistryStyle {
  if (score >= 75) return { color: C.success, width: 3, opacity: 0.95 };
  if (score >= 60) return { color: "#86EFAC", width: 2, opacity: 0.7 };
  if (score >= 45) return { color: C.textLL, width: 1.2, opacity: 0.4 };
  if (score >= 30) return { color: "#FCA5A5", width: 2, opacity: 0.75 };
  return { color: C.danger, width: 3, opacity: 0.95 };
}

export function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-[3px] w-5 rounded-full"
        style={{ background: color }}
      />
      <span style={{ color: C.text }}>{label}</span>
    </span>
  );
}

export function ChemistryGraph({
  members,
  onSelect,
}: {
  members: Member[];
  onSelect: (a: Member, b: Member) => void;
}) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const nodeRadius = 22;
  const ringRadius = members.length === 2 ? 80 : 118;

  const positions = members.map((m, i) => {
    const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
    return {
      member: m,
      angle,
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
    };
  });

  const pairs: Array<{
    a: (typeof positions)[number];
    b: (typeof positions)[number];
    score: number;
    style: ChemistryStyle;
  }> = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const score = pairScore(positions[i].member.type, positions[j].member.type);
      pairs.push({
        a: positions[i],
        b: positions[j],
        score,
        style: chemistryStyle(score),
      });
    }
  }
  // Draw extreme (good/bad) lines on top of neutral ones.
  pairs.sort((p, q) => Math.abs(50 - p.score) - Math.abs(50 - q.score));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[360px] mx-auto block"
      role="img"
      aria-label="팀원 간 궁합 관계도"
    >
      <g>
        {pairs.map((p, i) => (
          <g key={i} style={{ cursor: "pointer" }}>
            <line
              x1={p.a.x}
              y1={p.a.y}
              x2={p.b.x}
              y2={p.b.y}
              stroke={p.style.color}
              strokeWidth={p.style.width}
              strokeOpacity={p.style.opacity}
              strokeLinecap="round"
            />
            <line
              x1={p.a.x}
              y1={p.a.y}
              x2={p.b.x}
              y2={p.b.y}
              stroke="transparent"
              strokeWidth={16}
              role="button"
              tabIndex={0}
              aria-label={`${p.a.member.nickname}와(과) ${p.b.member.nickname}의 궁합 ${p.score}점 상세 보기`}
              onClick={() => onSelect(p.a.member, p.b.member)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.a.member, p.b.member);
                }
              }}
            >
              <title>
                {p.a.member.nickname} ↔ {p.b.member.nickname} · {p.score}
              </title>
            </line>
          </g>
        ))}
      </g>
      {positions.map((p) => {
        const T = TYPES[p.member.type];
        const labelDist = nodeRadius + 14;
        const labelX = p.x + labelDist * Math.cos(p.angle);
        const labelY = p.y + labelDist * Math.sin(p.angle);
        const cosA = Math.cos(p.angle);
        const anchor = cosA > 0.3 ? "start" : cosA < -0.3 ? "end" : "middle";
        return (
          <g key={p.member.uid}>
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeRadius}
              fill={T.color}
              stroke={C.surface}
              strokeWidth={3}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight={700}
              fill={C.white}
              style={{ pointerEvents: "none" }}
            >
              {p.member.type}
            </text>
            <text
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize="11"
              fontWeight={700}
              fill={C.text}
              style={{ pointerEvents: "none" }}
            >
              {p.member.nickname.length > 6
                ? `${p.member.nickname.slice(0, 6)}…`
                : p.member.nickname}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
