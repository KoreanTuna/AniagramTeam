import { useEffect, useRef, useState } from "react";
import { ANIMALS } from "../data/animals";
import { TypeId } from "../types";

type Props = {
  type: TypeId;
  size?: number;        // 캔버스 한 변 (px)
  hopping?: boolean;    // 살짝 위아래로 튀는 idle 애니메이션
  flip?: boolean;       // 좌우 뒤집기
  interactive?: boolean; // 클릭 시 타입별 리액션 재생 (기본 true)
  hint?: boolean;       // 첫 클릭 전까지 은은한 맥동 링 (Result 페이지용)
};

type Action = {
  anim: string;
  duration: number;
  particles: string[];
  count: number;
  label: string;
};

const ACTIONS: Record<TypeId, Action> = {
  1: { anim: "pa-spin",   duration: 1100, particles: ["✨", "⭐️"],             count: 6, label: "정확한 회전 점검" },
  2: { anim: "pa-hug",    duration: 1100, particles: ["💗", "💞", "🤍"],       count: 8, label: "따뜻한 포옹" },
  3: { anim: "pa-dash",   duration: 900,  particles: ["🏆", "⚡️", "✨"],        count: 7, label: "목표를 향한 대시" },
  4: { anim: "pa-sway",   duration: 1400, particles: ["🎨", "🌙", "🌸", "✨"],  count: 7, label: "예술적 흐름" },
  5: { anim: "pa-zoom",   duration: 1200, particles: ["🔍", "💭", "📚"],       count: 6, label: "관찰과 몰입" },
  6: { anim: "pa-wiggle", duration: 1000, particles: ["🛡️", "🐾", "💚"],       count: 7, label: "꼬리 흔들기" },
  7: { anim: "pa-hops",   duration: 1100, particles: ["🎉", "🌈", "🎈", "✨"], count: 9, label: "신난 점프" },
  8: { anim: "pa-roar",   duration: 900,  particles: ["💥", "🔥", "💢"],       count: 8, label: "대담한 포효" },
  9: { anim: "pa-drift",  duration: 1400, particles: ["💤", "☁️", "🌿"],       count: 5, label: "느긋한 숨" },
};

type Particle = {
  id: number;
  emoji: string;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
  scale: number;
};

/**
 * 유형에 매칭된 8비트 동물을 정적 캔버스로 렌더.
 * 클릭 시 유형별 성격에 맞는 리액션 애니메이션과 파티클이 재생됨.
 */
