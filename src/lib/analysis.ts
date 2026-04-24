import { Member, Scores, TypeId } from "../types";
import { REL, CENTERS, STYLES, WINGS, WingKey, wingKey } from "../data/enneagram";
import { METAPHORS, Metaphor, MetaphorVector } from "../data/metaphors";

export const ALL_TYPES: TypeId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function emptyScores(): Scores {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
}

export function topTypeOf(scores: Scores): TypeId {
  let top: TypeId = 1;
  let max = -Infinity;
  for (const t of ALL_TYPES) {
    if (scores[t] > max) {
      max = scores[t];
      top = t;
    }
  }
  return top;
}

/** 최고 점수가 여러 유형에 걸린 경우 모두 반환. 동점 감지·안내용. */
export function topTypesOf(scores: Scores): TypeId[] {
  let max = -Infinity;
  for (const t of ALL_TYPES) if (scores[t] > max) max = scores[t];
  return ALL_TYPES.filter((t) => scores[t] === max);
}

/**
 * 주 유형의 두 인접 타입 중 점수가 더 높은 쪽을 날개로 반환.
 * - 두 인접 점수가 모두 0이면 null (판정 불가)
 * - 동점이면 REL[type].wings[0] 우선
 */
export function wingOf(type: TypeId, scores: Scores): TypeId | null {
  const [w1, w2] = REL[type].wings;
  const s1 = scores[w1];
  const s2 = scores[w2];
  if (s1 === 0 && s2 === 0) return null;
  if (s1 >= s2) return w1;
  return w2;
}

/**
 * 주 유형 + 날개 조합 키(예: "1w9")와 `WINGS` 메타데이터를 반환.
 * 날개 판정 불가 시 null.
 */
export function wingInfoOf(type: TypeId, scores: Scores) {
  const wing = wingOf(type, scores);
  if (wing === null) return null;
  const key: WingKey = wingKey(type, wing);
  return { wing, key, info: WINGS[key] };
}

