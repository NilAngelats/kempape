import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateSessionToken, keyedHash, normalizeInviteCode } from "@/lib/auth/credentials";
import { sessionCookieOptions } from "@/lib/auth/cookie";
import { getPrivilegedDatabase } from "@/lib/server/database";
import { getServerEnv } from "@/lib/server/env";

const inputSchema = z.object({ inviteCode: z.string().min(1).max(64) });

export async function POST(request: NextRequest) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  const normalized = parsed.success ? normalizeInviteCode(parsed.data.inviteCode) : null;
  if (!normalized) return NextResponse.json({ code: "INVALID_INVITE", message: "Invalid or inactive invite code." }, { status: 401 });
  const env = getServerEnv();
  const token = generateSessionToken();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const scope = `${forwarded}|${request.headers.get("user-agent") ?? "unknown"}`;
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  const { data, error } = await getPrivilegedDatabase().rpc("redeem_invite_code", {
    p_code_hash: keyedHash(normalized, env.INVITE_CODE_HASH_SECRET),
    p_scope_hash: keyedHash(scope, env.RATE_LIMIT_HASH_SECRET),
    p_session_token_hash: keyedHash(token, env.SESSION_TOKEN_HASH_SECRET),
    p_session_expires_at: expiresAt.toISOString(),
  });
  if (error) return NextResponse.json({ code: "INFRASTRUCTURE", message: "Kempape is temporarily unavailable." }, { status: 503 });
  const result = Array.isArray(data) ? data[0] : data;
  if (result?.outcome === "rate_limited") return NextResponse.json({ code: "RATE_LIMITED", message: "Too many attempts. Try again later." }, { status: 429 });
  if (result?.outcome !== "success") return NextResponse.json({ code: "INVALID_INVITE", message: "Invalid or inactive invite code." }, { status: 401 });
  const response = NextResponse.json({ ok: true, destination: "/app" });
  response.cookies.set(env.SESSION_COOKIE_NAME, token, { ...sessionCookieOptions(env), expires: expiresAt });
  return response;
}
