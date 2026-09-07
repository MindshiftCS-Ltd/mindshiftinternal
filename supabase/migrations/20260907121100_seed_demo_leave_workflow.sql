-- One worked example so the engine is provably end-to-end on a fresh
-- install: HR's Leave Request form, routed through the requester's manager
-- and then HR. Everything here is ordinary form/workflow configuration --
-- delete or edit it freely once real forms are built through the UI.

do $$
declare
  v_hr_id uuid;
  v_form_id uuid;
  v_workflow_id uuid;
  v_hr_admin_role_id uuid;
begin
  select id into v_hr_id from public.departments where code = 'HR';
  select id into v_hr_admin_role_id from public.roles where slug = 'hr_admin';

  insert into public.forms (department_id, name, slug, description, status, reference_prefix, requires_approval)
  values (v_hr_id, 'Leave Request', 'hr-leave-request', 'Request annual, sick or compassionate leave.', 'published', 'LR', true)
  on conflict (slug) do nothing
  returning id into v_form_id;

  if v_form_id is null then
    select id into v_form_id from public.forms where slug = 'hr-leave-request';
  end if;

  insert into public.form_fields (form_id, label, field_key, field_type, options, is_required, order_index) values
    (v_form_id, 'Leave Type', 'leave_type', 'dropdown', '["Annual", "Sick", "Compassionate", "Unpaid"]'::jsonb, true, 1),
    (v_form_id, 'Start Date', 'start_date', 'date', '[]'::jsonb, true, 2),
    (v_form_id, 'End Date', 'end_date', 'date', '[]'::jsonb, true, 3),
    (v_form_id, 'Reason', 'reason', 'long_text', '[]'::jsonb, false, 4)
  on conflict (form_id, field_key) do nothing;

  insert into public.workflows (form_id, department_id, name, is_active)
  values (v_form_id, v_hr_id, 'Leave Approval', true)
  returning id into v_workflow_id;

  insert into public.workflow_steps (workflow_id, step_order, name, approver_type, approver_role_id) values
    (v_workflow_id, 1, 'Reporting Manager Approval', 'reporting_manager', null),
    (v_workflow_id, 2, 'HR Review', 'role', v_hr_admin_role_id);
end $$;
