import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration0002 = readFileSync("supabase/migrations/0002_core_player_engine.sql");
const migration0003 = readFileSync("supabase/migrations/0003_fix_core_function_result_ambiguity.sql", "utf8");

describe("core SQL migration safety", () => {
  it("keeps already-applied migration 0002 byte-for-byte unchanged", () => {
    expect(createHash("sha256").update(migration0002).digest("hex")).toBe(
      "cb92f0ff8ad91bb3ce4042e04e8aeb60232b0dd0c2d28d0f0690252647334702",
    );
  });

  it("replaces all three deployed functions using unambiguous result variables", () => {
    for (const functionName of ["core_change_coins", "core_heal_player", "core_mutate_xp"]) {
      expect(migration0003).toContain(`create or replace function public.${functionName}`);
      expect(migration0003).toContain(`ir.command_name='${functionName}'`);
    }
    expect(migration0003.match(/result=v_result/g)).toHaveLength(3);
  });

  it("rejects ambiguous SQL self-assignments in the forward fix", () => {
    expect(migration0003).not.toMatch(/\b(result|status|request_hash|request_fingerprint)\s*=\s*\1\b/i);
    expect(migration0003).not.toMatch(/where\s+actor_player_id\s*=/i);
    expect(migration0003).not.toMatch(/where\s+command_name\s*=/i);
    expect(migration0003).not.toMatch(/where\s+idempotency_key\s*=/i);
  });
});
