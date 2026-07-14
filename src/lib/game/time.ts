import { FESTIVAL_CONFIG } from "@/lib/game/config";

export type FestivalState = "before" | "active" | "after";

export function getFestivalState(now: Date): FestivalState {
  const timestamp = now.getTime();
  const startsAt = new Date(FESTIVAL_CONFIG.startsAt).getTime();
  const endsAt = new Date(FESTIVAL_CONFIG.endsAt).getTime();

  if (timestamp < startsAt) return "before";
  if (timestamp >= endsAt) return "after";
  return "active";
}

export function getFestivalCycleKey(now: Date): string | null {
  const timestamp = now.getTime();

  for (const cycle of FESTIVAL_CONFIG.cycleBoundaries) {
    const startsAt = new Date(cycle.startsAt).getTime();
    const endsAt = new Date(cycle.endsAt).getTime();

    if (timestamp >= startsAt && timestamp < endsAt) {
      return cycle.key;
    }
  }

  return null;
}

export function isFinalMidnight(now: Date): boolean {
  return now.getTime() === new Date(FESTIVAL_CONFIG.finalMidnightAt).getTime();
}