function toVector(scores: Scores): MetaphorVector {
  return [
    scores[1],
    scores[2],
    scores[3],
    scores[4],
    scores[5],
    scores[6],
    scores[7],
    scores[8],
    scores[9],
  ];
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** 팀 멤버들의 점수 벡터를 합산. */
export function teamVector(members: Member[]): MetaphorVector {
  const v: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (const m of members) {
    const mv = toVector(m.scores);
    for (let i = 0; i < 9; i++) v[i] += mv[i];
  }
  return v as MetaphorVector;
}

/** 팀 벡터와 가장 유사한 기업 Top N. */
export function topMetaphors(
  members: Member[],
  n = 3
): Array<{ metaphor: Metaphor; similarity: number }> {
  if (members.length === 0) return [];
  const v = teamVector(members);
  const scored = METAPHORS.map((m) => ({
    metaphor: m,
    similarity: cosine(v, m.vector),
  }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, n);
}

/** 유형별 몇 명인지 (topType 기준). */
export function typeDistribution(members: Member[]): Record<TypeId, number> {
  const d: Record<TypeId, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const m of members) d[m.type] += 1;
  return d;
}

/** 센터(본능/감정/사고) 분포. */
export function centerDistribution(members: Member[]): Record<keyof typeof CENTERS, number> {
  const d = { gut: 0, heart: 0, head: 0 } as Record<keyof typeof CENTERS, number>;
  for (const m of members) {
    for (const key of Object.keys(CENTERS) as Array<keyof typeof CENTERS>) {
      if (CENTERS[key].types.includes(m.type)) d[key] += 1;
    }
  }
  return d;
}

/** 스타일(주장/순응/움츠림) 분포. */
export function styleDistribution(members: Member[]): Record<keyof typeof STYLES, number> {
  const d = { assertive: 0, compliant: 0, withdrawn: 0 } as Record<keyof typeof STYLES, number>;
  for (const m of members) {
    for (const key of Object.keys(STYLES) as Array<keyof typeof STYLES>) {
      if (STYLES[key].types.includes(m.type)) d[key] += 1;
    }
  }
  return d;
}

/**
 * 두 유형 간 궁합 점수 (0~100). REL 데이터 기반.
 * - best[0]: +40 / best[1]: +30
 * - challenge[0]: -30 / challenge[1]: -20
 * - growth 방향: +10, stress 방향: +0
 * - wing: +10
 * 최종 50(기본) + 조정, 클램프.
 */
function pairScoreOneWay(a: TypeId, b: TypeId): number {
  if (a === b) return 72;
  const rel = REL[a];
  let s = 55;
  if (rel.best[0] === b) s += 35;
  else if (rel.best[1] === b) s += 25;
  if (rel.challenge[0] === b) s -= 30;
  else if (rel.challenge[1] === b) s -= 20;
  if (rel.growth === b) s += 8;
  if (rel.wings[0] === b || rel.wings[1] === b) s += 6;
  return Math.max(5, Math.min(98, s));
}

export function pairScore(a: TypeId, b: TypeId): number {
  return Math.round((pairScoreOneWay(a, b) + pairScoreOneWay(b, a)) / 2);
}

export function pairReason(a: TypeId, b: TypeId): { kind: "best" | "challenge" | "neutral"; why: string } {
  if (a === b) {
    return { kind: "neutral", why: "같은 유형끼리는 서로를 빠르게 이해하지만, 맹점도 나눠 가져요." };
  }
  const rela = REL[a];
  const relb = REL[b];
  if (rela.matchWhy[b]) return { kind: "best", why: rela.matchWhy[b]! };
  if (relb.matchWhy[a]) return { kind: "best", why: relb.matchWhy[a]! };
  if (rela.challengeWhy[b]) return { kind: "challenge", why: rela.challengeWhy[b]! };
  if (relb.challengeWhy[a]) return { kind: "challenge", why: relb.challengeWhy[a]! };
  return { kind: "neutral", why: "특별한 긴장도 끌림도 없는, 차분한 관계예요." };
}

export type PairResult = {
  a: Member;
  b: Member;
  score: number;
  reason: ReturnType<typeof pairReason>;
};

/** 모든 페어의 점수를 계산하고 점수 내림차순 정렬. */
export function allPairs(members: Member[]): PairResult[] {
  const out: PairResult[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i];
      const b = members[j];
      out.push({
        a,
        b,
        score: pairScore(a.type, b.type),
        reason: pairReason(a.type, b.type),
      });
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

/** 가장 잘 맞는 콤비 / 긴장 주의 콤비 추출. */
export function bestAndChallengeCombos(members: Member[]): {
  best?: PairResult;
  challenge?: PairResult;
} {
  const pairs = allPairs(members);
  if (pairs.length === 0) return {};
  const best = pairs[0];
  const challenge = pairs[pairs.length - 1];
  return { best, challenge };
}

/** 팀 전체 페어 평균 궁합. 멤버 2명 미만이면 null. */
export function teamAveragePairScore(members: Member[]): number | null {
  if (members.length < 2) return null;
  const pairs = allPairs(members);
  const sum = pairs.reduce((acc, p) => acc + p.score, 0);
  return Math.round(sum / pairs.length);
}

/** 팀 유형 다양성. 고유 유형 수와 멤버 수 대비 비율, 사람이 읽을 라벨을 함께 반환. */
export function diversityIndex(members: Member[]): {
  unique: number;
  total: number;
  pct: number;
  label: string;
} {
  const total = members.length;
  if (total === 0) return { unique: 0, total: 0, pct: 0, label: "—" };
  const dist = typeDistribution(members);
  const unique = ALL_TYPES.filter((t) => dist[t] > 0).length;
  const pct = Math.round((unique / total) * 100);
  let label: string;
  if (total === 1) label = "—";
  else if (unique === total) label = "매우 다양함";
  else if (unique / total >= 0.7) label = "다양함";
  else if (unique / total >= 0.5) label = "적당히 섞임";
  else label = "비슷한 성향";
  return { unique, total, pct, label };
}

const CENTER_DOMINANT_LABEL: Record<keyof typeof CENTERS, string> = {
  gut: "실행력",
  heart: "관계·감정",
  head: "사고·전략",
};

const CENTER_WEAK_LABEL: Record<keyof typeof CENTERS, string> = {
  gut: "실행·추진",
  heart: "관계·감정",
  head: "분석·전략",
};

const STYLE_LABEL: Record<keyof typeof STYLES, string> = {
  assertive: "적극적으로 밀어붙이는",
  compliant: "협력적으로 합을 맞추는",
  withdrawn: "신중하게 내면을 살피는",
};

/**
 * 팀 전체 성향을 한 문장으로 요약. 센터/스타일 분포 + 빈 라인 감지.
 * 예) "실행력 중심, 적극적으로 밀어붙이는 팀이에요. 관계·감정 라인이 비어 있어요."
 */
export function teamOneLiner(members: Member[]): string {
  const total = members.length;
  if (total === 0) return "";
  if (total === 1) {
    return "아직 혼자 있는 팀이에요. 동료가 들어오면 팀 성향이 보여요.";
  }

  const centers = centerDistribution(members);
  const styles = styleDistribution(members);

  const centerEntries = (Object.keys(centers) as Array<keyof typeof CENTERS>)
    .map((k) => ({ key: k, count: centers[k] }))
    .sort((a, b) => b.count - a.count);
  const styleEntries = (Object.keys(styles) as Array<keyof typeof STYLES>)
    .map((k) => ({ key: k, count: styles[k] }))
    .sort((a, b) => b.count - a.count);

  const topCenter = centerEntries[0];
  const weakestCenter = centerEntries[centerEntries.length - 1];
  const topStyle = styleEntries[0];

  const parts: string[] = [];
  if (topCenter.count / total >= 0.5) {
    parts.push(`${CENTER_DOMINANT_LABEL[topCenter.key]} 중심`);
  } else if (centerEntries.every((e) => e.count > 0)) {
    parts.push("센터가 균형 잡힌");
  } else {
    parts.push(`${CENTER_DOMINANT_LABEL[topCenter.key]}이 돋보이는`);
  }
  if (topStyle.count / total >= 0.5) {
    parts.push(STYLE_LABEL[topStyle.key]);
  }

  let line = `${parts.join(", ")} 팀이에요.`;
  if (weakestCenter.count === 0 && total >= 3) {
    line += ` ${CENTER_WEAK_LABEL[weakestCenter.key]} 라인이 비어 있어요.`;
  }
  return line;
}
