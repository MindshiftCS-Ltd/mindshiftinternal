-- Form Builder engine. A department admin creates a row in `forms` plus its
-- `form_fields` from the UI -- no application code changes are required to
-- add a new form.

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  status public.form_status not null default 'draft',
  reference_prefix text not null default 'REC',
  requires_approval boolean not null default true,
  version integer not null default 1,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.forms is 'Department-scoped (or organisation-wide, when department_id is null) form definitions.';

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  label text not null,
  field_key text not null,
  field_type public.field_type not null,
  options jsonb not null default '[]'::jsonb,
  placeholder text,
  help_text text,
  is_required boolean not null default false,
  order_index integer not null default 0,
  validation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (form_id, field_key)
);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete restrict,
  department_id uuid references public.departments (id) on delete set null,
  reference_code text not null unique,
  submitted_by uuid not null references public.profiles (id) on delete restrict,
  data jsonb not null default '{}'::jsonb,
  status public.submission_status not null default 'draft',
  current_step_order integer not null default 0,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.form_submissions is 'Every form submission becomes a record/card, tracked through its workflow.';

create index forms_department_id_idx on public.forms (department_id);
create index form_fields_form_id_idx on public.form_fields (form_id, order_index);
create index form_submissions_form_id_idx on public.form_submissions (form_id);
create index form_submissions_department_id_idx on public.form_submissions (department_id);
create index form_submissions_submitted_by_idx on public.form_submissions (submitted_by);
create index form_submissions_status_idx on public.form_submissions (status);

create trigger set_updated_at before update on public.forms
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.form_submissions
  for each row execute function public.set_updated_at();

create or replace function public.set_submission_reference_code()
returns trigger
language plpgsql
as $$
declare
  v_prefix text;
begin
  if new.reference_code is null or new.reference_code = '' then
    select reference_prefix into v_prefix from public.forms where id = new.form_id;
    new.reference_code := public.next_reference_code('form:' || new.form_id::text, v_prefix, 4);
  end if;
  return new;
end;
$$;

create trigger set_reference_code before insert on public.form_submissions
  for each row execute function public.set_submission_reference_code();
