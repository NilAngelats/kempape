import { createClient } from "@supabase/supabase-js";

const acknowledgement = "--acknowledge-development-run-mutation";
const state = process.argv.find((value) => value.startsWith("--state="))?.slice(8);
if (process.env.NODE_ENV === "production") throw new Error("Refusing lifecycle test mutation in production.");
if (!process.argv.includes(acknowledgement)) throw new Error(`Explicit acknowledgement required: ${acknowledgement}`);
if (!new Set(["scheduled", "live", "paused", "chaos", "ended", "restore"]).has(state)) throw new Error("Use --state=scheduled|live|paused|chaos|ended|restore");
for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) if (!process.env[name]) throw new Error(`Missing ${name}`);
const url = new URL(process.env.SUPABASE_URL);
const isLocal = new Set(["localhost", "127.0.0.1", "::1"]).has(url.hostname);
if (!isLocal && process.env.ALLOW_LINKED_LIFECYCLE_TEST !== "true") throw new Error("Refusing hosted development mutation. Set ALLOW_LINKED_LIFECYCLE_TEST=true only for an explicitly reviewed linked-development test.");

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const must = (result) => { if (result.error) throw result.error; return result.data; };
const pointer = must(await db.from("active_game_run").select("game_run_id").eq("singleton", true).single());
const currentRun = must(await db.from("game_runs").select("state_version").eq("id",pointer.game_run_id).single());
const now = Date.now();
const iso = (offsetMs) => new Date(now + offsetMs).toISOString();
const canonical = { scheduled_starts_at:"2026-07-16T11:30:00+02:00", normal_gameplay_ends_at:"2026-07-20T03:00:00+02:00", chaos_resolution_ends_at:"2026-07-20T03:15:00+02:00" };
const updates = {
  scheduled:{phase:"live",started_at:null,scheduled_starts_at:iso(60*60_000),normal_gameplay_ends_at:iso(5*60*60_000),chaos_resolution_ends_at:iso(5*60*60_000+15*60_000),ended_at:null},
  live:{phase:"live",started_at:iso(-60_000),scheduled_starts_at:iso(-2*60_000),normal_gameplay_ends_at:iso(4*60*60_000),chaos_resolution_ends_at:iso(4*60*60_000+15*60_000),ended_at:null},
  paused:{phase:"paused",started_at:iso(-60_000),scheduled_starts_at:iso(-2*60_000),normal_gameplay_ends_at:iso(4*60*60_000),chaos_resolution_ends_at:iso(4*60*60_000+15*60_000),ended_at:null},
  chaos:{phase:"chaos_resolution",started_at:iso(-2*60*60_000),scheduled_starts_at:iso(-2*60*60_000),normal_gameplay_ends_at:iso(-60_000),chaos_resolution_ends_at:iso(14*60_000),ended_at:null},
  ended:{phase:"ended",started_at:iso(-3*60*60_000),scheduled_starts_at:iso(-3*60*60_000),normal_gameplay_ends_at:iso(-30*60_000),chaos_resolution_ends_at:iso(-15*60_000),ended_at:iso(-15*60_000)},
  restore:{phase:"live",started_at:null,...canonical,ended_at:null},
};

const openPause = must(await db.from("game_run_pauses").select("id").eq("game_run_id",pointer.game_run_id).is("ended_at",null).maybeSingle());
let admin = null;
if (openPause || state === "paused") admin = must(await db.from("players").select("id").eq("role","admin").eq("status","active").limit(1).maybeSingle());
if (openPause && state !== "paused") {
  if (!admin) throw new Error("An active admin player is required to close the durable development pause.");
  must(await db.from("game_run_pauses").update({ended_at:new Date().toISOString(),ended_by_player_id:admin.id}).eq("id",openPause.id));
}
must(await db.from("game_runs").update({...updates[state],mode:"live",state_version:currentRun.state_version+1}).eq("id",pointer.game_run_id));
if (state === "paused") {
  if (!openPause) must(await db.from("game_run_pauses").insert({game_run_id:pointer.game_run_id,started_by_player_id:admin?.id??null,reason:"Explicit development lifecycle acceptance test"}));
}
process.stdout.write(`Development run ${pointer.game_run_id} set to ${state}. Use --state=restore with the same acknowledgement to restore the canonical schedule.\n`);
