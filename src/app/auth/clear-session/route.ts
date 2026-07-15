import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/server/env";
import { expiredSessionCookieOptions } from "@/lib/auth/cookie";
export function GET(request:Request){const env=getServerEnv();const response=NextResponse.redirect(new URL("/login",request.url));response.cookies.set(env.SESSION_COOKIE_NAME,"",expiredSessionCookieOptions(env));return response;}
