# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Aniagram Team — a Korean-language Enneagram quiz web app where users take a role-tailored 12-question test, get assigned one of 9 Enneagram types, and can create/join teams (up to 10 members, 7-day expiry) to see team chemistry, centers/styles distribution, pair compatibility matrix, and a "company metaphor" analysis.

## Commands

```bash
npm run dev        # vite dev server
npm run build      # tsc -b && vite build (outputs to dist/)
npm run lint       # tsc -b --noEmit (type-check only; there is no ESLint)
npm run preview    # preview built output
npm run deploy     # npm run build && firebase deploy (Firestore rules + Hosting)
```

One-off scoring verification (simulates all roles × each choice slot and prints top types):

```bash
npx tsx scripts/verify-scoring.ts
```

There is no test framework. "Tests" for this app means running `verify-scoring.ts` to sanity-check that no single choice column dominates the Enneagram distribution.

## Environment

Firebase config is read from Vite env vars (`VITE_FIREBASE_*`) in `.env.local`. Copy `.env.example` if setting up fresh. Firebase project id is `aniagram-team` (see `.firebaserc`).

## Architecture

### Data flow — quiz to team

1. **Auth (`src/lib/auth.tsx`)**: The app boots into `AuthProvider`, which force-signs-in anonymously via Firebase Auth. `App.tsx` blocks rendering behind a loading screen until `user` exists — every downstream page can assume an authenticated `user.uid`.
2. **Role select → Quiz (`src/pages/RoleSelect.tsx`, `Quiz.tsx`)**: The quiz picks 6 common + 6 role-specific questions, interleaved (`src/data/questions/index.ts`). Choice order is shuffled per session so choice *position* doesn't correlate with a type. Scoring: first type in `choice.scores` gets +2, second gets +1. `Quiz.tsx` keeps the running tally in a `useRef` to avoid stale closures inside `setTimeout`.
3. **Local result (`src/lib/localResult.ts`)**: The full `Scores` vector + top type + role are saved to `localStorage` under `aniagram:result`. The user is NOT written to Firestore yet — the result is purely client-side until they create or join a team.
4. **Team create/join (`src/pages/TeamCreate.tsx`, `JoinByLink.tsx`, `src/lib/teams.ts`)**: Only at this point is the member (uid, nickname, type, scores, role) written to Firestore, under `teams/{teamId}/members/{uid}`. A 6-char alphanumeric code (`codes/{code}` → `{teamId}`) is the public handle; teams are reached *only* via code, never listed (enforced by rules). Pending-join flow: if a user hits `/join/:code` without a local result, the code is stashed in `sessionStorage` (`aniagram:pendingJoin`) so quiz completion can resume the join.
5. **Dashboard (`src/pages/TeamDashboard.tsx`)**: Subscribes to `teams/{teamId}` + `members` subcollection via `subscribeTeam` (two `onSnapshot` listeners that reconcile into one callback). Runs all analysis in-browser from the materialized members array.

### Firestore schema

```
codes/{code}              -> { teamId, createdAt, expiresAt }     # get-only lookup
teams/{teamId}            -> { id, code, name, ownerUid, createdAt, expiresAt }
teams/{teamId}/members/{uid} -> { uid, nickname, type, scores, role, joinedAt }
```

Rules (`firestore.rules`) are the security model — the client cannot `list` codes or teams. Any change that adds listing/querying on these collections needs a rules update in the same PR. Members can only write their own doc; team owners can delete members; creating a team requires `ownerUid == auth.uid`.

### Enneagram analysis (`src/lib/analysis.ts` + `src/data/enneagram.ts`, `metaphors.ts`)

All analysis is pure TS running on members arrays — no server logic.

- **Type scoring**: `topTypeOf(scores)` picks the highest of 9 tallies.
- **Pair compatibility** (`pairScore`): Averages both directions of a one-way score built from the `REL` table (base 55, ±best/challenge, +growth, +wing), clamped to [5, 98]. `pairReason` picks a human-readable reason from `REL[x].matchWhy` / `challengeWhy`.
- **Company metaphor** (`topMetaphors`): Each entry in `METAPHORS` has a hand-tuned 9-dim vector. Team vector = sum of member score vectors. Ranked by cosine similarity.
- **Centers / Styles**: Fixed groupings in `CENTERS` (gut/heart/head) and `STYLES` (assertive/compliant/withdrawn) from `enneagram.ts`.

### Questions data (`src/data/questions/`)

One file per role (`engineer`, `designer`, `pm`, `planner`, `marketer`, `data`, `other`) plus `common.ts`. Each question has 4-5 choices; each `choice.scores` is `[primaryType]` or `[primaryType, secondaryType]`. The pools are designed so each type is represented roughly evenly across a pool — `verify-scoring.ts` is the sanity check for this. If you add/edit questions, re-run that script and confirm no single choice column produces a badly skewed distribution.

### Styling

Tailwind + a custom design token module (`src/data/design.ts`). Dark theme using Toss-inspired palette. Type accent colors (`yellowA`, `pinkA`, etc.) in `C` are keyed to Enneagram types 1–9 and referenced from `TYPES[n].color` / `.bg` — don't rename them without updating both places.

### Path alias

`@/*` → `src/*` is configured in both `tsconfig.json` and `vite.config.ts`.

## Language

The user-facing app and code comments are in Korean. Keep new UI strings and user-facing copy in Korean; match the existing polite-casual tone (e.g. `-예요`, `-어요`).
