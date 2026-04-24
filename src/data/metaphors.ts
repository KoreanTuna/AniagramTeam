import { TypeId } from "../types";

export type MetaphorVector = [number, number, number, number, number, number, number, number, number];

export type Metaphor = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  vector: MetaphorVector; // T1 ~ T9 가중치 (0~10)
  dominantTypes: TypeId[]; // 설명에 쓸 대표 유형 2~3개
  description: string;
};

export const METAPHORS: Metaphor[] = [
  {
    id: "aws",
    name: "AWS",
    emoji: "☁️",
    tagline: "인프라 장인 · 검증과 안정",
    vector: [8, 3, 5, 3, 10, 9, 3, 5, 4],
    dominantTypes: [5, 6, 1],
    description: "깊이 있는 전문성과 원칙 있는 안정성을 추구해요. 문서·검증·신뢰가 팀의 중심축이에요.",
  },
  {
    id: "coupang",
    name: "쿠팡",
    emoji: "🚀",
    tagline: "로켓 실행력 · 속도와 드라이브",
    vector: [5, 2, 10, 2, 5, 5, 7, 9, 3],
    dominantTypes: [3, 8, 7],
    description: "결과와 속도가 모든 것을 말해요. KPI를 향한 거침없는 추진력이 팀의 DNA예요.",
  },
  {
    id: "toss",
    name: "토스",
    emoji: "💙",
    tagline: "본질에 집요한 · UX·완성도",
    vector: [7, 4, 8, 7, 9, 5, 5, 6, 4],
    dominantTypes: [3, 5, 4],
    description: "숫자와 완성도, 본질적 UX에 모두 집요한 팀. 빠르면서도 깊이 있는 의사결정이 강점이에요.",
  },
  {
    id: "naver",
    name: "네이버",
    emoji: "🟢",
    tagline: "국민 플랫폼 · 안정과 거버넌스",
    vector: [8, 5, 6, 3, 6, 9, 3, 4, 7],
    dominantTypes: [6, 1, 9],
    description: "수많은 사용자의 일상을 책임지는 만큼, 검증되고 균형 잡힌 결정을 중시해요.",
  },
  {
    id: "kakao",
    name: "카카오",
    emoji: "💛",
    tagline: "연결 · 커뮤니티·유연",
    vector: [4, 8, 6, 5, 4, 5, 8, 5, 7],
    dominantTypes: [2, 7, 9],
    description: "사람과 사람을 잇는 따뜻한 감각. 유연함과 관계 중심의 문화가 팀을 움직여요.",
  },
  {
    id: "baemin",
    name: "배달의민족",
    emoji: "🍔",
    tagline: "즐거운 브랜드 · 유머·크리에이티브",
    vector: [4, 6, 6, 9, 3, 4, 10, 5, 5],
    dominantTypes: [7, 4, 2],
    description: "진지함 대신 재미를, 완벽함 대신 개성을 택해요. 브랜드가 곧 인격인 팀이에요.",
  },
  {
    id: "daangn",
    name: "당근마켓",
    emoji: "🥕",
    tagline: "따뜻한 커뮤니티 · 신뢰와 관계",
    vector: [6, 10, 4, 5, 3, 7, 4, 3, 8],
    dominantTypes: [2, 9, 6],
    description: "빠르기보단 믿음직하게, 크기보단 다정하게. 사람과 지역의 온기를 지키는 팀이에요.",
  },
  {
    id: "google",
    name: "구글",
    emoji: "🔬",
    tagline: "실험 엔지니어링 · 탐구와 기술",
    vector: [5, 3, 6, 7, 10, 5, 8, 4, 4],
    dominantTypes: [5, 7, 4],
    description: "호기심과 기술적 깊이가 만나는 실험실. 새로운 가설을 돌려보며 진화하는 팀이에요.",
  },
  {
    id: "apple",
    name: "애플",
    emoji: "🍎",
    tagline: "디테일 완성도 · 장인과 감성",
    vector: [10, 3, 8, 9, 7, 6, 3, 5, 3],
    dominantTypes: [1, 4, 3],
    description: "픽셀 하나, 감촉 하나까지 완성도로 말해요. 타협 없는 디테일이 팀의 정체성이에요.",
  },
  {
    id: "netflix",
    name: "넷플릭스",
    emoji: "🎬",
    tagline: "자율과 성과 · 하이퍼포머",
    vector: [4, 2, 9, 5, 8, 3, 5, 9, 3],
    dominantTypes: [3, 8, 5],
    description: "실력 있는 어른들의 팀. 솔직한 피드백과 높은 기준이 문화의 기반이에요.",
  },
  {
    id: "tesla",
    name: "테슬라",
    emoji: "⚡",
    tagline: "불가능에 도전 · 비전과 돌파",
    vector: [4, 2, 8, 7, 6, 2, 8, 10, 2],
    dominantTypes: [8, 7, 3],
    description: "남들이 안 된다는 걸 '일단 해본다'. 리스크를 껴안고 미래로 먼저 걸어가는 팀이에요.",
  },
  {
    id: "nvidia",
    name: "엔비디아",
    emoji: "🟩",
    tagline: "기술 선구자 · 선제 연구·아키텍처",
    vector: [8, 2, 8, 4, 10, 5, 4, 6, 3],
    dominantTypes: [5, 1, 3],
    description: "가장 먼저 미래를 설계하는 엔지니어링. 원리와 구조를 끝까지 파고드는 팀이에요.",
  },
  {
    id: "openai",
    name: "오픈AI",
    emoji: "🧠",
    tagline: "미션 드리븐 연구 · 야심과 실험",
    vector: [5, 3, 6, 8, 10, 4, 8, 5, 4],
    dominantTypes: [5, 4, 7],
    description: "기술로 세상을 바꾸겠다는 미션 아래, 탐구와 실험을 끊임없이 반복하는 팀이에요.",
  },
  {
    id: "musinsa",
    name: "무신사",
    emoji: "👕",
    tagline: "감각 큐레이터 · 트렌드·브랜드",
    vector: [5, 4, 8, 10, 5, 4, 8, 5, 4],
    dominantTypes: [4, 3, 7],
    description: "감각과 실행력의 결합. 트렌드를 읽고 브랜드의 결을 빚어내는 큐레이션 팀이에요.",
  },
  {
    id: "woowa",
    name: "우아한형제들",
    emoji: "🎨",
    tagline: "재미있게 잘하는 · 크리에이티브 실행",
    vector: [4, 6, 7, 9, 4, 4, 10, 5, 5],
    dominantTypes: [7, 4, 3],
    description: "진지한 문제를 재미있게 푸는 팀. 브랜드·문화·실행이 한 방향으로 흐르는 팀이에요.",
  },
];
