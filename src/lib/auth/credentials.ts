import { createHmac, randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_PATTERN = /^KMP([A-HJ-NP-Z2-9]{16})$/;

export function normalizeInviteCode(value: string): string | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, "");
  const match = INVITE_CODE_PATTERN.exec(normalized);
  return match ? `KMP${match[1]}` : null;
}

export function formatInviteCode(normalized: string): string {
  const body = normalized.slice(3);
  return `KMP-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12)}`;
}

export function generateInviteCode(): { normalized: string; formatted: string } {
  let body = "";
  while (body.length < 16) {
    for (const byte of randomBytes(24)) {
      if (byte < 224) body += ALPHABET[byte % ALPHABET.length];
      if (body.length === 16) break;
    }
  }
  const normalized = `KMP${body}`;
  return { normalized, formatted: formatInviteCode(normalized) };
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function keyedHash(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value, "utf8").digest("hex");
}
