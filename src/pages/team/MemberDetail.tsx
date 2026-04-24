import { useEffect, ReactNode } from "react";
import { PixelIcon, IconName } from "../../components/PixelIcon";
import { PixelAnimal } from "../../components/PixelAnimal";
import { TypeBadge } from "../../components/TypeBadge";
import { C } from "../../data/design";
import { ROLE_LABELS, TYPES, REL } from "../../data/enneagram";
import { ANIMALS } from "../../data/animals";
import { wingOf } from "../../lib/analysis";
import { Member, TypeId } from "../../types";
import { ROLE_ICON } from "./roleIcon";

export function MemberDetail({
  member,
  isMe,
  isOwner,
  onClose,
}: {
  member: Member;
  isMe: boolean;
  isOwner: boolean;
  onClose: () => void;
}) {
  const T = TYPES[member.type];
  const rel = REL[member.type];
  const role = ROLE_LABELS[member.role];
  const animal = ANIMALS[member.type];
  const wing = wingOf(member.type, member.scores);
  const [w1, w2] = rel.wings;
  const s1 = member.scores[w1];
  const s2 = member.scores[w2];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-detail-title"
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-6 pb-4 text-center relative"
          style={{ background: `linear-gradient(180deg, ${T.bg}, ${C.surface})` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}
            aria-label="닫기"
          >
            ✕
          </button>
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-2xl"
            style={{
              width: 96,
              height: 96,
              background: `radial-gradient(circle, ${T.color}22 0%, transparent 70%), ${C.surface}`,
              border: `1px solid ${T.color}44`,
            }}
          >
            <PixelAnimal type={member.type} size={76} />
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
            <h3 id="member-detail-title" className="text-lg font-bold" style={{ color: C.text }}>
              {member.nickname}
            </h3>
            {isMe && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: C.primary, color: C.white }}
              >
                나
              </span>
            )}
            {isOwner && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: C.warning, color: C.black }}
              >
                팀장
              </span>
            )}
          </div>
          <div className="text-[11px]" style={{ color: T.color }}>
            {animal.name}
          </div>
          <div className="text-base font-bold mt-1" style={{ color: C.text }}>
            {member.type}번. {T.name}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {T.tag} · {T.sub}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ background: C.surfaceHi, color: C.textL, border: `1px solid ${C.border}` }}
            >
              <PixelIcon name={ROLE_ICON[member.role]} size={10} color={C.textL} />
              {role.label}
            </span>
            {wing !== null && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: `${T.color}22`,
                  color: T.color,
                  fontFamily: "ui-monospace, Menlo, monospace",
                }}
              >
                {member.type}w{wing}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <MemberSection icon="search" accent={T.color} title="유형 개요">
            <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
              {T.overview}
            </p>
          </MemberSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <MemberSection icon="warn" accent={T.color} title="두려워하는 것">
              <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
                {T.fear}
              </p>
            </MemberSection>
            <MemberSection icon="target" accent={T.color} title="바라는 것">
              <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
                {T.desire}
              </p>
            </MemberSection>
          </div>

          <MemberSection icon="muscle" accent={T.color} title="강점 · 성장 · 팀 역할">
            <div className="space-y-2 text-[13px]">
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>강점 </span>
                <span style={{ color: C.text }}>{T.strength}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>성장 포인트 </span>
                <span style={{ color: C.text }}>{T.growth}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>팀 역할 </span>
                <span style={{ color: C.text }}>{T.teamRole}</span>
              </div>
            </div>
          </MemberSection>

          <MemberSection icon="sprout" accent={T.color} title="날개 (Wing)">
            <div className="space-y-2 text-[12.5px]">
              <WingRow
                label={`${member.type}w${w1} · ${TYPES[w1].name}`}
                score={s1}
                active={wing === w1}
                accent={T.color}
              />
              <WingRow
                label={`${member.type}w${w2} · ${TYPES[w2].name}`}
                score={s2}
                active={wing === w2}
                accent={T.color}
              />
              {wing === null && (
                <p className="text-[12px]" style={{ color: C.textL }}>
                  양쪽 날개가 모두 비어 있어 한쪽으로 치우치지 않았어요.
                </p>
              )}
            </div>
          </MemberSection>

          <MemberSection icon="heart" accent={C.success} title="잘 맞는 유형">
            <div className="space-y-2">
              {rel.best.map((t) => (
                <RelRow key={t} type={t} why={rel.matchWhy[t]} tone="best" />
              ))}
            </div>
          </MemberSection>

          <MemberSection icon="bolt" accent={C.warning} title="긴장 주의 유형">
            <div className="space-y-2">
              {rel.challenge.map((t) => (
                <RelRow key={t} type={t} why={rel.challengeWhy[t]} tone="challenge" />
              ))}
            </div>
          </MemberSection>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold mt-2"
            style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberSection({
  icon,
  title,
  accent,
  children,
}: {
  icon: IconName;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div
        className="text-xs font-bold mb-2 flex items-center gap-1.5"
        style={{ color: accent }}
      >
        <PixelIcon name={icon} size={12} color={accent} />
        {title}
      </div>
      {children}
    </div>
  );
}

function WingRow({
  label,
  score,
  active,
  accent,
}: {
  label: string;
  score: number;
  active: boolean;
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: active ? accent : C.textL, fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
        <span style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
          {score}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceActive }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, score * 10)}%`,
            background: active ? accent : `${accent}55`,
          }}
        />
      </div>
    </div>
  );
}

function RelRow({
  type,
  why,
  tone,
}: {
  type: TypeId;
  why?: string;
  tone: "best" | "challenge";
}) {
  const T = TYPES[type];
  const accent = tone === "best" ? C.success : C.warning;
  return (
    <div className="flex items-start gap-2.5">
      <TypeBadge type={type} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
          <span>{type}번. {T.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: `${accent}22`,
              color: accent,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            {tone === "best" ? "MATCH" : "WATCH"}
          </span>
        </div>
        {why && (
          <div className="text-[12px] mt-1 leading-relaxed" style={{ color: C.textL }}>
            {why}
          </div>
        )}
      </div>
    </div>
  );
}
