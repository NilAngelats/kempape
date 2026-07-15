begin;

create table public.level_xp_thresholds (
  level integer primary key check (level between 1 and 40),
  total_xp integer not null unique check (total_xp between 0 and 40130)
);
insert into public.level_xp_thresholds(level,total_xp) values
(1,0),(2,100),(3,210),(4,330),(5,460),(6,610),(7,770),(8,950),(9,1140),(10,1350),
(11,1590),(12,1850),(13,2140),(14,2450),(15,2800),(16,3180),(17,3600),(18,4060),(19,4570),(20,5130),
(21,5740),(22,6410),(23,7150),(24,7960),(25,8860),(26,9840),(27,10920),(28,12110),(29,13420),(30,14860),
(31,16450),(32,18190),(33,20110),(34,22220),(35,24540),(36,27090),(37,29900),(38,32990),(39,36390),(40,40130);

alter table public.player_run_states
  add constraint player_run_states_hp_bound check (current_hp <= 100 + ((current_level - 1) * 5));

create table public.claimed_level_rewards (
  game_run_id uuid not null,
  player_id uuid not null,
  level integer not null check (level between 2 and 40),
  coins_granted integer not null check (coins_granted in (5,15)),
  small_credits_granted integer not null default 0 check (small_credits_granted >= 0),
  medium_credits_granted integer not null default 0 check (medium_credits_granted >= 0),
  big_credits_granted integer not null default 0 check (big_credits_granted >= 0),
  claimed_at timestamptz not null default clock_timestamp(),
  primary key(game_run_id,player_id,level),
  foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id)
);

create table public.player_free_chest_credits (
  game_run_id uuid not null,
  player_id uuid not null,
  small integer not null default 0 check (small >= 0),
  medium integer not null default 0 check (medium >= 0),
  big integer not null default 0 check (big >= 0),
  updated_at timestamptz not null default clock_timestamp(),
  primary key(game_run_id,player_id),
  foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id)
);

create table public.xp_ledger_entries (
  id uuid primary key default gen_random_uuid(), game_run_id uuid not null, player_id uuid not null,
  amount integer not null check(amount <> 0), resulting_total_xp integer not null check(resulting_total_xp between 0 and 40130),
  source_type text not null check(length(btrim(source_type)) > 0), source_id text,
  idempotency_key uuid not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default clock_timestamp(),
  foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id),
  unique(game_run_id,player_id,idempotency_key)
);
create table public.coin_ledger_entries (
  id uuid primary key default gen_random_uuid(), game_run_id uuid not null, player_id uuid not null,
  amount integer not null check(amount <> 0), resulting_balance integer not null check(resulting_balance >= 0),
  source_type text not null check(length(btrim(source_type)) > 0), source_id text,
  idempotency_key uuid not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default clock_timestamp(),
  foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id),
  unique(game_run_id,player_id,idempotency_key,source_type,source_id)
);
create table public.midnight_heal_applications (
  game_run_id uuid not null, player_id uuid not null, festival_day_key text not null check(festival_day_key in ('cycle-2','cycle-3','cycle-4','final-midnight')),
  hp_restored integer not null check(hp_restored >= 0), applied_at timestamptz not null default clock_timestamp(),
  primary key(game_run_id,player_id,festival_day_key), foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id)
);
create table public.player_activity_events (
  id uuid primary key default gen_random_uuid(), game_run_id uuid not null, player_id uuid not null,
  event_type text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default clock_timestamp(),
  foreign key(game_run_id,player_id) references public.player_run_states(game_run_id,player_id)
);
create index xp_ledger_player_time_idx on public.xp_ledger_entries(game_run_id,player_id,created_at desc);
create index coin_ledger_player_time_idx on public.coin_ledger_entries(game_run_id,player_id,created_at desc);
create index player_activity_player_time_idx on public.player_activity_events(game_run_id,player_id,created_at desc);

create function public.core_initialize_player_state() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.player_free_chest_credits(game_run_id,player_id) values(new.game_run_id,new.player_id);
 insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key)
 values(new.game_run_id,new.player_id,new.coins,new.coins,'starting_balance','initial',gen_random_uuid());
 return new;
