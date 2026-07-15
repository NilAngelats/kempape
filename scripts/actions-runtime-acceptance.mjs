import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";

const ACK = "--acknowledge-development-run-mutation";
const PAUSE_ACK = "--acknowledge-temporary-global-pause";
if (process.env.NODE_ENV === "production") throw new Error("Refusing production.");
if (!process.argv.includes(ACK)) throw new Error(`Pass ${ACK} after reviewing the target.`);
const linked = !/localhost|127\.0\.0\.1/.test(process.env.SUPABASE_URL ?? "");
if (linked && process.env.ALLOW_LINKED_ACTION_RUNTIME_TEST !== "true") throw new Error("Linked development acceptance requires ALLOW_LINKED_ACTION_RUNTIME_TEST=true for this invocation.");
if (!process.argv.includes(PAUSE_ACK)) throw new Error(`The pause matrix briefly pauses the active development run. Pass ${PAUSE_ACK} after review.`);
for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!process.env[name]) throw new Error(`Missing ${name}`);

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().slice(0, 8), fixtures = [];
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const pass = label => process.stdout.write(`PASS: ${label}\n`);
const check = (condition, label) => { if (!condition) throw new Error(`FAIL: ${label}`); pass(label); };
const must = async promise => { const result = await promise; if (result.error) throw result.error; return result.data; };
const expectError = async (promise, token, label) => { const result = await promise; check(Boolean(result.error) && result.error.message.includes(token), label); return result.error; };
const count = async query => (await must(query)).length;
const run = await must(db.from("active_game_run").select("game_run_id").eq("singleton", true).single());

async function player(role, admin = false) {
  const safeRole = role.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const key = `${safeRole}_${randomUUID().slice(0, 6)}`, characterId = `runtime_${key}_${suffix}`;
  await must(db.from("characters").insert({ id: characterId, display_name: `Runtime ${role}`, image_key: `unresolved_${characterId}`, is_assignable: false }));
  const row = await must(db.from("players").insert({ display_name: `Runtime ${role} ${key} ${suffix}`, character_id: characterId, role: admin ? "admin" : "player" }).select("id").single());
  fixtures.push({ playerId: row.id, characterId });
  await must(db.from("player_run_states").insert({ game_run_id: run.game_run_id, player_id: row.id }));
  return row.id;
}
const request = (command, id) => ({ command, submissionId: id, nonce: randomUUID() });
async function submit(owner, actionId = "find_someone_you_know") {
  const body = { command: "submit", actionId, nonce: randomUUID() };
  return must(db.rpc("submit_action", { p_actor: owner, p_run: run.game_run_id, p_action: actionId, p_idempotency_key: randomUUID(), p_request_hash: hash(body) }));
}
const acceptCall = (actor, submissionId) => { const body = request("accept", submissionId); return db.rpc("accept_action_submission", { p_actor: actor, p_run: run.game_run_id, p_submission: submissionId, p_idempotency_key: randomUUID(), p_request_hash: hash(body) }); };
const rejectCall = (actor, submissionId) => { const body = request("reject", submissionId); return db.rpc("reject_action_submission", { p_actor: actor, p_run: run.game_run_id, p_submission: submissionId, p_idempotency_key: randomUUID(), p_request_hash: hash(body) }); };
const expireCall = () => db.rpc("expire_due_action_submissions", { p_run: run.game_run_id, p_limit: 50 });

async function effectSnapshot(submissionId, owner, validators) {
  const submission = await must(db.from("action_submissions").select("status,action_id").eq("id", submissionId).single());
  const states = await must(db.from("player_run_states").select("player_id,total_xp,coins,current_hp").eq("game_run_id", run.game_run_id).in("player_id", [owner, ...validators]));
  const progress = await must(db.from("daily_quest_progress").select("player_id,accepted_actions,successful_validations").eq("game_run_id", run.game_run_id).in("player_id", [owner, ...validators]));
  const completions = await must(db.from("daily_quest_completions").select("player_id,festival_day_key,quest_id").eq("game_run_id", run.game_run_id).in("player_id", [owner, ...validators]));
  const questXp = await must(db.from("xp_ledger_entries").select("player_id,source_id").eq("game_run_id", run.game_run_id).eq("source_type", "daily_quest").in("player_id", [owner, ...validators]));
  const questCoins = await must(db.from("coin_ledger_entries").select("player_id,source_id").eq("game_run_id", run.game_run_id).eq("source_type", "daily_quest").in("player_id", [owner, ...validators]));
  return {
    status: submission.status, states, progress,
    xp: await count(db.from("xp_ledger_entries").select("id").eq("game_run_id", run.game_run_id).eq("source_type", "action").eq("source_id", submissionId)),
    coins: await count(db.from("coin_ledger_entries").select("id").eq("game_run_id", run.game_run_id).eq("source_type", "action").eq("source_id", submissionId)),
    usages: await count(db.from("action_usages").select("id").eq("submission_id", submissionId)),
    cooldowns: await count(db.from("action_cooldowns").select("action_id").eq("source_submission_id", submissionId)),
    completions, questXp, questCoins,
    activityAccepted: await count(db.from("player_activity_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_accepted").contains("payload", { submissionId })),
    activityRejected: await count(db.from("player_activity_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_rejected").contains("payload", { submissionId })),
    activityExpired: await count(db.from("player_activity_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_expired").contains("payload", { submissionId })),
    outboxAccepted: await count(db.from("outbox_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_accepted").contains("payload", { submissionId })),
    outboxRejected: await count(db.from("outbox_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_rejected").contains("payload", { submissionId })),
    outboxExpired: await count(db.from("outbox_events").select("id").eq("game_run_id", run.game_run_id).eq("event_type", "action_expired").contains("payload", { submissionId })),
  };
}

