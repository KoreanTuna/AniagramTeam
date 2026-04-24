import { useRef, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn, GhostBtn } from "../components/Btn";
import { TypeBadge } from "../components/TypeBadge";
import { PixelAnimal } from "../components/PixelAnimal";
import { PixelIcon } from "../components/PixelIcon";
import { RadarChart } from "../components/charts/RadarChart";
import { bgStyle, C } from "../data/design";
import { TYPES, REL, ROLE_LABELS } from "../data/enneagram";
import { ANIMALS } from "../data/animals";
import { TypeId, Role } from "../types";
import { clearResult, getPendingJoin, loadResult } from "../lib/localResult";
import { topTypesOf, wingInfoOf } from "../lib/analysis";
import { ROLE_TYPE_SYNERGY } from "../data/roleTypeSynergy";
import { Toast } from "../components/Toast";

export function Result() {
  const nav = useNavigate();
  const result = loadResult();
  const [showRel, setShowRel] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const captureRef = useRef<HTMLDivElement | null>(null);

  if (!result) {
    return <Navigate to="/" replace />;
  }

  const top = result.type;
  const T = TYPES[top];
  const rel = REL[top];
  const pendingJoin = getPendingJoin();
  const roleLabel = ROLE_LABELS[result.role];
  const animal = ANIMALS[top];
  const wingData = wingInfoOf(top, result.scores);
  const synergy = ROLE_TYPE_SYNERGY[result.role][top];
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tied = topTypesOf(result.scores);
  const isTied = tied.length > 1;

  const onRetake = () => {
    clearResult();
    nav("/role");
  };

  const shareText = [
    `나의 에니어그램 결과`,
    `${top}번. ${T.name} — ${synergy.headline}`,
    ``,
    synergy.body,
    ``,
    `너의 유형도 확인해봐`,
    shareUrl,
  ].join("\n");

  const onShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${top}번. ${T.name}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // 사용자가 취소(AbortError)한 경우는 조용히 종료, 실제 실패면 클립보드로 폴백.
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setToast("결과가 복사됐어요. 친구에게 붙여넣기 해보세요.");
    } catch {
      setToast("공유에 실패했어요. 다시 시도해주세요.");
    }
  };

  const onSaveImage = async () => {
    if (!captureRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: C.surface,
      });
      const link = document.createElement("a");
      link.download = `aniagram-${top}-${T.name}.png`;
      link.href = dataUrl;
      link.click();
      setToast("결과 카드를 저장했어요.");
    } catch (e) {
      console.error("image save failed", e);
      setToast("이미지 저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={bgStyle} className="flex items-start justify-center p-3 sm:p-6">
      <Card className="overflow-hidden my-0 sm:my-4">
        <div
          ref={captureRef}
          className="px-6 pt-8 pb-6 text-center"
          style={{ background: `linear-gradient(180deg, ${T.bg}, ${C.surface})` }}
        >
          <div
            className="text-[10px] tracking-[0.18em] font-bold mb-3"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {roleLabel.label.toUpperCase()} · YOUR ANIMAL
          </div>
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-2xl"
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle, ${T.color}22 0%, transparent 70%), ${C.surface}`,
              border: `1px solid ${T.color}44`,
            }}
          >
            <PixelAnimal type={top} size={120} hint />
          </div>
          <div className="text-xs font-medium mb-1" style={{ color: T.color }}>
            {animal.name}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: C.text }}>
            {top}번. {T.name}
          </h2>
          <div className="text-xs" style={{ color: C.textL }}>
            {T.tag} · {T.sub}
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold mt-3"
            style={{ color: C.textLL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            ANIAGRAM · aniagram-team.web.app
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>
            {T.desc}
          </p>

          <div
            className="rounded-2xl p-4 text-sm leading-relaxed"
            style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.textL }}
          >
            <div className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: T.color }}>
              <PixelIcon name="search" size={12} />
              유형 개요
            </div>
            <p style={{ color: C.text }}>{T.overview}</p>
          </div>

          <WingCard top={top} scores={result.scores} wingData={wingData} accent={T.color} />

          <RoleSynergyCard
            role={result.role}
            synergy={synergy}
            typeName={T.name}
            accent={T.color}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="rounded-2xl p-4"
              style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
            >
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: T.color }}>
                <PixelIcon name="warn" size={12} />
                두려워하는 것
              </div>
              <div className="text-sm leading-relaxed" style={{ color: C.text }}>
                {T.fear}
              </div>
            </div>
            <div
              className="rounded-2xl p-4"
              style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
            >
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: T.color }}>
                <PixelIcon name="target" size={12} accent={T.color} />
                바라는 것
              </div>
              <div className="text-sm leading-relaxed" style={{ color: C.text }}>
                {T.desire}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 space-y-3" style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}>
            <div>
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: T.color }}>
                <PixelIcon name="muscle" size={12} />
                나의 강점
              </div>
              <div className="text-sm" style={{ color: C.text }}>
                {T.strength}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: T.color }}>
                <PixelIcon name="sprout" size={12} />
                성장 포인트
              </div>
              <div className="text-sm" style={{ color: C.text }}>
                {T.growth}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: T.color }}>
                <PixelIcon name="team" size={12} />
                팀에서의 역할
              </div>
              <div className="text-sm" style={{ color: C.text }}>
                {T.teamRole}
              </div>
            </div>
          </div>

          <div>
            <div
              className="text-[10px] tracking-[0.18em] font-bold mb-2 text-center"
              style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              9TYPE PROFILE
            </div>
            <RadarChart scores={result.scores} highlightType={top} />
          </div>

          <button
            onClick={() => setShowRel((v) => !v)}
            className="w-full text-left rounded-2xl p-4 transition-all"
            style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
                <PixelIcon name="link" size={14} color={C.primary} />
                나와 잘 맞는 / 상극 유형 보기
              </span>
              <span className="text-xs" style={{ color: C.textL }}>
                {showRel ? "접기" : "펼치기"}
              </span>
            </div>
          </button>

          {showRel && (
            <div className="space-y-3">
              <RelCard title="환상의 케미" types={rel.best} primary why={rel.matchWhy} />
              <RelCard title="긴장 주의" types={rel.challenge} why={rel.challengeWhy} />
            </div>
          )}

          {isTied && (
            <div
              className="rounded-2xl p-3 text-xs leading-relaxed"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: `1px solid ${C.warning}55`,
                color: C.text,
              }}
            >
              <div className="font-bold mb-1" style={{ color: C.warning }}>
                접전이에요
              </div>
              {tied.join("번, ")}번 유형이 동점이라 가장 많은 표를 받은 {top}번으로 보여드리고 있어요. 다시 풀면 결과가 달라질 수 있어요.
            </div>
          )}

          <div className="space-y-2.5 pt-2">
            {pendingJoin ? (
              <PrimaryBtn onClick={() => nav(`/join/${pendingJoin}`)}>
                <span className="inline-flex items-center gap-2">
                  <PixelIcon name="key" size={14} />
                  초대받은 팀 ({pendingJoin})에 참여하기
                </span>
              </PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={() => nav("/team/create")}>
                <span className="inline-flex items-center gap-2">
                  <PixelIcon name="team" size={14} />
                  이 결과로 팀 만들기
                </span>
              </PrimaryBtn>
            )}
            <SecondaryBtn onClick={onShare}>
              <span className="inline-flex items-center gap-2">
                <PixelIcon name="sparkle" size={14} />
                친구에게 공유하기
              </span>
            </SecondaryBtn>
            <SecondaryBtn onClick={onSaveImage} disabled={saving}>
              <span className="inline-flex items-center gap-2">
                <PixelIcon name="trophy" size={14} />
                {saving ? "이미지 만드는 중..." : "결과 카드 이미지 저장"}
              </span>
            </SecondaryBtn>
            {!pendingJoin && (
              <SecondaryBtn onClick={() => nav("/", { state: { joinOpen: true } })}>
                <span className="inline-flex items-center gap-2">
                  <PixelIcon name="key" size={14} />
                  팀 코드로 참여하기
                </span>
              </SecondaryBtn>
            )}
            <GhostBtn onClick={onRetake}>다시 해보기</GhostBtn>
          </div>
        </div>
      </Card>

      <Toast message={toast} onHide={() => setToast("")} />
    </div>
  );
}

function RoleSynergyCard({
  role,
  synergy,
  typeName,
  accent,
}: {
  role: Role;
  synergy: { headline: string; body: string };
  typeName: string;
  accent: string;
}) {
  const roleLabel = ROLE_LABELS[role];
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: accent }}>
        <PixelIcon name="sparkle" size={12} color={accent} accent={accent} />
        내 직군과의 시너지
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-bold"
          style={{ background: `${accent}22`, color: accent, fontFamily: "ui-monospace, Menlo, monospace" }}
        >
          {roleLabel.label} × {typeName}
        </span>
      </div>
      <div>
        <div className="text-sm font-bold mb-1" style={{ color: C.text }}>
          {synergy.headline}
        </div>
        <p className="text-[12.5px] leading-[1.7]" style={{ color: C.textL }}>
          {synergy.body}
        </p>
      </div>
    </div>
  );
}

function WingCard({
  top,
  scores,
  wingData,
  accent,
}: {
  top: TypeId;
  scores: Record<TypeId, number>;
  wingData: ReturnType<typeof wingInfoOf>;
  accent: string;
}) {
  const [w1, w2] = REL[top].wings;
  const s1 = scores[w1];
  const s2 = scores[w2];
  const maxSide = Math.max(s1, s2, 1);

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: accent }}>
          <PixelIcon name="sprout" size={12} />
          나의 날개 (Wing)
        </div>
        {wingData && (
          <div
            className="text-[11px] px-2 py-0.5 rounded-full font-bold"
            style={{ background: `${accent}22`, color: accent, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            {top}w{wingData.wing}
          </div>
        )}
      </div>

      {wingData ? (
        <>
          <div>
            <div className="text-sm font-bold" style={{ color: C.text }}>
              {wingData.info.name}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: C.textL }}>
              {wingData.info.tag} · {wingData.info.sub}
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: C.text }}>
            {wingData.info.desc}
          </p>
          <ul className="space-y-1 pl-0 list-none">
            {wingData.info.traits.map((t) => (
              <li key={t} className="text-xs flex items-start gap-1.5" style={{ color: C.textL }}>
                <span style={{ color: accent }}>•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: C.textL }}>
          이번 결과에선 양쪽 날개가 모두 비어 있어 한쪽으로 치우치지 않았어요. 다시 해보면 달라질 수 있어요.
        </p>
      )}

      <div
        className="pt-3 space-y-2"
        style={{ borderTop: `1px dashed ${C.border}` }}
      >
        <div className="text-[10px] tracking-[0.18em] font-bold" style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
          WING SCORES
        </div>
        <WingBar
          label={`${top}w${w1} · ${TYPES[w1].name}`}
          score={s1}
          max={maxSide}
          active={wingData?.wing === w1}
          accent={accent}
        />
        <WingBar
          label={`${top}w${w2} · ${TYPES[w2].name}`}
          score={s2}
          max={maxSide}
          active={wingData?.wing === w2}
          accent={accent}
        />
      </div>
    </div>
  );
}

function WingBar({
  label,
  score,
  max,
  active,
  accent,
}: {
  label: string;
  score: number;
  max: number;
  active: boolean;
  accent: string;
}) {
  const pct = max === 0 ? 0 : Math.round((score / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span style={{ color: active ? accent : C.textL, fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
        <span style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
          {score}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceActive }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: active ? accent : `${accent}55` }}
        />
      </div>
    </div>
  );
}

function RelCard({
  title,
  types,
  primary,
  why,
}: {
  title: string;
  types: [TypeId, TypeId];
  primary?: boolean;
  why: Partial<Record<TypeId, string>>;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.surfaceHi,
        border: `1px solid ${primary ? C.primary : C.border}`,
      }}
    >
      <div
        className="text-xs font-bold mb-3 flex items-center gap-1.5"
        style={{ color: primary ? C.primary : C.textL }}
      >
        <PixelIcon name={primary ? "heart" : "warn"} size={12} />
        {title}
      </div>
      <div className="space-y-3">
        {types.map((t) => (
          <div key={t} className="flex items-start gap-3">
            <TypeBadge type={t} size="sm" />
            <div className="flex-1">
              <div className="text-sm font-bold" style={{ color: C.text }}>
                {t}번. {TYPES[t].name}
              </div>
              {why[t] && (
                <div className="text-xs mt-1 leading-relaxed" style={{ color: C.textL }}>
                  {why[t]}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
