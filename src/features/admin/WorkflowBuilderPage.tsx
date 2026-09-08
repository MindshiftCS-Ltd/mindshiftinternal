import { ArrowRight, Building2, Loader2, Plus, Shield, Trash2, User, UserCheck } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { ApproverType, FormDef, Role, Workflow, WorkflowStep } from '@/types/domain'

const APPROVER_TYPE_LABEL: Record<ApproverType, string> = {
  reporting_manager: 'Reporting Manager',
  department_head: 'Department Head',
  role: 'Specific Role',
  specific_user: 'Specific Person',
}

const APPROVER_TYPE_STYLE: Record<ApproverType, { icon: typeof User; border: string; iconBg: string; iconColor: string }> = {
  reporting_manager: { icon: User, border: 'border-l-blue-400', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  department_head: { icon: Building2, border: 'border-l-purple-400', iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
  role: { icon: Shield, border: 'border-l-amber-400', iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  specific_user: { icon: UserCheck, border: 'border-l-pink-400', iconBg: 'bg-pink-50', iconColor: 'text-pink-500' },
}

function NewWorkflowDialog({
  departments,
  forms,
  onCreate,
}: {
  departments: { id: string; name: string }[]
  forms: FormDef[]
  onCreate: (input: { name: string; departmentId: string; formId: string | null }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? '')
  const [formId, setFormId] = React.useState<string>('none')

  React.useEffect(() => {
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id)
  }, [departments, departmentId])

  const formsInDept = forms.filter((f) => f.department_id === departmentId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate({ name, departmentId, formId: formId === 'none' ? null : formId })
    setName('')
    setFormId('none')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New Workflow
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="wf-name">Workflow name</Label>
            <Input id="wf-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Expense Approval" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Triggering form (optional)</Label>
            <Select value={formId} onValueChange={setFormId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not tied to a form</SelectItem>
                {formsInDept.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">Create Workflow</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddStepDialog({ roles, onAdd }: { roles: Role[]; onAdd: (input: { name: string; approverType: ApproverType; roleId: string | null }) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [approverType, setApproverType] = React.useState<ApproverType>('reporting_manager')
  const [roleId, setRoleId] = React.useState<string>(roles[0]?.id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ name, approverType, roleId: approverType === 'role' ? roleId : null })
    setName('')
    setApproverType('reporting_manager')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Add Step
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Approval Step</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="step-name">Step name</Label>
            <Input id="step-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Finance Sign-off" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Send to</Label>
            <Select value={approverType} onValueChange={(v) => setApproverType(v as ApproverType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(APPROVER_TYPE_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {approverType === 'role' && (
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="submit">Add Step</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WorkflowBuilderPage() {
  const { departments } = useDepartments()
  const [workflows, setWorkflows] = React.useState<Workflow[]>([])
  const [forms, setForms] = React.useState<FormDef[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [steps, setSteps] = React.useState<WorkflowStep[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  const loadWorkflows = React.useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const [wfRes, formsRes, rolesRes] = await Promise.all([
      supabase.from('workflows').select('*').order('name'),
      supabase.from('forms').select('*'),
      supabase.from('roles').select('*').order('name'),
    ])
    if (wfRes.error) toast.error(wfRes.error.message)
    setWorkflows(wfRes.data ?? [])
    setForms(formsRes.data ?? [])
    setRoles(rolesRes.data ?? [])
    setSelectedId((current) => current ?? wfRes.data?.[0]?.id ?? null)
    setLoading(false)
  }, [])

  const loadSteps = React.useCallback(async (workflowId: string) => {
    if (!isSupabaseConfigured) return
    const { data, error } = await supabase
      .from('workflow_steps')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('step_order')
    if (error) toast.error(error.message)
    else setSteps(data ?? [])
  }, [])

  React.useEffect(() => {
    void loadWorkflows()
  }, [loadWorkflows])

  React.useEffect(() => {
    if (selectedId) void loadSteps(selectedId)
  }, [selectedId, loadSteps])

  const selected = workflows.find((w) => w.id === selectedId) ?? null
  const triggerForm = forms.find((f) => f.id === selected?.form_id)

  async function handleCreateWorkflow({ name, departmentId, formId }: { name: string; departmentId: string; formId: string | null }) {
    const { data, error } = await supabase
      .from('workflows')
      .insert({ name, department_id: departmentId, form_id: formId, is_active: true })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${name} created`)
    await loadWorkflows()
    setSelectedId(data.id)
  }

  async function handleAddStep({ name, approverType, roleId }: { name: string; approverType: ApproverType; roleId: string | null }) {
    if (!selected) return
    const { error } = await supabase.from('workflow_steps').insert({
      workflow_id: selected.id,
      step_order: steps.length + 1,
      name,
      approver_type: approverType,
      approver_role_id: roleId,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    await loadSteps(selected.id)
  }

  async function handleDeleteStep(stepId: string) {
    const { error } = await supabase.from('workflow_steps').delete().eq('id', stepId)
    if (error) {
      toast.error(error.message)
      return
    }
    if (selected) await loadSteps(selected.id)
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to build workflows — this screen edits the real{' '}
          <code>workflows</code> and <code>workflow_steps</code> tables directly.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Workflows</h2>
          <NewWorkflowDialog departments={departments} forms={forms} onCreate={handleCreateWorkflow} />
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : workflows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflows yet. Create the first one.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                onClick={() => setSelectedId(wf.id)}
                className={cn(
                  'flex flex-col items-start rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-accent',
                  wf.id === selected?.id && 'border-border bg-accent',
                )}
              >
                <span className="font-medium">{wf.name}</span>
                <span className="text-xs text-muted-foreground">
                  {departments.find((d) => d.id === wf.department_id)?.code ?? 'Org-wide'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                WHEN {triggerForm ? `${triggerForm.name} submitted` : 'triggered manually'}
              </p>
            </div>
            <AddStepDialog roles={roles} onAdd={handleAddStep} />
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-wrap items-center gap-3 rounded-2xl p-6"
              style={{
                backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
                backgroundSize: '18px 18px',
                color: 'var(--border)',
              }}
            >
              <Badge variant="secondary" dot className="bg-white shadow-xs" style={{ color: 'var(--foreground)' }}>
                Submitted
              </Badge>
              {steps.map((step) => {
                const style = APPROVER_TYPE_STYLE[step.approver_type]
                const Icon = style.icon
                return (
                  <React.Fragment key={step.id}>
                    <ArrowRight className="size-4 shrink-0" style={{ color: 'var(--border)' }} />
                    <div
                      className={cn(
                        'group flex items-center gap-2.5 rounded-xl border-l-[3px] bg-white py-2 pr-2 pl-3 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]',
                        style.border,
                      )}
                    >
                      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
                        <Icon className={cn('size-4', style.iconColor)} />
                      </div>
                      <div className="text-sm">
                        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          {step.approver_type === 'role'
                            ? (roles.find((r) => r.id === step.approver_role_id)?.name ?? 'Role')
                            : APPROVER_TYPE_LABEL[step.approver_type]}
                        </p>
                        <p className="leading-tight font-semibold text-foreground">{step.name}</p>
                      </div>
                      <span className="ml-1 size-1.5 shrink-0 rounded-full bg-success" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteStep(step.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </React.Fragment>
                )
              })}
              <ArrowRight className="size-4 shrink-0" style={{ color: 'var(--border)' }} />
              <Badge variant="success" dot className="bg-white shadow-xs">
                Approved
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select a workflow, or create one to get started.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
