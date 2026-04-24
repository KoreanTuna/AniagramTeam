import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn, GhostBtn } from "../components/Btn";
import { PixelIcon } from "../components/PixelIcon";
import { PixelAnimal } from "../components/PixelAnimal";
import { bgStyle, C } from "../data/design";
import { useAuth } from "../lib/auth";
import { joinTeam, resolveTeamByCode, TeamError } from "../lib/teams";
import { loadResult, setPendingJoin } from "../lib/localResult";
import { Team } from "../types";
import { daysUntil, isValidCodeFormat, normalizeCode, TEAM_CAPACITY } from "../lib/teamCode";

export function JoinByLink() {
  const params = useParams<{ code: string }>();
  const nav = useNavigate();
  const { user, isGoogleAuthed, signInWithGoogle } = useAuth();
  const result = loadResult();

  const rawCode = params.code ?? "";
  const code = normalizeCode(rawCode);
  const validCode = isValidCodeFormat(code);

  const [team, setTeam] = useState<Team | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolveError, setResolveError] = useState<string>("");
  const [resolveKind, setResolveKind] = useState<"expired" | "not-found" | "unknown">("unknown");

  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinErrorKind, setJoinErrorKind] = useState<"capacity" | "other">("other");

  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  // Google 인증이 완료되면 authBusy를 해제한다 (popup 성공/redirect 복귀/기존 세션).
  useEffect(() => {
    if (isGoogleAuthed) setAuthBusy(false);
  }, [isGoogleAuthed]);

  useEffect(() => {
    if (!validCode) {
      setResolving(false);
      setResolveError("유효하지 않은 초대 링크예요.");
      setResolveKind("not-found");
      return;
    }
    let cancelled = false;
    resolveTeamByCode(code)
      .then((t) => {
        if (!cancelled) setTeam(t);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        if (e instanceof TeamError) {
          setResolveError(e.message);
          if (e.code === "expired") setResolveKind("expired");
          else if (e.code === "not-found" || e.code === "team-missing") setResolveKind("not-found");
          else setResolveKind("unknown");
        } else {
          setResolveError("팀 정보를 불러올 수 없어요.");
          setResolveKind("unknown");
        }
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, validCode]);

  if (!validCode && !resolving) {
    return <Navigate to="/" replace />;
  }

  if (resolving) {
    return (
      <div style={bgStyle} className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-2 inline-flex">
            <PixelIcon name="search" size={36} color={C.primary} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            SEARCHING...
          </div>
        </div>
      </div>
    );
  }

  if (resolveError || !team) {
    const isExpired = resolveKind === "expired";
    const isNotFound = resolveKind === "not-found";
    const title = isExpired
      ? "만료된 초대 링크예요"
      : isNotFound
        ? "존재하지 않는 팀이에요"
        : "팀에 들어갈 수 없어요";
    const body = isExpired
      ? "이 팀은 7일이 지나 더 이상 참여할 수 없어요. 직접 새 팀을 만들어 동료를 초대해보세요."
      : isNotFound
        ? "코드가 잘못됐거나 이미 없어진 팀이에요. 다시 한 번 확인해주세요."
        : (resolveError ?? "잠시 후 다시 시도해주세요.");
    const iconColor = isExpired ? C.danger : C.warning;
    return (
      <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-5">
            <div className="mb-2 inline-flex">
              <PixelIcon
                name={isExpired ? "warn" : "search"}
                size={36}
                color={iconColor}
                accent={isExpired ? C.danger : C.warning}
              />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>
              {title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: C.textL }}>
              {body}
            </p>
          </div>
          <div className="space-y-2">
            {isExpired ? (
              <PrimaryBtn onClick={() => nav(loadResult() ? "/team/create" : "/role")}>
                새 팀 만들기
              </PrimaryBtn>
            ) : (
              <PrimaryBtn onClick={() => nav("/")}>처음으로</PrimaryBtn>
            )}
            {isExpired && <SecondaryBtn onClick={() => nav("/")}>처음으로</SecondaryBtn>}
          </div>
        </Card>
      </div>
    );
  }

  // 결과가 없으면 테스트부터 하도록 유도
  if (!result) {
    return (
      <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-5">
            <div className="mb-2 inline-flex">
              <PixelAnimal type={2} size={56} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>
              <span style={{ color: C.primary }}>{team.name}</span>에 초대받았어요!
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: C.textL }}>
              먼저 애니어그램 테스트를 풀어주세요.
              <br />
              결과가 나오면 자동으로 팀에 연결해드릴게요.
            </p>
          </div>
          <div className="space-y-2">
            <PrimaryBtn
              onClick={() => {
                setPendingJoin(code);
                nav("/role");
              }}
            >
              테스트 시작하기
            </PrimaryBtn>
            <GhostBtn onClick={() => nav("/")}>나중에 하기</GhostBtn>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

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

  const submit = async () => {
    if (!isGoogleAuthed || !nickname.trim() || busy) return;
    setBusy(true);
    setJoinError("");
    try {
      await joinTeam({
        team,
        uid: user.uid,
        nickname: nickname.trim(),
        member: {
          type: result.type,
          scores: result.scores,
          role: result.role,
        },
      });
      setPendingJoin(null);
      nav(`/team/${team.code}`, { replace: true });
    } catch (e) {
      console.error("joinTeam failed", e);
      if (e instanceof TeamError) {
        setJoinError(e.message);
        setJoinErrorKind(e.code === "capacity" ? "capacity" : "other");
      } else if (e instanceof Error) {
        setJoinError(`참여 실패: ${e.message}`);
        setJoinErrorKind("other");
      } else {
        setJoinError("참여 중 문제가 생겼어요.");
        setJoinErrorKind("other");
      }
      setBusy(false);
    }
  };

  return (
    <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
      <Card className="p-6 sm:p-8">
        <div className="text-center mb-5">
          <div className="mb-2 inline-flex">
            <PixelIcon name="party" size={36} color={C.primary} accent={C.peachA} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold mb-1"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            TEAM INVITE
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
            {team.name}
          </h2>
          <div className="text-xs" style={{ color: C.textL }}>
            코드 {team.code} · {daysUntil(team.expiresAt)}일 남음 · 정원 {TEAM_CAPACITY}명
          </div>
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
              팀에 참여하려면 <b style={{ color: C.text }}>Google 로그인</b>이 필요해요.
              <br />
              테스트 결과는 그대로 유지돼요.
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
            <SecondaryBtn onClick={() => nav("/")}>취소</SecondaryBtn>
          </div>
        ) : (
          <>
            <div className="mb-4">
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
                autoFocus
              />
            </div>

            {joinError && (
              <div
                className="mb-3 text-xs p-3 rounded-xl leading-relaxed"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: C.danger,
                  border: `1px solid rgba(239,68,68,0.3)`,
                }}
              >
                <div className="font-bold mb-0.5">{joinError}</div>
                {joinErrorKind === "capacity" && (
                  <div style={{ color: C.textL }}>
                    팀장에게 부탁해 기존 멤버를 정리하거나, 이 결과로 직접 새 팀을 만들어 시작해보세요.
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <PrimaryBtn onClick={submit} disabled={!nickname.trim() || busy}>
                {busy ? "참여 중..." : "팀에 참여하기"}
              </PrimaryBtn>
              {joinErrorKind === "capacity" && (
                <SecondaryBtn onClick={() => nav("/team/create")}>
                  <span className="inline-flex items-center gap-2">
                    <PixelIcon name="team" size={14} />
                    내가 새 팀 만들기
                  </span>
                </SecondaryBtn>
              )}
              <SecondaryBtn onClick={() => nav("/")}>취소</SecondaryBtn>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
