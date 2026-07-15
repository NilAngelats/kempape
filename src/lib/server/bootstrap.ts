import "server-only";
import { getPrivilegedDatabase } from "@/lib/server/database";
import { lifecycleSnapshot, type PauseInterval, type RunLifecycleInput } from "@/lib/game/time";
import type { AuthenticatedPlayer } from "@/lib/auth/session";
import { getMaxHpForLevel, getXpProgress } from "@/lib/game/xp";

export type CorePlayerReadModel = { playerId:string; gameRunId:string; displayName:string; characterId:string; totalXp:number; level:number; xpIntoCurrentLevel:number; xpNeededForNextLevel:number|null; xpProgressPercentage:number; isMaxLevel:boolean; currentHp:number; maxHp:number; hpProgressPercentage:number; coins:number; freeChestCredits:{small:number;medium:number;big:number}; lifecycleState:string };

export async function getBootstrap(player: AuthenticatedPlayer) {
  const db = getPrivilegedDatabase();
  const { data: pointer, error } = await db.from("active_game_run").select("game_run_id,global_version").eq("singleton", true).maybeSingle();
  if (error) throw error;
  if (!pointer) return { player, run: null, playerState: null, corePlayer:null, lifecycle: lifecycleSnapshot(new Date(),null) };
  const [{ data: run, error: runError }, { data: state, error: stateError }, { data: pauses, error: pauseError }, {data:credits,error:creditsError}] = await Promise.all([
    db.from("game_runs").select("*").eq("id", pointer.game_run_id).single(),
    db.from("player_run_states").select("*").eq("game_run_id", pointer.game_run_id).eq("player_id", player.id).maybeSingle(),
    db.from("game_run_pauses").select("started_at,ended_at").eq("game_run_id", pointer.game_run_id).order("started_at"),
    db.from("player_free_chest_credits").select("small,medium,big").eq("game_run_id",pointer.game_run_id).eq("player_id",player.id).maybeSingle(),
  ]);
  if (runError || stateError || pauseError || (creditsError && creditsError.code!=="42P01")) throw runError ?? stateError ?? pauseError ?? creditsError;
  const intervals: PauseInterval[] = (pauses ?? []).map((pause) => ({ startedAt: new Date(pause.started_at), endedAt: pause.ended_at ? new Date(pause.ended_at) : null }));
  const lifecycleRun:RunLifecycleInput={phase:run.phase,scheduledStartsAt:new Date(run.scheduled_starts_at),startedAt:run.started_at?new Date(run.started_at):null,normalGameplayEndsAt:new Date(run.normal_gameplay_ends_at),chaosResolutionEndsAt:new Date(run.chaos_resolution_ends_at)};
  const lifecycle=lifecycleSnapshot(new Date(),lifecycleRun,intervals);
  let corePlayer:CorePlayerReadModel|null=null;
  if(state){const xp=getXpProgress(state.total_xp);const maxHp=getMaxHpForLevel(xp.level);corePlayer={playerId:player.id,gameRunId:pointer.game_run_id,displayName:player.displayName,characterId:player.character.id,totalXp:state.total_xp,level:xp.level,xpIntoCurrentLevel:xp.xpIntoCurrentLevel,xpNeededForNextLevel:xp.xpNeededForNextLevel,xpProgressPercentage:xp.percentage,isMaxLevel:xp.isMaxLevel,currentHp:state.current_hp,maxHp,hpProgressPercentage:Math.min(100,(state.current_hp/maxHp)*100),coins:state.coins,freeChestCredits:credits??{small:0,medium:0,big:0},lifecycleState:lifecycle.status};}
  return { player, run, playerState: state, corePlayer, lifecycle };
}
