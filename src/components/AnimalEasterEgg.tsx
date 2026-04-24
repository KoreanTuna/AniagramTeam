import { useRef, useState } from "react";
import { PixelAnimal } from "./PixelAnimal";
import { TypeId } from "../types";
import { ANIMALS } from "../data/animals";

type Action = {
  anim: string;      // transform keyframes 이름
  duration: number;  // ms, 파티클도 이 시간만큼 살아있음
  particles: string[]; // 이번 클릭에 뿌릴 이모지 세트
  count: number;     // 한 번에 튀어오를 파티클 수
  label: string;     // 스크린리더/hint용
};

// 타입별 성격을 한 번에 느낄 수 있는 동작 매핑.
// 키프레임 이름은 아래 <style>에서 정의.
const ACTIONS: Record<TypeId, Action> = {
  1: { anim: "ee-spin",   duration: 1100, particles: ["✨", "⭐️"],             count: 6, label: "정확한 회전 점검" },
  2: { anim: "ee-hug",    duration: 1100, particles: ["💗", "💞", "🤍"],       count: 8, label: "따뜻한 포옹" },
  3: { anim: "ee-dash",   duration: 900,  particles: ["🏆", "⚡️", "✨"],        count: 7, label: "목표를 향한 대시" },
  4: { anim: "ee-sway",   duration: 1400, particles: ["🎨", "🌙", "🌸", "✨"],  count: 7, label: "예술적 흐름" },
  5: { anim: "ee-zoom",   duration: 1200, particles: ["🔍", "💭", "📚"],       count: 6, label: "관찰과 몰입" },
  6: { anim: "ee-wiggle", duration: 1000, particles: ["🛡️", "🐾", "💚"],       count: 7, label: "꼬리 흔들기" },
  7: { anim: "ee-hops",   duration: 1100, particles: ["🎉", "🌈", "🎈", "✨"], count: 9, label: "신난 점프" },
  8: { anim: "ee-roar",   duration: 900,  particles: ["💥", "🔥", "💢"],       count: 8, label: "대담한 포효" },
  9: { anim: "ee-drift",  duration: 1400, particles: ["💤", "☁️", "🌿"],       count: 5, label: "느긋한 숨" },
};

type Particle = {
  id: number;
  emoji: string;
  dx: number;   // 최종 수평 오프셋 (px)
  dy: number;   // 최종 수직 오프셋 (위쪽이 음수)
  rot: number;  // 회전 (deg)
  delay: number;
  scale: number;
};

type Props = {
  type: TypeId;
  size?: number;
};

/**
 * 결과 페이지 이스터에그: 동물을 탭하면 타입별 성격에 맞는 동작을 재생.
 * 동일 타입을 연타해도 매번 다시 재생되도록 key를 증가시킴.
 */
export function AnimalEasterEgg({ type, size = 120 }: Props) {
  const [actionKey, setActionKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintSeen, setHintSeen] = useState(false);
  const idRef = useRef(0);

  const action = ACTIONS[type];
  const accent = ANIMALS[type].accent;

  const trigger = () => {
    setHintSeen(true);
    setActionKey((k) => k + 1);

    const next: Particle[] = [];
    for (let i = 0; i < action.count; i++) {
      const emoji = action.particles[i % action.particles.length];
      // 좌우로 퍼지며 위로 떠오르는 분포.
      const angle = (Math.random() - 0.5) * Math.PI * 0.9; // -81° ~ 81°
      const dist = size * (0.55 + Math.random() * 0.35);
      next.push({
        id: idRef.current++,
        emoji,
        dx: Math.sin(angle) * dist,
        dy: -Math.abs(Math.cos(angle)) * dist - size * 0.1,
        rot: (Math.random() - 0.5) * 60,
        delay: Math.random() * 120,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
    setParticles((prev) => [...prev, ...next]);
    const ids = new Set(next.map((p) => p.id));
    window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, action.duration + 400);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <button
        type="button"
        onClick={trigger}
        aria-label={`${action.label} 재생`}
        className="relative inline-flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* hint 링: 아직 안 눌러봤다면 은은하게 맥동 */}
        {!hintSeen && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: `0 0 0 2px ${accent}55`,
              animation: "ee-hint 1.8s ease-in-out infinite",
            }}
          />
        )}

        <span
          key={actionKey}
          className="inline-block"
          style={{
            animation: actionKey === 0 ? undefined : `${action.anim} ${action.duration}ms cubic-bezier(.22,1,.36,1)`,
            transformOrigin: "50% 70%",
            willChange: "transform",
          }}
        >
          <PixelAnimal type={type} size={size} />
        </span>

        {/* 파티클 레이어: pointer 통과시켜 재클릭 가능하게 */}
        <span aria-hidden className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <span
              key={p.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "55%",
                fontSize: Math.round(size * 0.18),
                transform: "translate(-50%, -50%)",
                animation: `ee-float ${action.duration}ms ${p.delay}ms cubic-bezier(.2,.7,.3,1) forwards`,
                // CSS 변수로 개별 파티클 목적지 전달
                ["--dx" as string]: `${p.dx}px`,
                ["--dy" as string]: `${p.dy}px`,
                ["--rot" as string]: `${p.rot}deg`,
                ["--scale" as string]: `${p.scale}`,
                filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.35))",
              }}
            >
              {p.emoji}
            </span>
          ))}
        </span>
      </button>
    </>
  );
}

