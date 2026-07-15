begin;

create or replace function public.core_change_coins(p_actor uuid,p_run uuid,p_player uuid,p_amount integer,p_source_type text,p_source_id text,p_idempotency_key uuid,p_request_hash text,p_metadata jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_state public.player_run_states%rowtype; v_existing public.idempotency_records%rowtype; v_result jsonb;
begin
 if p_amount is null or p_amount=0 or p_source_type is null or btrim(p_source_type)='' or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players as p where p.id=p_actor and p.role='admin' and p.status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run as agr where agr.game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_change_coins',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select ir.* into v_existing from public.idempotency_records as ir where ir.actor_player_id=p_actor and ir.command_name='core_change_coins' and ir.idempotency_key=p_idempotency_key for update;
 if v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if v_existing.status='completed' then return v_existing.result; end if;
 select prs.* into v_state from public.player_run_states as prs where prs.game_run_id=p_run and prs.player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if;
 if v_state.coins+p_amount<0 then raise exception 'INSUFFICIENT_FUNDS'; end if;
 update public.player_run_states as prs set coins=prs.coins+p_amount,state_version=prs.state_version+1,updated_at=clock_timestamp() where prs.game_run_id=p_run and prs.player_id=p_player returning prs.* into v_state;
 insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key,metadata) values(p_run,p_player,p_amount,v_state.coins,p_source_type,p_source_id,p_idempotency_key,p_metadata);
 perform public.core_record_event(p_run,p_player,'player_coins_changed',jsonb_build_object('amount',p_amount,'balance',v_state.coins,'sourceType',p_source_type));
 v_result:=jsonb_build_object('amountApplied',p_amount,'balance',v_state.coins);
 update public.idempotency_records as ir set status='completed',result=v_result,completed_at=clock_timestamp() where ir.actor_player_id=p_actor and ir.command_name='core_change_coins' and ir.idempotency_key=p_idempotency_key;
 return v_result;
end $$;

