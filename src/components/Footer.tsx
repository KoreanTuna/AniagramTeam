import { C } from "../data/design";

function GithubIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: "inline-block", verticalAlign: "-0.15em" }}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.69-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56C20.71 21.39 24 17.08 24 12 24 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 py-2 px-4 flex items-center justify-center gap-2 text-[11px] pointer-events-none z-10"
      style={{
        color: C.textLL,
        fontFamily: "ui-monospace, Menlo, monospace",
        letterSpacing: "0.05em",
        background: "linear-gradient(to top, rgba(11,15,20,0.8), rgba(11,15,20,0))",
      }}
    >
      <span>제작자 '고랭지참치'</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <a
        href="https://github.com/KoreanTuna/AniagramTeam"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 transition-colors pointer-events-auto"
        style={{ color: C.textLL }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.textL)}
        onMouseLeave={(e) => (e.currentTarget.style.color = C.textLL)}
      >
        <GithubIcon size={12} />
        <span>KoreanTuna/AniagramTeam</span>
      </a>
    </footer>
  );
}
