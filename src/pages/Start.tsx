import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn, GhostBtn } from "../components/Btn";
import { PixelAnimal } from "../components/PixelAnimal";
import { PixelIcon } from "../components/PixelIcon";
import { bgStyle, C } from "../data/design";
import { isValidCodeFormat, normalizeCode } from "../lib/teamCode";
import { TypeId } from "../types";

const HERO_LINEUP: TypeId[] = [3, 2, 8, 4, 7];

export function Start() {
  const nav = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");

  const onJoin = () => {
    const normalized = normalizeCode(code);
    if (!isValidCodeFormat(normalized)) {
      setError("영문·숫자 6자리 코드를 입력해주세요.");
      return;
    }
    nav(`/join/${normalized}`);
  };

  return (
    <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
      <Card className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center items-end gap-1 mb-3">
            {HERO_LINEUP.map((t, i) => (
              <div key={t} style={{ transform: `translateY(${i % 2 === 0 ? 0 : -6}px)` }}>
                <PixelAnimal type={t} size={52} />
              </div>
            ))}
          </div>
          <div
            className="text-[10px] tracking-[0.22em] font-bold mb-1"
            style={{ color: C.primary, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            ANIAGRAM · 8BIT EDITION
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: C.text }}>
            우리 팀 애니어그램
          </h1>
          <p className="text-sm sm:text-base" style={{ color: C.textL }}>
            팀원과 함께 풀어보는 직장인 성향 테스트
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-5" style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}>
          <div className="space-y-3 text-sm" style={{ color: C.text }}>
            <div className="flex items-start gap-3">
              <PixelIcon name="sparkle" size={16} color={C.primary} />
              <span>직무를 골라 맞춤 질문 12개로 나의 유형 찾기</span>
            </div>
            <div className="flex items-start gap-3">
              <PixelIcon name="team" size={16} color={C.primary} />
              <span>팀을 만들어 시너지와 궁합을 실시간으로 분석</span>
            </div>
            <div className="flex items-start gap-3">
              <PixelIcon name="target" size={16} color={C.primary} accent={C.peachA} />
              <span>AWS·토스·애플… 우리 팀은 어떤 회사 스타일?</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <PrimaryBtn onClick={() => nav("/role")}>테스트 시작하기</PrimaryBtn>

          <SecondaryBtn onClick={() => nav("/my-teams")}>
            <span className="inline-flex items-center gap-2">
              <PixelIcon name="team" size={14} />
              내가 속한 팀 보기
            </span>
          </SecondaryBtn>

          {!showJoin ? (
            <SecondaryBtn onClick={() => setShowJoin(true)}>
              <span className="inline-flex items-center gap-2">
                <PixelIcon name="key" size={14} />
                팀 코드로 참여하기
              </span>
            </SecondaryBtn>
          ) : (
            <div
              className="rounded-2xl p-4 space-y-2.5 border-2"
              style={{ borderColor: C.border, background: C.surfaceHi }}
            >
              <div className="text-xs font-medium" style={{ color: C.textL }}>
                6자리 팀 코드 입력
              </div>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && onJoin()}
                placeholder="ABC234"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl text-lg text-center tracking-[0.4em] font-bold uppercase outline-none border"
                style={{
                  background: C.surface,
                  borderColor: error ? C.danger : C.border,
                  color: C.text,
                }}
                autoFocus
              />
              {error && (
                <div className="text-xs" style={{ color: C.danger }}>
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowJoin(false);
                    setCode("");
                    setError("");
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: C.surface, color: C.textL, border: `1px solid ${C.border}` }}
                >
                  취소
                </button>
                <button
                  onClick={onJoin}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: C.primary }}
                >
                  참여하기
                </button>
              </div>
            </div>
          )}

          <GhostBtn onClick={() => nav("/about")}>
            <span className="inline-flex items-center gap-2">
              <PixelIcon name="brain" size={14} color={C.textL} />
              애니어그램이 뭐예요?
            </span>
          </GhostBtn>
        </div>
      </Card>
    </div>
  );
}
