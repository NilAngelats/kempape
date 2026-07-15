import { z } from "zod";

export type AppErrorCode =
  | "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "SESSION_EXPIRED"
  | "LIFECYCLE_BLOCKED" | "PLAYER_HOSPITALIZED" | "ACTION_UNAVAILABLE"
  | "ACTION_ALREADY_PENDING" | "PENDING_LIMIT_REACHED" | "COOLDOWN_ACTIVE"
  | "DAILY_CAP_REACHED" | "FESTIVAL_CAP_REACHED" | "SELF_VALIDATION"
  | "CONSECUTIVE_VALIDATOR_BLOCKED" | "SUBMISSION_NOT_FOUND" | "SUBMISSION_EXPIRED"
  | "SUBMISSION_ALREADY_PROCESSED" | "IDEMPOTENCY_CONFLICT" | "INFRASTRUCTURE";

export class AppError extends Error {
  constructor(public readonly code: AppErrorCode, message: string, public readonly status: number) { super(message); }
}

const domainErrors: Record<string, [AppErrorCode, string, number]> = {
  VALIDATION: ["VALIDATION", "The request is invalid.", 400],
  FORBIDDEN: ["FORBIDDEN", "You cannot perform this action.", 403],
  STALE_RUN: ["LIFECYCLE_BLOCKED", "The active game changed. Refresh and try again.", 403],
  PHASE_BLOCKED: ["LIFECYCLE_BLOCKED", "Actions are unavailable in the current game phase.", 403],
  LIFECYCLE_BLOCKED: ["LIFECYCLE_BLOCKED", "Actions are unavailable right now.", 403],
  STATUS_BLOCKED: ["LIFECYCLE_BLOCKED", "Your current player status blocks this action.", 403],
  PLAYER_HOSPITALIZED: ["PLAYER_HOSPITALIZED", "Hospitalized players cannot use Actions.", 403],
  HOSPITALIZED: ["PLAYER_HOSPITALIZED", "Hospitalized players cannot use Actions.", 403],
  ACTION_UNAVAILABLE: ["ACTION_UNAVAILABLE", "This Action is unavailable.", 403],
  ACTION_PENDING: ["ACTION_ALREADY_PENDING", "This Action is already awaiting validation.", 409],
  PENDING_LIMIT: ["PENDING_LIMIT_REACHED", "You already have three pending Actions.", 409],
  COOLDOWN: ["COOLDOWN_ACTIVE", "This Action is still on cooldown.", 409],
  DAILY_CAP: ["DAILY_CAP_REACHED", "This Action's daily limit has been reached.", 409],
  FESTIVAL_CAP: ["FESTIVAL_CAP_REACHED", "This Action's festival limit has been reached.", 409],
  SELF_VALIDATION: ["SELF_VALIDATION", "You cannot validate your own Action.", 403],
  CONSECUTIVE_VALIDATOR: ["CONSECUTIVE_VALIDATOR_BLOCKED", "Another player must validate this owner's next Action.", 403],
  SUBMISSION_NOT_FOUND: ["SUBMISSION_NOT_FOUND", "The Action submission was not found.", 404],
  NOT_FOUND: ["SUBMISSION_NOT_FOUND", "The Action submission was not found.", 404],
  SUBMISSION_EXPIRED: ["SUBMISSION_EXPIRED", "The Action submission has expired.", 410],
  SUBMISSION_ALREADY_PROCESSED: ["SUBMISSION_ALREADY_PROCESSED", "The Action submission was already processed.", 409],
  IDEMPOTENCY_CONFLICT: ["IDEMPOTENCY_CONFLICT", "This command key was already used for a different request.", 409],
};

export function mapDatabaseError(error: unknown): AppError {
  const message = typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" ? error.message : "";
  const token = message.match(/\b[A-Z][A-Z_]+\b/)?.[0];
  const mapped = token ? domainErrors[token] : undefined;
  return mapped ? new AppError(...mapped) : new AppError("INFRASTRUCTURE", "Kempape is temporarily unavailable.", 503);
}

export function safeErrorResponse(error: unknown) {
  const safe = error instanceof AppError ? error : z.ZodError && error instanceof z.ZodError
    ? new AppError("VALIDATION", "The request is invalid.", 400)
    : mapDatabaseError(error);
  return { code: safe.code, message: safe.message, status: safe.status };
}
