begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.player_role as enum ('player', 'admin');
create type public.player_account_status as enum ('active', 'disabled');
create type public.game_run_mode as enum ('testing', 'live');
create type public.game_run_phase as enum ('setup', 'testing', 'live', 'paused', 'chaos_resolution', 'ended', 'archived');
create type public.player_gameplay_status as enum ('active', 'chaos_locked', 'hospitalized', 'disabled');
create type public.idempotency_status as enum ('processing', 'completed', 'failed');

create table public.characters (
  id text primary key,
  display_name text not null,
  image_key text not null unique,
  face_image_key text unique,
  is_assignable boolean not null default true,
  created_at timestamptz not null default now(),
  check (id = lower(id) and id ~ '^[a-z0-9_]+$')
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  normalized_display_name text generated always as (lower(btrim(display_name))) stored,
  character_id text not null references public.characters(id),
  role public.player_role not null default 'player',
  status public.player_account_status not null default 'active',
  session_version integer not null default 0 check (session_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_display_name)
);
create index players_role_status_idx on public.players(role, status);

create table public.player_invite_codes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  code_hash text not null unique check (length(code_hash) = 64),
  code_last_four text not null check (code_last_four ~ '^[A-HJ-NP-Z2-9]{4}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  check ((is_active and revoked_at is null) or (not is_active and revoked_at is not null))
);
create unique index player_invite_codes_one_active_idx on public.player_invite_codes(player_id) where is_active;
create index player_invite_codes_active_hash_idx on public.player_invite_codes(code_hash) where is_active;

create table public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  token_hash text not null unique check (length(token_hash) = 64),
  session_version integer not null check (session_version >= 1),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > created_at),
  check (revoked_at is null or revoked_at >= created_at)
);
create index player_sessions_player_expiry_idx on public.player_sessions(player_id, expires_at desc);
create index player_sessions_valid_idx on public.player_sessions(token_hash, expires_at) where revoked_at is null;

create table public.authentication_attempts (
  id bigint generated always as identity primary key,
  scope_hash text not null check (length(scope_hash) = 64),
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);
create index authentication_attempts_scope_time_idx on public.authentication_attempts(scope_hash, attempted_at desc);

create table public.game_runs (
  id uuid primary key default gen_random_uuid(),
  mode public.game_run_mode not null,
  phase public.game_run_phase not null,
  scheduled_starts_at timestamptz not null,
  started_at timestamptz,
  normal_gameplay_ends_at timestamptz not null,
  chaos_resolution_ends_at timestamptz not null,
  created_by_player_id uuid references public.players(id),
  reset_from_game_run_id uuid references public.game_runs(id),
  reset_reason text,
  ended_at timestamptz,
  archived_at timestamptz,
  state_version bigint not null default 1 check (state_version > 0),
  created_at timestamptz not null default now(),
  check (normal_gameplay_ends_at > scheduled_starts_at),
  check (chaos_resolution_ends_at > normal_gameplay_ends_at),
  check (started_at is null or started_at < normal_gameplay_ends_at),
  check (reset_from_game_run_id is null or reset_reason is not null)
);
create index game_runs_phase_idx on public.game_runs(phase, normal_gameplay_ends_at);

create table public.active_game_run (
  singleton boolean primary key default true check (singleton),
  game_run_id uuid not null unique references public.game_runs(id),
  global_version bigint not null default 1 check (global_version > 0),
  updated_at timestamptz not null default now()
);

create table public.game_run_pauses (
  id uuid primary key default gen_random_uuid(),
  game_run_id uuid not null references public.game_runs(id),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  started_by_player_id uuid references public.players(id),
  ended_by_player_id uuid references public.players(id),
  reason text not null check (length(btrim(reason)) > 0),
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  check (ended_at is null or ended_by_player_id is not null)
);
create unique index game_run_pauses_one_open_idx on public.game_run_pauses(game_run_id) where ended_at is null;
create index game_run_pauses_time_idx on public.game_run_pauses(game_run_id, started_at, ended_at);
alter table public.game_run_pauses add constraint game_run_pauses_no_overlap
  exclude using gist (game_run_id with =, tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&);

create table public.player_run_states (
  game_run_id uuid not null references public.game_runs(id),
  player_id uuid not null references public.players(id),
  total_xp integer not null default 0 check (total_xp between 0 and 40130),
  current_level integer not null default 1 check (current_level between 1 and 40),
  current_hp integer not null default 100 check (current_hp >= 0),
  coins integer not null default 50 check (coins >= 0),
  deaths integer not null default 0 check (deaths >= 0),
  gameplay_status public.player_gameplay_status not null default 'active',
  state_version bigint not null default 1 check (state_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_run_id, player_id)
);
create index player_run_states_status_idx on public.player_run_states(game_run_id, gameplay_status);
create index player_run_states_ranking_idx on public.player_run_states(game_run_id, total_xp desc, deaths, player_id);

create table public.idempotency_records (
  actor_player_id uuid not null references public.players(id),
  game_run_id uuid references public.game_runs(id),
  command_name text not null,
  idempotency_key uuid not null,
  request_hash text not null check (length(request_hash) = 64),
  status public.idempotency_status not null default 'processing',
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null,
  primary key (actor_player_id, command_name, idempotency_key),
  check ((status = 'processing' and completed_at is null) or (status <> 'processing' and completed_at is not null))
);
create index idempotency_records_expiry_idx on public.idempotency_records(expires_at);
create unique index idempotency_records_run_scope_idx on public.idempotency_records(game_run_id, actor_player_id, command_name, idempotency_key) where game_run_id is not null;

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_player_id uuid references public.players(id),
  game_run_id uuid references public.game_runs(id),
  event_type text not null,
  target_type text,
  target_id text,
  reason text,
  request_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_events_actor_time_idx on public.admin_audit_events(actor_player_id, created_at desc);
