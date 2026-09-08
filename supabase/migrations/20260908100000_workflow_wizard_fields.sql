-- Backs the Create Workflow wizard's Basic Details step with real columns
-- instead of presentational-only fields.

alter table public.workflows
  add column description text,
  add column workflow_type text not null default 'approval_workflow'
    check (workflow_type in ('approval_workflow', 'notification_workflow', 'automation')),
  add column require_sequential_steps boolean not null default true;
