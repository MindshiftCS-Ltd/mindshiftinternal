-- Notify the first step's approver as soon as a workflow chain is created.
create or replace function public.notify_on_approval_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  if new.step_order = 1 then
    select reference_code into v_ref from public.form_submissions where id = new.submission_id;
    perform public.create_notification(
      new.approver_id,
      'approval_pending',
      'New request awaiting your review',
      v_ref,
      '/records/' || new.submission_id::text
    );
  end if;
  return new;
end;
$$;

create trigger notify_on_approval_created after insert on public.submission_approvals
  for each row execute function public.notify_on_approval_created();

-- When a step is decided: advance to the next step, or close out the
-- submission and notify the original submitter either way.
create or replace function public.advance_submission_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission public.form_submissions%rowtype;
  v_next public.submission_approvals%rowtype;
begin
  if new.status = old.status or new.status = 'pending' then
    return new;
  end if;

  select * into v_submission from public.form_submissions where id = new.submission_id;

  if new.status = 'rejected' then
    update public.form_submissions set status = 'rejected' where id = new.submission_id;
    perform public.create_notification(
      v_submission.submitted_by,
      'submission_rejected',
      'Your request was rejected',
      v_submission.reference_code,
      '/records/' || v_submission.id::text
    );
    return new;
  end if;

  select * into v_next
  from public.submission_approvals
  where submission_id = new.submission_id and step_order = new.step_order + 1;

  if found then
    update public.form_submissions set current_step_order = v_next.step_order where id = new.submission_id;
    perform public.create_notification(
      v_next.approver_id,
      'approval_pending',
      'New request awaiting your review',
      v_submission.reference_code,
      '/records/' || v_submission.id::text
    );
  else
    update public.form_submissions set status = 'approved' where id = new.submission_id;
    perform public.create_notification(
      v_submission.submitted_by,
      'submission_approved',
      'Your request was approved',
      v_submission.reference_code,
      '/records/' || v_submission.id::text
    );
  end if;

  return new;
end;
$$;

create trigger advance_workflow_on_decision after update on public.submission_approvals
  for each row execute function public.advance_submission_workflow();

-- Every new Supabase Auth user gets a corresponding profile row.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_auth_user();
