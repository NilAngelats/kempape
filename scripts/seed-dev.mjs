import { createClient } from "@supabase/supabase-js";
import { createHmac, randomBytes } from "node:crypto";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") throw new Error("Refusing to seed production. Set ALLOW_PRODUCTION_SEED=true only after explicit review.");
for (const name of ["SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","INVITE_CODE_HASH_SECRET"]) if (!process.env[name]) throw new Error(`Missing ${name}`);
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode=()=>{let value="";while(value.length<16){for(const byte of randomBytes(24)){if(byte<224)value+=alphabet[byte%alphabet.length];if(value.length===16)break;}}return `KMP${value}`};
const format=(value)=>`KMP-${value.slice(3,7)}-${value.slice(7,11)}-${value.slice(11,15)}-${value.slice(15,19)}`;
const hash=(value)=>createHmac("sha256",process.env.INVITE_CODE_HASH_SECRET).update(value).digest("hex");
const must=(result)=>{if(result.error)throw result.error;return result.data};

await must(await db.from("characters").upsert({id:"dev_character",display_name:"Development Character",image_key:"unresolved_dev_character",face_image_key:null,is_assignable:true},{onConflict:"id"}));
let player=must(await db.from("players").select("id").eq("normalized_display_name","development player").maybeSingle());
if(!player)player=must(await db.from("players").insert({display_name:"Development Player",character_id:"dev_character"}).select("id").single());
const startsAt="2026-07-16T11:30:00+02:00", normalEnd="2026-07-20T03:00:00+02:00", chaosEnd="2026-07-20T03:15:00+02:00";
let run=must(await db.from("game_runs").select("id").eq("mode","live").eq("normal_gameplay_ends_at",normalEnd).maybeSingle());
if(!run)run=must(await db.from("game_runs").insert({mode:"live",phase:"live",scheduled_starts_at:startsAt,started_at:startsAt,normal_gameplay_ends_at:normalEnd,chaos_resolution_ends_at:chaosEnd}).select("id").single());
await must(await db.from("active_game_run").upsert({singleton:true,game_run_id:run.id},{onConflict:"singleton"}));
await must(await db.from("player_run_states").upsert({game_run_id:run.id,player_id:player.id},{onConflict:"game_run_id,player_id"}));
const existing=must(await db.from("player_invite_codes").select("id").eq("player_id",player.id).eq("is_active",true).maybeSingle());
if(existing){process.stdout.write("Development foundation already exists. Existing invite code was not revealed or replaced.\n");}
else{const code=randomCode();await must(await db.from("player_invite_codes").insert({player_id:player.id,code_hash:hash(code),code_last_four:code.slice(-4)}));process.stdout.write(`One-time development invite code: ${format(code)}\nStore it securely; it cannot be recovered.\n`);}
