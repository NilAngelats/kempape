import { FESTIVAL_CONFIG } from "@/lib/game/config";

export type LifecycleStatus = "unavailable" | "before_start" | "active" | "paused" | "chaos_resolution" | "ended";
export type PauseInterval = { startedAt: Date; endedAt: Date | null };
export type RunLifecycleInput = {
  phase: string;
  scheduledStartsAt: Date;
  startedAt: Date | null;
  normalGameplayEndsAt: Date;
  chaosResolutionEndsAt: Date;
};

export function getLifecycleStatus(now: Date, run: RunLifecycleInput | null): LifecycleStatus {
  if (!run) return "unavailable";
  const timestamp = now.getTime();
  if (run.phase === "ended" || run.phase === "archived" || timestamp >= run.chaosResolutionEndsAt.getTime()) return "ended";
  if (run.phase === "chaos_resolution" || timestamp >= run.normalGameplayEndsAt.getTime()) return "chaos_resolution";
  const effectiveStart = run.startedAt ?? run.scheduledStartsAt;
  if (run.phase === "setup" || timestamp < effectiveStart.getTime()) return "before_start";
  if (run.phase === "paused") return "paused";
  return "active";
}

export const getFestivalState = getLifecycleStatus;

export function getFestivalCycleKey(now: Date): string | null {
  const timestamp = now.getTime();
  return FESTIVAL_CONFIG.cycleBoundaries.find((cycle) => timestamp >= Date.parse(cycle.startsAt) && timestamp < Date.parse(cycle.endsAt))?.key ?? null;
}

export function isFinalMidnight(now: Date): boolean { return now.getTime() === Date.parse(FESTIVAL_CONFIG.finalMidnightAt); }
export function pauseDurationMs(intervals: PauseInterval[], until: Date): number { return intervals.reduce((total,pause)=>{const end=Math.min((pause.endedAt??until).getTime(),until.getTime());return total+Math.max(0,end-pause.startedAt.getTime());},0); }
export function effectiveElapsedMs(startedAt: Date, now: Date, intervals: PauseInterval[]): number { return Math.max(0,now.getTime()-startedAt.getTime()-pauseDurationMs(intervals,now)); }

export function lifecycleSnapshot(now: Date, run: RunLifecycleInput | null, pauses: PauseInterval[] = []) {
  const status=getLifecycleStatus(now,run);
  const effectiveStart=run?.startedAt??run?.scheduledStartsAt??null;
  return {
    serverNow:now.toISOString(),status,mutationsAllowed:status==="active",festivalDayKey:getFestivalCycleKey(now),
    startsAt:effectiveStart?.toISOString()??null,normalGameplayEndsAt:run?.normalGameplayEndsAt.toISOString()??null,chaosResolutionEndsAt:run?.chaosResolutionEndsAt.toISOString()??null,
    millisecondsUntilStart:effectiveStart?Math.max(0,effectiveStart.getTime()-now.getTime()):0,
    millisecondsUntilEnd:run?Math.max(0,run.normalGameplayEndsAt.getTime()-now.getTime()):0,
    effectiveElapsedMilliseconds:effectiveStart?effectiveElapsedMs(effectiveStart,now,pauses):0,
    isFinalMidnightWindow:Boolean(run&&now.getTime()>=Date.parse(FESTIVAL_CONFIG.finalMidnightAt)&&now.getTime()<run.normalGameplayEndsAt.getTime()),
  } as const;
}
