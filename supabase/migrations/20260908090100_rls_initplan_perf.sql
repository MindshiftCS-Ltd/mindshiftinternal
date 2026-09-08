-- Performance fix flagged by Supabase's advisor (auth_rls_initplan): wrap
-- auth.uid() and the row-independent helper functions in `(select ...)` so
-- Postgres evaluates them once per query (an InitPlan/cached SubPlan)
-- instead of once per row. Purely a rewrite of each USING/WITH CHECK
-- expression -- the access rules themselves are unchanged.

alter policy "profiles_select_scoped" on public.profiles
  using (
    id = (select auth.uid())
    or (select public.is_flm())
    or (select public.is_hr_admin())
    or exists (
      select 1 from public.department_members mine
      join public.department_members theirs on theirs.department_id = mine.department_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = public.profiles.id
    )
  );

alter policy "profiles_update_self_or_hr" on public.profiles
  using (
    id = (select auth.uid()) or (select public.is_hr_admin()) or (select public.is_flm())
  ) with check (
    id = (select auth.uid()) or (select public.is_hr_admin()) or (select public.is_flm())
  );

alter policy "staff_confidential_select" on public.staff_confidential
  using (
    profile_id = (select auth.uid()) or (select public.is_hr_admin()) or (select public.is_super_admin())
  );

alter policy "user_global_roles_select" on public.user_global_roles
  using (user_id = (select auth.uid()) or (select public.is_flm()));

alter policy "form_submissions_select" on public.form_submissions
  using (
    submitted_by = (select auth.uid())
    or (select public.is_flm())
    or (department_id is not null and (select public.is_department_head(department_id)))
    or exists (
      select 1 from public.submission_approvals sa
      where sa.submission_id = id and sa.approver_id = (select auth.uid())
    )
  );

alter policy "form_submissions_insert" on public.form_submissions
  with check (
    submitted_by = (select auth.uid())
    and (department_id is null or (select public.is_department_member(department_id)))
  );

alter policy "form_submissions_update" on public.form_submissions
  using (
    (submitted_by = (select auth.uid()) and status = 'draft')
    or (select public.is_flm())
    or (department_id is not null and (select public.is_department_head(department_id)))
  ) with check (
    (submitted_by = (select auth.uid()))
    or (select public.is_flm())
    or (department_id is not null and (select public.is_department_head(department_id)))
  );

alter policy "form_submissions_delete" on public.form_submissions
  using (
    (submitted_by = (select auth.uid()) and status = 'draft') or (select public.is_flm())
  );

alter policy "submission_approvals_select" on public.submission_approvals
  using (
    approver_id = (select auth.uid())
    or (select public.is_flm())
    or exists (
      select 1 from public.form_submissions s
      where s.id = submission_id
        and (s.submitted_by = (select auth.uid()) or (s.department_id is not null and (select public.is_department_head(s.department_id))))
    )
  );

alter policy "submission_approvals_update" on public.submission_approvals
  using (
    approver_id = (select auth.uid()) or (select public.is_flm())
  ) with check (
    approver_id = (select auth.uid()) or (select public.is_flm())
  );

alter policy "tasks_select" on public.tasks
  using (
    assigned_to = (select auth.uid())
    or assigned_by = (select auth.uid())
    or (select public.is_flm())
    or (department_id is not null and (select public.is_department_head(department_id)))
  );

alter policy "tasks_write" on public.tasks
  using (
    assigned_to = (select auth.uid())
    or assigned_by = (select auth.uid())
    or (select public.is_flm())
    or (department_id is not null and (select public.is_department_head(department_id)))
  ) with check (
    assigned_by = (select auth.uid()) or (select public.is_flm()) or (department_id is not null and (select public.is_department_head(department_id)))
  );

alter policy "documents_select" on public.documents
  using (
    access_level = 'public'
    or owner_id = (select auth.uid())
    or (select public.is_flm())
    or (access_level = 'department' and department_id is not null and (select public.is_department_member(department_id)))
    or (access_level = 'restricted' and department_id is not null and (select public.is_department_head(department_id)))
  );

alter policy "documents_write" on public.documents
  using (
    owner_id = (select auth.uid()) or (select public.is_flm()) or (department_id is not null and (select public.is_department_head(department_id)))
  ) with check (
    owner_id = (select auth.uid()) or (select public.is_flm()) or (department_id is not null and (select public.is_department_head(department_id)))
  );

alter policy "notifications_select_own" on public.notifications
  using (user_id = (select auth.uid()));
alter policy "notifications_update_own" on public.notifications
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "notifications_delete_own" on public.notifications
  using (user_id = (select auth.uid()));
