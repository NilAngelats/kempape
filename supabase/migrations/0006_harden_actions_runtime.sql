begin;

-- Preserve the applied Handoff 3 effect pipelines and put hardened command
-- boundaries in front of them. They remain private implementation details.
alter function public.submit_action(uuid,uuid,text,uuid,text) rename to submit_action_v0004;
alter function public.accept_action_submission(uuid,uuid,uuid,uuid,text) rename to accept_action_submission_v0005;

create or replace function public.action_remaining_validation_seconds(
  p_run uuid,
  p_submitted_at timestamptz,
  p_at timestamptz default clock_timestamp()
) returns integer
language sql stable security definer set search_path=public,pg_temp as $$
  select greatest(0, 7200 - floor(extract(epoch from greatest(
    interval '0 seconds',
    p_at - p_submitted_at - coalesce((
      select sum(greatest(
        interval '0 seconds',
        least(coalesce(gp.ended_at,p_at),p_at) - greatest(gp.started_at,p_submitted_at)
      ))
      from public.game_run_pauses gp
      where gp.game_run_id=p_run
        and gp.started_at<p_at
        and coalesce(gp.ended_at,p_at)>p_submitted_at
    ),interval '0 seconds')
  ))))::integer;
$$;

create or replace function public.action_refresh_deadline_projection(p_run uuid,p_player uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_now timestamptz:=clock_timestamp();
begin
  update public.action_submissions s
  set expires_at=v_now+make_interval(secs=>public.action_remaining_validation_seconds(p_run,s.submitted_at,v_now))
  where s.game_run_id=p_run and s.owner_player_id=p_player and s.status='pending';
end $$;

create or replace function public.expire_due_action_submissions(p_run uuid,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_now timestamptz:=clock_timestamp();v_row record;v_ids uuid[]:='{}';
begin
  if p_run is null or p_limit is null or p_limit<1 or p_limit>100 then raise exception 'VALIDATION';end if;
  if not exists(select 1 from public.active_game_run agr where agr.game_run_id=p_run)then raise exception 'STALE_RUN';end if;
  for v_row in
    select s.id,s.owner_player_id
    from public.action_submissions s
    where s.game_run_id=p_run and s.status='pending'
      and public.action_remaining_validation_seconds(p_run,s.submitted_at,v_now)=0
    order by s.submitted_at,s.id
    for update skip locked limit p_limit
  loop
    update public.action_submissions s set status='expired',resolved_at=v_now,expires_at=v_now
    where s.id=v_row.id and s.game_run_id=p_run and s.status='pending';
    if found then
      perform public.core_record_event(p_run,v_row.owner_player_id,'action_expired',jsonb_build_object('submissionId',v_row.id));
      v_ids:=array_append(v_ids,v_row.id);
    end if;
  end loop;
  return jsonb_build_object('processedCount',cardinality(v_ids),'submissionIds',to_jsonb(v_ids),'serverNow',v_now);
end $$;

create or replace function public.get_action_pool_snapshot(p_run uuid)
returns table(submission_id uuid,owner_player_id uuid,action_id text,submitted_at timestamptz,
  remaining_validation_seconds integer,is_expired boolean,server_now timestamptz)
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_now timestamptz:=clock_timestamp();
begin
  if not exists(select 1 from public.active_game_run agr where agr.game_run_id=p_run)then raise exception 'STALE_RUN';end if;
  return query select s.id,s.owner_player_id,s.action_id,s.submitted_at,
    public.action_remaining_validation_seconds(p_run,s.submitted_at,v_now),
    public.action_remaining_validation_seconds(p_run,s.submitted_at,v_now)=0,v_now
  from public.action_submissions s
  where s.game_run_id=p_run and s.status='pending'
  order by s.submitted_at,s.id;
end $$;

create or replace function public.submit_action(p_actor uuid,p_run uuid,p_action text,p_idempotency_key uuid,p_request_hash text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_existing public.idempotency_records%rowtype;v_result jsonb;v_now timestamptz:=clock_timestamp();
begin
  if p_actor is null or p_run is null or p_idempotency_key is null or p_request_hash!~'^[0-9a-f]{64}$' then raise exception 'VALIDATION';end if;
  insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at)
  values(p_actor,p_run,'submit_action',p_idempotency_key,p_request_hash,v_now+interval '24 hours') on conflict do nothing;
  select ir.* into v_existing from public.idempotency_records ir
  where ir.actor_player_id=p_actor and ir.command_name='submit_action' and ir.idempotency_key=p_idempotency_key for update;
  if v_existing.game_run_id is distinct from p_run or v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  if v_existing.status='completed' then return v_existing.result;end if;
  perform public.expire_due_action_submissions(p_run,50);
  perform public.action_refresh_deadline_projection(p_run,p_actor);
  v_result:=public.submit_action_v0004(p_actor,p_run,p_action,p_idempotency_key,p_request_hash);
  return v_result;
end $$;

create or replace function public.accept_action_submission(p_actor uuid,p_run uuid,p_submission uuid,p_idempotency_key uuid,p_request_hash text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_existing public.idempotency_records%rowtype;v_s public.action_submissions%rowtype;v_result jsonb;v_now timestamptz:=clock_timestamp();
begin
  if p_actor is null or p_run is null or p_submission is null or p_idempotency_key is null or p_request_hash!~'^[0-9a-f]{64}$' then raise exception 'VALIDATION';end if;
  insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at)
  values(p_actor,p_run,'accept_action_submission',p_idempotency_key,p_request_hash,v_now+interval '24 hours') on conflict do nothing;
  select ir.* into v_existing from public.idempotency_records ir
  where ir.actor_player_id=p_actor and ir.command_name='accept_action_submission' and ir.idempotency_key=p_idempotency_key for update;
  if v_existing.game_run_id is distinct from p_run or v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  if v_existing.status='completed' then return v_existing.result;end if;
  perform public.action_assert_live(p_run);
  select s.* into v_s from public.action_submissions s where s.id=p_submission and s.game_run_id=p_run for update;
  if not found then raise exception 'SUBMISSION_NOT_FOUND';end if;
  if v_s.status='expired' then raise exception 'SUBMISSION_EXPIRED';end if;
  if v_s.status<>'pending' then raise exception 'SUBMISSION_ALREADY_PROCESSED';end if;
  if v_s.owner_player_id=p_actor then raise exception 'SELF_VALIDATION';end if;
  if public.action_remaining_validation_seconds(p_run,v_s.submitted_at,v_now)=0 then
    update public.action_submissions s set status='expired',resolved_at=v_now,expires_at=v_now where s.id=p_submission and s.status='pending';
    perform public.core_record_event(p_run,v_s.owner_player_id,'action_expired',jsonb_build_object('submissionId',p_submission));
    v_result:=jsonb_build_object('submissionId',p_submission,'status','expired','expiredAt',v_now);
  else
    perform 1 from public.player_run_states prs where prs.game_run_id=p_run and prs.player_id in(v_s.owner_player_id,p_actor) order by prs.player_id for update;
    if (select prs.gameplay_status from public.player_run_states prs where prs.game_run_id=p_run and prs.player_id=p_actor)='hospitalized' then raise exception 'PLAYER_HOSPITALIZED';end if;
    if exists(select 1 from public.player_run_states prs where prs.game_run_id=p_run and prs.player_id in(v_s.owner_player_id,p_actor) and prs.gameplay_status<>'active')then raise exception 'LIFECYCLE_BLOCKED';end if;
    update public.action_submissions s set expires_at=v_now+make_interval(secs=>public.action_remaining_validation_seconds(p_run,v_s.submitted_at,v_now)) where s.id=p_submission;
    v_result:=public.accept_action_submission_v0005(p_actor,p_run,p_submission,p_idempotency_key,p_request_hash);
  end if;
  update public.idempotency_records ir set status='completed',result=v_result,completed_at=clock_timestamp()
  where ir.actor_player_id=p_actor and ir.command_name='accept_action_submission' and ir.idempotency_key=p_idempotency_key;
  return v_result;
end $$;

create or replace function public.reject_action_submission(p_actor uuid,p_run uuid,p_submission uuid,p_idempotency_key uuid,p_request_hash text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_existing public.idempotency_records%rowtype;v_s public.action_submissions%rowtype;v_state public.player_run_states%rowtype;v_result jsonb;v_now timestamptz:=clock_timestamp();
begin
  if p_actor is null or p_run is null or p_submission is null or p_idempotency_key is null or p_request_hash!~'^[0-9a-f]{64}$' then raise exception 'VALIDATION';end if;
  insert into public.idempotency_records(actor_player_id,game_run_id,command_name,idempotency_key,request_hash,expires_at)
  values(p_actor,p_run,'reject_action_submission',p_idempotency_key,p_request_hash,v_now+interval '24 hours') on conflict do nothing;
  select ir.* into v_existing from public.idempotency_records ir
  where ir.actor_player_id=p_actor and ir.command_name='reject_action_submission' and ir.idempotency_key=p_idempotency_key for update;
  if v_existing.game_run_id is distinct from p_run or v_existing.request_hash<>p_request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  if v_existing.status='completed' then return v_existing.result;end if;
  perform public.action_assert_live(p_run);
  select s.* into v_s from public.action_submissions s where s.id=p_submission and s.game_run_id=p_run for update;
  if not found then raise exception 'SUBMISSION_NOT_FOUND';end if;
  if v_s.status='expired' then raise exception 'SUBMISSION_EXPIRED';end if;
  if v_s.status<>'pending' then raise exception 'SUBMISSION_ALREADY_PROCESSED';end if;
  if public.action_remaining_validation_seconds(p_run,v_s.submitted_at,v_now)=0 then
    update public.action_submissions s set status='expired',resolved_at=v_now,expires_at=v_now where s.id=p_submission and s.status='pending';
    perform public.core_record_event(p_run,v_s.owner_player_id,'action_expired',jsonb_build_object('submissionId',p_submission));
    v_result:=jsonb_build_object('submissionId',p_submission,'status','expired','expiredAt',v_now);
  else
    if v_s.owner_player_id=p_actor then raise exception 'SELF_VALIDATION';end if;
    select prs.* into v_state from public.player_run_states prs where prs.game_run_id=p_run and prs.player_id=p_actor for update;
    if not found then raise exception 'FORBIDDEN';end if;
    if v_state.gameplay_status='hospitalized' then raise exception 'PLAYER_HOSPITALIZED';end if;
    if v_state.gameplay_status<>'active' then raise exception 'LIFECYCLE_BLOCKED';end if;
    update public.action_submissions s set status='rejected',validator_player_id=p_actor,rejected_at=v_now,resolved_at=v_now where s.id=p_submission and s.status='pending';
    perform public.core_record_event(p_run,v_s.owner_player_id,'action_rejected',jsonb_build_object('submissionId',p_submission));
    v_result:=jsonb_build_object('submissionId',p_submission,'status','rejected','rejectedAt',v_now);
  end if;
  update public.idempotency_records ir set status='completed',result=v_result,completed_at=clock_timestamp()
  where ir.actor_player_id=p_actor and ir.command_name='reject_action_submission' and ir.idempotency_key=p_idempotency_key;
  return v_result;
end $$;

revoke all on function public.submit_action_v0004(uuid,uuid,text,uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.accept_action_submission_v0005(uuid,uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
revoke all on function public.action_remaining_validation_seconds(uuid,timestamptz,timestamptz) from public,anon,authenticated;
revoke all on function public.action_refresh_deadline_projection(uuid,uuid) from public,anon,authenticated;
revoke all on function public.expire_due_action_submissions(uuid,integer) from public,anon,authenticated;
revoke all on function public.get_action_pool_snapshot(uuid) from public,anon,authenticated;
revoke all on function public.submit_action(uuid,uuid,text,uuid,text) from public,anon,authenticated;
revoke all on function public.accept_action_submission(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.reject_action_submission(uuid,uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.action_remaining_validation_seconds(uuid,timestamptz,timestamptz) to service_role;
grant execute on function public.expire_due_action_submissions(uuid,integer) to service_role;
grant execute on function public.get_action_pool_snapshot(uuid) to service_role;
grant execute on function public.submit_action(uuid,uuid,text,uuid,text) to service_role;
grant execute on function public.accept_action_submission(uuid,uuid,uuid,uuid,text) to service_role;
grant execute on function public.reject_action_submission(uuid,uuid,uuid,uuid,text) to service_role;

commit;