async function race(label, left, right, due = false) {
  const owner = await player(`${label}-owner`), validatorA = await player(`${label}-a`), validatorB = await player(`${label}-b`);
  const created = await submit(owner, "smoke_cigarette");
  if (due) await must(db.from("action_submissions").update({ submitted_at: new Date(Date.now() - 7_201_000).toISOString(), expires_at: new Date(Date.now() - 1_000).toISOString() }).eq("id", created.submissionId));
  const before = await effectSnapshot(created.submissionId, owner, [validatorA, validatorB]);
  const results = await Promise.all([left(validatorA, created.submissionId), right(validatorB, created.submissionId)]);
  const after = await effectSnapshot(created.submissionId, owner, [validatorA, validatorB]);
  check(["accepted", "rejected", "expired"].includes(after.status), `${label}: exactly one terminal status is stored`);
  check(after.xp - before.xp <= 1 && after.coins - before.coins <= 1, `${label}: Action XP and coins grant no more than once`);
  check(after.usages - before.usages <= 1 && after.cooldowns - before.cooldowns <= 1, `${label}: usage and cooldown occur no more than once`);
  const ownerBefore = before.progress.find(row => row.player_id === owner)?.accepted_actions ?? 0;
  const ownerAfter = after.progress.find(row => row.player_id === owner)?.accepted_actions ?? 0;
  const validationsBefore = before.progress.filter(row => validatorsHas(row.player_id, validatorA, validatorB)).reduce((n, row) => n + row.successful_validations, 0);
  const validationsAfter = after.progress.filter(row => validatorsHas(row.player_id, validatorA, validatorB)).reduce((n, row) => n + row.successful_validations, 0);
  const accepted = after.status === "accepted" ? 1 : 0;
  check(ownerAfter - ownerBefore === accepted, `${label}: owner Quest progress matches the winning Accept`);
  check(validationsAfter - validationsBefore === accepted, `${label}: validator Quest progress belongs only to the winning Accept`);
  const uniqueCompletions = new Set(after.completions.map(row => `${row.player_id}:${row.festival_day_key}:${row.quest_id}`));
  const uniqueQuestXp = new Set(after.questXp.map(row => `${row.player_id}:${row.source_id}`));
  const uniqueQuestCoins = new Set(after.questCoins.map(row => `${row.player_id}:${row.source_id}`));
  check(uniqueCompletions.size === after.completions.length && uniqueQuestXp.size === after.questXp.length && uniqueQuestCoins.size === after.questCoins.length, `${label}: Quest completions and rewards do not duplicate`);
  const ownerStateBefore = before.states.find(row => row.player_id === owner), ownerStateAfter = after.states.find(row => row.player_id === owner);
  check(ownerStateBefore.current_hp - ownerStateAfter.current_hp === accepted * 6, `${label}: HP cost occurs exactly once only for a winning Accept`);
  const terminalActivity = after.activityAccepted + after.activityRejected + after.activityExpired - before.activityAccepted - before.activityRejected - before.activityExpired;
  const terminalOutbox = after.outboxAccepted + after.outboxRejected + after.outboxExpired - before.outboxAccepted - before.outboxRejected - before.outboxExpired;
  check(terminalActivity === 1 && terminalOutbox === 1, `${label}: one terminal activity and outbox event are written`);
  check(results.some(result => !result.error), `${label}: overlapping PostgreSQL requests produced a winner`);
}
const validatorsHas = (id, a, b) => id === a || id === b;

await race("Accept vs Accept", acceptCall, acceptCall);
await race("Accept vs Reject", acceptCall, rejectCall);
await race("Accept vs Expire", acceptCall, (_actor, _id) => expireCall(), true);
await race("Reject vs Expire", rejectCall, (_actor, _id) => expireCall(), true);

