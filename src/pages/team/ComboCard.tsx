import { PixelIcon } from "../../components/PixelIcon";
import { TypeBadge } from "../../components/TypeBadge";
import { C } from "../../data/design";
import { TYPES } from "../../data/enneagram";
import { Member } from "../../types";

export function ComboCard({
  combo,
  tone,
}: {
  combo: { a: Member; b: Member; score: number; reason: { kind: string; why: string } };
  tone: "best" | "challenge";
}) {
  const isBest = tone === "best";
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.surfaceHi,
        border: `1px solid ${isBest ? C.success : C.warning}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-bold flex items-center gap-1.5"
          style={{ color: isBest ? C.success : C.warning }}
        >
          <PixelIcon name={isBest ? "heart" : "warn"} size={12} />
          {isBest ? "환상의 콤비" : "긴장 주의"}
        </div>
        <div className="text-xs" style={{ color: C.textL }}>
          궁합 {combo.score}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={combo.a.type} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: C.text }}>
            {combo.a.nickname}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {combo.a.type}번 {TYPES[combo.a.type].name}
          </div>
        </div>
        <PixelIcon name={isBest ? "heart" : "bolt"} size={16} color={isBest ? C.success : C.warning} />
        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm font-bold truncate" style={{ color: C.text }}>
            {combo.b.nickname}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {combo.b.type}번 {TYPES[combo.b.type].name}
          </div>
        </div>
        <TypeBadge type={combo.b.type} size="sm" />
      </div>
      <div className="text-xs leading-relaxed pt-2" style={{ color: C.text, borderTop: `1px solid ${C.border}` }}>
        {combo.reason.why}
      </div>
    </div>
  );
}
