import { describe, expect, it } from "vitest";
import { mapDatabaseError, safeErrorResponse } from "@/lib/errors";

describe("safe Action database errors", () => {
  const cases = [
    ["PHASE_BLOCKED", "LIFECYCLE_BLOCKED", 403], ["STATUS_BLOCKED", "LIFECYCLE_BLOCKED", 403],
    ["HOSPITALIZED", "PLAYER_HOSPITALIZED", 403],
    ["ACTION_UNAVAILABLE", "ACTION_UNAVAILABLE", 403], ["ACTION_PENDING", "ACTION_ALREADY_PENDING", 409],
    ["PENDING_LIMIT", "PENDING_LIMIT_REACHED", 409], ["COOLDOWN", "COOLDOWN_ACTIVE", 409],
    ["DAILY_CAP", "DAILY_CAP_REACHED", 409], ["FESTIVAL_CAP", "FESTIVAL_CAP_REACHED", 409],
    ["SELF_VALIDATION", "SELF_VALIDATION", 403], ["CONSECUTIVE_VALIDATOR", "CONSECUTIVE_VALIDATOR_BLOCKED", 403],
    ["SUBMISSION_NOT_FOUND", "SUBMISSION_NOT_FOUND", 404], ["SUBMISSION_EXPIRED", "SUBMISSION_EXPIRED", 410],
    ["SUBMISSION_ALREADY_PROCESSED", "SUBMISSION_ALREADY_PROCESSED", 409], ["IDEMPOTENCY_CONFLICT", "IDEMPOTENCY_CONFLICT", 409],
  ] as const;
  it.each(cases)("maps %s", (databaseCode, appCode, status) => {
    const mapped = mapDatabaseError({ message: databaseCode, details: "secret table detail" });
    expect(mapped).toMatchObject({ code: appCode, status });
    expect(mapped.message).not.toContain("table");
  });
  it("keeps unknown and temporary failures as infrastructure errors", () => {
    expect(mapDatabaseError({ message: "connection reset" })).toMatchObject({ code: "INFRASTRUCTURE", status: 503 });
  });
  it("never returns raw database text", () => {
    expect(safeErrorResponse({ message: "select * from private_table" })).toEqual({ code: "INFRASTRUCTURE", message: "Kempape is temporarily unavailable.", status: 503 });
  });
});
