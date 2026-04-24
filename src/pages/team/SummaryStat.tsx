import { PixelIcon } from "../../components/PixelIcon";
import { C } from "../../data/design";

export function SummaryStat({
  label,
  value,
  suffix,
  hint,
  accent,
}: {
  label: string;
  value: string;
  suffix: string;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div
        className="text-[10px] font-bold tracking-[0.14em]"
        style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
      >
        {label.toUpperCase()}
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span
          className="text-xl font-bold"
          style={{ color: accent, fontFamily: "ui-monospace, Menlo, monospace" }}
        >
          {value}
        </span>
        {suffix && (
          <span
            className="text-xs"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {suffix}
          </span>
        )}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: C.textL }}>
        {hint}
      </div>
    </div>
  );
}

export function avgPairHint(score: number | null): string {
  if (score === null) return "2명 이상일 때 보여요";
  if (score >= 75) return "서로 꽤 잘 맞는 편";
  if (score >= 60) return "무난한 케미";
  if (score >= 50) return "잔잔한 긴장 공존";
  return "삐걱거리는 구간 주의";
}

export function MedalBadge({ rank }: { rank: 1 | 2 | 3 | number }) {
  const color = rank === 1 ? "#FACC15" : rank === 2 ? "#CBD5E1" : rank === 3 ? "#D97706" : C.textL;
  const label = rank === 1 ? "1" : rank === 2 ? "2" : rank === 3 ? "3" : `${rank}`;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        fontFamily: "ui-monospace, Menlo, monospace",
      }}
    >
      <PixelIcon name="medal" size={10} color={color} />
      {label}
    </span>
  );
}
