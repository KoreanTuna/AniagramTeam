import { useEffect, useRef } from "react";
import { ANIMALS } from "../data/animals";
import { TypeId } from "../types";

type Props = {
  type: TypeId;
  size?: number;        // 캔버스 한 변 (px)
  hopping?: boolean;    // 살짝 위아래로 튀는 idle 애니메이션
  flip?: boolean;       // 좌우 뒤집기
};

/**
 * 유형에 매칭된 8비트 동물을 정적 캔버스로 렌더.
 * AnimalArena와 달리 물리 없이 한 마리만 보여줌.
 */
export function PixelAnimal({ type, size = 80, hopping = true, flip = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

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

  return (
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
}