export function PixelAnimal({
  type,
  size = 80,
  hopping = true,
  flip = false,
  interactive = true,
  hint = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const animWrapRef = useRef<HTMLSpanElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hintSeen, setHintSeen] = useState(false);
  const idRef = useRef(0);

  const action = ACTIONS[type];
  const accent = ANIMALS[type].accent;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const sp = ANIMALS[type].sprite;
    const rows = sp.pixels.length;
    const cols = sp.pixels[0].length;
    // 바닥 여유를 두기 위해 size * 0.95에 맞춤
    const maxW = size * 0.92;
    const maxH = size * 0.8;
    const scale = Math.max(1, Math.floor(Math.min(maxW / cols, maxH / rows)));
    const w = cols * scale;
    const h = rows * scale;

    const start = performance.now();

    const draw = (t: number) => {
      const elapsed = t - start;
      const bounce = hopping ? Math.sin(elapsed / 320) : 0;
      const yOff = hopping ? -Math.max(0, bounce) * 4 : 0;

      ctx.clearRect(0, 0, size, size);

      const ox = Math.round((size - w) / 2);
      const oy = Math.round(size - h - 6 + yOff);

      // 바닥 그림자 (크기 축소/확대)
      const shadowW = w * (0.8 + Math.min(0, bounce) * 0.1);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(size / 2, size - 4, shadowW / 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      for (let r = 0; r < rows; r++) {
        const row = sp.pixels[r];
        for (let c = 0; c < cols; c++) {
          const ch = row[c];
          const col = sp.palette[ch];
          if (!col || col === "transparent") continue;
          ctx.fillStyle = col;
          const cc = flip ? cols - 1 - c : c;
          ctx.fillRect(ox + cc * scale, oy + r * scale, scale, scale);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [type, size, hopping, flip]);

  const trigger = (e: React.MouseEvent) => {
    // 부모가 클릭 핸들러를 가진 경우 (예: 팀 카드 버튼) 애니메이션만 재생하고 전파를 막음.
    e.stopPropagation();
    setHintSeen(true);

    // 캔버스를 remount 시키지 않고 애니메이션만 재시작. key 토글은 canvas draw를
    // 끊어먹기 때문에 강제 리플로우로 동일 요소 위에서 다시 재생한다.
    const wrap = animWrapRef.current;
    if (wrap) {
      wrap.style.animation = "none";
      void wrap.offsetWidth;
      wrap.style.animation = `${action.anim} ${action.duration}ms cubic-bezier(.22,1,.36,1)`;
    }

    const next: Particle[] = [];
    for (let i = 0; i < action.count; i++) {
      const emoji = action.particles[i % action.particles.length];
      // 좌우로 퍼지며 위로 떠오르는 분포.
      const angle = (Math.random() - 0.5) * Math.PI * 0.9;
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

  const canvas = (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        display: "inline-block",
      }}
    />
  );

  if (!interactive) return canvas;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <span
        role="button"
        tabIndex={-1}
        onClick={trigger}
        aria-label={`${action.label} 재생`}
        className="relative inline-flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          cursor: "pointer",
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {hint && !hintSeen && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow: `0 0 0 2px ${accent}55`,
              animation: "pa-hint 1.8s ease-in-out infinite",
            }}
          />
        )}

        <span
          ref={animWrapRef}
          className="inline-block"
          style={{
            transformOrigin: "50% 70%",
            willChange: "transform",
          }}
        >
          {canvas}
        </span>

        <span aria-hidden className="absolute inset-0 pointer-events-none overflow-visible">
          {particles.map((p) => (
            <span
              key={p.id}
              style={{
                position: "absolute",
                left: "50%",
                top: "55%",
                fontSize: Math.round(Math.max(10, size * 0.18)),
                transform: "translate(-50%, -50%)",
                animation: `pa-float ${action.duration}ms ${p.delay}ms cubic-bezier(.2,.7,.3,1) forwards`,
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
      </span>
    </>
  );
}

const KEYFRAMES = `
@keyframes pa-hint {
  0%, 100% { opacity: 0.35; transform: scale(1); }
  50%      { opacity: 0.9;  transform: scale(1.04); }
}
@keyframes pa-float {
  0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.4) rotate(0deg); }
  15%  { opacity: 1; transform: translate(calc(-50% + (var(--dx) * 0.2)), calc(-50% + (var(--dy) * 0.2))) scale(var(--scale)) rotate(calc(var(--rot) * 0.2)); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(calc(var(--scale) * 0.9)) rotate(var(--rot)); }
}

/* 1번 개혁가 — 올빼미의 시그니처 고개 회전. 정밀 점검 느낌. */
@keyframes pa-spin {
  0%   { transform: rotate(0deg) scale(1); }
  20%  { transform: rotate(-12deg) scale(1.02); }
  60%  { transform: rotate(360deg) scale(1.05); }
  100% { transform: rotate(360deg) scale(1); }
}

/* 2번 조력자 — 포근한 품으로 감싸듯 두 번 바운스 */
@keyframes pa-hug {
  0%   { transform: scale(1,1) translateY(0); }
  25%  { transform: scale(1.12, 0.9) translateY(2px); }
  45%  { transform: scale(0.92, 1.1) translateY(-6px); }
  70%  { transform: scale(1.06, 0.96) translateY(0); }
  100% { transform: scale(1,1) translateY(0); }
}

/* 3번 성취자 — 좌우로 빠르게 대시 */
@keyframes pa-dash {
  0%   { transform: translateX(0) scaleX(1); }
  15%  { transform: translateX(-6px) scaleX(0.95); }
  40%  { transform: translateX(18px) scaleX(1.1); }
  60%  { transform: translateX(-14px) scaleX(0.9); }
  80%  { transform: translateX(6px) scaleX(1.05); }
  100% { transform: translateX(0) scaleX(1); }
}

/* 4번 예술가 — 예술적 스윙 */
@keyframes pa-sway {
  0%   { transform: rotate(0) translateY(0); }
  20%  { transform: rotate(-10deg) translateY(-3px); }
  45%  { transform: rotate(8deg) translateY(-6px); }
  70%  { transform: rotate(-6deg) translateY(-2px); }
  100% { transform: rotate(0) translateY(0); }
}

/* 5번 탐구자 — 관찰하듯 줌 인/아웃 반복 */
@keyframes pa-zoom {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.18); }
  50%  { transform: scale(0.92); }
  75%  { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 6번 충성가 — 꼬리 흔들 듯 부드러운 좌우 기울임 */
@keyframes pa-wiggle {
  0%   { transform: rotate(0); }
  20%  { transform: rotate(-8deg); }
  40%  { transform: rotate(8deg); }
  60%  { transform: rotate(-6deg); }
  80%  { transform: rotate(6deg); }
  100% { transform: rotate(0); }
}

/* 7번 열정가 — 신나게 세 번 폴짝폴짝 */
@keyframes pa-hops {
  0%   { transform: translateY(0) scale(1,1); }
  15%  { transform: translateY(-18px) scale(0.95, 1.08); }
  30%  { transform: translateY(0) scale(1.08, 0.92); }
  45%  { transform: translateY(-14px) scale(0.96, 1.06); }
  60%  { transform: translateY(0) scale(1.06, 0.94); }
  80%  { transform: translateY(-8px) scale(0.98, 1.04); }
  100% { transform: translateY(0) scale(1,1); }
}

/* 8번 도전자 — 위협적인 쉐이크 + 확대 */
@keyframes pa-roar {
  0%   { transform: scale(1) translate(0,0); }
  15%  { transform: scale(1.15) translate(-3px, 1px); }
  30%  { transform: scale(1.18) translate(4px, -1px); }
  45%  { transform: scale(1.14) translate(-4px, 2px); }
  60%  { transform: scale(1.12) translate(3px, -2px); }
  80%  { transform: scale(1.06) translate(-2px, 1px); }
  100% { transform: scale(1) translate(0, 0); }
}

/* 9번 평화주의자 — 천천히 떠다니는 느긋한 흔들림 */
@keyframes pa-drift {
  0%   { transform: translate(0,0) rotate(0); }
  30%  { transform: translate(-4px, -3px) rotate(-3deg); }
  60%  { transform: translate(4px, -2px) rotate(3deg); }
  100% { transform: translate(0, 0) rotate(0); }
}
`;
