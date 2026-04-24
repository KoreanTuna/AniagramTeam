import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, GhostBtn } from "../components/Btn";
import { PixelIcon } from "../components/PixelIcon";
import { bgStyle, C } from "../data/design";
import { useAuth } from "../lib/auth";
import { createTeam, TeamError } from "../lib/teams";
import { loadResult } from "../lib/localResult";

export function TeamCreate() {
  const nav = useNavigate();
  const { user, isGoogleAuthed, signInWithGoogle } = useAuth();
  const result = loadResult();
  const [teamName, setTeamName] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  if (!result) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/" replace />;

  const canSubmit =
    isGoogleAuthed &&
    teamName.trim().length >= 2 &&
    nickname.trim().length >= 1 &&
    !busy;

  const handleGoogleLogin = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      // 리다이렉트로 이동하므로 성공 시 이후 코드는 실행되지 않는다.
      await signInWithGoogle();
    } catch (e) {
      console.error("Google 로그인 시작 실패", e);
      setAuthError("Google 로그인을 시작할 수 없어요. 잠시 후 다시 시도해주세요.");
      setAuthBusy(false);
    }
  };

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const team = await createTeam({
        ownerUid: user.uid,
        teamName: teamName.trim(),
        ownerNickname: nickname.trim(),
        ownerMember: {
          type: result.type,
          scores: result.scores,
          role: result.role,
        },
      });
      nav(`/team/${team.code}`, { replace: true });
    } catch (e) {
      console.error("createTeam failed", e);
      if (e instanceof TeamError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(`팀 생성 실패: ${e.message}`);
      } else {
        setError("팀 생성 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
      }
      setBusy(false);
    }
  };

  return (
    <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
      <Card className="p-6 sm:p-8">
        <button
          onClick={() => nav(-1)}
          className="text-xs mb-3"
          style={{ color: C.textL }}
        >
          ← 뒤로
        </button>
        <div className="text-center mb-6">
          <div className="mb-2 inline-flex">
            <PixelIcon name="gift" size={36} color={C.primary} accent={C.peachA} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold mb-1"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            NEW TEAM
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: C.text }}>
            팀 만들기
          </h1>
          <p className="text-sm" style={{ color: C.textL }}>
            6자리 코드가 발급되고, 팀원을 최대 10명까지 초대할 수 있어요.
            <br />팀은 7일 동안 유지돼요.
          </p>
        </div>

        {!isGoogleAuthed ? (
          <div className="space-y-3">
            <div
              className="p-4 rounded-xl text-sm leading-relaxed"
              style={{
                background: C.surfaceHi,
                color: C.textL,
                border: `1px solid ${C.border}`,
              }}
            >
              팀을 만들려면 <b style={{ color: C.text }}>Google 로그인</b>이 필요해요.
              <br />
              지금까지 푼 결과는 그대로 유지돼요.
            </div>
            {authError && (
              <div
                className="text-xs p-3 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: C.danger,
                  border: `1px solid rgba(239,68,68,0.3)`,
                }}
              >
                {authError}
              </div>
            )}
            <PrimaryBtn onClick={handleGoogleLogin} disabled={authBusy}>
              {authBusy ? "로그인 중..." : "Google로 로그인하고 계속하기"}
            </PrimaryBtn>
            <GhostBtn onClick={() => nav("/result")}>결과 화면으로 돌아가기</GhostBtn>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: C.textL }}
                >
                  팀 이름
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="예) 프로덕트 드림팀"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl text-base outline-none border-2"
                  style={{ background: C.surfaceHi, borderColor: C.border, color: C.text }}
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium mb-1.5 block"
                  style={{ color: C.textL }}
                >
                  내 닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="팀에서 불릴 이름"
                  maxLength={12}
                  className="w-full px-4 py-3 rounded-xl text-base outline-none border-2"
                  style={{ background: C.surfaceHi, borderColor: C.border, color: C.text }}
                />
              </div>
            </div>

            {error && (
              <div
                className="mb-3 text-xs p-3 rounded-xl"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: C.danger,
                  border: `1px solid rgba(239,68,68,0.3)`,
                }}
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <PrimaryBtn onClick={submit} disabled={!canSubmit}>
                {busy ? "만드는 중..." : "팀 만들기"}
              </PrimaryBtn>
              <GhostBtn onClick={() => nav("/result")}>결과 화면으로 돌아가기</GhostBtn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