end $$;
create trigger player_run_state_initialize after insert on public.player_run_states for each row execute function public.core_initialize_player_state();

insert into public.player_free_chest_credits(game_run_id,player_id) select game_run_id,player_id from public.player_run_states on conflict do nothing;
insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key)
select game_run_id,player_id,coins,coins,'starting_balance','migration_backfill',gen_random_uuid() from public.player_run_states where coins>0;

do $$ declare n text; begin foreach n in array array['level_xp_thresholds','claimed_level_rewards','player_free_chest_credits','xp_ledger_entries','coin_ledger_entries','midnight_heal_applications','player_activity_events'] loop
 execute format('alter table public.%I enable row level security',n); execute format('alter table public.%I force row level security',n); execute format('revoke all on table public.%I from public,anon,authenticated',n); end loop; end $$;

create function public.core_level_for_xp(p_total_xp integer) returns integer language sql stable security definer set search_path=public,pg_temp as $$
 select max(level) from public.level_xp_thresholds where total_xp <= greatest(0,least(40130,p_total_xp));
$$;

create function public.core_validate_player_state() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.current_level<>public.core_level_for_xp(new.total_xp) then raise exception 'LEVEL_XP_MISMATCH'; end if;
 if new.current_hp>100+((new.current_level-1)*5) then raise exception 'HP_EXCEEDS_MAX'; end if;
 return new;
end $$;
create trigger player_run_state_validate before insert or update of total_xp,current_level,current_hp on public.player_run_states for each row execute function public.core_validate_player_state();

