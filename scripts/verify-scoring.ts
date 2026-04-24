import { Role, Scores, TypeId } from "../src/types";
import { getQuestions } from "../src/data/questions";
import { COMMON_QUESTIONS } from "../src/data/questions/common";
import { CORE_QUESTIONS } from "../src/data/questions/core";
import { ENGINEER_QUESTIONS } from "../src/data/questions/engineer";
import { DESIGNER_QUESTIONS } from "../src/data/questions/designer";
import { PM_QUESTIONS } from "../src/data/questions/pm";
import { PLANNER_QUESTIONS } from "../src/data/questions/planner";
import { MARKETER_QUESTIONS } from "../src/data/questions/marketer";
import { DATA_QUESTIONS } from "../src/data/questions/data";
import { SALES_QUESTIONS } from "../src/data/questions/sales";
import { HR_QUESTIONS } from "../src/data/questions/hr";
import { OTHER_QUESTIONS } from "../src/data/questions/other";
import { TYPES, REL, WINGS, wingKey } from "../src/data/enneagram";

const ROLES: Role[] = ["engineer", "designer", "pm", "planner", "marketer", "data", "sales", "hr", "other"];
const ALL_TYPES: TypeId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function emptyScores(): Scores {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
}

function topTypeOf(s: Scores): TypeId {
  let top: TypeId = 1;
  let max = -Infinity;
  for (const t of ALL_TYPES) {
    if (s[t] > max) {
      max = s[t];
      top = t;
    }
  }
  return top;
}

function wingOf(type: TypeId, scores: Scores): TypeId | null {
  const [w1, w2] = REL[type].wings;
  const s1 = scores[w1];
  const s2 = scores[w2];
  if (s1 === 0 && s2 === 0) return null;
  if (s1 >= s2) return w1;
  return w2;
}

function simulate(role: Role, pickOption: number): { top: TypeId; scores: Scores } {
  const qs = getQuestions(role);
  const scores = emptyScores();
  for (const q of qs) {
    const c = q.choices[pickOption];
    c.scores.forEach((t, i) => {
      scores[t] += i === 0 ? 2 : 1;
    });
  }
  return { top: topTypeOf(scores), scores };
}

console.log("\n직무별 · 선택 패턴별 상위 유형 + 날개 시뮬레이션\n");
console.log("직무".padEnd(12), "A만".padEnd(14), "B만".padEnd(14), "C만".padEnd(14), "D만".padEnd(14));
for (const role of ROLES) {
  const results = [0, 1, 2, 3].map((i) => {
    const { top, scores } = simulate(role, i);
    const wing = wingOf(top, scores);
    const label = wing === null
      ? `${top}(${TYPES[top].name.slice(0, 3)})/-`
      : `${top}w${wing}(${WINGS[wingKey(top, wing)].name.slice(0, 4)})`;
    return label.padEnd(14);
  });
  console.log(role.padEnd(12), ...results);
}

console.log("\n자세한 점수 (개발자, A만 선택):");
console.log(simulate("engineer", 0).scores);
console.log("\n자세한 점수 (개발자, B만 선택):");
console.log(simulate("engineer", 1).scores);
console.log("\n자세한 점수 (개발자, C만 선택):");
console.log(simulate("engineer", 2).scores);
console.log("\n자세한 점수 (개발자, D만 선택):");
console.log(simulate("engineer", 3).scores);

