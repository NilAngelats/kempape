begin;

create extension if not exists pgcrypto;

create type public.player_status as enum ('active', 'disabled');
create type public.session_role as enum ('player', 'admin');
create type public.item_rarity as enum ('common', 'rare', 'epic', 'legendary');
create type public.equipment_slot as enum ('helmet', 'armor', 'legs', 'boots');
create type public.action_submission_status as enum ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
create type public.chest_type as enum ('small', 'medium', 'big');
create type public.chest_payment_type as enum ('coins', 'free_credit');
create type public.spin_source as enum ('daily', 'fortune_ticket');

create table public.festivals (
  id text primary key,
  name text not null,
  time_zone text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  base_image_key text not null,
  face_image_key text not null,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null references public.festivals(id),
  display_name text not null,
  character_id uuid references public.characters(id),
  status public.player_status not null default 'active',
  role public.session_role not null default 'player',
  total_xp bigint not null default 0 check (total_xp >= 0),
  current_level integer not null default 1 check (current_level between 1 and 40),
  current_hp integer not null default 100 check (current_hp >= 0),
  coins integer not null default 50 check (coins >= 0),
  deaths integer not null default 0 check (deaths >= 0),
  session_version integer not null default 1,
  claimed_level_rewards integer[] not null default '{}',
  phoenix_last_success_cycle_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (festival_id, display_name)
);

create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  code_hash text not null unique,
  code_last_four text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz
);

create unique index invite_codes_one_active_per_player
on public.invite_codes(player_id)
where is_active;

create table public.player_sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  token_hash text not null unique,
  session_version integer not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table public.action_definitions (
  id text primary key,
  name text not null,
  description text not null default '',
  tier text not null check (tier in ('common','rare','epic','legendary')),
  hp_cost integer not null default 0 check (hp_cost >= 0),
  xp_percentage numeric(6,4) not null check (xp_percentage >= 0),
  coin_reward integer not null check (coin_reward >= 0),
  cooldown_minutes integer check (cooldown_minutes is null or cooldown_minutes >= 0),
  daily_cap integer check (daily_cap is null or daily_cap > 0),
  festival_cap integer check (festival_cap is null or festival_cap > 0),
  requires_unique_person boolean not null default false,
  requires_unique_group boolean not null default false,
  requires_unique_item boolean not null default false,
  is_extreme_challenge boolean not null default false,
  is_enabled boolean not null default true
);

create table public.action_submissions (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null references public.festivals(id),
  action_id text not null references public.action_definitions(id),
  player_id uuid not null references public.players(id),
  status public.action_submission_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  resolved_at timestamptz,
  validator_id uuid references public.players(id),
  idempotency_key text not null,
  unique (player_id, idempotency_key)
);

create unique index one_pending_submission_per_action
on public.action_submissions(player_id, action_id)
where status = 'pending';

create table public.action_usages (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  action_id text not null references public.action_definitions(id),
  festival_cycle_key text not null,
  accepted_at timestamptz not null,
  cooldown_ends_at timestamptz
);

create table public.daily_quest_progress (
  player_id uuid not null references public.players(id),
  festival_cycle_key text not null,
  accepted_actions integer not null default 0 check (accepted_actions >= 0),
  successful_validations integer not null default 0 check (successful_validations >= 0),
  distinct_action_ids text[] not null default '{}',
  completed_quest_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (player_id, festival_cycle_key)
);

create table public.consumable_definitions (
  id text primary key,
  name text not null,
  rarity public.item_rarity not null,
  description text not null default '',
  max_quantity integer not null default 10 check (max_quantity > 0),
  usable_from_inventory boolean not null default true,
  image_key text not null
);

create table public.chaos_card_definitions (
  id text primary key,
  name text not null,
  rarity public.item_rarity not null,
  description text not null default '',
  base_damage integer not null check (base_damage > 0),
  max_quantity integer not null default 10 check (max_quantity > 0),
  self_damage_divisor integer,
  image_key text not null
);

