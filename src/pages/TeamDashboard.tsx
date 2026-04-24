import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn, GhostBtn } from "../components/Btn";
import { TypeBadge } from "../components/TypeBadge";
import { PixelIcon, IconName } from "../components/PixelIcon";
import { PixelAnimal } from "../components/PixelAnimal";
import { ExpiredBanner, ExpiryText } from "../components/ExpiredBadge";
import { ConfirmModal } from "../components/ConfirmModal";
import { Toast } from "../components/Toast";
import { RadarChart } from "../components/charts/RadarChart";
import { bgStyle, C } from "../data/design";
import { ROLE_LABELS, TYPES, REL } from "../data/enneagram";
import { ANIMALS } from "../data/animals";
import { Member, Team, Role, Scores, TypeId } from "../types";

const ROLE_ICON: Record<Role, IconName> = {
  engineer: "laptop",
  designer: "palette",
  pm: "chart",
  planner: "clipboard",
  marketer: "megaphone",
  data: "chart-line",
  sales: "trophy",
  hr: "team",
  other: "sprout",
};
import { useAuth } from "../lib/auth";
import {
  resolveTeamByCode,
  subscribeTeam,
  leaveTeam,
  isMember as checkIsMember,
  TeamError,
} from "../lib/teams";
import {
  ALL_TYPES,
  topMetaphors,
  typeDistribution,
  bestAndChallengeCombos,
  pairScore,
  pairReason,
  teamVector,
  wingOf,
  teamAveragePairScore,
  diversityIndex,
  teamOneLiner,
} from "../lib/analysis";
import { clearResult, setPendingJoin } from "../lib/localResult";
import {
  isExpired,
  isValidCodeFormat,
  normalizeCode,
  TEAM_CAPACITY,
} from "../lib/teamCode";

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
  const metaphorTop = useMemo(() => topMetaphors(members, 3), [members]);
  const typeDist = useMemo(() => typeDistribution(members), [members]);
  const { best, challenge } = useMemo(() => bestAndChallengeCombos(members), [members]);
  const avgScore = useMemo(() => teamAveragePairScore(members), [members]);
  const diversity = useMemo(() => diversityIndex(members), [members]);
  const oneLiner = useMemo(() => teamOneLiner(members), [members]);

  const teamScores = useMemo<Scores>(() => {
    const v = teamVector(members);
    return { 1: v[0], 2: v[1], 3: v[2], 4: v[3], 5: v[4], 6: v[5], 7: v[6], 8: v[7], 9: v[8] };
  }, [members]);

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
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: C.text }}
              >
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
                        <span
                          className="text-sm font-bold"
                          style={{ color: C.text }}
                        >
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
                          <span
                            className="text-sm font-bold truncate"
                            style={{ color: C.text }}
                          >
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

