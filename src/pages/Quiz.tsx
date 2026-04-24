import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { Card } from "../components/Card";
import { AnimalArena, AnimalArenaHandle } from "../components/AnimalArena";
import { bgStyle, C } from "../data/design";
import { getQuestions } from "../data/questions";
import { Choice, Role, Scores } from "../types";
import { emptyScores, topTypeOf } from "../lib/analysis";
import { saveResult } from "../lib/localResult";
import { shuffle } from "../lib/shuffle";

type LocationState = { role?: Role };

export function Quiz() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state ?? {}) as LocationState;
  const role = state.role;

  // 선택지 위치와 유형 점수의 상관을 끊기 위해 세션마다 선택지 순서를 섞음.
  const questions = useMemo(() => {
    if (!role) return [];
    return getQuestions(role).map((q) => ({
      ...q,
      choices: shuffle(q.choices),
    }));
  }, [role]);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  // 모바일에서 탭 시 mouseenter가 발생하고 mouseleave 없이 다음 문항으로 넘어가면
  // 동일 인덱스 버튼에 hover 스타일이 남는 문제 방지용. idx 변경 시 초기화한다.
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // 점수 누적은 ref로 관리해 setTimeout 내부 stale closure 문제를 제거.
  const scoresRef = useRef<Scores>(emptyScores());
  const pickingRef = useRef(false); // 빠른 연속 클릭 가드
  const arenaRef = useRef<AnimalArenaHandle>(null);
  // 이전 문항으로 돌아갈 때 점수/동물 스폰을 되돌리기 위한 선택 이력.
  const historyRef = useRef<Choice[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setHoveredIdx(null);
  }, [idx]);

  if (!role) {
    return <Navigate to="/role" replace />;
  }

  const q = questions[idx];
  const progress = ((idx + 1) / questions.length) * 100;

  const pick = (choice: Choice) => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    setFading(true);

    // 선택지 1차 점수 타입에 매칭된 동물 한 마리 추가.
    arenaRef.current?.addAnimal(choice.scores[0]);

    // 점수 누적은 동기적으로 즉시 반영.
    const next: Scores = { ...scoresRef.current };
    choice.scores.forEach((t, i) => {
      next[t] += i === 0 ? 2 : 1;
    });
    scoresRef.current = next;
    historyRef.current.push(choice);

    window.setTimeout(() => {
      if (idx < questions.length - 1) {
        setIdx(idx + 1);
      } else {
        const finalScores = scoresRef.current;
        const top = topTypeOf(finalScores);
        if (import.meta.env.DEV) {
          console.log("[quiz] final scores", finalScores, "→ top", top);
        }
        saveResult({
          type: top,
          scores: finalScores,
          role,
          completedAt: Date.now(),
        });
        nav("/result", { replace: true });
      }
      setFading(false);
      pickingRef.current = false;
    }, 220);
  };

  const goBack = () => {
    if (pickingRef.current || idx === 0) return;
    const last = historyRef.current[historyRef.current.length - 1];
    if (!last) return;
    pickingRef.current = true;
    setFading(true);

    // 스폰했던 동물 제거 + 점수 차감.
    arenaRef.current?.removeAnimal(last.scores[0]);
    const reverted: Scores = { ...scoresRef.current };
    last.scores.forEach((t, i) => {
      reverted[t] -= i === 0 ? 2 : 1;
    });
    scoresRef.current = reverted;
    historyRef.current.pop();

    window.setTimeout(() => {
      setIdx((n) => n - 1);
      setFading(false);
      pickingRef.current = false;
    }, 180);
  };

  return (
    <div style={bgStyle} className="flex items-start sm:items-center justify-center p-3 sm:p-6">
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <div className="flex justify-between items-center mb-2 text-xs" style={{ color: C.textL }}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHomeConfirm(true)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  background: C.surfaceHi,
                  border: `1px solid ${C.border}`,
                  color: C.textL,
                }}
                aria-label="홈으로 돌아가기"
              >
                <span aria-hidden>🏠</span>
                <span>홈</span>
              </button>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={pickingRef.current}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
                  style={{
                    background: C.surfaceHi,
                    border: `1px solid ${C.border}`,
                    color: C.textL,
                  }}
                  aria-label="이전 문항으로 돌아가기"
                >
                  <span aria-hidden>←</span>
                  <span>이전</span>
                </button>
              )}
              <span className="font-medium">{q.scene}</span>
            </div>
            <span>
              {idx + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceHi }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: C.primary,
              }}
            />
          </div>
        </div>
        <div className={`transition-opacity duration-200 ${fading ? "opacity-0" : "opacity-100"}`}>
          <div className="px-5 pb-4 pt-4">
            <h2
              className="text-base sm:text-lg font-bold leading-relaxed"
              style={{ color: C.text }}
            >
              {q.text}
            </h2>
          </div>
          <div className="px-5 pb-4 space-y-2.5">
            {q.choices.map((c, i) => {
              const isHover = hoveredIdx === i;
              return (
              <button
                key={`${idx}-${i}`}
                onClick={() => pick(c)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all active:scale-[0.99]"
                style={{
                  background: isHover ? C.surfaceActive : C.surfaceHi,
                  border: `1px solid ${isHover ? C.primary : C.border}`,
                  color: C.text,
                }}
              >
                <span className="font-medium mr-1.5" style={{ color: C.primary }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {c.text}
              </button>
              );
            })}
          </div>
        </div>
        <div className="px-5 pb-5">
          <div
            className="mb-1.5 text-[10px] tracking-[0.18em] font-bold"
            style={{ color: C.textLL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            ANIMAL ARENA
          </div>
          <AnimalArena ref={arenaRef} height={110} />
        </div>
      </Card>
      {showHomeConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowHomeConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-confirm-title"
        >
          <div
            className="w-full max-w-xs rounded-2xl p-5"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="home-confirm-title"
              className="text-base font-bold mb-1.5"
              style={{ color: C.text }}
            >
              홈으로 돌아갈까요?
            </h3>
            <p className="text-[13px] leading-relaxed mb-4" style={{ color: C.textL }}>
              지금까지 선택한 답변은 저장되지 않아요.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowHomeConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: C.surfaceHi,
                  color: C.text,
                  border: `1px solid ${C.border}`,
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => nav("/", { replace: true })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: C.primary }}
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
