import { FESTIVAL_CONFIG } from "@/lib/game/config";

export type LifecycleStatus = "before_start" | "active" | "paused" | "ended";
export type PauseInterval = { startedAt: Date; endedAt: Date | null };

export function getLifecycleStatus(now: Date, runPhase?: string): LifecycleStatus {
  if (now.getTime() < Date.parse(FESTIVAL_CONFIG.startsAt)) return "before_start";
  if (now.getTime() >= Date.parse(FESTIVAL_CONFIG.endsAt) || runPhase === "ended" || runPhase === "archived" || runPhase === "chaos_resolution") return "ended";
  if (runPhase === "paused") return "paused";
  return "active";
}

export const getFestivalState = getLifecycleStatus;

export function getFestivalCycleKey(now: Date): string | null {
  const timestamp = now.getTime();
  return FESTIVAL_CONFIG.cycleBoundaries.find((cycle) => timestamp >= Date.parse(cycle.startsAt) && timestamp < Date.parse(cycle.endsAt))?.key ?? null;
}

export function isFinalMidnight(now: Date): boolean {
  return now.getTime() === Date.parse(FESTIVAL_CONFIG.finalMidnightAt);
}

export function pauseDurationMs(intervals: PauseInterval[], until: Date): number {
  return intervals.reduce((total, pause) => {
    const end = Math.min((pause.endedAt ?? until).getTime(), until.getTime());
    return total + Math.max(0, end - pause.startedAt.getTime());
  }, 0);
}

export function effectiveElapsedMs(startedAt: Date, now: Date, intervals: PauseInterval[]): number {
  return Math.max(0, now.getTime() - startedAt.getTime() - pauseDurationMs(intervals, now));
}

export function lifecycleSnapshot(now: Date, runPhase?: string, pauses: PauseInterval[] = []) {
  const status = getLifecycleStatus(now, runPhase);
  return {
    serverNow: now.toISOString(),
    status,
    mutationsAllowed: status === "active",
    festivalDayKey: getFestivalCycleKey(now),
    millisecondsUntilStart: Math.max(0, Date.parse(FESTIVAL_CONFIG.startsAt) - now.getTime()),
    millisecondsUntilEnd: Math.max(0, Date.parse(FESTIVAL_CONFIG.endsAt) - now.getTime()),
    effectiveElapsedMilliseconds: effectiveElapsedMs(new Date(FESTIVAL_CONFIG.startsAt), now, pauses),
    isFinalMidnightWindow: now.getTime() >= Date.parse(FESTIVAL_CONFIG.finalMidnightAt) && now.getTime() < Date.parse(FESTIVAL_CONFIG.endsAt),
  } as const;
}