create or replace function public.core_mutate_xp(p_actor uuid,p_run uuid,p_player uuid,p_delta integer,p_source_type text,p_source_id text,p_idempotency_key uuid,p_request_hash text,p_metadata jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_state public.player_run_states%rowtype; v_old_level integer; v_new_level integer; v_new_xp integer; v_applied integer; v_level integer; v_reward_coins integer:=0; v_small_credits integer:=0; v_medium_credits integer:=0; v_big_credits integer:=0; v_claimed integer[]:='{}'; v_result jsonb; v_existing public.idempotency_records%rowtype;
begin
 if p_delta is null or p_source_type is null or btrim(p_source_type)='' or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players as p where p.id=p_actor and p.role='admin' and p.status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run as agr where agr.game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_mutate_xp',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select ir.* into v_existing from public.idempotency_records as ir where ir.actor_player_id=p_actor and ir.command_name='core_mutate_xp' and ir.idempotency_key=p_idempotency_key for update;
 if v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if v_existing.status='completed' then return v_existing.result; end if;
 select prs.* into v_state from public.player_run_states as prs where prs.game_run_id=p_run and prs.player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if;
 v_old_level:=public.core_level_for_xp(v_state.total_xp); v_new_xp:=greatest(0,least(40130,v_state.total_xp+p_delta)); v_applied:=v_new_xp-v_state.total_xp; v_new_level:=public.core_level_for_xp(v_new_xp);
 if v_new_level>v_old_level then
  for v_level in v_old_level+1..v_new_level loop
   insert into public.claimed_level_rewards(game_run_id,player_id,level,coins_granted,small_credits_granted,medium_credits_granted,big_credits_granted)
   values(p_run,p_player,v_level,case when v_level%5=0 then 15 else 5 end,case when v_level in(5,25) then 1 when v_level=15 then 2 else 0 end,case when v_level in(10,25,35) then 1 when v_level=30 then 2 else 0 end,case when v_level in(20,35) then 1 when v_level=40 then 2 else 0 end) on conflict do nothing;
   if found then v_reward_coins:=v_reward_coins+case when v_level%5=0 then 15 else 5 end; v_small_credits:=v_small_credits+case when v_level in(5,25) then 1 when v_level=15 then 2 else 0 end; v_medium_credits:=v_medium_credits+case when v_level in(10,25,35) then 1 when v_level=30 then 2 else 0 end; v_big_credits:=v_big_credits+case when v_level in(20,35) then 1 when v_level=40 then 2 else 0 end; v_claimed:=array_append(v_claimed,v_level); end if;
  end loop;
 end if;
 update public.player_run_states as prs set total_xp=v_new_xp,current_level=v_new_level,current_hp=least(100+(v_new_level-1)*5,v_state.current_hp+greatest(0,v_new_level-v_old_level)*5),coins=prs.coins+v_reward_coins,state_version=prs.state_version+1,updated_at=clock_timestamp() where prs.game_run_id=p_run and prs.player_id=p_player returning prs.* into v_state;
 insert into public.player_free_chest_credits(game_run_id,player_id,small,medium,big) values(p_run,p_player,v_small_credits,v_medium_credits,v_big_credits) on conflict(game_run_id,player_id) do update set small=player_free_chest_credits.small+excluded.small,medium=player_free_chest_credits.medium+excluded.medium,big=player_free_chest_credits.big+excluded.big,updated_at=clock_timestamp();
 if v_applied<>0 then insert into public.xp_ledger_entries(game_run_id,player_id,amount,resulting_total_xp,source_type,source_id,idempotency_key,metadata) values(p_run,p_player,v_applied,v_new_xp,p_source_type,p_source_id,p_idempotency_key,p_metadata); perform public.core_record_event(p_run,p_player,'player_xp_changed',jsonb_build_object('previousTotalXp',v_new_xp-v_applied,'newTotalXp',v_new_xp,'xpApplied',v_applied)); end if;
 if v_reward_coins<>0 then insert into public.coin_ledger_entries(game_run_id,player_id,amount,resulting_balance,source_type,source_id,idempotency_key) values(p_run,p_player,v_reward_coins,v_state.coins,'level_reward',array_to_string(v_claimed,','),p_idempotency_key); perform public.core_record_event(p_run,p_player,'level_reward_granted',jsonb_build_object('levels',v_claimed,'coins',v_reward_coins)); end if;
 if v_new_level<>v_old_level then perform public.core_record_event(p_run,p_player,'player_level_changed',jsonb_build_object('previousLevel',v_old_level,'newLevel',v_new_level)); end if;
 v_result:=jsonb_build_object('previousTotalXp',v_new_xp-v_applied,'newTotalXp',v_new_xp,'xpApplied',v_applied,'previousLevel',v_old_level,'newLevel',v_new_level,'levelsGained',greatest(0,v_new_level-v_old_level),'levelsLost',greatest(0,v_old_level-v_new_level),'currentHp',v_state.current_hp,'maxHp',100+(v_new_level-1)*5,'newlyClaimedLevelRewards',v_claimed,'coinsGranted',v_reward_coins,'freeChestCreditsGranted',jsonb_build_object('small',v_small_credits,'medium',v_medium_credits,'big',v_big_credits),'wasCapped',p_delta>v_applied);
 update public.idempotency_records as ir set status='completed',result=v_result,completed_at=clock_timestamp() where ir.actor_player_id=p_actor and ir.command_name='core_mutate_xp' and ir.idempotency_key=p_idempotency_key;
 return v_result;
end $$;

create or replace function public.core_heal_player(p_actor uuid,p_run uuid,p_player uuid,p_healing integer,p_full_heal boolean,p_source_type text,p_idempotency_key uuid,p_request_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_state public.player_run_states%rowtype; v_max_hp integer; v_restored integer; v_existing public.idempotency_records%rowtype; v_result jsonb;
begin
 if p_healing<0 or p_request_hash !~ '^[0-9a-f]{64}$' then raise exception 'VALIDATION'; end if;
 if p_actor<>p_player and not exists(select 1 from public.players as p where p.id=p_actor and p.role='admin' and p.status='active') then raise exception 'FORBIDDEN'; end if;
 if not exists(select 1 from public.active_game_run as agr where agr.game_run_id=p_run) then raise exception 'STALE_RUN'; end if;
 insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at) values(p_actor,p_run,'core_heal_player',p_idempotency_key,p_request_hash,clock_timestamp()+interval '24 hours') on conflict do nothing;
 select ir.* into v_existing from public.idempotency_records as ir where ir.actor_player_id=p_actor and ir.command_name='core_heal_player' and ir.idempotency_key=p_idempotency_key for update;
 if v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if; if v_existing.status='completed' then return v_existing.result; end if;
 select prs.* into v_state from public.player_run_states as prs where prs.game_run_id=p_run and prs.player_id=p_player for update; if not found then raise exception 'NOT_FOUND'; end if; if v_state.gameplay_status='hospitalized' then raise exception 'HOSPITALIZED'; end if;
 v_max_hp:=100+(v_state.current_level-1)*5; v_restored:=case when p_full_heal then v_max_hp-v_state.current_hp else least(p_healing,v_max_hp-v_state.current_hp) end;
 update public.player_run_states as prs set current_hp=prs.current_hp+v_restored,state_version=prs.state_version+1,updated_at=clock_timestamp() where prs.game_run_id=p_run and prs.player_id=p_player returning prs.* into v_state;
 if v_restored>0 then perform public.core_record_event(p_run,p_player,'player_hp_changed',jsonb_build_object('hpRestored',v_restored,'currentHp',v_state.current_hp,'maxHp',v_max_hp,'sourceType',p_source_type)); end if;
 v_result:=jsonb_build_object('hpRestored',v_restored,'currentHp',v_state.current_hp,'maxHp',v_max_hp);
 update public.idempotency_records as ir set status='completed',result=v_result,completed_at=clock_timestamp() where ir.actor_player_id=p_actor and ir.command_name='core_heal_player' and ir.idempotency_key=p_idempotency_key;
 return v_result;
end $$;

revoke all on function public.core_change_coins(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) from public,anon,authenticated;
revoke all on function public.core_heal_player(uuid,uuid,uuid,integer,boolean,text,uuid,text) from public,anon,authenticated;
revoke all on function public.core_mutate_xp(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.core_change_coins(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) to service_role;
grant execute on function public.core_heal_player(uuid,uuid,uuid,integer,boolean,text,uuid,text) to service_role;
grant execute on function public.core_mutate_xp(uuid,uuid,uuid,integer,text,text,uuid,text,jsonb) to service_role;

commit;
