create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, is_read, created_at desc);

create or replace function public.create_notification(p_user_id uuid, p_type text, p_title text, p_body text default null, p_link text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    return null;
  end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link)
  returning id into v_id;
  return v_id;
end;
$$;

-- Every important action gets a WHO/WHAT/WHEN/BEFORE/AFTER row.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_departments after insert or update or delete on public.departments
  for each row execute function public.audit_log_trigger();
create trigger audit_forms after insert or update or delete on public.forms
  for each row execute function public.audit_log_trigger();
create trigger audit_form_submissions after insert or update or delete on public.form_submissions
  for each row execute function public.audit_log_trigger();
create trigger audit_profiles after update on public.profiles
  for each row execute function public.audit_log_trigger();
create trigger audit_staff_confidential after insert or update or delete on public.staff_confidential
  for each row execute function public.audit_log_trigger();
create trigger audit_department_members after insert or delete on public.department_members
  for each row execute function public.audit_log_trigger();
create trigger audit_user_global_roles after insert or delete on public.user_global_roles
  for each row execute function public.audit_log_trigger();
