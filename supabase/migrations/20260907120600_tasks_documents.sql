create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments (id) on delete set null,
  assigned_to uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  related_submission_id uuid references public.form_submissions (id) on delete set null,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status public.task_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments (id) on delete set null,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  doc_type text not null default 'general',
  storage_path text not null,
  version integer not null default 1,
  access_level public.document_access_level not null default 'department',
  related_type text,
  related_id uuid,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_assigned_to_idx on public.tasks (assigned_to, status);
create index tasks_department_id_idx on public.tasks (department_id);
create index documents_department_id_idx on public.documents (department_id);
create index documents_owner_id_idx on public.documents (owner_id);
create index documents_related_idx on public.documents (related_type, related_id);

create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
