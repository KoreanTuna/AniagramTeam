import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn, GhostBtn } from "../components/Btn";
import { TypeBadge } from "../components/TypeBadge";
import { PixelIcon } from "../components/PixelIcon";
import { PixelAnimal } from "../components/PixelAnimal";
import { ExpiredBanner, ExpiryText } from "../components/ExpiredBadge";
import { ConfirmModal } from "../components/ConfirmModal";
import { Toast } from "../components/Toast";
import { RadarChart } from "../components/charts/RadarChart";
import { bgStyle, C } from "../data/design";
import { ROLE_LABELS, TYPES } from "../data/enneagram";
import { Member, Team, Scores } from "../types";
import { useAuth } from "../lib/auth";
import {
  resolveTeamByCode,
  subscribeTeam,
  leaveTeam,
  isMember as checkIsMember,
  TeamError,
} from "../lib/teams";
import { ALL_TYPES, analyzeTeam, wingOf } from "../lib/analysis";
import { clearResult, setPendingJoin } from "../lib/localResult";
import {
  isExpired,
  isValidCodeFormat,
  normalizeCode,
  TEAM_CAPACITY,
} from "../lib/teamCode";
import { ROLE_ICON } from "./team/roleIcon";
import { ComboCard } from "./team/ComboCard";
import { SummaryStat, MedalBadge, avgPairHint } from "./team/SummaryStat";
import { ChemistryGraph, LegendLine } from "./team/ChemistryGraph";
import { MemberDetail } from "./team/MemberDetail";
import { PairDetail } from "./team/PairDetail";

