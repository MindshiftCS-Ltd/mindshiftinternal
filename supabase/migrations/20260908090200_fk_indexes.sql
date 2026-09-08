-- Index every foreign key the performance advisor flagged as unindexed, so
-- joins and cascade lookups on these columns don't force a sequential scan.

create index department_members_role_id_idx on public.department_members (role_id);
create index forms_created_by_idx on public.forms (created_by);
create index submission_approvals_workflow_step_id_idx on public.submission_approvals (workflow_step_id);
create index tasks_assigned_by_idx on public.tasks (assigned_by);
create index tasks_related_submission_id_idx on public.tasks (related_submission_id);
create index user_global_roles_role_id_idx on public.user_global_roles (role_id);
create index workflow_steps_approver_role_id_idx on public.workflow_steps (approver_role_id);
create index workflow_steps_approver_user_id_idx on public.workflow_steps (approver_user_id);
create index workflows_created_by_idx on public.workflows (created_by);
create index workflows_department_id_idx on public.workflows (department_id);