const consecutiveOwner = await player("consecutive-owner"), consecutiveA = await player("consecutive-a"), consecutiveB = await player("consecutive-b");
const c1 = await submit(consecutiveOwner, "find_someone_you_know"); await must(acceptCall(consecutiveA, c1.submissionId));
const c2 = await submit(consecutiveOwner, "talk_to_stranger_20_minutes");
await expectError(acceptCall(consecutiveA, c2.submissionId), "CONSECUTIVE_VALIDATOR", "Validator A is blocked from Owner Action 2");
await must(acceptCall(consecutiveB, c2.submissionId)); pass("Validator B accepts Owner Action 2");
const c3 = await submit(consecutiveOwner, "take_group_photo_other_festival_group"); await must(acceptCall(consecutiveA, c3.submissionId)); pass("Validator A becomes eligible again");

const admin = await player("pause-admin", true), pauseOwner = await player("pause-owner");
const pausedSubmission = await submit(pauseOwner);
await must(db.from("action_submissions").update({ submitted_at: new Date(Date.now() - 5_400_000).toISOString() }).eq("id", pausedSubmission.submissionId));
const prePause = (await must(db.rpc("get_action_pool_snapshot", { p_run: run.game_run_id }))).find(row => row.submission_id === pausedSubmission.submissionId);
let pauseOpened = false;
try {
  await must(db.rpc("pause_game_run", { p_actor_id: admin, p_reason: `Action runtime acceptance ${suffix}` })); pauseOpened = true;
  const frozen1 = (await must(db.rpc("get_action_pool_snapshot", { p_run: run.game_run_id }))).find(row => row.submission_id === pausedSubmission.submissionId);
  await new Promise(resolve => setTimeout(resolve, 1100));
  const frozen2 = (await must(db.rpc("get_action_pool_snapshot", { p_run: run.game_run_id }))).find(row => row.submission_id === pausedSubmission.submissionId);
  check(Math.abs(frozen2.remaining_validation_seconds - frozen1.remaining_validation_seconds) <= 1, "Open durable pause freezes remaining validation time");
  const pausedExpiry = await must(expireCall());
  check(!pausedExpiry.submissionIds.includes(pausedSubmission.submissionId), "Submission does not expire during the pause");
} finally {
  if (pauseOpened) await must(db.rpc("resume_game_run", { p_actor_id: admin }));
}
await new Promise(resolve => setTimeout(resolve, 1100));
const resumed = (await must(db.rpc("get_action_pool_snapshot", { p_run: run.game_run_id }))).find(row => row.submission_id === pausedSubmission.submissionId);
check(resumed.remaining_validation_seconds < prePause.remaining_validation_seconds, "Timer continues after resume from its preserved remainder");
await must(db.from("action_submissions").update({ submitted_at: new Date(Date.now() - 9_000_000).toISOString() }).eq("id", pausedSubmission.submissionId));
const expireOnce = await must(expireCall()), expireTwice = await must(expireCall());
check(expireOnce.submissionIds.includes(pausedSubmission.submissionId) && !expireTwice.submissionIds.includes(pausedSubmission.submissionId), "Submission expires exactly once after two effective hours");

const domainOwner = await player("domain-owner"), domainValidator = await player("domain-validator");
await expectError(db.rpc("submit_action", { p_actor: domainOwner, p_run: run.game_run_id, p_action: "extreme_challenge", p_idempotency_key: randomUUID(), p_request_hash: hash({ unavailable: true }) }), "ACTION_UNAVAILABLE", "Action unavailable domain error");
const pending = await submit(domainOwner, "find_someone_you_know");
await expectError(db.rpc("submit_action", { p_actor: domainOwner, p_run: run.game_run_id, p_action: "find_someone_you_know", p_idempotency_key: randomUUID(), p_request_hash: hash({ pending: true }) }), "ACTION_PENDING", "Action already pending domain error");
await expectError(acceptCall(domainOwner, pending.submissionId), "SELF_VALIDATION", "Self-validation domain error");
await expectError(acceptCall(domainValidator, randomUUID()), "SUBMISSION_NOT_FOUND", "Submission-not-found domain error");
await must(rejectCall(domainValidator, pending.submissionId));
await expectError(acceptCall(domainValidator, pending.submissionId), "SUBMISSION_ALREADY_PROCESSED", "Submission-already-processed domain error");
const expired = await submit(domainOwner, "talk_to_stranger_20_minutes");
await must(db.from("action_submissions").update({ status: "expired", resolved_at: new Date().toISOString() }).eq("id", expired.submissionId));
await expectError(acceptCall(domainValidator, expired.submissionId), "SUBMISSION_EXPIRED", "Submission-expired domain error");
const conflictKey = randomUUID(), conflictBody = { command: "submit", actionId: "cold_shower" };
const conflictArgs = { p_actor: domainOwner, p_run: run.game_run_id, p_action: "cold_shower", p_idempotency_key: conflictKey, p_request_hash: hash(conflictBody) };
await must(db.rpc("submit_action", conflictArgs));
await expectError(db.rpc("submit_action", { ...conflictArgs, p_request_hash: hash({ ...conflictBody, changed: true }) }), "IDEMPOTENCY_CONFLICT", "Idempotency-conflict domain error");