function ComboCard({
  combo,
  tone,
}: {
  combo: { a: Member; b: Member; score: number; reason: { kind: string; why: string } };
  tone: "best" | "challenge";
}) {
  const isBest = tone === "best";
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: C.surfaceHi,
        border: `1px solid ${isBest ? C.success : C.warning}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-bold flex items-center gap-1.5"
          style={{ color: isBest ? C.success : C.warning }}
        >
          <PixelIcon name={isBest ? "heart" : "warn"} size={12} />
          {isBest ? "환상의 콤비" : "긴장 주의"}
        </div>
        <div className="text-xs" style={{ color: C.textL }}>
          궁합 {combo.score}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={combo.a.type} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: C.text }}>
            {combo.a.nickname}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {combo.a.type}번 {TYPES[combo.a.type].name}
          </div>
        </div>
        <PixelIcon name={isBest ? "heart" : "bolt"} size={16} color={isBest ? C.success : C.warning} />
        <div className="flex-1 min-w-0 text-right">
          <div className="text-sm font-bold truncate" style={{ color: C.text }}>
            {combo.b.nickname}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {combo.b.type}번 {TYPES[combo.b.type].name}
          </div>
        </div>
        <TypeBadge type={combo.b.type} size="sm" />
      </div>
      <div className="text-xs leading-relaxed pt-2" style={{ color: C.text, borderTop: `1px solid ${C.border}` }}>
        {combo.reason.why}
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
  hint,
  accent,
}: {
  label: string;
  value: string;
  suffix: string;
  hint: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl px-3 py-3"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div className="text-[10px] font-bold tracking-[0.14em]" style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
        {label.toUpperCase()}
      </div>
      <div className="flex items-baseline gap-1 mt-0.5">
        <span className="text-xl font-bold" style={{ color: accent, fontFamily: "ui-monospace, Menlo, monospace" }}>
          {value}
        </span>
        {suffix && (
          <span className="text-xs" style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
            {suffix}
          </span>
        )}
      </div>
      <div className="text-[11px] mt-0.5" style={{ color: C.textL }}>
        {hint}
      </div>
    </div>
  );
}

function avgPairHint(score: number | null): string {
  if (score === null) return "2명 이상일 때 보여요";
  if (score >= 75) return "서로 꽤 잘 맞는 편";
  if (score >= 60) return "무난한 케미";
  if (score >= 50) return "잔잔한 긴장 공존";
  return "삐걱거리는 구간 주의";
}

function MedalBadge({ rank }: { rank: 1 | 2 | 3 | number }) {
  const color = rank === 1 ? "#FACC15" : rank === 2 ? "#CBD5E1" : rank === 3 ? "#D97706" : C.textL;
  const label = rank === 1 ? "1" : rank === 2 ? "2" : rank === 3 ? "3" : `${rank}`;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
        fontFamily: "ui-monospace, Menlo, monospace",
      }}
    >
      <PixelIcon name="medal" size={10} color={color} />
      {label}
    </span>
  );
}

function LegendLine({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-[3px] w-5 rounded-full"
        style={{ background: color }}
      />
      <span style={{ color: C.text }}>{label}</span>
    </span>
  );
}

type ChemistryStyle = { color: string; width: number; opacity: number };

function chemistryStyle(score: number): ChemistryStyle {
  if (score >= 75) return { color: C.success, width: 3, opacity: 0.95 };
  if (score >= 60) return { color: "#86EFAC", width: 2, opacity: 0.7 };
  if (score >= 45) return { color: C.textLL, width: 1.2, opacity: 0.4 };
  if (score >= 30) return { color: "#FCA5A5", width: 2, opacity: 0.75 };
  return { color: C.danger, width: 3, opacity: 0.95 };
}

function ChemistryGraph({
  members,
  onSelect,
}: {
  members: Member[];
  onSelect: (a: Member, b: Member) => void;
}) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const nodeRadius = 22;
  const ringRadius = members.length === 2 ? 80 : 118;

  const positions = members.map((m, i) => {
    const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
    return {
      member: m,
      angle,
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
    };
  });

  const pairs: Array<{
    a: (typeof positions)[number];
    b: (typeof positions)[number];
    score: number;
    style: ChemistryStyle;
  }> = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const score = pairScore(positions[i].member.type, positions[j].member.type);
      pairs.push({
        a: positions[i],
        b: positions[j],
        score,
        style: chemistryStyle(score),
      });
    }
  }
  // Draw extreme (good/bad) lines on top of neutral ones.
  pairs.sort(
    (p, q) => Math.abs(50 - p.score) - Math.abs(50 - q.score)
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[360px] mx-auto block"
      role="img"
      aria-label="팀원 간 궁합 관계도"
    >
      <g>
        {pairs.map((p, i) => (
          <g key={i} style={{ cursor: "pointer" }}>
            <line
              x1={p.a.x}
              y1={p.a.y}
              x2={p.b.x}
              y2={p.b.y}
              stroke={p.style.color}
              strokeWidth={p.style.width}
              strokeOpacity={p.style.opacity}
              strokeLinecap="round"
            />
            <line
              x1={p.a.x}
              y1={p.a.y}
              x2={p.b.x}
              y2={p.b.y}
              stroke="transparent"
              strokeWidth={16}
              onClick={() => onSelect(p.a.member, p.b.member)}
            >
              <title>
                {p.a.member.nickname} ↔ {p.b.member.nickname} · {p.score}
              </title>
            </line>
          </g>
        ))}
      </g>
      {positions.map((p) => {
        const T = TYPES[p.member.type];
        const labelDist = nodeRadius + 14;
        const labelX = p.x + labelDist * Math.cos(p.angle);
        const labelY = p.y + labelDist * Math.sin(p.angle);
        const cosA = Math.cos(p.angle);
        const anchor = cosA > 0.3 ? "start" : cosA < -0.3 ? "end" : "middle";
        return (
          <g key={p.member.uid}>
            <circle
              cx={p.x}
              cy={p.y}
              r={nodeRadius}
              fill={T.color}
              stroke={C.surface}
              strokeWidth={3}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="14"
              fontWeight={700}
              fill={C.white}
              style={{ pointerEvents: "none" }}
            >
              {p.member.type}
            </text>
            <text
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize="11"
              fontWeight={700}
              fill={C.text}
              style={{ pointerEvents: "none" }}
            >
              {p.member.nickname.length > 6
                ? `${p.member.nickname.slice(0, 6)}…`
                : p.member.nickname}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MemberDetail({
  member,
  isMe,
  isOwner,
  onClose,
}: {
  member: Member;
  isMe: boolean;
  isOwner: boolean;
  onClose: () => void;
}) {
  const T = TYPES[member.type];
  const rel = REL[member.type];
  const role = ROLE_LABELS[member.role];
  const animal = ANIMALS[member.type];
  const wing = wingOf(member.type, member.scores);
  const [w1, w2] = rel.wings;
  const s1 = member.scores[w1];
  const s2 = member.scores[w2];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-detail-title"
    >
      <div
        className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ background: C.surface, border: `1px solid ${C.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-6 pb-4 text-center relative"
          style={{ background: `linear-gradient(180deg, ${T.bg}, ${C.surface})` }}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}
            aria-label="닫기"
          >
            ✕
          </button>
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-2xl"
            style={{
              width: 96,
              height: 96,
              background: `radial-gradient(circle, ${T.color}22 0%, transparent 70%), ${C.surface}`,
              border: `1px solid ${T.color}44`,
            }}
          >
            <PixelAnimal type={member.type} size={76} />
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap mb-1">
            <h3 id="member-detail-title" className="text-lg font-bold" style={{ color: C.text }}>
              {member.nickname}
            </h3>
            {isMe && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: C.primary, color: C.white }}
              >
                나
              </span>
            )}
            {isOwner && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: C.warning, color: C.black }}
              >
                팀장
              </span>
            )}
          </div>
          <div className="text-[11px]" style={{ color: T.color }}>
            {animal.name}
          </div>
          <div className="text-base font-bold mt-1" style={{ color: C.text }}>
            {member.type}번. {T.name}
          </div>
          <div className="text-xs" style={{ color: C.textL }}>
            {T.tag} · {T.sub}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full inline-flex items-center gap-1"
              style={{ background: C.surfaceHi, color: C.textL, border: `1px solid ${C.border}` }}
            >
              <PixelIcon name={ROLE_ICON[member.role]} size={10} color={C.textL} />
              {role.label}
            </span>
            {wing !== null && (
              <span
                className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: `${T.color}22`,
                  color: T.color,
                  fontFamily: "ui-monospace, Menlo, monospace",
                }}
              >
                {member.type}w{wing}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <MemberSection icon="search" accent={T.color} title="유형 개요">
            <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
              {T.overview}
            </p>
          </MemberSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <MemberSection icon="warn" accent={T.color} title="두려워하는 것">
              <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
                {T.fear}
              </p>
            </MemberSection>
            <MemberSection icon="target" accent={T.color} title="바라는 것">
              <p className="text-[13px] leading-relaxed" style={{ color: C.text }}>
                {T.desire}
              </p>
            </MemberSection>
          </div>

          <MemberSection icon="muscle" accent={T.color} title="강점 · 성장 · 팀 역할">
            <div className="space-y-2 text-[13px]">
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>강점 </span>
                <span style={{ color: C.text }}>{T.strength}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>성장 포인트 </span>
                <span style={{ color: C.text }}>{T.growth}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold" style={{ color: T.color }}>팀 역할 </span>
                <span style={{ color: C.text }}>{T.teamRole}</span>
              </div>
            </div>
          </MemberSection>

          <MemberSection icon="sprout" accent={T.color} title="날개 (Wing)">
            <div className="space-y-2 text-[12.5px]">
              <WingRow
                label={`${member.type}w${w1} · ${TYPES[w1].name}`}
                score={s1}
                active={wing === w1}
                accent={T.color}
              />
              <WingRow
                label={`${member.type}w${w2} · ${TYPES[w2].name}`}
                score={s2}
                active={wing === w2}
                accent={T.color}
              />
              {wing === null && (
                <p className="text-[12px]" style={{ color: C.textL }}>
                  양쪽 날개가 모두 비어 있어 한쪽으로 치우치지 않았어요.
                </p>
              )}
            </div>
          </MemberSection>

          <MemberSection icon="heart" accent={C.success} title="잘 맞는 유형">
            <div className="space-y-2">
              {rel.best.map((t) => (
                <RelRow key={t} type={t} why={rel.matchWhy[t]} tone="best" />
              ))}
            </div>
          </MemberSection>

          <MemberSection icon="bolt" accent={C.warning} title="긴장 주의 유형">
            <div className="space-y-2">
              {rel.challenge.map((t) => (
                <RelRow key={t} type={t} why={rel.challengeWhy[t]} tone="challenge" />
              ))}
            </div>
          </MemberSection>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold mt-2"
            style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberSection({
  icon,
  title,
  accent,
  children,
}: {
  icon: IconName;
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-3.5"
      style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
    >
      <div
        className="text-xs font-bold mb-2 flex items-center gap-1.5"
        style={{ color: accent }}
      >
        <PixelIcon name={icon} size={12} color={accent} />
        {title}
      </div>
      {children}
    </div>
  );
}