// 무작위 샘플링으로 날개 분포가 한쪽으로 쏠리지 않는지 확인.
console.log("\n무작위 500회 시뮬레이션 (각 문항 임의 선택) — 주 유형 × 날개 분포:");
const wingCounts: Record<string, number> = {};
const noWingByType: Record<TypeId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
const runs = 500;
for (let r = 0; r < runs; r++) {
  const role = ROLES[r % ROLES.length];
  const qs = getQuestions(role);
  const scores = emptyScores();
  for (const q of qs) {
    const c = q.choices[Math.floor(Math.random() * q.choices.length)];
    c.scores.forEach((t, i) => {
      scores[t] += i === 0 ? 2 : 1;
    });
  }
  const top = topTypeOf(scores);
  const wing = wingOf(top, scores);
  if (wing === null) {
    noWingByType[top]++;
    continue;
  }
  const key = `${top}w${wing}`;
  wingCounts[key] = (wingCounts[key] ?? 0) + 1;
}
const sortedWings = Object.entries(wingCounts).sort((a, b) => b[1] - a[1]);
for (const [key, n] of sortedWings) {
  const bar = "█".repeat(Math.round((n / runs) * 100));
  console.log(`  ${key.padEnd(6)} ${String(n).padStart(3)}  ${bar}`);
}
const noWingTotal = Object.values(noWingByType).reduce((a, b) => a + b, 0);
if (noWingTotal > 0) {
  console.log(`  (날개 판정 불가: ${noWingTotal}건 — 유형별:`, noWingByType, ")");
}

// 의미 검증: 각 타입이 primary(첫 번째 점수) 위치로 등장하는 빈도.
// 특정 타입이 primary로 너무 적게 등장하면 그 유형은 주 유형으로 판별되기 어려움.
console.log("\n========================================");
console.log("의미 검증 — 풀별 각 타입의 primary 등장 횟수");
console.log("========================================");

const POOLS: { name: string; qs: typeof COMMON_QUESTIONS; minPrimary: number }[] = [
  { name: "CORE", qs: CORE_QUESTIONS, minPrimary: 0 },
  { name: "공통(COMMON)", qs: COMMON_QUESTIONS, minPrimary: 2 },
  { name: "개발자(ENGINEER)", qs: ENGINEER_QUESTIONS, minPrimary: 2 },
  { name: "디자이너(DESIGNER)", qs: DESIGNER_QUESTIONS, minPrimary: 2 },
  { name: "PM", qs: PM_QUESTIONS, minPrimary: 2 },
  { name: "기획자(PLANNER)", qs: PLANNER_QUESTIONS, minPrimary: 2 },
  { name: "마케터(MARKETER)", qs: MARKETER_QUESTIONS, minPrimary: 2 },
  { name: "데이터(DATA)", qs: DATA_QUESTIONS, minPrimary: 2 },
  { name: "세일즈(SALES)", qs: SALES_QUESTIONS, minPrimary: 2 },
  { name: "HR", qs: HR_QUESTIONS, minPrimary: 2 },
  { name: "기타(OTHER)", qs: OTHER_QUESTIONS, minPrimary: 2 },
];

let warnCount = 0;
for (const pool of POOLS) {
  const primaryCount: Record<TypeId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  const secondaryCount: Record<TypeId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const q of pool.qs) {
    for (const c of q.choices) {
      primaryCount[c.scores[0]] += 1;
      if (c.scores.length > 1) secondaryCount[c.scores[1]!] += 1;
    }
  }
  const line = ALL_TYPES.map((t) => {
    const p = primaryCount[t];
    const s = secondaryCount[t];
    const warn = p < pool.minPrimary ? "⚠" : " ";
    return `${t}:${warn}${String(p).padStart(2)}/${String(s).padStart(2)}`;
  }).join("  ");
  console.log(`\n[${pool.name}] (primary/secondary, min primary=${pool.minPrimary})`);
  console.log(`  ${line}`);
  for (const t of ALL_TYPES) {
    if (primaryCount[t] < pool.minPrimary) {
      warnCount++;
    }
  }
}

if (warnCount > 0) {
  console.log(`\n⚠ 경고: ${warnCount}개 (풀, 타입) 조합이 최소 primary 기준을 충족하지 못했어요.`);
  process.exit(1);
} else {
  console.log(`\n✓ 모든 풀에서 각 타입이 primary 최소 기준을 충족해요.`);
}
