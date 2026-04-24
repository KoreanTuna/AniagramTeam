import { LocalResult } from "../types";

const RESULT_KEY = "aniagram:result";
const PENDING_JOIN_KEY = "aniagram:pendingJoin";

export function saveResult(result: LocalResult) {
  try {
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // ignore
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
    // ignore
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