function WingRow({
  label,
  score,
  active,
  accent,
}: {
  label: string;
  score: number;
  active: boolean;
  accent: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: active ? accent : C.textL, fontWeight: active ? 700 : 500 }}>
          {label}
        </span>
        <span style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}>
          {score}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: C.surfaceActive }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, score * 10)}%`,
            background: active ? accent : `${accent}55`,
          }}
        />
      </div>
    </div>
  );
}

function RelRow({
  type,
  why,
  tone,
}: {
  type: TypeId;
  why?: string;
  tone: "best" | "challenge";
}) {
  const T = TYPES[type];
  const accent = tone === "best" ? C.success : C.warning;
  return (
    <div className="flex items-start gap-2.5">
      <TypeBadge type={type} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.text }}>
          <span>{type}번. {T.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{
              background: `${accent}22`,
              color: accent,
              fontFamily: "ui-monospace, Menlo, monospace",
            }}
          >
            {tone === "best" ? "MATCH" : "WATCH"}
          </span>
        </div>
        {why && (
          <div className="text-[12px] mt-1 leading-relaxed" style={{ color: C.textL }}>
            {why}
          </div>
        )}
      </div>
    </div>
  );
}

function PairDetail({ a, b, onClose }: { a: Member; b: Member; onClose: () => void }) {
  const score = pairScore(a.type, b.type);
  const reason = pairReason(a.type, b.type);
  const tone = reason.kind === "best" ? "best" : reason.kind === "challenge" ? "challenge" : "neutral";
  const bgMap: Record<string, string> = { best: C.surfaceHi, challenge: C.surfaceHi, neutral: C.surfaceHi };
  const borderMap: Record<string, string> = { best: C.success, challenge: C.warning, neutral: C.border };

  return (
    <div
      className="mt-3 rounded-2xl p-4"
      style={{ background: bgMap[tone], border: `2px solid ${borderMap[tone]}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold" style={{ color: C.textL }}>
          페어 궁합 · {score}점
        </div>
        <button onClick={onClose} className="text-xs" style={{ color: C.textL }}>
          닫기
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <TypeBadge type={a.type} size="sm" />
        <div className="text-sm font-bold flex-1" style={{ color: C.text }}>
          {a.nickname}
        </div>
        <span className="text-xs" style={{ color: C.textL }}>vs</span>
        <div className="text-sm font-bold flex-1 text-right" style={{ color: C.text }}>
          {b.nickname}
        </div>
        <TypeBadge type={b.type} size="sm" />
      </div>
      <div className="text-xs leading-relaxed" style={{ color: C.text }}>
        {reason.why}
      </div>
    </div>
  );
}

