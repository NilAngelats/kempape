export type ActionPauseInterval = { startedAt: Date; endedAt: Date | null };

export const ACTION_VALIDATION_SECONDS = 2 * 60 * 60;

export function overlappingPauseMilliseconds(
  submittedAt: Date,
  serverNow: Date,
  pauses: ActionPauseInterval[],
): number {
  const start = submittedAt.getTime();
  const end = serverNow.getTime();
  return pauses.reduce((total, pause) => {
    const overlapStart = Math.max(start, pause.startedAt.getTime());
    const overlapEnd = Math.min(end, (pause.endedAt ?? serverNow).getTime());
    return total + Math.max(0, overlapEnd - overlapStart);
  }, 0);
}

export function remainingActionValidationSeconds(
  submittedAt: Date,
  serverNow: Date,
  pauses: ActionPauseInterval[],
): number {
  const wallMilliseconds = Math.max(0, serverNow.getTime() - submittedAt.getTime());
  const effectiveMilliseconds = Math.max(
    0,
    wallMilliseconds - overlappingPauseMilliseconds(submittedAt, serverNow, pauses),
  );
  return Math.max(0, ACTION_VALIDATION_SECONDS - Math.floor(effectiveMilliseconds / 1000));
}

