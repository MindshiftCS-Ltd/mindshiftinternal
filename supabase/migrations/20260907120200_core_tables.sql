-- Departments, roles, profiles and membership.
-- Departments are data, not code: creating one is an insert into this table,
-- never a code change.

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text,
  icon text,
  head_id uuid,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.departments is 'Configurable organizational departments. Admins create/edit rows here rather than shipping code.';

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.roles is 'System and custom roles. is_system rows (super_admin, flm, ...) cannot be deleted from the UI.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  staff_number text unique,
  full_name text not null,
  preferred_name text,
  email text not null,
  phone text,
  avatar_url text,
  job_title text,
  status public.staff_status not null default 'probation',
  primary_department_id uuid references public.departments (id) on delete set null,
  reporting_manager_id uuid references public.profiles (id) on delete set null,
  joined_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Non-sensitive staff profile, visible across the organisation subject to RLS.';

alter table public.departments
  add constraint departments_head_id_fkey foreign key (head_id) references public.profiles (id) on delete set null;

-- Sensitive PII kept out of profiles entirely so a broad "read profiles" grant
-- never leaks it.
create table public.staff_confidential (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  nin text,
  bvn text,
  bank_name text,
  bank_account_number text,
  next_of_kin jsonb,
  salary numeric(14, 2),
  contract_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.staff_confidential is 'NIN/BVN/bank/payroll data. Only the owner, HR admins and super admins may read this.';

-- Roles scoped to a department (department_head, department_officer, hr_admin, ...).
create table public.department_members (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (department_id, user_id, role_id)
);

-- Roles that apply organisation-wide (super_admin, flm) and are not tied to
-- any single department.
create table public.user_global_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

-- Numbering conventions (MS-STAFF-0001, LR-0042, LD-0187, ...) are configuration,
-- not hard-coded strings, so a new department/form can define its own prefix.
create table public.sequences (
  key text primary key,
  prefix text not null,
  next_value integer not null default 1,
  padding integer not null default 4
);

create or replace function public.next_reference_code(p_key text, p_prefix text default null, p_padding integer default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value integer;
  v_prefix text;
  v_padding integer;
begin
  insert into public.sequences (key, prefix, padding)
  values (p_key, coalesce(p_prefix, upper(p_key)), coalesce(p_padding, 4))
  on conflict (key) do nothing;

  update public.sequences
  set next_value = next_value + 1
  where key = p_key
  returning next_value - 1, prefix, padding into v_value, v_prefix, v_padding;

  return v_prefix || '-' || lpad(v_value::text, v_padding, '0');
end;
$$;

create trigger set_updated_at before update on public.departments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.staff_confidential
  for each row execute function public.set_updated_at();

create index departments_head_id_idx on public.departments (head_id);
create index profiles_primary_department_id_idx on public.profiles (primary_department_id);
create index profiles_reporting_manager_id_idx on public.profiles (reporting_manager_id);
create index department_members_user_id_idx on public.department_members (user_id);
create index department_members_department_id_idx on public.department_members (department_id);
create index user_global_roles_user_id_idx on public.user_global_roles (user_id);
