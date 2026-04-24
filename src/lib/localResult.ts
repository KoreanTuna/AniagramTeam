import { LocalResult } from "../types";

const RESULT_KEY = "aniagram:result";
const PENDING_JOIN_KEY = "aniagram:pendingJoin";

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  // Safari는 "QuotaExceededError"를 throw, 일부 브라우저는 DOMException code 22.
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    (e as { code?: number }).code === 22
  );
}

export type SaveResultError = "quota" | "unavailable";

export function saveResult(result: LocalResult): { ok: true } | { ok: false; reason: SaveResultError } {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    return { ok: true };
  } catch (e) {
    if (isQuotaError(e)) return { ok: false, reason: "quota" };
    return { ok: false, reason: "unavailable" };
  }
}

export function loadResult(): LocalResult | null {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalResult;
  } catch {
    return null;
  }
}

export function clearResult() {
  try {
    localStorage.removeItem(RESULT_KEY);
  } catch {
    // ignore - 삭제 실패는 UX에 치명적이지 않음.
  }
}

export function setPendingJoin(code: string | null) {
  try {
    if (code) sessionStorage.setItem(PENDING_JOIN_KEY, code);
    else sessionStorage.removeItem(PENDING_JOIN_KEY);
  } catch {
    // ignore
  }
}

export function getPendingJoin(): string | null {
  try {
    return sessionStorage.getItem(PENDING_JOIN_KEY);
  } catch {
    return null;
  }
}
