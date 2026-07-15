import "server-only";
import { createHash } from "node:crypto";
import { getPrivilegedDatabase } from "@/lib/server/database";
import type { AuthenticatedPlayer } from "@/lib/auth/session";
import { ACTIONS } from "@/lib/game/actions";
import { DAILY_QUESTS } from "@/lib/game/quests";
import { getAsset } from "@/lib/assets/registry";

export const requestHash=(value:unknown)=>createHash("sha256").update(JSON.stringify(value)).digest("hex");
export async function getActiveRunId(){const {data,error}=await getPrivilegedDatabase().from("active_game_run").select("game_run_id").eq("singleton",true).single();if(error)throw error;return data.game_run_id as string;}

export async function getActionsForCurrentPlayer(player:AuthenticatedPlayer){
 const db=getPrivilegedDatabase(),runId=await getActiveRunId(),now=new Date();
 const [{data:submissions,error:sError},{data:usages,error:uError},{data:cooldowns,error:cError}]=await Promise.all([
  db.from("action_submissions").select("action_id,expires_at").eq("game_run_id",runId).eq("owner_player_id",player.id).eq("status","pending"),
  db.from("action_usages").select("action_id,festival_day_key").eq("game_run_id",runId).eq("player_id",player.id),
  db.from("action_cooldowns").select("action_id,cooldown_ends_at").eq("game_run_id",runId).eq("player_id",player.id).gt("cooldown_ends_at",now.toISOString()),
 ]);if(sError||uError||cError)throw sError??uError??cError;
 const pending=new Map((submissions??[]).map(v=>[v.action_id,v.expires_at]));const activeCooldowns=new Map((cooldowns??[]).map(v=>[v.action_id,v.cooldown_ends_at]));
 return {runId,serverNow:now.toISOString(),actions:ACTIONS.map(def=>{const asset=getAsset("actions",def.imageKey);const festivalUses=(usages??[]).filter(v=>v.action_id===def.id).length;const day=(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(now));const dailyUses=(usages??[]).filter(v=>v.action_id===def.id&&v.festival_day_key===day).length;const reason=!def.isEnabled?"Extreme Challenge has not been configured.":pending.has(def.id)?"Awaiting validation":activeCooldowns.has(def.id)?"Cooldown active":def.dailyCap!==null&&dailyUses>=def.dailyCap?"Daily cap reached":def.festivalCap!==null&&festivalUses>=def.festivalCap?"Festival cap reached":null;return {...def,imagePath:asset?.path??getAsset("actions","action_fallback")?.path??null,pendingExpiresAt:pending.get(def.id)??null,cooldownEndsAt:activeCooldowns.get(def.id)??null,dailyUses,festivalUses,availabilityReason:reason,canSubmit:reason===null};})};
}

export async function getActionPool(player:AuthenticatedPlayer){
 const db=getPrivilegedDatabase(),runId=await getActiveRunId();
 const {error:expiryError}=await db.rpc("expire_due_action_submissions",{p_run:runId,p_limit:50});if(expiryError)throw expiryError;
 const {data,error}=await db.rpc("get_action_pool_snapshot",{p_run:runId});if(error)throw error;
 const rows=(data??[]) as Array<{submission_id:string;owner_player_id:string;action_id:string;submitted_at:string;remaining_validation_seconds:number;is_expired:boolean;server_now:string}>;
 const ownerIds=[...new Set(rows.map(row=>row.owner_player_id))];
 const owners=ownerIds.length?(await db.from("players").select("id,display_name,character_id").in("id",ownerIds)):null;
 if(owners?.error)throw owners.error;const ownerById=new Map((owners?.data??[]).map(owner=>[owner.id,owner]));
 const serverNow=rows[0]?.server_now??new Date().toISOString();
 return {runId,serverNow,entries:rows.filter(row=>!row.is_expired).map(row=>{const def=ACTIONS.find(v=>v.id===row.action_id),owned=row.owner_player_id===player.id,remainingValidationSeconds=row.remaining_validation_seconds;return {submissionId:row.submission_id,status:"pending",ownerPlayerId:row.owner_player_id,ownerDisplayName:ownerById.get(row.owner_player_id)?.display_name??"Player",ownerFaceAssetKey:null,actionId:row.action_id,actionName:def?.name??row.action_id,tier:def?.tier??"common",submittedAt:row.submitted_at,remainingValidationSeconds,isExpired:row.is_expired,serverNow,expiresAt:new Date(Date.parse(serverNow)+remainingValidationSeconds*1000).toISOString(),canCurrentPlayerAccept:!owned,canCurrentPlayerReject:!owned,ineligibilityReason:owned?"Awaiting validation":null,isOwnedByCurrentPlayer:owned};})};
}

export async function getDailyQuests(player:AuthenticatedPlayer){const db=getPrivilegedDatabase(),runId=await getActiveRunId(),now=new Date();const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);const [{data:progress},{data:distinct},{data:completed}]=await Promise.all([db.from("daily_quest_progress").select("accepted_actions,successful_validations").eq("game_run_id",runId).eq("player_id",player.id).eq("festival_day_key",day).maybeSingle(),db.from("daily_quest_distinct_actions").select("action_id").eq("game_run_id",runId).eq("player_id",player.id).eq("festival_day_key",day),db.from("daily_quest_completions").select("quest_id").eq("game_run_id",runId).eq("player_id",player.id).eq("festival_day_key",day)]);const values={acceptedActions:progress?.accepted_actions??0,successfulValidations:progress?.successful_validations??0,distinctActions:distinct?.length??0};const complete=new Set((completed??[]).map(v=>v.quest_id));return {runId,serverNow:now.toISOString(),festivalDayKey:day,quests:DAILY_QUESTS.map(q=>({...q,completed:complete.has(q.id),progress:values}))};}
