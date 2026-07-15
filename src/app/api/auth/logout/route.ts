import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth/session";
import { getServerEnv } from "@/lib/server/env";
import { expiredSessionCookieOptions } from "@/lib/auth/cookie";

export async function POST() {
  await revokeCurrentSession().catch(() => undefined);
  const env = getServerEnv();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(env.SESSION_COOKIE_NAME, "", expiredSessionCookieOptions(env));
  return response;
}
