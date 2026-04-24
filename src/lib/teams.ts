import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  deleteDoc,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { Member, Team } from "../types";
import { generateCode, TEAM_CAPACITY, TEAM_EXPIRY_MS, isExpired } from "./teamCode";

export type MyTeamEntry = {
  team: Team;
  member: Member;
  expired: boolean;
};

export class TeamError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

async function findUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const snap = await getDoc(doc(db, "codes", code));
    if (!snap.exists()) return code;
  }
  throw new TeamError("팀 코드를 만들 수 없어요. 다시 시도해주세요.", "code-generation-failed");
}

export async function createTeam(params: {
  ownerUid: string;
  teamName: string;
  ownerNickname: string;
  ownerMember: Omit<Member, "uid" | "joinedAt" | "nickname">;
}): Promise<Team> {
  const { ownerUid, teamName, ownerNickname, ownerMember } = params;
  const code = await findUniqueCode();
  const teamId = doc(collection(db, "teams")).id;
  const now = Date.now();
  const expiresAt = now + TEAM_EXPIRY_MS;

  const team: Team = {
    id: teamId,
    code,
    name: teamName.trim() || "이름 없는 팀",
    ownerUid,
    createdAt: now,
    expiresAt,
  };

  await runTransaction(db, async (tx) => {
    const codeRef = doc(db, "codes", code);
    const teamRef = doc(db, "teams", teamId);
    const memberRef = doc(db, "teams", teamId, "members", ownerUid);

    tx.set(codeRef, { teamId, createdAt: now, expiresAt });
    tx.set(teamRef, team);
    tx.set(memberRef, {
      uid: ownerUid,
      nickname: ownerNickname.trim(),
      type: ownerMember.type,
      scores: ownerMember.scores,
      role: ownerMember.role,
      joinedAt: now,
    } as Member);
  });

  return team;
}

export async function resolveTeamByCode(
  code: string,
  opts: { allowExpired?: boolean } = {}
): Promise<Team> {
  const codeDoc = await getDoc(doc(db, "codes", code));
  if (!codeDoc.exists()) {
    throw new TeamError("존재하지 않는 팀 코드예요.", "not-found");
  }
  const { teamId } = codeDoc.data() as { teamId: string };
  const teamDoc = await getDoc(doc(db, "teams", teamId));
  if (!teamDoc.exists()) {
    throw new TeamError("팀 정보를 찾을 수 없어요.", "team-missing");
  }
  const team = teamDoc.data() as Team;
  if (!opts.allowExpired && isExpired(team.expiresAt)) {
    throw new TeamError("만료된 팀 코드예요. 새 팀을 만들어 주세요.", "expired");
  }
  return team;
}

export async function joinTeam(params: {
  team: Team;
  uid: string;
  nickname: string;
  member: Omit<Member, "uid" | "joinedAt" | "nickname">;
}): Promise<void> {
  const { team, uid, nickname, member } = params;

  const membersRef = collection(db, "teams", team.id, "members");
  const snap = await getDocs(query(membersRef));

  const existing = snap.docs.find((d) => d.id === uid);
  const currentCount = snap.size;

  if (!existing && currentCount >= TEAM_CAPACITY) {
    throw new TeamError(`팀 정원(${TEAM_CAPACITY}명)이 가득 찼어요.`, "capacity");
  }

  await setDoc(doc(db, "teams", team.id, "members", uid), {
    uid,
    nickname: nickname.trim(),
    type: member.type,
    scores: member.scores,
    role: member.role,
    joinedAt: existing ? (existing.data() as Member).joinedAt : Date.now(),
  } as Member);
}

export function subscribeTeam(
  teamId: string,
  onChange: (team: Team | null, members: Member[]) => void
): Unsubscribe {
  const teamRef = doc(db, "teams", teamId);
  const membersRef = collection(db, "teams", teamId, "members");

  let latestTeam: Team | null = null;
  let latestMembers: Member[] = [];

  const unsubTeam = onSnapshot(teamRef, (snap) => {
    latestTeam = snap.exists() ? (snap.data() as Team) : null;
    onChange(latestTeam, latestMembers);
  });

  const unsubMembers = onSnapshot(membersRef, (snap) => {
    latestMembers = snap.docs
      .map((d) => d.data() as Member)
      .sort((a, b) => a.joinedAt - b.joinedAt);
    onChange(latestTeam, latestMembers);
  });

  return () => {
    unsubTeam();
    unsubMembers();
  };
}

export async function leaveTeam(teamId: string, uid: string): Promise<void> {
  await deleteDoc(doc(db, "teams", teamId, "members", uid));
}

export async function isMember(teamId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "teams", teamId, "members", uid));
  return snap.exists();
}

export async function listMyTeams(uid: string): Promise<MyTeamEntry[]> {
  const membersQuery = query(collectionGroup(db, "members"), where("uid", "==", uid));
  const snap = await getDocs(membersQuery);

  const entries = await Promise.all(
    snap.docs.map(async (d) => {
      const member = d.data() as Member;
      // 경로: teams/{teamId}/members/{uid}
      const teamId = d.ref.parent.parent?.id;
      if (!teamId) return null;

      const teamDoc = await getDoc(doc(db, "teams", teamId));
      if (!teamDoc.exists()) return null;
      const team = teamDoc.data() as Team;

      return { team, member, expired: isExpired(team.expiresAt) } as MyTeamEntry;
    })
  );

  return entries
    .filter((e): e is MyTeamEntry => e !== null)
    .sort((a, b) => {
      // 활성 팀을 먼저, 그 다음 최근 참여 순.
      if (a.expired !== b.expired) return a.expired ? 1 : -1;
      return b.member.joinedAt - a.member.joinedAt;
    });
}
