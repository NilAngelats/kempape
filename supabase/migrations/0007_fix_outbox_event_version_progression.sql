begin;

-- Every committed player event is an authoritative invalidation boundary.
-- Advance the aggregate version while holding the player-state row so repeated
-- events of the same type cannot collide or publish an already-seen version.
create or replace function public.core_record_event(p_run uuid,p_player uuid,p_type text,p_payload jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_version bigint;
begin
  if p_run is null or p_player is null or p_type is null or btrim(p_type)='' or p_payload is null then
    raise exception 'VALIDATION';
  end if;
  update public.player_run_states prs
  set state_version=prs.state_version+1,updated_at=clock_timestamp()
  where prs.game_run_id=p_run and prs.player_id=p_player
  returning prs.state_version into v_version;
  if not found then raise exception 'PLAYER_STATE_NOT_FOUND';end if;
  insert into public.player_activity_events(game_run_id,player_id,event_type,payload)
  values(p_run,p_player,p_type,p_payload);
  insert into public.outbox_events(game_run_id,aggregate_type,aggregate_id,aggregate_version,event_type,payload)
  values(p_run,'player',p_player::text,v_version,p_type,p_payload);
end $$;

revoke all on function public.core_record_event(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.core_record_event(uuid,uuid,text,jsonb) to service_role;

commit;
