-- Row Level Security. Nothing here is "everyone can see everything" --
-- every table is locked down by default and opened only per the security
-- model (staff see their own data + what their department role grants;
-- HR/Finance/FLM/super_admin get progressively wider scopes).

alter table public.departments enable row level security;
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.staff_confidential enable row level security;
alter table public.department_members enable row level security;
alter table public.user_global_roles enable row level security;
alter table public.sequences enable row level security;
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_submissions enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.submission_approvals enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- departments: an org directory everyone can browse; only Admin/FLM manage it.
create policy "departments_select_all" on public.departments
  for select to authenticated using (true);
create policy "departments_write_admin" on public.departments
  for all to authenticated using (public.is_flm()) with check (public.is_flm());

-- roles: readable so UIs can render pickers; only super_admin edits the catalogue.
create policy "roles_select_all" on public.roles
  for select to authenticated using (true);
create policy "roles_write_super_admin" on public.roles
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- profiles: self, teammates in a shared department, HR and FLM/super_admin.
create policy "profiles_select_scoped" on public.profiles
  for select to authenticated using (
    id = auth.uid()
    or public.is_flm()
    or public.is_hr_admin()
    or exists (
      select 1 from public.department_members mine
      join public.department_members theirs on theirs.department_id = mine.department_id
      where mine.user_id = auth.uid() and theirs.user_id = public.profiles.id
    )
  );
create policy "profiles_update_self_or_hr" on public.profiles
  for update to authenticated using (
    id = auth.uid() or public.is_hr_admin() or public.is_flm()
  ) with check (
    id = auth.uid() or public.is_hr_admin() or public.is_flm()
  );
create policy "profiles_insert_hr" on public.profiles
  for insert to authenticated with check (public.is_hr_admin() or public.is_flm());

-- staff_confidential: NIN/BVN/bank/payroll -- owner, HR and super_admin only.
create policy "staff_confidential_select" on public.staff_confidential
  for select to authenticated using (
    profile_id = auth.uid() or public.is_hr_admin() or public.is_super_admin()
  );
create policy "staff_confidential_write" on public.staff_confidential
  for all to authenticated using (
    public.is_hr_admin() or public.is_super_admin()
  ) with check (
    public.is_hr_admin() or public.is_super_admin()
  );

-- department_members: department peers + HR/FLM can view; department heads,
-- HR and FLM/super_admin manage membership.
create policy "department_members_select" on public.department_members
  for select to authenticated using (
    public.is_department_member(department_id) or public.is_hr_admin()
  );
create policy "department_members_write" on public.department_members
  for all to authenticated using (
    public.is_department_head(department_id) or public.is_hr_admin() or public.is_flm()
  ) with check (
    public.is_department_head(department_id) or public.is_hr_admin() or public.is_flm()
  );

-- user_global_roles (super_admin, flm): visible to the holder and admins;
-- only super_admin grants them.
create policy "user_global_roles_select" on public.user_global_roles
  for select to authenticated using (user_id = auth.uid() or public.is_flm());
create policy "user_global_roles_write" on public.user_global_roles
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- sequences are an internal implementation detail behind next_reference_code();
-- no direct client access.
create policy "sequences_admin_only" on public.sequences
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- forms: published, department-scoped forms are visible to that department
-- (or everyone, for organisation-wide forms); drafts stay visible to the
-- department's admins; department heads/HR/FLM manage the definitions.
create policy "forms_select" on public.forms
  for select to authenticated using (
    (status = 'published' and (department_id is null or public.is_department_member(department_id)))
    or (department_id is not null and public.is_department_head(department_id))
    or public.is_flm()
  );
create policy "forms_write" on public.forms
  for all to authenticated using (
    public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  ) with check (
    public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  );

create policy "form_fields_select" on public.form_fields
  for select to authenticated using (
    exists (
      select 1 from public.forms f
      where f.id = form_id
        and (
          (f.status = 'published' and (f.department_id is null or public.is_department_member(f.department_id)))
          or (f.department_id is not null and public.is_department_head(f.department_id))
          or public.is_flm()
        )
    )
  );
create policy "form_fields_write" on public.form_fields
  for all to authenticated using (
    exists (
      select 1 from public.forms f
      where f.id = form_id and (public.is_flm() or (f.department_id is not null and public.is_department_head(f.department_id)))
    )
  ) with check (
    exists (
      select 1 from public.forms f
      where f.id = form_id and (public.is_flm() or (f.department_id is not null and public.is_department_head(f.department_id)))
    )
  );

