import { describe, expect, it } from "vitest";
import { remainingActionValidationSeconds } from "@/lib/game/action-timing";

const at = (minutes: number, seconds = 0) => new Date(Date.UTC(2026, 6, 16, 10, minutes, seconds));

describe("pause-aware Action validation time", () => {
  it("handles no pauses and the exact boundary", () => {
    expect(remainingActionValidationSeconds(at(0), at(119, 59), [])).toBe(1);
    expect(remainingActionValidationSeconds(at(0), at(120), [])).toBe(0);
    expect(remainingActionValidationSeconds(at(0), at(120, 1), [])).toBe(0);
  });

  it("subtracts one completed pause", () => {
    expect(remainingActionValidationSeconds(at(0), at(150), [{ startedAt: at(60), endedAt: at(90) }])).toBe(0);
    expect(remainingActionValidationSeconds(at(0), at(120), [{ startedAt: at(60), endedAt: at(90) }])).toBe(1800);
  });

  it("freezes during an open pause", () => {
    expect(remainingActionValidationSeconds(at(0), at(120), [{ startedAt: at(90), endedAt: null }])).toBe(1800);
    expect(remainingActionValidationSeconds(at(0), at(150), [{ startedAt: at(90), endedAt: null }])).toBe(1800);
  });

  it("handles multiple pauses and partial overlap", () => {
    const pauses = [{ startedAt: at(-10), endedAt: at(10) }, { startedAt: at(30), endedAt: at(50) }];
    expect(remainingActionValidationSeconds(at(0), at(150), pauses)).toBe(0);
    expect(remainingActionValidationSeconds(at(0), at(140), pauses)).toBe(600);
  });

  it("ignores a pause completed before submission", () => {
    expect(remainingActionValidationSeconds(at(30), at(90), [{ startedAt: at(0), endedAt: at(20) }])).toBe(3600);
  });
});
