import { readFileSync } from "node:fs";
import { describe,expect,it,vi } from "vitest";
import { validateSessionToken,type SessionLookup } from "@/lib/auth/session-validation";
import { PRIMARY_NAV_ITEMS } from "@/lib/navigation";

const token="a".repeat(43), now=new Date("2026-07-15T12:00:00Z");
const session={id:"session",player_id:"player",session_version:2,last_seen_at:now.toISOString(),expires_at:"2026-08-15T12:00:00Z",revoked_at:null};
const player={id:"player",display_name:"Player",role:"player" as const,status:"active" as const,session_version:2,character_id:"character"};
const character={id:"character",display_name:"Character",image_key:"character",face_image_key:null};
function lookup(overrides:Partial<SessionLookup>={}):SessionLookup{return {findSession:async()=>session,findPlayer:async()=>player,findCharacter:async()=>character,...overrides}}

describe("invalid session classification",()=>{
  it("rejects malformed cookies without a database lookup",async()=>{const findSession=vi.fn();expect(await validateSessionToken("bad",String,lookup({findSession}))).toEqual({kind:"invalid",reason:"malformed"});expect(findSession).not.toHaveBeenCalled()});
  it("classifies expired cookies",async()=>expect(await validateSessionToken(token,String,lookup({findSession:async()=>({...session,expires_at:"2026-07-15T11:59:59Z"})}),now)).toEqual({kind:"invalid",reason:"expired"}));
  it("classifies revoked cookies",async()=>expect(await validateSessionToken(token,String,lookup({findSession:async()=>({...session,revoked_at:"2026-07-15T11:00:00Z"})}),now)).toEqual({kind:"invalid",reason:"revoked"}));
  it("classifies version-invalid cookies",async()=>expect(await validateSessionToken(token,String,lookup({findPlayer:async()=>({...player,session_version:3})}),now)).toEqual({kind:"invalid",reason:"version_invalid"}));
  it("propagates temporary database failures instead of invalidating",async()=>{const failure=new Error("temporary database failure");await expect(validateSessionToken(token,String,lookup({findSession:async()=>{throw failure}}),now)).rejects.toBe(failure)});
});

describe("canonical navigation",()=>it("uses the approved five primary destinations and keeps Inventory secondary",()=>{expect(PRIMARY_NAV_ITEMS.map(({label})=>label)).toEqual(["Home","Actions","Store","Quests","Pool"]);expect(PRIMARY_NAV_ITEMS.map(({assetKey})=>assetKey)).toEqual(["nav_home","nav_actions","nav_store","nav_quests","nav_action_pool"]);expect(PRIMARY_NAV_ITEMS.some(({href})=>href.includes("inventory"))).toBe(false)}));

describe("migration security",()=>it("keeps service functions private and rate limiting serialized",()=>{const sql=readFileSync("supabase/migrations/0001_initial_schema.sql","utf8");expect(sql.match(/security definer set search_path = public, pg_temp/g)).toHaveLength(3);expect(sql.match(/revoke all on function public\./g)).toHaveLength(3);expect(sql).toContain("pg_advisory_xact_lock");expect(sql).toContain("game_run_pauses_no_overlap");expect(sql).toContain("alter table public.%I force row level security");expect(sql).toContain("select p.id, i.id into v_player_id, v_invite_id");expect(sql).not.toContain("v_player public.players%rowtype");expect(sql).not.toMatch(/grant execute .* (anon|authenticated)/)}));

describe("development lifecycle control",()=>it("requires explicit non-production acknowledgement and provides canonical restoration",()=>{const script=readFileSync("scripts/set-dev-lifecycle.mjs","utf8");expect(script).toContain('process.env.NODE_ENV === "production"');expect(script).toContain("--acknowledge-development-run-mutation");expect(script).toContain("ALLOW_LINKED_LIFECYCLE_TEST");expect(script).toContain('restore:{phase:"live",started_at:null,...canonical');expect(script).toContain('scheduled_starts_at:"2026-07-16T11:30:00+02:00"')}));
