import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration0002 = readFileSync("supabase/migrations/0002_core_player_engine.sql");
const migration0003 = readFileSync("supabase/migrations/0003_fix_core_function_result_ambiguity.sql", "utf8");
const migration0004 = readFileSync("supabase/migrations/0004_actions_and_daily_quests.sql");
const migration0005 = readFileSync("supabase/migrations/0005_fix_pgcrypto_digest_resolution.sql", "utf8");
const migration0006 = readFileSync("supabase/migrations/0006_harden_actions_runtime.sql", "utf8");
const migration0007 = readFileSync("supabase/migrations/0007_fix_outbox_event_version_progression.sql", "utf8");
const actionReadModel = readFileSync("src/lib/server/action-game.ts", "utf8");

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

describe("Handoff 3 runtime hardening migration", () => {
  it("claims and completes Accept and Reject idempotency records", () => {
    for (const command of ["accept_action_submission", "reject_action_submission"]) {
      expect(migration0006).toContain(`'${command}',p_idempotency_key,p_request_hash`);
      expect(migration0006).toContain(`ir.command_name='${command}'`);
    }
    expect(migration0006.match(/status='completed',result=v_result/g)).toHaveLength(2);
    expect(migration0006.match(/IDEMPOTENCY_CONFLICT/g)).toHaveLength(3);
  });

  it("derives expiration from overlapping durable pauses", () => {
    expect(migration0006).toContain("public.game_run_pauses gp");
    expect(migration0006).toContain("greatest(gp.started_at,p_submitted_at)");
    expect(migration0006).toContain("for update skip locked limit p_limit");
    expect(migration0006).toContain("'action_expired'");
  });

  it("keeps pool reads free of direct gameplay-table mutation", () => {
    expect(actionReadModel).toContain('db.rpc("expire_due_action_submissions"');
    expect(actionReadModel).toContain('db.rpc("get_action_pool_snapshot"');
    expect(actionReadModel).not.toMatch(/from\("action_submissions"\)\.update/);
  });

  it("uses safe search paths and service-only execution", () => {
    expect(migration0006).not.toMatch(/(?<!\.)\b(?:digest|hmac|crypt|gen_salt)\s*\(/i);
    for (const signature of [
      "public.expire_due_action_submissions(uuid,integer)",
      "public.get_action_pool_snapshot(uuid)",
      "public.submit_action(uuid,uuid,text,uuid,text)",
      "public.accept_action_submission(uuid,uuid,uuid,uuid,text)",
      "public.reject_action_submission(uuid,uuid,uuid,uuid,text)",
    ]) {
      expect(migration0006).toContain(`revoke all on function ${signature} from public,anon,authenticated;`);
      expect(migration0006).toContain(`grant execute on function ${signature} to service_role;`);
    }
  });
});

describe("Handoff 3 outbox version correction", () => {
  it("advances the authoritative player version for every recorded event", () => {
    expect(migration0007).toContain("set state_version=prs.state_version+1");
    expect(migration0007).toContain("returning prs.state_version into v_version");
    expect(migration0007).toContain("values(p_run,'player',p_player::text,v_version,p_type,p_payload)");
  });

  it("keeps the replacement service-only with a fixed search path", () => {
    expect(migration0007).toContain("security definer set search_path=public,pg_temp");
    expect(migration0007).toContain("revoke all on function public.core_record_event(uuid,uuid,text,jsonb) from public,anon,authenticated;");
    expect(migration0007).toContain("grant execute on function public.core_record_event(uuid,uuid,text,jsonb) to service_role;");
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
