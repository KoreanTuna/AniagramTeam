import { C } from "../data/design";
import { daysUntil } from "../lib/teamCode";

export function ExpiredBadge() {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
      style={{
        background: "rgba(239,68,68,0.12)",
        color: C.danger,
        border: `1px solid rgba(239,68,68,0.3)`,
      }}
    >
      만료됨
    </span>
  );
}

/** 팀 남은 기간/만료 여부를 한 줄 텍스트로 표시. */
export function ExpiryText({
  expiresAt,
  expired,
  expiredLabel = "만료됨",
}: {
  expiresAt: number;
  expired: boolean;
  expiredLabel?: string;
}) {
  if (expired) {
    return <span style={{ color: C.danger }}>{expiredLabel}</span>;
  }
  return <span>{daysUntil(expiresAt)}일 남음</span>;
}

/** 팀이 만료되었다는 안내 배너. 대시보드 등 페이지 상단에 사용. */
export function ExpiredBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-3 text-xs leading-relaxed"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: `1px solid rgba(239,68,68,0.3)`,
        color: C.textL,
      }}
    >
      {children ?? "이 팀은 만료돼서 읽기 전용이에요. 새 팀을 만들어 다시 시작해보세요."}
    </div>
  );
}