create table public.equipment_definitions (
  id text primary key,
  name text not null,
  rarity public.item_rarity not null,
  slot public.equipment_slot not null,
  set_key text not null,
  description text not null default '',
  global_copy_limit integer,
  image_key text not null,
  check (global_copy_limit is null or global_copy_limit > 0)
);

create table public.player_consumables (
  player_id uuid not null references public.players(id),
  consumable_id text not null references public.consumable_definitions(id),
  quantity integer not null default 0 check (quantity between 0 and 10),
  primary key (player_id, consumable_id)
);

create table public.player_chaos_cards (
  player_id uuid not null references public.players(id),
  chaos_card_id text not null references public.chaos_card_definitions(id),
  quantity integer not null default 0 check (quantity between 0 and 10),
  primary key (player_id, chaos_card_id)
);

create table public.player_equipment (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  equipment_definition_id text not null references public.equipment_definitions(id),
  slot public.equipment_slot not null,
  is_equipped boolean not null default false,
  cooldown_ends_at timestamptz,
  continuous_effect_started_at timestamptz,
  continuous_effect_last_processed_at timestamptz,
  hospital_lock_stay_id uuid,
  acquired_at timestamptz not null default now()
);

create unique index one_equipped_item_per_slot
on public.player_equipment(player_id, slot)
where is_equipped;

create table public.equipment_supply (
  festival_id text not null references public.festivals(id),
  equipment_definition_id text not null references public.equipment_definitions(id),
  claimed_count integer not null default 0 check (claimed_count >= 0),
  primary key (festival_id, equipment_definition_id)
);

create table public.hospital_stays (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  death_at timestamptz not null,
  hospital_until timestamptz not null,
  released_at timestamptz,
  xp_lost bigint not null default 0,
  discharge_pill_used boolean not null default false,
  full_set_bonus_applied boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.player_equipment
  add constraint player_equipment_hospital_lock_fk
  foreign key (hospital_lock_stay_id)
  references public.hospital_stays(id);

create unique index one_active_hospital_stay_per_player
on public.hospital_stays(player_id)
where released_at is null;

create table public.hospital_equipment_activations (
  hospital_stay_id uuid not null references public.hospital_stays(id) on delete cascade,
  player_equipment_id uuid not null references public.player_equipment(id),
  reduction_minutes integer not null check (reduction_minutes > 0),
  activated_at timestamptz not null default now(),
  primary key (hospital_stay_id, player_equipment_id)
);

create table public.free_chest_credits (
  player_id uuid primary key references public.players(id),
  small integer not null default 0 check (small >= 0),
  medium integer not null default 0 check (medium >= 0),
  big integer not null default 0 check (big >= 0)
);

create table public.chest_openings (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  chest_type public.chest_type not null,
  payment_type public.chest_payment_type not null,
  reference_price integer not null,
  price_paid integer not null,
  chest_set_chance numeric(5,4) not null default 0,
  chest_set_triggered boolean not null default false,
  rewards jsonb not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  reveal_completed_at timestamptz,
  unique (player_id, idempotency_key)
);

create table public.player_wheel_state (
  player_id uuid primary key references public.players(id),
  last_daily_spin_cycle_key text,
  pending_fortune_spins integer not null default 0 check (pending_fortune_spins >= 0)
);

create table public.wheel_spins (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id),
  festival_cycle_key text not null,
  source public.spin_source not null,
  slice_id text not null,
  result jsonb not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  reveal_completed_at timestamptz,
  unique (player_id, idempotency_key)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null references public.festivals(id),
  player_id uuid references public.players(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.idempotency_records (
  player_id uuid not null references public.players(id),
  command_name text not null,
  idempotency_key text not null,
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (player_id, command_name, idempotency_key)
);

create index action_submissions_pool_idx
  on public.action_submissions(status, expires_at);

create index action_usages_player_action_idx
  on public.action_usages(player_id, action_id, accepted_at desc);

create index activity_events_festival_created_idx
  on public.activity_events(festival_id, created_at desc);

commit;
