import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { ServerEnv } from "@/lib/server/env";

export function sessionCookieOptions(env: Pick<ServerEnv, "NODE_ENV" | "SESSION_TTL_DAYS">): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}

export function expiredSessionCookieOptions(env:Pick<ServerEnv,"NODE_ENV"|"SESSION_TTL_DAYS">):Partial<ResponseCookie>{return {...sessionCookieOptions(env),maxAge:0,expires:new Date(0)}}
