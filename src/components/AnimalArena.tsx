import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ANIMALS, PixelSprite } from "../data/animals";
import { TypeId } from "../types";
import { C } from "../data/design";

export type AnimalArenaHandle = {
  /** 특정 유형 동물을 스폰. 미지정 시 랜덤. */
  addAnimal: (type?: TypeId) => void;
  /** 해당 유형으로 가장 최근에 스폰된 동물 한 마리 제거. */
  removeAnimal: (type: TypeId) => void;
};

type Props = {
  height?: number;
};

type Animal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  sprite: PixelSprite;
  accent: string;
  facing: 1 | -1;
  jumpTimer: number;
  onGround: boolean;
  squash: number;
  flashFrames: number;
  spawnGlow: number;
};

const ALL_TYPES: TypeId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const PIXEL_SCALE = 3;
const MAX_ANIMALS = 30;
const GRAVITY = 0.38;
const FRICTION = 0.9;

export const AnimalArena = forwardRef<AnimalArenaHandle, Props>(function AnimalArena(
  { height = 110 },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animalsRef = useRef<Animal[]>([]);
  const sizeRef = useRef({ w: 320, h: height });
  const rafRef = useRef<number | null>(null);

  const spawn = (type?: TypeId) => {
    const t = type ?? ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
    const animal = ANIMALS[t];
    const sp = animal.sprite;
    const w = sp.pixels[0].length * PIXEL_SCALE;
    const h = sp.pixels.length * PIXEL_SCALE;
    const { w: W } = sizeRef.current;
    const usable = Math.max(w + 8, W);
    animalsRef.current.push({
      x: Math.random() * (usable - w - 8) + 4,
      y: -h - 4,
      vx: (Math.random() - 0.5) * 3,
      vy: 1 + Math.random(),
      w,
      h,
      sprite: sp,
      accent: animal.accent,
      facing: Math.random() > 0.5 ? 1 : -1,
      jumpTimer: 50 + Math.random() * 120,
      onGround: false,
      squash: 0,
      flashFrames: 10,
      spawnGlow: 28,
    });
    if (animalsRef.current.length > MAX_ANIMALS) {
      animalsRef.current.splice(0, animalsRef.current.length - MAX_ANIMALS);
    }
  };

  const despawn = (type: TypeId) => {
    const sprite = ANIMALS[type].sprite;
    const animals = animalsRef.current;
    for (let i = animals.length - 1; i >= 0; i--) {
      if (animals[i].sprite === sprite) {
        animals.splice(i, 1);
        return;
      }
    }
  };

  useImperativeHandle(ref, () => ({ addAnimal: spawn, removeAnimal: despawn }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    if (animalsRef.current.length === 0) {
      // 처음엔 랜덤 한 마리만 배치
      spawn();
    }

    const drawSprite = (a: Animal) => {
      const rows = a.sprite.pixels;
      const cols = rows[0].length;
      const flip = a.facing === -1;
      const sx = 1 + (a.squash > 0 ? a.squash * 0.25 : 0);
      const sy = 1 - (a.squash > 0 ? a.squash * 0.35 : 0);
      const drawW = a.w * sx;
      const drawH = a.h * sy;
      const offX = (a.w - drawW) / 2;
      const offY = a.h - drawH;
      const pxW = drawW / cols;
      const pxH = drawH / rows.length;

      // 스폰 글로우
      if (a.spawnGlow > 0) {
        ctx.fillStyle = a.accent;
        ctx.globalAlpha = Math.min(0.35, a.spawnGlow / 28);
        ctx.fillRect(
          Math.round(a.x - 4),
          Math.round(a.y - 4),
          Math.round(a.w + 8),
          Math.round(a.h + 8),
        );
        ctx.globalAlpha = 1;
      }

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < cols; c++) {
          const ch = row[c];
          const col = a.sprite.palette[ch];
          if (!col || col === "transparent") continue;
          ctx.fillStyle = a.flashFrames > 0 && a.flashFrames % 4 < 2 ? "#FFFFFF" : col;
          const cc = flip ? cols - 1 - c : c;
          ctx.fillRect(
            Math.round(a.x + offX + cc * pxW),
            Math.round(a.y + offY + r * pxH),
            Math.ceil(pxW),
            Math.ceil(pxH),
          );
        }
      }
    };

    const step = () => {
      const { w: W, h: H } = sizeRef.current;
      ctx.clearRect(0, 0, W, H);

      // 배경 스캔라인
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

      const animals = animalsRef.current;

      for (const a of animals) {
        if (a.flashFrames > 0) a.flashFrames -= 1;
        if (a.spawnGlow > 0) a.spawnGlow -= 1;
        if (a.squash > 0) a.squash = Math.max(0, a.squash - 0.12);

        a.vy += GRAVITY;
        a.x += a.vx;
        a.y += a.vy;

        if (a.x < 0) {
          a.x = 0;
          a.vx = Math.abs(a.vx) * 0.75;
          a.facing = 1;
        } else if (a.x + a.w > W) {
          a.x = W - a.w;
          a.vx = -Math.abs(a.vx) * 0.75;
          a.facing = -1;
        }

        const floor = H - 4;
        if (a.y + a.h >= floor) {
          a.y = floor - a.h;
          if (a.vy > 2) {
            a.squash = Math.min(1, a.vy / 8);
            a.vy = -a.vy * 0.32;
            if (Math.abs(a.vy) < 1.2) a.vy = 0;
          } else {
            a.vy = 0;
            a.onGround = true;
            a.vx *= FRICTION;
            if (Math.abs(a.vx) < 0.05) a.vx = 0;
          }
        } else {
          a.onGround = false;
        }

        a.jumpTimer -= 1;
        if (a.jumpTimer <= 0 && a.onGround) {
          a.vy = -4.2 - Math.random() * 2.8;
          a.vx = (Math.random() - 0.5) * 3.8;
          a.facing = a.vx >= 0 ? 1 : -1;
          a.jumpTimer = 60 + Math.random() * 160;
          a.onGround = false;
        }
      }

      for (let i = 0; i < animals.length; i++) {
        for (let j = i + 1; j < animals.length; j++) {
          const a = animals[i];
          const b = animals[j];
          if (
            a.x < b.x + b.w &&
            a.x + a.w > b.x &&
            a.y < b.y + b.h &&
            a.y + a.h > b.y
          ) {
            const dx1 = b.x + b.w - a.x;
            const dx2 = a.x + a.w - b.x;
            const dy1 = b.y + b.h - a.y;
            const dy2 = a.y + a.h - b.y;
            const minX = Math.min(dx1, dx2);
            const minY = Math.min(dy1, dy2);
            if (minX < minY) {
              if (dx1 < dx2) {
                a.x += minX / 2;
                b.x -= minX / 2;
              } else {
                a.x -= minX / 2;
                b.x += minX / 2;
              }
              const tvx = a.vx;
              a.vx = b.vx * 0.7 + (a.x < b.x ? -0.6 : 0.6);
              b.vx = tvx * 0.7 + (b.x < a.x ? -0.6 : 0.6);
              a.facing = a.vx >= 0 ? 1 : -1;
              b.facing = b.vx >= 0 ? 1 : -1;
              a.vy -= 1.2;
              b.vy -= 1.2;
              a.squash = Math.max(a.squash, 0.5);
              b.squash = Math.max(b.squash, 0.5);
            } else {
              if (dy1 < dy2) {
                a.y += minY / 2;
                b.y -= minY / 2;
              } else {
                a.y -= minY / 2;
                b.y += minY / 2;
              }
              const tvy = a.vy;
              a.vy = b.vy * 0.5;
              b.vy = tvy * 0.5;
            }
          }
        }
      }

      // 바닥 플랫폼
      const floorY = H - 4;
      ctx.fillStyle = "#2A3A55";
      ctx.fillRect(0, floorY, W, 1);
      ctx.fillStyle = "#1E2A3E";
      ctx.fillRect(0, floorY + 1, W, 3);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x < W; x += 4) ctx.fillRect(x, floorY + 1, 2, 1);

      const sorted = [...animals].sort((p, q) => p.y + p.h - (q.y + q.h));
      for (const a of sorted) drawSprite(a);

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${C.border}`,
        background:
          "linear-gradient(180deg, #0C1119 0%, #141C28 60%, #0E141D 100%)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)",
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="선택한 답변에 따라 유형별 동물이 등장하는 장식용 애니메이션"
        style={{
          display: "block",
          width: "100%",
          height: `${height}px`,
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
});
