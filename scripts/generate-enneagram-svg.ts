import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANIMALS } from "../src/data/animals";
import { TYPES } from "../src/data/enneagram";
import { TypeId } from "../src/types";

/**
 * 9개 타입을 전통 애니어그램 원형 그래프로 배치한 단일 SVG 생성.
 * 레이아웃: 9번을 꼭대기에 두고 시계 방향으로 1~8을 40°씩 배치.
 *  - 작은 번호 원이 내부 원 위에 얹혀 있고
 *  - 내부 삼각형(9-3-6)과 헥사드(1-4-2-8-5-7)로 연결됨
 *  - 각 번호 바깥에 유형명 + 8비트 동물 스프라이트 pill 라벨을 띄움
 * 출력: docs/enneagram.svg
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, "../docs/enneagram.svg");

const VIEW = 920;
const CX = VIEW / 2;
const CY = VIEW / 2;
const RING_R = 188;     // 번호 원이 앉는 기본 원의 반지름
const NODE_R = 28;      // 번호 원 반지름
const LABEL_R = 360;    // pill 라벨 중심 반지름
const PILL_W = 186;
const PILL_H = 72;
const SPRITE_MAX = 52;

const BG = "#0B0F14";
const SURFACE = "#151B24";
const BORDER = "#242D3A";
const RING_COLOR = "#2A3A55";
const LINE_COLOR = "#3182F6";
const TEXT = "#E6EBF2";
const TEXT_L = "#8B95A3";
const NUMBER_FG = "#FFFFFF";

// 9번을 꼭대기로 두고 시계 방향으로 40°씩
const ANGLES: Record<TypeId, number> = {
  9: 0,
  1: 40,
  2: 80,
  3: 120,
  4: 160,
  5: 200,
  6: 240,
  7: 280,
  8: 320,
};

// 내부 삼각형: 9-3-6
const TRIANGLE: TypeId[] = [9, 3, 6];
// 헥사드 (스트레스/성장 경로): 1-4-2-8-5-7
const HEXAD: TypeId[] = [1, 4, 2, 8, 5, 7];

function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
}

function fmt(n: number) {
  return n.toFixed(1);
}

function spriteGroup(
  sp: (typeof ANIMALS)[TypeId]["sprite"],
  translateX: number,
  translateY: number,
  maxSize: number,
): string {
  const rows = sp.pixels.length;
  const cols = sp.pixels[0].length;
  const px = Math.max(1, Math.floor(Math.min(maxSize / cols, maxSize / rows)));
  const w = cols * px;
  const h = rows * px;
  const ox = translateX - w / 2;
  const oy = translateY - h / 2;

  const byColor = new Map<string, string[]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = sp.pixels[r][c];
      const col = sp.palette[ch];
      if (!col || col === "transparent") continue;
      const rect = `<rect x="${c * px}" y="${r * px}" width="${px}" height="${px}"/>`;
      const arr = byColor.get(col) ?? [];
      arr.push(rect);
      byColor.set(col, arr);
    }
  }
  const groups = Array.from(byColor.entries())
    .map(([col, rects]) => `<g fill="${col}">${rects.join("")}</g>`)
    .join("");

  return `<g shape-rendering="crispEdges" transform="translate(${fmt(ox)},${fmt(oy)})">${groups}</g>`;
}

const parts: string[] = [];
parts.push(`<rect width="${VIEW}" height="${VIEW}" fill="${BG}"/>`);

// 외곽 장식 원 (pill 중심을 가로지르는 연한 가이드 — 참조 이미지와 동일)
parts.push(
  `<circle cx="${CX}" cy="${CY}" r="${LABEL_R}" fill="none" stroke="${BORDER}" stroke-width="1"/>`,
);

// 번호 원이 앉는 내부 원
parts.push(
  `<circle cx="${CX}" cy="${CY}" r="${RING_R}" fill="none" stroke="${RING_COLOR}" stroke-width="1.5"/>`,
);

// 헥사드 라인 (뒤에 배치)
{
  const pts = HEXAD.map((n) => polar(RING_R, ANGLES[n]).map(fmt).join(",")).join(" ");
  parts.push(
    `<polygon points="${pts}" fill="none" stroke="${LINE_COLOR}" stroke-width="2" stroke-linejoin="round" opacity="0.75"/>`,
  );
}

// 내부 삼각형 (9-3-6)
{
  const pts = TRIANGLE.map((n) => polar(RING_R, ANGLES[n]).map(fmt).join(",")).join(" ");
  parts.push(
    `<polygon points="${pts}" fill="none" stroke="${LINE_COLOR}" stroke-width="2" stroke-linejoin="round" opacity="0.9"/>`,
  );
}

// 중앙 브랜드 텍스트
parts.push(
  `<text x="${CX}" y="${CY - 2}" text-anchor="middle" fill="${LINE_COLOR}" font-family="ui-monospace,Menlo,monospace" font-size="22" letter-spacing="4" font-weight="800">ANIAGRAM</text>`,
);
parts.push(
  `<text x="${CX}" y="${CY + 20}" text-anchor="middle" fill="${TEXT_L}" font-family="ui-monospace,Menlo,monospace" font-size="11" letter-spacing="3">9 TYPES</text>`,
);

// 9개 노드 + 바깥 pill 라벨
for (let n = 1 as TypeId; n <= 9; n = ((n as number) + 1) as TypeId) {
  const animal = ANIMALS[n];
  const type = TYPES[n];
  const angle = ANGLES[n];
  const [nx, ny] = polar(RING_R, angle);
  const [lx, ly] = polar(LABEL_R, angle);
  const accent = animal.accent;

  // 번호 원
  parts.push(`
  <g>
    <circle cx="${fmt(nx)}" cy="${fmt(ny)}" r="${NODE_R}" fill="${accent}" stroke="${BG}" stroke-width="3"/>
    <text x="${fmt(nx)}" y="${fmt(ny + 6)}" text-anchor="middle" fill="${NUMBER_FG}" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="800">${n}</text>
  </g>`);

  // pill 라벨 (sprite + 텍스트)
  const pillX = lx - PILL_W / 2;
  const pillY = ly - PILL_H / 2;
  const spriteCx = pillX + 34;
  const spriteCy = ly;
  const textX = pillX + 66;

  parts.push(`
  <g>
    <rect x="${fmt(pillX)}" y="${fmt(pillY)}" width="${PILL_W}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${SURFACE}" stroke="${accent}" stroke-width="1.5"/>
    ${spriteGroup(animal.sprite, spriteCx, spriteCy, SPRITE_MAX)}
    <text x="${fmt(textX)}" y="${fmt(ly - 4)}" fill="${TEXT}" font-family="system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="15" font-weight="700">${n}번 · ${type.name}</text>
    <text x="${fmt(textX)}" y="${fmt(ly + 16)}" fill="${TEXT_L}" font-family="system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-size="11">${animal.name}</text>
  </g>`);
}


const title = "애니어그램 9유형 원형 그래프 · Aniagram 9 Types";
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" role="img" aria-label="${title}">
  <title>${title}</title>
  ${parts.join("\n  ")}
</svg>
`;

writeFileSync(OUT_PATH, svg, "utf8");
console.log(`wrote ${OUT_PATH}`);
