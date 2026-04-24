import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANIMALS } from "../src/data/animals";
import { TYPES } from "../src/data/enneagram";
import { TypeId } from "../src/types";

/**
 * 9개 타입 동물 스프라이트를 README에 임베드할 SVG로 내보냄.
 * 출력: docs/animals/type-{n}.svg
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../docs/animals");
mkdirSync(OUT_DIR, { recursive: true });

for (let n = 1 as TypeId; n <= 9; n = ((n as number) + 1) as TypeId) {
  const animal = ANIMALS[n];
  const type = TYPES[n];
  const sp = animal.sprite;
  const rows = sp.pixels.length;
  const cols = sp.pixels[0].length;
  const pad = 1;
  const viewW = cols + pad * 2;
  const viewH = rows + pad * 2;

  const byColor = new Map<string, string[]>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = sp.pixels[r][c];
      const col = sp.palette[ch];
      if (!col || col === "transparent") continue;
      const rect = `<rect x="${c + pad}" y="${r + pad}" width="1" height="1"/>`;
      const arr = byColor.get(col) ?? [];
      arr.push(rect);
      byColor.set(col, arr);
    }
  }

  const groups = Array.from(byColor.entries())
    .map(([col, rects]) => `<g fill="${col}">${rects.join("")}</g>`)
    .join("\n  ");

  const title = `${n}번. ${type.name} — ${animal.name}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" shape-rendering="crispEdges" role="img" aria-label="${title}">
  <title>${title}</title>
  <rect width="${viewW}" height="${viewH}" fill="#151B24"/>
  ${groups}
</svg>
`;

  const outPath = resolve(OUT_DIR, `type-${n}.svg`);
  writeFileSync(outPath, svg, "utf8");
  console.log(`wrote ${outPath}`);
}
