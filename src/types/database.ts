import type {
  AuditLog,
  Department,
  DepartmentMember,
  Document,
  FormDef,
  FormField,
  FormSubmission,
  Notification,
  Profile,
  Role,
  SubmissionApproval,
  Task,
  UserGlobalRole,
  Workflow,
  WorkflowStep,
} from './domain'

type Table<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      departments: Table<Department>
      roles: Table<Role>
      profiles: Table<Profile>
      department_members: Table<DepartmentMember>
      user_global_roles: Table<UserGlobalRole>
      forms: Table<FormDef>
      form_fields: Table<FormField>
      form_submissions: Table<FormSubmission>
      workflows: Table<Workflow>
      workflow_steps: Table<WorkflowStep>
      submission_approvals: Table<SubmissionApproval>
      tasks: Table<Task>
      documents: Table<Document>
      notifications: Table<Notification>
      audit_logs: Table<AuditLog>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