-- form_submissions: the submitter, whoever is (or was) an approver on it,
-- that department's head/HR/Finance leads, and FLM/super_admin.
create policy "form_submissions_select" on public.form_submissions
  for select to authenticated using (
    submitted_by = auth.uid()
    or public.is_flm()
    or (department_id is not null and public.is_department_head(department_id))
    or exists (
      select 1 from public.submission_approvals sa
      where sa.submission_id = id and sa.approver_id = auth.uid()
    )
  );
create policy "form_submissions_insert" on public.form_submissions
  for insert to authenticated with check (
    submitted_by = auth.uid()
    and (department_id is null or public.is_department_member(department_id))
  );
create policy "form_submissions_update" on public.form_submissions
  for update to authenticated using (
    (submitted_by = auth.uid() and status = 'draft')
    or public.is_flm()
    or (department_id is not null and public.is_department_head(department_id))
  ) with check (
    (submitted_by = auth.uid())
    or public.is_flm()
    or (department_id is not null and public.is_department_head(department_id))
  );
create policy "form_submissions_delete" on public.form_submissions
  for delete to authenticated using (
    (submitted_by = auth.uid() and status = 'draft') or public.is_flm()
  );

-- workflows / workflow_steps: department members can see how a process
-- works; only that department's head/FLM/super_admin design it.
create policy "workflows_select" on public.workflows
  for select to authenticated using (
    (department_id is not null and public.is_department_member(department_id)) or public.is_flm()
  );
create policy "workflows_write" on public.workflows
  for all to authenticated using (
    public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  ) with check (
    public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  );

create policy "workflow_steps_select" on public.workflow_steps
  for select to authenticated using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id
        and ((w.department_id is not null and public.is_department_member(w.department_id)) or public.is_flm())
    )
  );
create policy "workflow_steps_write" on public.workflow_steps
  for all to authenticated using (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id
        and (public.is_flm() or (w.department_id is not null and public.is_department_head(w.department_id)))
    )
  ) with check (
    exists (
      select 1 from public.workflows w
      where w.id = workflow_id
        and (public.is_flm() or (w.department_id is not null and public.is_department_head(w.department_id)))
    )
  );

-- submission_approvals: the assigned approver, the original submitter, and
-- admins; only the assigned approver (or an admin override) may decide.
create policy "submission_approvals_select" on public.submission_approvals
  for select to authenticated using (
    approver_id = auth.uid()
    or public.is_flm()
    or exists (
      select 1 from public.form_submissions s
      where s.id = submission_id
        and (s.submitted_by = auth.uid() or (s.department_id is not null and public.is_department_head(s.department_id)))
    )
  );
create policy "submission_approvals_update" on public.submission_approvals
  for update to authenticated using (
    approver_id = auth.uid() or public.is_flm()
  ) with check (
    approver_id = auth.uid() or public.is_flm()
  );

-- tasks: assignee, assigner, that department's head, and FLM/super_admin.
create policy "tasks_select" on public.tasks
  for select to authenticated using (
    assigned_to = auth.uid()
    or assigned_by = auth.uid()
    or public.is_flm()
    or (department_id is not null and public.is_department_head(department_id))
  );
create policy "tasks_write" on public.tasks
  for all to authenticated using (
    assigned_to = auth.uid()
    or assigned_by = auth.uid()
    or public.is_flm()
    or (department_id is not null and public.is_department_head(department_id))
  ) with check (
    assigned_by = auth.uid() or public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  );

-- documents: gated by access_level, then by department membership or ownership.
create policy "documents_select" on public.documents
  for select to authenticated using (
    access_level = 'public'
    or owner_id = auth.uid()
    or public.is_flm()
    or (access_level = 'department' and department_id is not null and public.is_department_member(department_id))
    or (access_level = 'restricted' and department_id is not null and public.is_department_head(department_id))
  );
create policy "documents_write" on public.documents
  for all to authenticated using (
    owner_id = auth.uid() or public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  ) with check (
    owner_id = auth.uid() or public.is_flm() or (department_id is not null and public.is_department_head(department_id))
  );

-- notifications: strictly your own.
create policy "notifications_select_own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- audit_logs: admin/FLM eyes only.
create policy "audit_logs_select_admin" on public.audit_logs
  for select to authenticated using (public.is_flm());
