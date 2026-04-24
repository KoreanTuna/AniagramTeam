/**
 * 헷갈리기 쉬운 문자(0/O, 1/I) 제외한 6자리 코드.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 6): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export const TEAM_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7일
export const TEAM_CAPACITY = 10;

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

export function daysUntil(expiresAt: number): number {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s/g, "");
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}
