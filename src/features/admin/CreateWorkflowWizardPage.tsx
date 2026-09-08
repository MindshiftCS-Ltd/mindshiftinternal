import {
  ArrowLeft,
  Bell,
  Building2,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Plus,
  Send,
  Shield,
  Trash2,
  User,
  UserCheck,
  Zap,
} from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { ApproverType, FormDef, Role, WorkflowType } from '@/types/domain'

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

const WORKFLOW_TYPE_LABEL: Record<WorkflowType, string> = {
  approval_workflow: 'Approval Workflow',
  notification_workflow: 'Notification Workflow',
  automation: 'Automation',
}

interface DraftStep {
  localId: string
  name: string
  approverType: ApproverType
  roleId: string | null
  notifyOnComplete: boolean
}

function IconSelect({
  icon: Icon,
  children,
  ...props
}: React.ComponentProps<typeof Select> & { icon: typeof FileText }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Select {...props}>{children}</Select>
    </div>
  )
}

function AddStepDialog({ roles, onAdd }: { roles: Role[]; onAdd: (step: DraftStep) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [approverType, setApproverType] = React.useState<ApproverType>('reporting_manager')
  const [roleId, setRoleId] = React.useState<string>(roles[0]?.id ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({
      localId: crypto.randomUUID(),
      name,
      approverType,
      roleId: approverType === 'role' ? roleId : null,
      notifyOnComplete: true,
    })
    setName('')
    setApproverType('reporting_manager')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
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
            <Input id="step-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Manager Approval" />
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

function Stepper({ step, maxStep, onJump }: { step: number; maxStep: number; onJump: (n: number) => void }) {
  const labels = ['Basic Details', 'Configure Steps', 'Review Approvals', 'Notifications']
  return (
    <div className="flex items-center">
      {labels.map((label, i) => {
        const n = i + 1
        const isActive = n === step
        const isDone = n < step
        const clickable = n <= maxStep
        return (
          <React.Fragment key={label}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onJump(n)}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                  isActive && 'bg-primary text-primary-foreground',
                  isDone && !isActive && 'bg-primary/15 text-primary',
                  !isActive && !isDone && 'bg-secondary text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : n}
              </span>
              <span className={cn('hidden text-sm font-medium sm:block', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
            </button>
            {n < labels.length && <div className="mx-3 h-px flex-1 bg-border" />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function PreviewPanel({
  departmentName,
  formName,
  steps,
}: {
  departmentName: string | null
  formName: string | null
  steps: DraftStep[]
}) {
  const previewItems = [
    {
      key: 'submit',
      icon: Send,
      iconBg: 'bg-success/15',
      iconColor: 'text-success',
      title: '1. Submission',
      description: formName ? `Employee submits ${formName}` : 'Employee submits the request',
      tag: 'Trigger',
    },
    ...steps.map((s, i) => {
      const style = APPROVER_TYPE_STYLE[s.approverType]
      return {
        key: s.localId,
        icon: style.icon,
        iconBg: style.iconBg,
        iconColor: style.iconColor,
        title: `${i + 2}. ${s.name || 'Untitled step'}`,
        description: `Reviewed by ${APPROVER_TYPE_LABEL[s.approverType]}`,
        tag: 'Approval',
      }
    }),
    {
      key: 'notify',
      icon: Bell,
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning-foreground',
      title: `${steps.length + 2}. Notification`,
      description: 'Employee and approvers are notified',
      tag: 'Automation',
    },
  ]

  return (
    <Card className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-40 blur-2xl"
        style={{ background: 'radial-gradient(circle, var(--accent), transparent 70%)' }}
      />
      <CardContent className="relative flex flex-col gap-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Shield className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Workflow Preview</p>
            <p className="text-xs text-muted-foreground">See how this will flow once published.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {previewItems.map((item) => (
            <div key={item.key} className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3">
              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', item.iconBg)}>
                <item.icon className={cn('size-4', item.iconColor)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                <Badge variant="secondary" className="mt-1.5">
                  {item.tag}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white p-3 text-sm shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]">
          <p className="font-semibold">Estimated completion time</p>
          <p className="mt-1 text-lg font-bold">
            ~{Math.max(steps.length, 1)} business day{steps.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-muted-foreground">Rough guide — depends on how quickly approvers respond.</p>
        </div>

        {departmentName && (
          <div className="rounded-xl bg-accent/60 p-3 text-sm text-accent-foreground">
            This workflow will be available to <strong>{departmentName}</strong> and its members.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CreateWorkflowWizardPage() {
  const navigate = useNavigate()
  const { departments } = useDepartments()
  const [step, setStep] = React.useState(1)
  const [maxStep, setMaxStep] = React.useState(1)

  const [name, setName] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [workflowType, setWorkflowType] = React.useState<WorkflowType>('approval_workflow')
  const [formId, setFormId] = React.useState<string>('none')
  const [sendNotifications, setSendNotifications] = React.useState(true)
  const [advancedOpen, setAdvancedOpen] = React.useState(true)

  const [forms, setForms] = React.useState<FormDef[]>([])
  const [roles, setRoles] = React.useState<Role[]>([])
  const [draftSteps, setDraftSteps] = React.useState<DraftStep[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    Promise.all([supabase.from('forms').select('*'), supabase.from('roles').select('*').order('name')]).then(
      ([formsRes, rolesRes]) => {
        setForms(formsRes.data ?? [])
        setRoles(rolesRes.data ?? [])
      },
    )
  }, [])

  React.useEffect(() => {
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id)
  }, [departments, departmentId])

  const formsInDept = forms.filter((f) => f.department_id === departmentId)
  const selectedDept = departments.find((d) => d.id === departmentId)
  const selectedForm = forms.find((f) => f.id === formId)

  function goTo(n: number) {
    setStep(n)
    setMaxStep((m) => Math.max(m, n))
  }

  function next() {
    if (step === 1 && !name.trim()) {
      toast.error('Give the workflow a name first')
      return
    }
    goTo(Math.min(step + 1, 4))
  }

  async function handleSave(publish: boolean) {
    if (!name.trim() || !departmentId) {
      toast.error('Workflow name and department are required')
      return
    }
    setSubmitting(true)
    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        name,
        department_id: departmentId,
        description: description || null,
        workflow_type: workflowType,
        require_sequential_steps: true,
        form_id: formId === 'none' ? null : formId,
        is_active: publish,
      })
      .select()
      .single()

    if (error || !workflow) {
      setSubmitting(false)
      toast.error(error?.message ?? 'Could not create workflow')
      return
    }

    if (draftSteps.length > 0) {
      const { error: stepsError } = await supabase.from('workflow_steps').insert(
        draftSteps.map((s, i) => ({
          workflow_id: workflow.id,
          step_order: i + 1,
          name: s.name,
          approver_type: s.approverType,
          approver_role_id: s.roleId,
          notify_on_complete: s.notifyOnComplete,
        })),
      )
      if (stepsError) {
        setSubmitting(false)
        toast.error(stepsError.message)
        return
      }
    }

    setSubmitting(false)
    toast.success(publish ? 'Workflow published' : 'Workflow saved as draft')
    navigate('/admin/workflows')
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to create workflows here.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate('/admin/workflows')}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Workflows
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Workflow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a new workflow for a department or process. Customize steps, approvals and notifications.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={submitting} onClick={() => handleSave(false)}>
            Save as Draft
          </Button>
          <Button disabled={submitting} onClick={() => handleSave(true)}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Publish Workflow'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            <Stepper step={step} maxStep={maxStep} onJump={goTo} />

            {step === 1 && (
              <div className="flex flex-col gap-5">
                <h3 className="text-base font-semibold">Workflow Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="wf-name">
                      Workflow Name <span className="text-destructive">*</span>
                    </Label>
                    <Input id="wf-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Leave Request Approval" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <IconSelect icon={Building2} value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger className="pl-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </IconSelect>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wf-desc">Description</Label>
                  <Textarea
                    id="wf-desc"
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="This workflow handles the leave request process from submission to approval."
                    className="min-h-20"
                  />
                  <p className="self-end text-xs text-muted-foreground">{description.length}/500</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>
                      Workflow Type <span className="text-destructive">*</span>
                    </Label>
                    <IconSelect icon={FileText} value={workflowType} onValueChange={(v) => setWorkflowType(v as WorkflowType)}>
                      <SelectTrigger className="pl-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WORKFLOW_TYPE_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </IconSelect>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Trigger</Label>
                    <IconSelect icon={Zap} value={formId} onValueChange={setFormId}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Not tied to a form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not tied to a form</SelectItem>
                        {formsInDept.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name} submitted
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </IconSelect>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold"
                  >
                    Advanced Settings
                    <ChevronDown className={cn('size-4 transition-transform', advancedOpen && 'rotate-180')} />
                  </button>
                  {advancedOpen && (
                    <div className="flex flex-col gap-4 border-t border-border/60 px-4 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Require completion before next step</p>
                          <p className="text-xs text-muted-foreground">
                            Steps run in order — each must be resolved before the next one starts.
                          </p>
                        </div>
                        <Switch checked disabled />
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">Send notifications</p>
                          <p className="text-xs text-muted-foreground">Notify approvers when a request reaches their step.</p>
                        </div>
                        <Switch checked={sendNotifications} onCheckedChange={setSendNotifications} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Configure Steps</h3>
                  <AddStepDialog
                    roles={roles}
                    onAdd={(s) => setDraftSteps((prev) => [...prev, { ...s, notifyOnComplete: sendNotifications }])}
                  />
                </div>
                {draftSteps.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    No steps yet. Add the first approval step for this workflow.
                  </p>
                ) : (
                  <div
                    className="flex flex-col gap-2 rounded-2xl p-4"
                    style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '18px 18px', color: 'var(--border)' }}
                  >
                    {draftSteps.map((s, i) => {
                      const style = APPROVER_TYPE_STYLE[s.approverType]
                      const Icon = style.icon
                      return (
                        <div
                          key={s.localId}
                          className={cn(
                            'group flex items-center gap-3 rounded-xl border-l-[3px] bg-white p-2.5 pr-2 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]',
                            style.border,
                          )}
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                          <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
                            <Icon className={cn('size-4', style.iconColor)} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                              {s.approverType === 'role' ? (roles.find((r) => r.id === s.roleId)?.name ?? 'Role') : APPROVER_TYPE_LABEL[s.approverType]}
                            </p>
                            <p className="leading-tight font-semibold text-foreground">{s.name}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => setDraftSteps((prev) => prev.filter((x) => x.localId !== s.localId))}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">Review Approvals</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm the approval chain below before publishing. You can still go back and adjust it.
                </p>
                <div
                  className="flex flex-wrap items-center gap-3 rounded-2xl p-6"
                  style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '18px 18px', color: 'var(--border)' }}
                >
                  <Badge variant="secondary" dot className="bg-white shadow-xs">
                    Submitted
                  </Badge>
                  {draftSteps.map((s) => {
                    const style = APPROVER_TYPE_STYLE[s.approverType]
                    const Icon = style.icon
                    return (
                      <React.Fragment key={s.localId}>
                        <span className="text-muted-foreground">→</span>
                        <div className={cn('flex items-center gap-2 rounded-xl border-l-[3px] bg-white py-1.5 pr-3 pl-2.5', style.border)}>
                          <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', style.iconBg)}>
                            <Icon className={cn('size-3.5', style.iconColor)} />
                          </div>
                          <p className="text-sm font-semibold">{s.name}</p>
                        </div>
                      </React.Fragment>
                    )
                  })}
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="success" dot className="bg-white shadow-xs">
                    Approved
                  </Badge>
                </div>
                {draftSteps.length === 0 && (
                  <p className="text-sm text-muted-foreground">No steps configured — this workflow will approve immediately on submission.</p>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which steps notify their approver when a request reaches them. Submitters are always notified
                  automatically once their request is fully approved or rejected.
                </p>
                {draftSteps.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                    No steps to configure yet — add steps in step 2 first.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {draftSteps.map((s) => (
                      <div
                        key={s.localId}
                        className="flex items-center justify-between gap-4 rounded-xl bg-white p-3 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_-2px_rgba(16,24,40,0.06)]"
                      >
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">Notify on reaching this step</p>
                        </div>
                        <Switch
                          checked={s.notifyOnComplete}
                          onCheckedChange={(checked) =>
                            setDraftSteps((prev) => prev.map((x) => (x.localId === s.localId ? { ...x, notifyOnComplete: checked } : x)))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between border-t border-border pt-4">
              <Button variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                Back
              </Button>
              {step < 4 ? (
                <Button onClick={next}>Next →</Button>
              ) : (
                <Button disabled={submitting} onClick={() => handleSave(true)}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : 'Publish Workflow'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <PreviewPanel departmentName={selectedDept?.name ?? null} formName={selectedForm?.name ?? null} steps={draftSteps} />
      </div>
    </div>
  )
}
