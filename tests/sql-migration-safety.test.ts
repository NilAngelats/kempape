import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration0002 = readFileSync("supabase/migrations/0002_core_player_engine.sql");
const migration0003 = readFileSync("supabase/migrations/0003_fix_core_function_result_ambiguity.sql", "utf8");
const migration0004 = readFileSync("supabase/migrations/0004_actions_and_daily_quests.sql");
const migration0005 = readFileSync("supabase/migrations/0005_fix_pgcrypto_digest_resolution.sql", "utf8");

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

describe("Handoff 3 pgcrypto migration safety", () => {
  it("keeps already-applied migration 0004 byte-for-byte unchanged", () => {
    expect(createHash("sha256").update(migration0004).digest("hex")).toBe(
      "1a30d5d6428b9160ce6209fc62837327f182ce1a475c428f784b6085ddcb016e",
    );
  });

  it("replaces both deployed SECURITY DEFINER functions", () => {
    expect(migration0005).toContain(
      "create or replace function public.action_complete_eligible_quests(p_run uuid,p_player uuid,p_day date,p_at timestamptz)returns text[]",
    );
    expect(migration0005).toContain(
      "create or replace function public.accept_action_submission(p_actor uuid,p_run uuid,p_submission uuid,p_idempotency_key uuid,p_request_hash text)returns jsonb",
    );
    expect(migration0005.match(/security definer set search_path=public,pg_temp/g)).toHaveLength(2);
  });

  it("rejects unqualified pgcrypto calls in the replacement definitions", () => {
    expect(migration0005.match(/extensions\.digest\s*\(/g)).toHaveLength(5);
    expect(migration0005).not.toMatch(/(?<!\.)\bdigest\s*\(/i);
    expect(migration0005).not.toMatch(/(?<!\.)\b(?:hmac|crypt|gen_salt)\s*\(/i);
    expect(migration0005.match(/extensions\.digest\(convert_to\(/g)).toHaveLength(5);
    expect(migration0005.match(/'sha256'::text/g)).toHaveLength(5);
  });

  it("restores service-role-only execution", () => {
    for (const signature of [
      "public.action_complete_eligible_quests(uuid,uuid,date,timestamptz)",
      "public.accept_action_submission(uuid,uuid,uuid,uuid,text)",
    ]) {
      expect(migration0005).toContain(`revoke all on function ${signature} from public,anon,authenticated;`);
      expect(migration0005).toContain(`grant execute on function ${signature} to service_role;`);
    }
  });
});
