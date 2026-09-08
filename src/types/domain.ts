// Hand-written domain types mirroring supabase/migrations/*.sql.
// Once a live Supabase project exists, replace these with
// `supabase gen types typescript` output and re-point src/lib/supabase.ts at it.

export type SubmissionStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped'
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled'
export type DocumentAccessLevel = 'public' | 'department' | 'restricted'
export type FormStatus = 'draft' | 'published' | 'archived'
export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'dropdown'
  | 'multi_select'
  | 'checkbox'
  | 'file_upload'
  | 'email'
  | 'phone'
  | 'signature'
export type ApproverType = 'specific_user' | 'role' | 'department_head' | 'reporting_manager'
export type StaffStatus = 'probation' | 'active' | 'on_leave' | 'suspended' | 'exited'

export type Department = {
  id: string
  name: string
  code: string
  description: string | null
  icon: string | null
  head_id: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Role = {
  id: string
  slug: string
  name: string
  description: string | null
  is_system: boolean
  created_at: string
}

export type Profile = {
  id: string
  staff_number: string | null
  full_name: string
  preferred_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  job_title: string | null
  status: StaffStatus
  primary_department_id: string | null
  reporting_manager_id: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export type DepartmentMember = {
  id: string
  department_id: string
  user_id: string
  role_id: string
  created_at: string
}

export type UserGlobalRole = {
  id: string
  user_id: string
  role_id: string
  created_at: string
}

export type FormDef = {
  id: string
  department_id: string | null
  name: string
  slug: string
  description: string | null
  status: FormStatus
  reference_prefix: string
  requires_approval: boolean
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FormField = {
  id: string
  form_id: string
  label: string
  field_key: string
  field_type: FieldType
  options: unknown
  placeholder: string | null
  help_text: string | null
  is_required: boolean
  order_index: number
  validation: unknown
  created_at: string
}

export type FormSubmission = {
  id: string
  form_id: string
  department_id: string | null
  reference_code: string
  submitted_by: string
  data: Record<string, unknown>
  status: SubmissionStatus
  current_step_order: number
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type Workflow = {
  id: string
  form_id: string | null
  department_id: string | null
  name: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type WorkflowStep = {
  id: string
  workflow_id: string
  step_order: number
  name: string
  approver_type: ApproverType
  approver_role_id: string | null
  approver_user_id: string | null
  notify_on_complete: boolean
  created_at: string
}

export type SubmissionApproval = {
  id: string
  submission_id: string
  workflow_step_id: string
  step_order: number
  approver_id: string | null
  status: ApprovalStatus
  comment: string | null
  decided_at: string | null
  created_at: string
}

export type Task = {
  id: string
  department_id: string | null
  assigned_to: string
  assigned_by: string | null
  title: string
  description: string | null
  related_submission_id: string | null
  due_date: string | null
  priority: string
  status: TaskStatus
  created_at: string
  updated_at: string
}

export type Document = {
  id: string
  department_id: string | null
  owner_id: string
  title: string
  doc_type: string
  storage_path: string
  version: number
  access_level: DocumentAccessLevel
  related_type: string | null
  related_id: string | null
  status: string
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type AuditLog = {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  created_at: string
}
