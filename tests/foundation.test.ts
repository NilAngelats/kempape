import { describe, expect, it } from "vitest";
import { formatInviteCode, generateSessionToken, keyedHash, normalizeInviteCode } from "@/lib/auth/credentials";
import { expiredSessionCookieOptions, sessionCookieOptions } from "@/lib/auth/cookie";
import { effectiveElapsedMs, getLifecycleStatus, lifecycleSnapshot } from "@/lib/game/time";
import { parseServerEnv } from "@/lib/server/env-schema";
import { validateAssetRegistry } from "@/lib/assets/registry";

describe("invite credentials",()=>{
  it("normalizes approved separators and case",()=>expect(normalizeInviteCode("kmp-7h9q x4md-p8tr-abc2")).toBe("KMP7H9QX4MDP8TRABC2"));
  it("rejects ambiguous and malformed codes",()=>{expect(normalizeInviteCode("KMP-0000-0000-0000-0000")).toBeNull();expect(normalizeInviteCode("KMP-ABC")).toBeNull()});
  it("formats canonical codes",()=>expect(formatInviteCode("KMP7H9QX4MDP8TRABC2")).toBe("KMP-7H9Q-X4MD-P8TR-ABC2"));
  it("hashes deterministically with domain secrets",()=>{expect(keyedHash("value","a".repeat(32))).toBe(keyedHash("value","a".repeat(32)));expect(keyedHash("value","a".repeat(32))).not.toBe(keyedHash("value","b".repeat(32)))});
  it("creates 256-bit URL-safe session tokens",()=>{const token=generateSessionToken();expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);expect(generateSessionToken()).not.toBe(token)});
});

describe("session cookie",()=>{it("is persistent, HttpOnly and production-secure",()=>expect(sessionCookieOptions({NODE_ENV:"production",SESSION_TTL_DAYS:30})).toMatchObject({httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:2592000}));it("actively expires invalid sessions",()=>expect(expiredSessionCookieOptions({NODE_ENV:"production",SESSION_TTL_DAYS:30})).toMatchObject({httpOnly:true,secure:true,path:"/",maxAge:0,expires:new Date(0)}))});

describe("festival lifecycle",()=>{
  it("covers start and end boundaries",()=>{expect(getLifecycleStatus(new Date("2026-07-16T11:29:59.999+02:00"))).toBe("before_start");expect(getLifecycleStatus(new Date("2026-07-16T11:30:00+02:00"))).toBe("active");expect(getLifecycleStatus(new Date("2026-07-20T03:00:00+02:00"))).toBe("ended")});
  it("reports a durable pause only inside the active window",()=>expect(getLifecycleStatus(new Date("2026-07-18T12:00:00+02:00"),"paused")).toBe("paused"));
  it("keeps final midnight in day four without a fifth day",()=>{const result=lifecycleSnapshot(new Date("2026-07-20T00:00:00+02:00"));expect(result.festivalDayKey).toBe("cycle-4");expect(result.isFinalMidnightWindow).toBe(true)});
  it("excludes one and multiple pause intervals",()=>{const start=new Date("2026-07-18T10:00:00Z"),end=new Date("2026-07-18T14:00:00Z");expect(effectiveElapsedMs(start,end,[{startedAt:new Date("2026-07-18T11:00:00Z"),endedAt:new Date("2026-07-18T12:00:00Z")}])).toBe(10800000);expect(effectiveElapsedMs(start,end,[{startedAt:new Date("2026-07-18T10:30:00Z"),endedAt:new Date("2026-07-18T11:00:00Z")},{startedAt:new Date("2026-07-18T12:00:00Z"),endedAt:new Date("2026-07-18T13:00:00Z")}])).toBe(9000000)});
});

describe("configuration and assets",()=>{
  it("validates environment without exposing client secrets",()=>expect(parseServerEnv({NODE_ENV:"test",APP_URL:"http://localhost:3000",SUPABASE_URL:"http://localhost:54321",SUPABASE_SERVICE_ROLE_KEY:"s".repeat(20),INVITE_CODE_HASH_SECRET:"i".repeat(32),SESSION_TOKEN_HASH_SECRET:"t".repeat(32),RATE_LIMIT_HASH_SECRET:"r".repeat(32)}).success).toBe(true));
  it("validates existing registry paths",()=>expect(validateAssetRegistry(new Set(["/assets/character-template.png"]))).toEqual([]));
});
