/**
 * 다크 테마 + Toss-inspired 팔레트.
 * 레거시 키(pinkA, lavA 등)는 각 유형 배색 용도로 유지하되 다크 배경에 맞춘 톤으로 재정의.
 */
export const C = {
  // Page backgrounds
  bg1: "#0B0F14",
  bg2: "#111720",
  bg3: "#18202B",

  // Surfaces
  surface: "#151B24",
  surfaceHi: "#1C2431",
  surfaceActive: "#253040",

  // Borders
  border: "#242D3A",
  borderStrong: "#35404F",

  // Primary (Toss-style blue)
  primary: "#3182F6",
  primaryHi: "#4F9BFF",
  primarySoft: "rgba(49,130,246,0.14)",

  // Text
  text: "#E6EBF2",
  textL: "#8B95A3",
  textLL: "#5B6676",

  // Status
  success: "#22C55E",
  warning: "#EAB308",
  danger: "#EF4444",

  // Utility
  white: "#FFFFFF",
  black: "#000000",

  // Type accent colors (bg = soft tinted dark, A = main, D = deeper)
  // 1번 개혁가 - gold
  yellow: "rgba(250,204,21,0.12)",
  yellowA: "#FACC15",
  yellowD: "#EAB308",

  // 2번 조력자 - pink
  pink: "rgba(236,72,153,0.12)",
  pinkA: "#EC4899",
  pinkD: "#DB2777",

  // 3번 성취자 - amber orange
  peach: "rgba(251,146,60,0.12)",
  peachA: "#FB923C",
  peachD: "#F97316",

  // 4번 예술가 - purple
  lav: "rgba(167,139,250,0.12)",
  lavA: "#A78BFA",
  lavD: "#8B5CF6",

  // 5번 탐구자 - sky blue
  sky: "rgba(56,189,248,0.12)",
  skyA: "#38BDF8",
  skyD: "#0EA5E9",

  // 6번 충성가 - green
  mint: "rgba(52,211,153,0.12)",
  mintA: "#34D399",
  mintD: "#10B981",

  // 7번 열정가 - cyan
  cyan: "rgba(34,211,238,0.12)",
  cyanA: "#22D3EE",
  cyanD: "#06B6D4",

  // 8번 도전자 - red/coral
  red: "rgba(248,113,113,0.12)",
  redA: "#F87171",
  redD: "#EF4444",

  // 9번 평화주의자 - slate
  slate: "rgba(148,163,184,0.12)",
  slateA: "#94A3B8",
  slateD: "#64748B",

  // Legacy alias (many existing usages)
  cream: "#1C2431", // subtle surface for choice buttons
};

export const bgStyle = {
  background: `
    radial-gradient(ellipse at top, ${C.bg2} 0%, ${C.bg1} 55%),
    ${C.bg1}
  `,
  minHeight: "100vh",
  color: C.text,
};
