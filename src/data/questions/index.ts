import { Question, Role } from "../../types";
import { shuffle } from "../../lib/shuffle";
import { CORE_QUESTIONS } from "./core";
import { COMMON_QUESTIONS } from "./common";
import { ENGINEER_QUESTIONS } from "./engineer";
import { DESIGNER_QUESTIONS } from "./designer";
import { PM_QUESTIONS } from "./pm";
import { PLANNER_QUESTIONS } from "./planner";
import { MARKETER_QUESTIONS } from "./marketer";
import { DATA_QUESTIONS } from "./data";
import { SALES_QUESTIONS } from "./sales";
import { HR_QUESTIONS } from "./hr";
import { OTHER_QUESTIONS } from "./other";

const ROLE_SPECIFIC: Record<Role, Question[]> = {
  engineer: ENGINEER_QUESTIONS,
  designer: DESIGNER_QUESTIONS,
  pm: PM_QUESTIONS,
  planner: PLANNER_QUESTIONS,
  marketer: MARKETER_QUESTIONS,
  data: DATA_QUESTIONS,
  sales: SALES_QUESTIONS,
  hr: HR_QUESTIONS,
  other: OTHER_QUESTIONS,
};

const COMMON_PICK = 3;
const ROLE_PICK = 6;

function sample<T>(pool: readonly T[], n: number): T[] {
  if (pool.length <= n) return shuffle(pool);
  return shuffle(pool).slice(0, n);
}

/**
 * 매 세션 구성:
 * - CORE 3문항: 두려움/욕망/스트레스를 직접 묻는 동기 직격 문항, 항상 포함
 * - 공통 풀에서 3문항 샘플
 * - 직무 풀에서 6문항 샘플
 * = 총 12문항. 전체 순서는 섞어 '동기 직격 vs 상황 시나리오'가 교대로 나오게 한다.
 *
 * CORE가 주 유형의 축을 잡고, 나머지 9문항이 보조·날개 판별을 맡는 구조.
 */
export function getQuestions(role: Role): Question[] {
  const coreQs = shuffle(CORE_QUESTIONS);
  const commonQs = sample(COMMON_QUESTIONS, COMMON_PICK);
  const roleQs = sample(ROLE_SPECIFIC[role], ROLE_PICK);
  return shuffle([...coreQs, ...commonQs, ...roleQs]);
}
