import { TypeId } from "../types";

export type PixelSprite = {
  pixels: string[];
  palette: Record<string, string>;
};

export type TypeAnimal = {
  name: string;        // 예: "황금 올빼미"
  species: string;     // 예: "올빼미"
  sprite: PixelSprite;
  accent: string;      // 유형 색과 어울리는 포인트 컬러 (스폰 플래시 등)
};

/**
 * 9가지 에니어그램 유형을 8비트 동물로 매칭.
 * 유형 성격과 동물 이미지가 직관적으로 연결되도록 골랐음.
 */
export const ANIMALS: Record<TypeId, TypeAnimal> = {
  // 1번 개혁가 — 정확·원칙·통찰의 상징, 황금 올빼미
  1: {
    name: "황금 올빼미",
    species: "올빼미",
    accent: "#FACC15",
    sprite: {
      pixels: [
        ".M...M.",
        "MMMMMMM",
        "MWKMKWM",
        "MMMOMMM",
        "MWMMMWM",
        "MMMMMMM",
        ".MMMMM.",
        ".M.M.M.",
      ],
      palette: { M: "#CA8A04", W: "#FEF3C7", K: "#111827", O: "#F97316", ".": "transparent" },
    },
  },
  // 2번 조력자 — 따뜻·포근, 흰 토끼
  2: {
    name: "포근한 토끼",
    species: "토끼",
    accent: "#EC4899",
    sprite: {
      pixels: [
        "W.....W",
        "W.....W",
        "WW...WW",
        "WWWWWWW",
        "WKWWWKW",
        "WWWNWWW",
        ".WWWWW.",
        ".W...W.",
      ],
      palette: { W: "#F3F4F6", K: "#111827", N: "#F472B6", ".": "transparent" },
    },
  },
  // 3번 성취자 — 영리·민첩, 주황 여우
  3: {
    name: "영리한 여우",
    species: "여우",
    accent: "#FB923C",
    sprite: {
      pixels: [
        "R.....R",
        "RR...RR",
        "RRRWRRR",
        "RKRWRKR",
        "RRRNRRR",
        "WRRRRRW",
        ".RRRRR.",
        "R.....R",
      ],
      palette: { R: "#F97316", W: "#FFFFFF", K: "#111827", N: "#1F2937", ".": "transparent" },
    },
  },
  // 4번 예술가 — 독창·신비, 보랏빛 고양이
  4: {
    name: "신비한 고양이",
    species: "고양이",
    accent: "#A78BFA",
    sprite: {
      pixels: [
        ".L...L.",
        "LLL.LLL",
        "LLLLLLL",
        "LKLLLKL",
        "LLLNLL.",
        "LWLLLWL",
        ".LLLLL.",
        "L.L.L.L",
      ],
      palette: { L: "#A78BFA", K: "#1F2937", N: "#EC4899", W: "#E9D5FF", ".": "transparent" },
    },
  },
  // 5번 탐구자 — 관찰·사색, 초록 개구리
  5: {
    name: "호기심 개구리",
    species: "개구리",
    accent: "#38BDF8",
    sprite: {
      pixels: [
        ".GGGGG.",
        "GWKWKWG",
        "GGGGGGG",
        "GG.K.GG",
        "GGGGGGG",
        ".GGGGG.",
        "G.G.G.G",
        "G.....G",
      ],
      palette: { G: "#22C55E", K: "#0F172A", W: "#FFFFFF", ".": "transparent" },
    },
  },
  // 6번 충성가 — 믿음직, 갈색 강아지
  6: {
    name: "든든한 강아지",
    species: "강아지",
    accent: "#34D399",
    sprite: {
      pixels: [
        "MM..MMM",
        "MMMMMMM",
        "MKMMMKM",
        "MMMNMMM",
        "MMOOOMM",
        "MMMMMMM",
        ".MMMMM.",
        ".M...M.",
      ],
      palette: { M: "#B45309", K: "#111827", N: "#1F2937", O: "#FFFFFF", ".": "transparent" },
    },
  },
  // 7번 열정가 — 경쾌·발랄, 노란 병아리
  7: {
    name: "발랄한 병아리",
    species: "병아리",
    accent: "#22D3EE",
    sprite: {
      pixels: [
        "..YYY..",
        ".YYYYY.",
        "YKYYYKY",
        "YYOOOYY",
        "YYYYYYY",
        ".YYYYY.",
        "..O.O..",
        ".......",
      ],
      palette: { Y: "#FDE047", O: "#FB923C", K: "#111827", ".": "transparent" },
    },
  },
  // 8번 도전자 — 강인·대담, 붉은 곰
  8: {
    name: "용맹한 곰",
    species: "곰",
    accent: "#F87171",
    sprite: {
      pixels: [
        "M.....M",
        "MMM.MMM",
        "MMMMMMM",
        "MKMMMKM",
        "MMMTMMM",
        "MMWWWMM",
        ".MMMMM.",
        "M.M.M.M",
      ],
      palette: { M: "#7C2D12", K: "#111827", T: "#0F172A", W: "#F5F5DC", ".": "transparent" },
    },
  },
  // 9번 평화주의자 — 느긋·조화, 판다
  9: {
    name: "느긋한 판다",
    species: "판다",
    accent: "#94A3B8",
    sprite: {
      pixels: [
        "B.....B",
        "BBW.WBB",
        "WWWWWWW",
        "WBWWWBW",
        "WBWWWBW",
        "WWWNWWW",
        ".WWWWW.",
        "B.....B",
      ],
      palette: { W: "#F9FAFB", B: "#111827", N: "#4B5563", ".": "transparent" },
    },
  },
};

export function animalOf(type: TypeId): TypeAnimal {
  return ANIMALS[type];
}
