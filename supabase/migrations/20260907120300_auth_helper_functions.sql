-- Security-definer helpers used inside RLS policies. Defined as functions
-- (rather than inlined subqueries) so policies stay simple and never recurse
-- into the tables they protect.

create or replace function public.has_global_role(p_role_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.user_global_roles ugr
    join public.roles r on r.id = ugr.role_id
    where ugr.user_id = auth.uid()
      and r.slug = p_role_slug
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_global_role('super_admin');
$$;

create or replace function public.is_flm()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.has_global_role('super_admin') or public.has_global_role('flm');
$$;

create or replace function public.has_department_role(p_department_id uuid, p_role_slug text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.department_members dm
    join public.roles r on r.id = dm.role_id
    where dm.user_id = auth.uid()
      and dm.department_id = p_department_id
      and r.slug = p_role_slug
  );
$$;

create or replace function public.is_department_member(p_department_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_flm() or exists (
    select 1
    from public.department_members dm
    where dm.user_id = auth.uid()
      and dm.department_id = p_department_id
  );
$$;

create or replace function public.is_department_head(p_department_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_flm()
    or public.has_department_role(p_department_id, 'department_head')
    or exists (
      select 1 from public.departments d
      where d.id = p_department_id and d.head_id = auth.uid()
    );
$$;

create or replace function public.is_hr_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1
    from public.department_members dm
    join public.roles r on r.id = dm.role_id
    where dm.user_id = auth.uid() and r.slug = 'hr_admin'
  );
$$;

create or replace function public.my_department_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select department_id from public.department_members where user_id = auth.uid();
$$;
