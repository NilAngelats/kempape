import "server-only";
import { cookies } from "next/headers";
import { getPrivilegedDatabase } from "@/lib/server/database";
import { getServerEnv } from "@/lib/server/env";
import { keyedHash } from "@/lib/auth/credentials";
import { validateSessionToken, type SessionLookup, type SessionValidation, type ValidatedPlayer } from "@/lib/auth/session-validation";

export type AuthenticatedPlayer = ValidatedPlayer;

function databaseLookup():SessionLookup { const db=getPrivilegedDatabase(); return {
  async findSession(tokenHash){const {data,error}=await db.from("player_sessions").select("id,player_id,session_version,last_seen_at,expires_at,revoked_at").eq("token_hash",tokenHash).maybeSingle();if(error)throw error;return data},
  async findPlayer(id){const {data,error}=await db.from("players").select("id,display_name,role,status,session_version,character_id").eq("id",id).maybeSingle();if(error)throw error;return data},
  async findCharacter(id){const {data,error}=await db.from("characters").select("id,display_name,image_key,face_image_key").eq("id",id).maybeSingle();if(error)throw error;return data},
};}

export async function getSessionValidation():Promise<SessionValidation>{const env=getServerEnv();const token=(await cookies()).get(env.SESSION_COOKIE_NAME)?.value;const result=await validateSessionToken(token,(value)=>keyedHash(value,env.SESSION_TOKEN_HASH_SECRET),databaseLookup());if(result.kind==="valid"&&Date.now()-Date.parse(result.lastSeenAt)>15*60_000)void getPrivilegedDatabase().from("player_sessions").update({last_seen_at:new Date().toISOString()}).eq("id",result.player.sessionId);return result;}
export async function restoreSession():Promise<AuthenticatedPlayer|null>{const result=await getSessionValidation();return result.kind==="valid"?result.player:null;}
export async function revokeCurrentSession():Promise<void>{const env=getServerEnv();const store=await cookies();const token=store.get(env.SESSION_COOKIE_NAME)?.value;if(token&&/^[A-Za-z0-9_-]{43}$/.test(token))await getPrivilegedDatabase().from("player_sessions").update({revoked_at:new Date().toISOString()}).eq("token_hash",keyedHash(token,env.SESSION_TOKEN_HASH_SECRET)).is("revoked_at",null);}