const KEYFRAMES = `
@keyframes ee-hint {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 0.9;  transform: scale(1.04); }
}
@keyframes ee-float {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(0deg); }
  15%  { opacity: 1; transform: translate(calc(-50% + (var(--dx) * 0.2)), calc(-50% + (var(--dy) * 0.2))) scale(var(--scale)) rotate(calc(var(--rot) * 0.2)); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(calc(var(--scale) * 0.9)) rotate(var(--rot)); }
}

/* 1번 개혁가 — 올빼미의 시그니처 고개 회전. 정밀 점검 느낌. */
@keyframes ee-spin {
  0%   { transform: rotate(0deg) scale(1); }
  20%  { transform: rotate(-12deg) scale(1.02); }
  60%  { transform: rotate(360deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

/* 2번 조력자 — 포근한 품으로 감싸듯 두 번 바운스 */
@keyframes ee-hug {
  0%   { transform: scale(1,1) translateY(0); }
  25%  { transform: scale(1.12, 0.9) translateY(2px); }
  45%  { transform: scale(0.92, 1.1) translateY(-6px); }
  70%  { transform: scale(1.06, 0.96) translateY(0); }
  100% { transform: scale(1,1) translateY(0); }
}

/* 3번 성취자 — 좌우로 빠르게 대시 */
@keyframes ee-dash {
  0%   { transform: translateX(0) scaleX(1); }
  15%  { transform: translateX(-6px) scaleX(0.95); }
  40%  { transform: translateX(18px) scaleX(1.1); }
  60%  { transform: translateX(-14px) scaleX(0.9); }
  80%  { transform: translateX(6px) scaleX(1.05); }
  100% { transform: translateX(0) scaleX(1); }
}

/* 4번 예술가 — 예술적 스윙 */
@keyframes ee-sway {
  0%   { transform: rotate(0) translateY(0); }
  20%  { transform: rotate(-10deg) translateY(-3px); }
  45%  { transform: rotate(8deg) translateY(-6px); }
  70%  { transform: rotate(-6deg) translateY(-2px); }
  100% { transform: rotate(0) translateY(0); }
}

/* 5번 탐구자 — 관찰하듯 줌 인/아웃 반복 */
@keyframes ee-zoom {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.18); }
  50%  { transform: scale(0.92); }
  75%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 6번 충성가 — 꼬리 흔들 듯 부드러운 좌우 기울임 */
@keyframes ee-wiggle {
  0%   { transform: rotate(0); }
  20%  { transform: rotate(-8deg); }
  40%  { transform: rotate(8deg); }
  60%  { transform: rotate(-6deg); }
  80%  { transform: rotate(6deg); }
  100% { transform: rotate(0); }
}

/* 7번 열정가 — 신나게 세 번 폴짝폴짝 */
@keyframes ee-hops {
  0%   { transform: translateY(0) scale(1,1); }
  15%  { transform: translateY(-18px) scale(0.95, 1.08); }
  30%  { transform: translateY(0) scale(1.08, 0.92); }
  45%  { transform: translateY(-14px) scale(0.96, 1.06); }
  60%  { transform: translateY(0) scale(1.06, 0.94); }
  80%  { transform: translateY(-8px) scale(0.98, 1.04); }
  100% { transform: translateY(0) scale(1,1); }
}

/* 8번 도전자 — 위협적인 쉐이크 + 확대 */
@keyframes ee-roar {
  0%   { transform: scale(1) translate(0,0); }
  15%  { transform: scale(1.15) translate(-3px, 1px); }
  30%  { transform: scale(1.18) translate(4px, -1px); }
  45%  { transform: scale(1.14) translate(-4px, 2px); }
  60%  { transform: scale(1.12) translate(3px, -2px); }
  80%  { transform: scale(1.06) translate(-2px, 1px); }
  100% { transform: scale(1) translate(0, 0); }
}

/* 9번 평화주의자 — 천천히 떠다니는 느긋한 흔들림 */
@keyframes ee-drift {
  0%   { transform: translate(0,0) rotate(0); }
  30%  { transform: translate(-4px, -3px) rotate(-3deg); }
  60%  { transform: translate(4px, -2px) rotate(3deg); }
  100% { transform: translate(0, 0) rotate(0); }
}
`;
