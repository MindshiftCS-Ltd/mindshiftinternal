-- Workflow Builder engine: WHEN a form is submitted, THEN route it through an
-- ordered chain of approval steps. Steps are data, so "send leave requests to
-- the reporting manager, then HR" is configured, not coded.

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms (id) on delete cascade,
  department_id uuid references public.departments (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  step_order integer not null,
  name text not null,
  approver_type public.approver_type not null,
  approver_role_id uuid references public.roles (id) on delete restrict,
  approver_user_id uuid references public.profiles (id) on delete restrict,
  notify_on_complete boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workflow_id, step_order)
);

-- One row per step per submission: the actual, resolved instance of a
-- workflow step being worked through a given record.
create table public.submission_approvals (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.form_submissions (id) on delete cascade,
  workflow_step_id uuid not null references public.workflow_steps (id) on delete restrict,
  step_order integer not null,
  approver_id uuid references public.profiles (id) on delete set null,
  status public.approval_status not null default 'pending',
  comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index workflows_form_id_idx on public.workflows (form_id);
create index workflow_steps_workflow_id_idx on public.workflow_steps (workflow_id, step_order);
create index submission_approvals_submission_id_idx on public.submission_approvals (submission_id);
create index submission_approvals_approver_id_idx on public.submission_approvals (approver_id, status);

create trigger set_updated_at before update on public.workflows
  for each row execute function public.set_updated_at();

-- Resolve the approver for a step at the moment a submission enters it:
-- a role resolves to the department's holder of that role, "department_head"
-- to the submission's department head, "reporting_manager" to the
-- submitter's manager, and "specific_user" is already fixed on the step.
create or replace function public.resolve_step_approver(p_submission_id uuid, p_step_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_step public.workflow_steps%rowtype;
  v_submission public.form_submissions%rowtype;
  v_approver uuid;
begin
  select * into v_step from public.workflow_steps where id = p_step_id;
  select * into v_submission from public.form_submissions where id = p_submission_id;

  if v_step.approver_type = 'specific_user' then
    v_approver := v_step.approver_user_id;
  elsif v_step.approver_type = 'department_head' then
    select head_id into v_approver from public.departments where id = v_submission.department_id;
  elsif v_step.approver_type = 'reporting_manager' then
    select reporting_manager_id into v_approver from public.profiles where id = v_submission.submitted_by;
  elsif v_step.approver_type = 'role' then
    select dm.user_id into v_approver
    from public.department_members dm
    where dm.department_id = v_submission.department_id
      and dm.role_id = v_step.approver_role_id
    limit 1;
  end if;

  return v_approver;
end;
$$;

-- Instantiate the approval chain for a submission the moment it is submitted.
create or replace function public.start_submission_workflow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workflow_id uuid;
  v_step record;
begin
  if new.status = 'submitted' and (old.status is distinct from 'submitted') then
    select id into v_workflow_id
    from public.workflows
    where form_id = new.form_id and is_active = true
    order by created_at
    limit 1;

    if v_workflow_id is not null then
      for v_step in
        select * from public.workflow_steps where workflow_id = v_workflow_id order by step_order
      loop
        insert into public.submission_approvals (submission_id, workflow_step_id, step_order, approver_id, status)
        values (
          new.id,
          v_step.id,
          v_step.step_order,
          public.resolve_step_approver(new.id, v_step.id),
          case when v_step.step_order = 1 then 'pending' else 'pending' end
        );
      end loop;
      new.status := 'in_review';
      new.current_step_order := 1;
    end if;
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

create trigger start_workflow_on_submit before update on public.form_submissions
  for each row execute function public.start_submission_workflow();