const hospitalOwner = await player("hospital-owner"); await must(db.from("player_run_states").update({ gameplay_status: "hospitalized" }).eq("game_run_id", run.game_run_id).eq("player_id", hospitalOwner));
await expectError(db.rpc("submit_action", { p_actor: hospitalOwner, p_run: run.game_run_id, p_action: "find_someone_you_know", p_idempotency_key: randomUUID(), p_request_hash: hash({ hospital: true }) }), "HOSPITALIZED", "Player-hospitalized domain error");

const limitOwner = await player("pending-limit-owner");
for (const action of ["find_someone_you_know", "talk_to_stranger_20_minutes", "find_catalan_people"]) await submit(limitOwner, action);
await expectError(db.rpc("submit_action", { p_actor: limitOwner, p_run: run.game_run_id, p_action: "make_out_with_someone", p_idempotency_key: randomUUID(), p_request_hash: hash({ limit: true }) }), "PENDING_LIMIT", "Pending-limit domain error");

async function acceptedFixture(owner, actionId, day) {
  const submission = await must(db.from("action_submissions").insert({ game_run_id: run.game_run_id, owner_player_id: owner, action_id: actionId, status: "accepted", submitted_at: new Date(Date.now()-60_000).toISOString(), expires_at: new Date(Date.now()+60_000).toISOString(), resolved_at: new Date().toISOString(), accepted_at: new Date().toISOString(), validator_player_id: domainValidator, created_by_idempotency_key: randomUUID() }).select("id").single());
  await must(db.from("action_usages").insert({ game_run_id: run.game_run_id, player_id: owner, action_id: actionId, submission_id: submission.id, accepted_at: new Date().toISOString(), festival_day_key: day }));
  return submission.id;
}
const day = await must(db.rpc("action_day_key", { p_at: new Date().toISOString() }));
const cooldownOwner = await player("cooldown-owner"), cooldownSource = await acceptedFixture(cooldownOwner, "push_ups_20", day);
await must(db.from("action_cooldowns").insert({ game_run_id: run.game_run_id, player_id: cooldownOwner, action_id: "push_ups_20", cooldown_ends_at: new Date(Date.now()+3_600_000).toISOString(), source_submission_id: cooldownSource }));
await expectError(db.rpc("submit_action", { p_actor: cooldownOwner, p_run: run.game_run_id, p_action: "push_ups_20", p_idempotency_key: randomUUID(), p_request_hash: hash({ cooldown: true }) }), "COOLDOWN", "Cooldown-active domain error");
const dailyOwner = await player("daily-cap-owner"); for(let i=0;i<2;i++) await acceptedFixture(dailyOwner,"cold_shower",day);
await expectError(db.rpc("submit_action", { p_actor: dailyOwner, p_run: run.game_run_id, p_action: "cold_shower", p_idempotency_key: randomUUID(), p_request_hash: hash({ daily: true }) }), "DAILY_CAP", "Daily-cap domain error");
const festivalOwner = await player("festival-cap-owner"); await acceptedFixture(festivalOwner,"have_sex_with_someone",day);
await expectError(db.rpc("submit_action", { p_actor: festivalOwner, p_run: run.game_run_id, p_action: "have_sex_with_someone", p_idempotency_key: randomUUID(), p_request_hash: hash({ festival: true }) }), "FESTIVAL_CAP", "Festival-cap domain error");

let lifecyclePaused = false;
try {
  await must(db.rpc("pause_game_run", { p_actor_id: admin, p_reason: `Action error acceptance ${suffix}` })); lifecyclePaused = true;
  await expectError(db.rpc("submit_action", { p_actor: domainOwner, p_run: run.game_run_id, p_action: "receive_item_from_another_person", p_idempotency_key: randomUUID(), p_request_hash: hash({ paused: true }) }), "PHASE_BLOCKED", "Lifecycle-blocked domain error");
} finally { if (lifecyclePaused) await must(db.rpc("resume_game_run", { p_actor_id: admin })); }

process.stdout.write(`Runtime acceptance ${suffix} completed with ${fixtures.length} isolated fixture players. No credential material was printed.\n`);
