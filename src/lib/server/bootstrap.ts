import "server-only";
import { getPrivilegedDatabase } from "@/lib/server/database";
import { lifecycleSnapshot, type PauseInterval } from "@/lib/game/time";
import type { AuthenticatedPlayer } from "@/lib/auth/session";

export async function getBootstrap(player: AuthenticatedPlayer) {
  const db = getPrivilegedDatabase();
  const { data: pointer, error } = await db.from("active_game_run").select("game_run_id,global_version").eq("singleton", true).maybeSingle();
  if (error) throw error;
  if (!pointer) return { player, run: null, playerState: null, lifecycle: lifecycleSnapshot(new Date()) };
  const [{ data: run, error: runError }, { data: state, error: stateError }, { data: pauses, error: pauseError }] = await Promise.all([
    db.from("game_runs").select("*").eq("id", pointer.game_run_id).single(),
    db.from("player_run_states").select("*").eq("game_run_id", pointer.game_run_id).eq("player_id", player.id).maybeSingle(),
    db.from("game_run_pauses").select("started_at,ended_at").eq("game_run_id", pointer.game_run_id).order("started_at"),
  ]);
  if (runError || stateError || pauseError) throw runError ?? stateError ?? pauseError;
  const intervals: PauseInterval[] = (pauses ?? []).map((pause) => ({ startedAt: new Date(pause.started_at), endedAt: pause.ended_at ? new Date(pause.ended_at) : null }));
  return { player, run, playerState: state, lifecycle: lifecycleSnapshot(new Date(), run.phase, intervals) };
}