create function public.core_record_event(p_run uuid,p_player uuid,p_type text,p_payload jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_version bigint; begin
 insert into public.player_activity_events(game_run_id,player_id,event_type,payload) values(p_run,p_player,p_type,p_payload);
 select state_version into v_version from public.player_run_states where game_run_id=p_run and player_id=p_player;
 insert into public.outbox_events(game_run_id,aggregate_type,aggregate_id,aggregate_version,event_type,payload)
 values(p_run,'player',p_player::text,v_version,p_type,p_payload);
end $$;

create function public.core_change_coins(p_actor uuid,p_run uuid,p_player uuid,p_amount integer,p_source_type text,p_source_id text,p_idempotency_key uuid,p_request_hash text,p_metadata jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.player_run_states%rowtype; existing public.idempotency_records%rowtype; result jsonb;
begin
 if p_amount is null or p_amount=0 or p_source_type is null or btrim(p_source_type)='' or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players where id=p_actor and role='admin' and status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run where game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_change_coins',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select * into existing from public.idempotency_records where actor_player_id=p_actor and command_name='core_change_coins' and idempotency_key=p_idempotency_key for update;
 if existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if existing.status='completed' then return existing.result; end if;
 select * into s from public.player_run_states where game_run_id=p_run and player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if;
 if s.coins+p_amount<0 then raise exception 'INSUFFICIENT_FUNDS'; end if;
 update public.player_run_states set coins=coins+p_amount,state_version=state_version+1,updated_at=clock_timestamp() where game_run_id=p_run and player_id=p_player returning * into s;
 insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key,metadata) values(p_run,p_player,p_amount,s.coins,p_source_type,p_source_id,p_idempotency_key,p_metadata);
 perform public.core_record_event(p_run,p_player,'player_coins_changed',jsonb_build_object('amount',p_amount,'balance',s.coins,'sourceType',p_source_type));
 result:=jsonb_build_object('amountApplied',p_amount,'balance',s.coins); update public.idempotency_records set status='completed',result=result,completed_at=clock_timestamp() where actor_player_id=p_actor and command_name='core_change_coins' and idempotency_key=p_idempotency_key; return result;
end $$;

create function public.core_heal_player(p_actor uuid,p_run uuid,p_player uuid,p_healing integer,p_full_heal boolean,p_source_type text,p_idempotency_key uuid,p_request_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.player_run_states%rowtype; max_hp integer; restored integer; existing public.idempotency_records%rowtype; result jsonb;
begin
 if p_healing<0 or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players where id=p_actor and role='admin' and status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run where game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_heal_player',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select * into existing from public.idempotency_records where actor_player_id=p_actor and command_name='core_heal_player' and idempotency_key=p_idempotency_key for update;
 if existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if existing.status='completed' then return existing.result; end if;
 select * into s from public.player_run_states where game_run_id=p_run and player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if; if s.gameplay_status='hospitalized' then raise exception 'HOSPITALIZED'; end if;
 max_hp:=100+(s.current_level-1)*5; restored:=case when p_full_heal then max_hp-s.current_hp else least(p_healing,max_hp-s.current_hp) end;
 update public.player_run_states set current_hp=current_hp+restored,state_version=state_version+1,updated_at=clock_timestamp() where game_run_id=p_run and player_id=p_player returning * into s;
 if restored>0 then perform public.core_record_event(p_run,p_player,'player_hp_changed',jsonb_build_object('hpRestored',restored,'currentHp',s.current_hp,'maxHp',max_hp,'sourceType',p_source_type)); end if;
 result:=jsonb_build_object('hpRestored',restored,'currentHp',s.current_hp,'maxHp',max_hp); update public.idempotency_records set status='completed',result=result,completed_at=clock_timestamp() where actor_player_id=p_actor and command_name='core_heal_player' and idempotency_key=p_idempotency_key; return result;
end $$;

create function public.core_process_midnight_heals(p_festival_day_key text,p_batch_size integer default 100) returns integer
language plpgsql security definer set search_path=public,pg_temp as $$
declare r record; restored integer; processed integer:=0;
begin
 if p_festival_day_key not in ('cycle-2','cycle-3','cycle-4','final-midnight') or p_batch_size not between 1 and 500 then raise exception 'VALIDATION'; end if;
 if not pg_try_advisory_xact_lock(hashtextextended('kempape-midnight-heal:'||p_festival_day_key,0)) then return 0; end if;
 for r in select s.* from public.active_game_run a join public.player_run_states s on s.game_run_id=a.game_run_id where s.gameplay_status<>'hospitalized' and not exists(select 1 from public.midnight_heal_applications h where h.game_run_id=s.game_run_id and h.player_id=s.player_id and h.festival_day_key=p_festival_day_key) order by s.player_id for update of s skip locked limit p_batch_size loop
  restored:=(100+(r.current_level-1)*5)-r.current_hp; update public.player_run_states set current_hp=current_hp+restored,state_version=state_version+1,updated_at=clock_timestamp() where game_run_id=r.game_run_id and player_id=r.player_id;
  insert into public.midnight_heal_applications(game_run_id,player_id,festival_day_key,hp_restored) values(r.game_run_id,r.player_id,p_festival_day_key,restored);
  perform public.core_record_event(r.game_run_id,r.player_id,'midnight_heal_applied',jsonb_build_object('festivalDayKey',p_festival_day_key,'hpRestored',restored)); processed:=processed+1;
 end loop; return processed;
end $$;

revoke all on function public.core_level_for_xp(integer) from public,anon,authenticated;
revoke all on function public.core_initialize_player_state() from public,anon,authenticated;
revoke all on function public.core_validate_player_state() from public,anon,authenticated;
revoke all on function public.core_record_event(uuid,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.core_change_coins(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.core_heal_player(uuid,uuid,uuid,integer,boolean,text,uuid,text) from public,anon,authenticated;
revoke all on function public.core_process_midnight_heals(text,integer) from public,anon,authenticated;
grant execute on function public.core_level_for_xp(integer),public.core_change_coins(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb),public.core_heal_player(uuid,uuid,uuid,integer,boolean,text,uuid,text),public.core_process_midnight_heals(text,integer) to service_role;

create function public.core_mutate_xp(p_actor uuid,p_run uuid,p_player uuid,p_delta integer,p_source_type text,p_source_id text,p_idempotency_key uuid,p_request_hash text,p_metadata jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.player_run_states%rowtype; old_level integer; new_level integer; new_xp integer; applied integer; lvl integer; reward_coins integer:=0; small_c integer:=0; medium_c integer:=0; big_c integer:=0; claimed integer[]:='{}'; result jsonb; existing public.idempotency_records%rowtype;
begin
 if p_delta is null or p_source_type is null or btrim(p_source_type)='' or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players where id=p_actor and role='admin' and status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run where game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_mutate_xp',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select * into existing from public.idempotency_records where actor_player_id=p_actor and command_name='core_mutate_xp' and idempotency_key=p_idempotency_key for update;
 if existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if existing.status='completed' then return existing.result; end if;
 select * into s from public.player_run_states where game_run_id=p_run and player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if;
 old_level:=public.core_level_for_xp(s.total_xp); new_xp:=greatest(0,least(40130,s.total_xp+p_delta)); applied:=new_xp-s.total_xp; new_level:=public.core_level_for_xp(new_xp);
 if new_level>old_level then
  for lvl in old_level+1..new_level loop
   insert into public.claimed_level_rewards(game_run_id,player_id,level,coins_granted,small_credits_granted,medium_credits_granted,big_credits_granted)
   values(p_run,p_player,lvl,case when lvl%5=0 then 15 else 5 end,case when lvl in(5,25) then 1 when lvl=15 then 2 else 0 end,case when lvl in(10,25,35) then 1 when lvl=30 then 2 else 0 end,case when lvl in(20,35) then 1 when lvl=40 then 2 else 0 end) on conflict do nothing;
   if found then reward_coins:=reward_coins+case when lvl%5=0 then 15 else 5 end; small_c:=small_c+case when lvl in(5,25) then 1 when lvl=15 then 2 else 0 end; medium_c:=medium_c+case when lvl in(10,25,35) then 1 when lvl=30 then 2 else 0 end; big_c:=big_c+case when lvl in(20,35) then 1 when lvl=40 then 2 else 0 end; claimed:=array_append(claimed,lvl); end if;
  end loop;
 end if;
 update public.player_run_states set total_xp=new_xp,current_level=new_level,current_hp=least(100+(new_level-1)*5,s.current_hp+greatest(0,new_level-old_level)*5),coins=coins+reward_coins,state_version=state_version+1,updated_at=clock_timestamp() where game_run_id=p_run and player_id=p_player returning * into s;
 insert into public.player_free_chest_credits(game_run_id,player_id,small,medium,big) values(p_run,p_player,small_c,medium_c,big_c) on conflict(game_run_id,player_id) do update set small=player_free_chest_credits.small+excluded.small,medium=player_free_chest_credits.medium+excluded.medium,big=player_free_chest_credits.big+excluded.big,updated_at=clock_timestamp();
 if applied<>0 then insert into public.xp_ledger_entries(game_run_id,player_id,amount,resulting_total_xp,source_type,source_id,idempotency_key,metadata) values(p_run,p_player,applied,new_xp,p_source_type,p_source_id,p_idempotency_key,p_metadata); perform public.core_record_event(p_run,p_player,'player_xp_changed',jsonb_build_object('previousTotalXp',new_xp-applied,'newTotalXp',new_xp,'xpApplied',applied)); end if;
 if reward_coins<>0 then insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key) values(p_run,p_player,reward_coins,s.coins,'level_reward',array_to_string(claimed,','),p_idempotency_key); perform public.core_record_event(p_run,p_player,'level_reward_granted',jsonb_build_object('levels',claimed,'coins',reward_coins)); end if;
 if new_level<>old_level then perform public.core_record_event(p_run,p_player,'player_level_changed',jsonb_build_object('previousLevel',old_level,'newLevel',new_level)); end if;
 result:=jsonb_build_object('previousTotalXp',new_xp-applied,'newTotalXp',new_xp,'xpApplied',applied,'previousLevel',old_level,'newLevel',new_level,'levelsGained',greatest(0,new_level-old_level),'levelsLost',greatest(0,old_level-new_level),'currentHp',s.current_hp,'maxHp',100+(new_level-1)*5,'newlyClaimedLevelRewards',claimed,'coinsGranted',reward_coins,'freeChestCreditsGranted',jsonb_build_object('small',small_c,'medium',medium_c,'big',big_c),'wasCapped',p_delta>applied);
 update public.idempotency_records set status='completed',result=result,completed_at=clock_timestamp() where actor_player_id=p_actor and command_name='core_mutate_xp' and idempotency_key=p_idempotency_key; return result;
end $$;

revoke all on function public.core_mutate_xp(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.core_mutate_xp(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) to service_role;

commit;