export function TeamDashboard() {
  const params = useParams<{ code: string }>();
  const nav = useNavigate();
  const { user } = useAuth();

  const rawCode = params.code ?? "";
  const code = normalizeCode(rawCode);

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [selectedPair, setSelectedPair] = useState<{ a: Member; b: Member } | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);

  useEffect(() => {
    if (!isValidCodeFormat(code)) {
      setLoadError("유효하지 않은 팀 코드예요.");
      setLoading(false);
      return;
    }
    if (!user) return;

    let unsub: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        // 대시보드는 기존 멤버가 만료된 팀도 읽기 전용으로 회고할 수 있도록 만료 허용.
        const t = await resolveTeamByCode(code, { allowExpired: true });
        if (cancelled) return;
        // 가입하지 않은 사용자는 팀 데이터 접근 불가. 참여 페이지로 유도.
        const joined = await checkIsMember(t.id, user.uid);
        if (cancelled) return;
        if (!joined) {
          nav(`/join/${code}`, { replace: true });
          return;
        }
        setTeam(t);
        const sub = subscribeTeam(t.id, (liveTeam, liveMembers) => {
          if (cancelled) return;
          if (liveTeam) setTeam(liveTeam);
          setMembers(liveMembers);
          setLoading(false);
        });
        // 구독 생성과 cancelled 체크 사이에 unmount가 발생해도 즉시 정리.
        if (cancelled) {
          sub();
          return;
        }
        unsub = sub;
      } catch (e: unknown) {
        if (cancelled) return;
        if (e instanceof TeamError) setLoadError(e.message);
        else setLoadError("팀 정보를 불러올 수 없어요.");
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [code, user, nav]);

  const isOwner = !!user && !!team && team.ownerUid === user.uid;
  const analysis = useMemo(() => analyzeTeam(members, 3), [members]);
  const {
    metaphorTop,
    typeDistribution: typeDist,
    best,
    challenge,
    averagePairScore: avgScore,
    diversity,
    oneLiner,
    vector: v,
  } = analysis;

  const teamScores = useMemo<Scores>(
    () => ({ 1: v[0], 2: v[1], 3: v[2], 4: v[3], 5: v[4], 6: v[5], 7: v[6], 8: v[7], 9: v[8] }),
    [v]
  );

  const showToast = (msg: string) => setToast(msg);

  const copyCode = async () => {
    if (!team) return;
    try {
      await navigator.clipboard.writeText(team.code);
      showToast("팀 코드를 복사했어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  };

  const copyLink = async () => {
    if (!team) return;
    const link = `${window.location.origin}/join/${team.code}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast("초대 링크를 복사했어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  };

  const onLeave = async () => {
    if (!team || !user) return;
    try {
      await leaveTeam(team.id, user.uid);
      nav("/", { replace: true });
    } catch {
      showToast("나가기에 실패했어요");
    }
  };

  if (loading) {
    return (
      <div style={bgStyle} className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-2 inline-flex">
            <PixelAnimal type={6} size={56} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            LOADING TEAM...
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !team) {
    return (
      <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-5">
            <div className="mb-2 inline-flex">
              <PixelIcon name="warn" size={36} color={C.warning} accent={C.danger} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: C.text }}>
              팀을 찾을 수 없어요
            </h2>
            <p className="text-sm" style={{ color: C.textL }}>
              {loadError ?? "코드를 다시 확인해주세요."}
            </p>
          </div>
          <PrimaryBtn onClick={() => nav("/")}>처음으로</PrimaryBtn>
        </Card>
      </div>
    );
  }

  const expired = isExpired(team.expiresAt);

  return (
    <div style={bgStyle} className="p-3 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header card */}
        <Card className="p-5 sm:p-6">
          <button
            onClick={() => nav("/")}
            className="text-xs mb-3"
            style={{ color: C.textL }}
          >
            ← 홈으로
          </button>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium mb-1" style={{ color: C.textL }}>
                우리 팀
              </div>
              <h1
                className="text-xl sm:text-2xl font-bold truncate"
                style={{ color: C.text }}
              >
                {team.name}
              </h1>
              <div className="text-xs mt-1" style={{ color: C.textL }}>
                코드 <span style={{ color: C.primary, fontWeight: 700 }}>{team.code}</span>
                {" · "}
                {members.length} / {TEAM_CAPACITY}명
                {" · "}
                <ExpiryText expiresAt={team.expiresAt} expired={expired} />
              </div>
            </div>
          </div>

          {!expired && (
            <div className="flex gap-2 mb-1">
              <button
                onClick={copyLink}
                className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-white inline-flex items-center justify-center gap-2"
                style={{ background: C.primary }}
              >
                <PixelIcon name="link" size={14} />
                초대 링크 복사
              </button>
              <button
                onClick={copyCode}
                className="px-4 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.text }}
              >
                코드 복사
              </button>
            </div>
          )}
        </Card>

        {members.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="mb-2 inline-flex">
              <PixelIcon name="sprout" size={36} color={C.mintA} />
            </div>
            <div className="text-sm" style={{ color: C.textL }}>
              아직 팀원이 없어요. 링크를 공유해보세요.
            </div>
          </Card>
        ) : (
          <>
            {/* Team summary */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="sparkle" size={18} color={C.primary} accent={C.peachA} />
                <h2 className="text-sm font-bold" style={{ color: C.text }}>
                  우리 팀 한 줄 요약
                </h2>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: C.text }}>
                {oneLiner}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <SummaryStat
                  label="평균 궁합"
                  value={avgScore === null ? "—" : `${avgScore}`}
                  suffix={avgScore === null ? "" : "점"}
                  hint={avgPairHint(avgScore)}
                  accent={C.primary}
                />
                <SummaryStat
                  label="유형 다양성"
                  value={members.length < 2 ? "—" : `${diversity.unique}`}
                  suffix={members.length < 2 ? "" : `/${members.length}`}
                  hint={diversity.label}
                  accent={C.peachA}
                />
              </div>
              {members.length === 1 && (
                <div
                  className="mt-3 rounded-xl p-3 text-xs leading-relaxed"
                  style={{
                    background: C.surfaceHi,
                    border: `1px dashed ${C.border}`,
                    color: C.textL,
                  }}
                >
                  팀원이 2명 이상일 때 궁합·케미·페어 분석이 보여요. 초대 링크를 공유해보세요.
                </div>
              )}
            </Card>

            {/* Company metaphor */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="trophy" size={18} color={C.peachA} />
                <h2 className="text-sm font-bold" style={{ color: C.text }}>
                  우리 팀과 닮은 회사 스타일
                </h2>
              </div>
              <div className="space-y-2.5">
                {metaphorTop.map((m, i) => (
                  <div
                    key={m.metaphor.id}
                    className="rounded-2xl p-4"
                    style={{
                      background: C.surfaceHi,
                      border: `1px solid ${i === 0 ? C.primary : C.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <MedalBadge rank={i + 1} />
                        <span className="text-sm font-bold" style={{ color: C.text }}>
                          {m.metaphor.name}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: C.textL }}>
                        {Math.round(m.similarity * 100)}%
                      </div>
                    </div>
                    <div className="text-xs mb-2" style={{ color: C.textL }}>
                      {m.metaphor.tagline}
                    </div>
                    {i === 0 && (
                      <div
                        className="text-xs leading-relaxed mt-2 pt-2"
                        style={{ color: C.text, borderTop: `1px solid ${C.border}` }}
                      >
                        {m.metaphor.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Best / Challenge combos */}
            {best && challenge && best !== challenge && (
              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <PixelIcon name="sparkle" size={18} color={C.primary} />
                  <h2 className="text-sm font-bold" style={{ color: C.text }}>
                    오늘의 케미 하이라이트
                  </h2>
                </div>
                <ComboCard combo={best} tone="best" />
                <ComboCard combo={challenge} tone="challenge" />
              </Card>
            )}

            {/* Team radar profile */}
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="target" size={18} color={C.primary} accent={C.peachA} />
                <h2 className="text-sm font-bold" style={{ color: C.text }}>
                  우리 팀의 성향 프로필
                </h2>
              </div>
              <RadarChart scores={teamScores} />
              <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                {ALL_TYPES.filter((t) => typeDist[t] > 0)
                  .sort((a, b) => typeDist[b] - typeDist[a])
                  .map((t) => (
                    <div
                      key={t}
                      className="rounded-full pl-1 pr-2.5 py-0.5 text-xs font-medium flex items-center gap-1.5"
                      style={{ background: TYPES[t].bg, color: C.text, border: `1px solid ${TYPES[t].color}33` }}
                    >
                      <PixelAnimal type={t} size={22} hopping={false} />
                      <span>{TYPES[t].name}</span>
                      <span style={{ color: TYPES[t].color, fontWeight: 700 }}>{typeDist[t]}</span>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Member chemistry graph */}
            {members.length >= 2 && (
              <Card className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <PixelIcon name="link" size={18} color={C.primary} />
                  <h2 className="text-sm font-bold" style={{ color: C.text }}>
                    팀원 케미 지도
                  </h2>
                </div>
                <div className="text-xs mb-3" style={{ color: C.textL }}>
                  선을 누르면 두 사람의 자세한 궁합을 볼 수 있어요.
                </div>
                <ChemistryGraph
                  members={members}
                  onSelect={(a, b) => setSelectedPair({ a, b })}
                />
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
                  <span style={{ color: C.textL }}>관계:</span>
                  <LegendLine color={C.success} label="잘 맞아요" />
                  <LegendLine color={C.textLL} label="보통" />
                  <LegendLine color={C.danger} label="긴장" />
                </div>
                {selectedPair && (
                  <PairDetail
                    a={selectedPair.a}
                    b={selectedPair.b}
                    onClose={() => setSelectedPair(null)}
                  />
                )}
              </Card>
            )}

            {/* Member list */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="team" size={18} color={C.primary} />
                <h2 className="text-sm font-bold" style={{ color: C.text }}>
                  우리 팀원 ({members.length}명)
                </h2>
              </div>
              <div className="text-xs mb-3" style={{ color: C.textL }}>
                이름을 누르면 해당 팀원의 유형 해설이 열려요.
              </div>
              <div className="space-y-2">
                {members.map((m) => {
                  const T = TYPES[m.type];
                  const role = ROLE_LABELS[m.role];
                  const isMe = m.uid === user?.uid;
                  const wing = wingOf(m.type, m.scores);
                  return (
                    <button
                      key={m.uid}
                      type="button"
                      onClick={() => setSelectedMember(m)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-colors"
                      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
                      onMouseEnter={(ev) => {
                        ev.currentTarget.style.background = C.surfaceActive;
                      }}
                      onMouseLeave={(ev) => {
                        ev.currentTarget.style.background = C.surfaceHi;
                      }}
                    >
                      <TypeBadge type={m.type} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold truncate" style={{ color: C.text }}>
                            {m.nickname}
                          </span>
                          {isMe && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: C.primary, color: C.white }}
                            >
                              나
                            </span>
                          )}
                          {team.ownerUid === m.uid && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: C.warning, color: C.black }}
                            >
                              팀장
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: C.textL }}>
                          <span>{m.type}번 {T.name}</span>
                          {wing !== null && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{
                                background: `${T.color}22`,
                                color: T.color,
                                fontFamily: "ui-monospace, Menlo, monospace",
                              }}
                              title={`${m.type}번의 날개: ${wing}번`}
                            >
                              {m.type}w{wing}
                            </span>
                          )}
                          <span>·</span>
                          <PixelIcon name={ROLE_ICON[m.role]} size={10} color={C.textL} />
                          <span>{role.label}</span>
                        </div>
                      </div>
                      <span style={{ color: C.textLL }} className="text-sm">
                        ›
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        <Card className="p-5 space-y-2">
          {expired ? (
            <>
              <div className="mb-1">
                <ExpiredBanner />
              </div>
              <PrimaryBtn onClick={() => nav("/team/create")}>
                <span className="inline-flex items-center gap-2">
                  <PixelIcon name="team" size={14} />
                  새 팀 만들기
                </span>
              </PrimaryBtn>
            </>
          ) : (
            <>
              <SecondaryBtn onClick={() => nav(`/join/${team.code}`)}>
                <span className="inline-flex items-center gap-2">
                  <PixelIcon name="sparkle" size={14} />
                  내 결과 다시 업데이트
                </span>
              </SecondaryBtn>
              <GhostBtn onClick={() => setShowRetakeConfirm(true)}>
                테스트 다시 풀고 갱신하기
              </GhostBtn>
            </>
          )}
          <GhostBtn onClick={() => setShowLeaveConfirm(true)}>
            {isOwner ? "팀장 권한 유지한 채 나가기" : "팀에서 나가기"}
          </GhostBtn>
        </Card>
      </div>
      {selectedMember && (
        <MemberDetail
          member={selectedMember}
          isMe={selectedMember.uid === user?.uid}
          isOwner={selectedMember.uid === team.ownerUid}
          onClose={() => setSelectedMember(null)}
        />
      )}
      <ConfirmModal
        open={showLeaveConfirm}
        title="팀에서 나갈까요?"
        description="팀에서 나가면 내 결과는 팀에서 사라져요."
        confirmLabel="나가기"
        danger
        onCancel={() => setShowLeaveConfirm(false)}
        onConfirm={() => {
          setShowLeaveConfirm(false);
          onLeave();
        }}
      />
      <ConfirmModal
        open={showRetakeConfirm}
        title="다시 풀어볼까요?"
        description="테스트를 다시 풀면 새 결과로 내 정보가 업데이트돼요."
        confirmLabel="다시 풀기"
        onCancel={() => setShowRetakeConfirm(false)}
        onConfirm={() => {
          setShowRetakeConfirm(false);
          clearResult();
          setPendingJoin(team.code);
          nav("/role");
        }}
      />
      <Toast message={toast} onHide={() => setToast("")} />
    </div>
  );
}
