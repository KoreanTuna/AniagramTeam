import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, GhostBtn, SecondaryBtn } from "../components/Btn";
import { PixelIcon } from "../components/PixelIcon";
import { PixelAnimal } from "../components/PixelAnimal";
import { ExpiredBadge } from "../components/ExpiredBadge";
import { bgStyle, C } from "../data/design";
import { useAuth } from "../lib/auth";
import { listMyTeams, MyTeamEntry } from "../lib/teams";
import { daysUntil } from "../lib/teamCode";
import { loadResult } from "../lib/localResult";
import { TYPES } from "../data/enneagram";

export function MyTeams() {
  const nav = useNavigate();
  const { user, isGoogleAuthed, loading, signInWithGoogle } = useAuth();
  const [entries, setEntries] = useState<MyTeamEntry[] | null>(null);
  const [error, setError] = useState<string>("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  // Google 인증이 완료되면 authBusy를 해제한다.
  useEffect(() => {
    if (isGoogleAuthed) setAuthBusy(false);
  }, [isGoogleAuthed]);

  useEffect(() => {
    if (!user || !isGoogleAuthed) return;
    let cancelled = false;
    setEntries(null);
    setError("");
    listMyTeams(user.uid)
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch((e) => {
        console.error("listMyTeams failed", e);
        if (!cancelled) {
          setError("팀 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
          setEntries([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, isGoogleAuthed]);

  const handleGoogleLogin = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("Google 로그인 시작 실패", e);
      setAuthError("Google 로그인을 시작할 수 없어요. 잠시 후 다시 시도해주세요.");
      setAuthBusy(false);
    }
  };

  if (loading) return null;

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
            <PixelIcon name="team" size={36} color={C.primary} accent={C.peachA} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold mb-1"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            MY TEAMS
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: C.text }}>
            내가 속한 팀
          </h1>
          <p className="text-sm" style={{ color: C.textL }}>
            이 Google 계정으로 만들거나 참여한 팀이에요.
          </p>
        </div>

        {!isGoogleAuthed ? (
          <div className="space-y-3 mb-4">
            <div
              className="p-4 rounded-xl text-sm leading-relaxed"
              style={{
                background: C.surfaceHi,
                color: C.textL,
                border: `1px solid ${C.border}`,
              }}
            >
              내 팀 목록을 보려면 <b style={{ color: C.text }}>Google 로그인</b>이 필요해요.
              <br />
              로그인 후 바로 팀 목록을 보여드릴게요.
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
            <SecondaryBtn onClick={() => nav("/")}>처음으로</SecondaryBtn>
          </div>
        ) : entries === null ? (
          <div
            className="text-center py-8 text-xs"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.18em" }}
          >
            LOADING...
          </div>
        ) : error ? (
          <div
            className="text-xs p-3 rounded-xl mb-3"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: C.danger,
              border: `1px solid rgba(239,68,68,0.3)`,
            }}
          >
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div
            className="text-center py-8 px-4 rounded-xl mb-4"
            style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.textL }}
          >
            <div className="mb-2">
              <PixelAnimal type={9} size={48} />
            </div>
            <div className="text-sm">아직 속한 팀이 없어요.</div>
            <div className="text-xs mt-1" style={{ color: C.textLL }}>
              팀을 만들거나 초대 코드로 참여해보세요.
            </div>
          </div>
        ) : (
          <ul className="space-y-2 mb-4">
            {entries.map((e) => {
              const type = TYPES[e.member.type];
              const days = daysUntil(e.team.expiresAt);
              return (
                <li key={e.team.id}>
                  <button
                    onClick={() => nav(`/team/${e.team.code}`)}
                    className="w-full text-left p-3 rounded-xl transition-colors"
                    style={{
                      background: C.surfaceHi,
                      border: `1px solid ${C.border}`,
                      opacity: e.expired ? 0.7 : 1,
                    }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.background = C.surfaceActive;
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.background = C.surfaceHi;
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: type.bg, border: `1px solid ${C.border}` }}
                      >
                        <PixelAnimal type={e.member.type} size={28} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="font-bold text-[15px] truncate"
                            style={{ color: C.text }}
                          >
                            {e.team.name}
                          </div>
                          {e.expired && <ExpiredBadge />}
                        </div>
                        <div
                          className="text-[11px] mt-0.5 flex items-center gap-1.5"
                          style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
                        >
                          <span>{e.team.code}</span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span>{e.member.nickname}</span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span style={{ color: type.color }}>
                            {e.member.type}번 {type.name}
                          </span>
                        </div>
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: e.expired ? C.danger : C.textLL }}
                        >
                          {e.expired ? "만료된 팀 · 읽기 전용" : `${days}일 남음`}
                        </div>
                      </div>
                      <span style={{ color: C.textLL }} className="text-sm">
                        ›
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {isGoogleAuthed && (
          <div className="space-y-2">
            <PrimaryBtn onClick={() => nav(loadResult() ? "/team/create" : "/role")}>
              새 팀 만들기
            </PrimaryBtn>
            <GhostBtn onClick={() => nav("/")}>처음으로</GhostBtn>
          </div>
        )}
      </Card>
    </div>
  );
}
