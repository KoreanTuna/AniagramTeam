export type TypeId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Role =
  | "engineer"
  | "designer"
  | "pm"
  | "planner"
  | "marketer"
  | "data"
  | "sales"
  | "hr"
  | "other";

export type Scores = Record<TypeId, number>;

export type Choice = {
  text: string;
  scores: [TypeId] | [TypeId, TypeId];
};

export type Question = {
  id: string;
  scene: string;
  text: string;
  choices: Choice[];
  illustId?: number;
};

export type Member = {
  uid: string;
  nickname: string;
  type: TypeId;
  scores: Scores;
  role: Role;
  joinedAt: number;
};

export type Team = {
  id: string;
  code: string;
  name: string;
  ownerUid: string;
  createdAt: number;
  expiresAt: number;
};

export type LocalResult = {
  type: TypeId;
  scores: Scores;
  role: Role;
  completedAt: number;
};
