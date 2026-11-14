import { z } from "zod";

export type AppErrorCode =
  | "VALIDATION" | "UNAUTHENTICATED" | "FORBIDDEN" | "RATE_LIMITED" | "SESSION_EXPIRED"
  | "LIFECYCLE_BLOCKED" | "PLAYER_HOSPITALIZED" | "ACTION_UNAVAILABLE"
  | "ACTION_ALREADY_PENDING" | "PENDING_LIMIT_REACHED" | "COOLDOWN_ACTIVE"
  | "DAILY_CAP_REACHED" | "FESTIVAL_CAP_REACHED" | "SELF_VALIDATION"
  | "CONSECUTIVE_VALIDATOR_BLOCKED" | "SUBMISSION_NOT_FOUND" | "SUBMISSION_EXPIRED"
  | "SUBMISSION_ALREADY_PROCESSED" | "IDEMPOTENCY_CONFLICT" | "INFRASTRUCTURE"
  | "FULL_HP" | "LEVEL_CAP" | "NO_ELIGIBLE_COOLDOWN" | "HOSPITAL_ONLY"
  | "DISCHARGE_ALREADY_USED" | "NOT_HOSPITALIZED" | "STACK_LIMIT_REACHED"
  | "EQUIPMENT_SUPPLY_EXHAUSTED" | "EQUIPMENT_COOLDOWN_ACTIVE" | "SLOT_OCCUPIED"
  | "REPLACEMENT_MISMATCH" | "ITEM_NOT_FOUND" | "ITEM_NOT_OWNED"
  | "ITEM_NOT_EQUIPPED" | "ITEM_ALREADY_EQUIPPED";


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
  PLAYER_HOSPITALIZED: ["PLAYER_HOSPITALIZED", "This operation is unavailable while you are hospitalized.", 403],
  HOSPITALIZED: ["PLAYER_HOSPITALIZED", "This operation is unavailable while you are hospitalized.", 403],
  FULL_HP: ["FULL_HP", "You are already at full HP.", 409],
  LEVEL_CAP: ["LEVEL_CAP", "XP items cannot be used at Level 40.", 409],
  NO_ELIGIBLE_COOLDOWN: ["NO_ELIGIBLE_COOLDOWN", "No eligible Action cooldown can be reset.", 409],
  HOSPITAL_ONLY: ["HOSPITAL_ONLY", "This item can only be used from the Hospital screen.", 403],
  DISCHARGE_ALREADY_USED: ["DISCHARGE_ALREADY_USED", "A Discharge Pill was already used for this Hospital stay.", 409],
  NOT_HOSPITALIZED: ["NOT_HOSPITALIZED", "There is no active Hospital stay.", 409],
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
  ITEM_NOT_FOUND: ["ITEM_NOT_FOUND", "The selected item does not exist.", 404],
  ITEM_NOT_OWNED: ["ITEM_NOT_OWNED", "You do not own that item.", 403],
  ITEM_NOT_EQUIPPED: ["ITEM_NOT_EQUIPPED", "That item is not equipped.", 409],
  ITEM_ALREADY_EQUIPPED: ["ITEM_ALREADY_EQUIPPED", "That item is already equipped.", 409],
  SLOT_OCCUPIED: ["SLOT_OCCUPIED", "Replace the currently equipped item in this slot.", 409],
  REPLACEMENT_MISMATCH: ["REPLACEMENT_MISMATCH", "The replacement selection is stale.", 409],
  EQUIPMENT_COOLDOWN_ACTIVE: ["EQUIPMENT_COOLDOWN_ACTIVE", "That Equipment copy is still on cooldown.", 409],
  EQUIPMENT_SUPPLY_EXHAUSTED: ["EQUIPMENT_SUPPLY_EXHAUSTED", "That Equipment item is no longer available.", 409],
  STACK_LIMIT_REACHED: ["STACK_LIMIT_REACHED", "That item stack is already full.", 409],
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