create index admin_audit_events_run_time_idx on public.admin_audit_events(game_run_id, created_at desc);

create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  game_run_id uuid references public.game_runs(id),
  aggregate_type text not null,
  aggregate_id text not null,
  aggregate_version bigint not null check (aggregate_version > 0),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (aggregate_type, aggregate_id, aggregate_version, event_type)
);
create index outbox_events_unpublished_idx on public.outbox_events(created_at) where published_at is null;

-- Custom sessions do not map to Supabase Auth JWTs. Application tables are
-- therefore deny-by-default for browser roles; only the server service role
-- and explicitly granted SECURITY DEFINER functions may cross this boundary.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'characters','players','player_invite_codes','player_sessions',
    'authentication_attempts','game_runs','active_game_run','game_run_pauses',
    'player_run_states','idempotency_records','admin_audit_events','outbox_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', table_name);
  end loop;
end $$;
revoke all on sequence public.authentication_attempts_id_seq from public, anon, authenticated;

create or replace function public.redeem_invite_code(
  p_code_hash text,
  p_scope_hash text,
  p_session_token_hash text,
  p_session_expires_at timestamptz
) returns table (outcome text, player_id uuid, session_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_player_id uuid;
  v_session_version integer;
  v_invite_id uuid;
  v_session_id uuid;
  v_failures integer;
begin
  if p_code_hash !~ '^[0-9a-f]{64}$' or p_scope_hash !~ '^[0-9a-f]{64}$' or p_session_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'VALIDATION';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_scope_hash, 0));
  select count(*) into v_failures
  from public.authentication_attempts
  where scope_hash = p_scope_hash and not succeeded and attempted_at >= clock_timestamp() - interval '10 minutes';
  if v_failures >= 5 then return query select 'rate_limited'::text, null::uuid, null::uuid; return; end if;

  select p.id, i.id into v_player_id, v_invite_id
  from public.player_invite_codes i join public.players p on p.id = i.player_id
  where i.code_hash = p_code_hash and i.is_active and i.revoked_at is null and p.status = 'active'
  for update of p, i;

  if not found then
    insert into public.authentication_attempts(scope_hash, succeeded) values (p_scope_hash, false);
    return query select 'invalid'::text, null::uuid, null::uuid; return;
  end if;

  update public.players set session_version = session_version + 1, updated_at = clock_timestamp() where id = v_player_id
  returning session_version into v_session_version;
  update public.player_sessions set revoked_at = clock_timestamp() where player_sessions.player_id = v_player_id and revoked_at is null;
  insert into public.player_sessions(player_id, token_hash, session_version, expires_at)
    values (v_player_id, p_session_token_hash, v_session_version, p_session_expires_at) returning id into v_session_id;
  update public.player_invite_codes set last_used_at = clock_timestamp() where id = v_invite_id;
  insert into public.authentication_attempts(scope_hash, succeeded) values (p_scope_hash, true);
  insert into public.admin_audit_events(actor_player_id, event_type, target_type, target_id)
    values (v_player_id, 'invite_login_succeeded', 'player', v_player_id::text);
  return query select 'success'::text, v_player_id, v_session_id;
end $$;

create or replace function public.pause_game_run(p_actor_id uuid, p_reason text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_run public.game_runs%rowtype; v_pause_id uuid;
begin
  if not exists (select 1 from public.players where id = p_actor_id and role = 'admin' and status = 'active') then raise exception 'FORBIDDEN'; end if;
  select r.* into v_run from public.active_game_run a join public.game_runs r on r.id = a.game_run_id for update of r;
  if v_run.phase <> 'live' then raise exception 'PHASE_BLOCKED'; end if;
  insert into public.game_run_pauses(game_run_id, started_by_player_id, reason) values (v_run.id, p_actor_id, p_reason) returning id into v_pause_id;
  update public.game_runs set phase = 'paused', state_version = state_version + 1 where id = v_run.id;
  return v_pause_id;
end $$;

create or replace function public.resume_game_run(p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_run public.game_runs%rowtype; v_pause_id uuid;
begin
  if not exists (select 1 from public.players where id = p_actor_id and role = 'admin' and status = 'active') then raise exception 'FORBIDDEN'; end if;
  select r.* into v_run from public.active_game_run a join public.game_runs r on r.id = a.game_run_id for update of r;
  if v_run.phase <> 'paused' then raise exception 'PHASE_BLOCKED'; end if;
  update public.game_run_pauses set ended_at = clock_timestamp(), ended_by_player_id = p_actor_id
    where game_run_id = v_run.id and ended_at is null returning id into v_pause_id;
  if v_pause_id is null then raise exception 'CONFLICT'; end if;
  update public.game_runs set phase = 'live', state_version = state_version + 1 where id = v_run.id;
  return v_pause_id;
end $$;

revoke all on function public.redeem_invite_code(text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.pause_game_run(uuid,text) from public, anon, authenticated;
revoke all on function public.resume_game_run(uuid) from public, anon, authenticated;
grant execute on function public.redeem_invite_code(text,text,text,timestamptz) to service_role;
grant execute on function public.pause_game_run(uuid,text) to service_role;
grant execute on function public.resume_game_run(uuid) to service_role;

commit;
