import { TypeBadge } from "../../components/TypeBadge";
import { C } from "../../data/design";
import { pairScore, pairReason } from "../../lib/analysis";
import { Member } from "../../types";

export function PairDetail({ a, b, onClose }: { a: Member; b: Member; onClose: () => void }) {
  const score = pairScore(a.type, b.type);
  const reason = pairReason(a.type, b.type);
  const tone = reason.kind === "best" ? "best" : reason.kind === "challenge" ? "challenge" : "neutral";
  const bgMap: Record<string, string> = { best: C.surfaceHi, challenge: C.surfaceHi, neutral: C.surfaceHi };
  const borderMap: Record<string, string> = { best: C.success, challenge: C.warning, neutral: C.border };

  return (
    <div
      className="mt-3 rounded-2xl p-4"
      style={{ background: bgMap[tone], border: `2px solid ${borderMap[tone]}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold" style={{ color: C.textL }}>
          페어 궁합 · {score}점
        </div>
        <button onClick={onClose} className="text-xs" style={{ color: C.textL }}>
          닫기
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={a.type} size="sm" />
        <div className="text-sm font-bold flex-1" style={{ color: C.text }}>
          {a.nickname}
        </div>
        <span className="text-xs" style={{ color: C.textL }}>vs</span>
        <div className="text-sm font-bold flex-1 text-right" style={{ color: C.text }}>
          {b.nickname}
        </div>
        <TypeBadge type={b.type} size="sm" />
      </div>
      <div className="text-xs leading-relaxed" style={{ color: C.text }}>
        {reason.why}
      </div>
    </div>
  );
}
