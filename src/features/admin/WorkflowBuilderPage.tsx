import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'

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
import { cn } from '@/lib/utils'
import type { ApproverType } from '@/types/domain'

const APPROVER_TYPE_LABEL: Record<ApproverType, string> = {
  reporting_manager: 'Reporting Manager',
  department_head: 'Department Head',
  role: 'Specific Role',
  specific_user: 'Specific Person',
}

interface StepDraft {
  id: string
  name: string
  approverType: ApproverType
}

interface WorkflowDraft {
  id: string
  name: string
  triggerForm: string
  steps: StepDraft[]
}

const initialWorkflows: WorkflowDraft[] = [
  {
    id: 'leave-approval',
    name: 'Leave Approval',
    triggerForm: 'Leave Request submitted',
    steps: [
      { id: 's1', name: 'Reporting Manager Approval', approverType: 'reporting_manager' },
      { id: 's2', name: 'HR Review', approverType: 'role' },
    ],
  },
  {
    id: 'expense-approval',
    name: 'Expense Approval',
    triggerForm: 'Expense Reimbursement submitted',
    steps: [{ id: 's1', name: 'Finance Review', approverType: 'department_head' }],
  },
]

function AddStepDialog({ onAdd }: { onAdd: (step: StepDraft) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [approverType, setApproverType] = React.useState<ApproverType>('reporting_manager')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ id: crypto.randomUUID(), name, approverType })
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
          <DialogFooter>
            <Button type="submit">Add Step</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = React.useState<WorkflowDraft[]>(initialWorkflows)
  const [selectedId, setSelectedId] = React.useState(initialWorkflows[0]!.id)
  const selected = workflows.find((w) => w.id === selectedId) ?? workflows[0]!

  function updateSelected(update: (w: WorkflowDraft) => WorkflowDraft) {
    setWorkflows((prev) => prev.map((w) => (w.id === selected.id ? update(w) : w)))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Workflows</h2>
        <div className="flex flex-col gap-1">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedId(wf.id)}
              className={cn(
                'flex flex-col items-start rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-accent',
                wf.id === selected.id && 'border-border bg-accent',
              )}
            >
              <span className="font-medium">{wf.name}</span>
              <span className="text-xs text-muted-foreground">{wf.steps.length} steps</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{selected.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">WHEN {selected.triggerForm}</p>
          </div>
          <AddStepDialog onAdd={(step) => updateSelected((w) => ({ ...w, steps: [...w.steps, step] }))} />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Submitted</Badge>
            {selected.steps.map((step) => (
              <React.Fragment key={step.id}>
                <ArrowRight className="size-4 text-muted-foreground" />
                <div className="flex items-center gap-1 rounded-md border border-border py-1 pr-1 pl-2.5">
                  <div className="text-sm">
                    <p className="font-medium leading-tight">{step.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{APPROVER_TYPE_LABEL[step.approverType]}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => updateSelected((w) => ({ ...w, steps: w.steps.filter((s) => s.id !== step.id) }))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </React.Fragment>
            ))}
            <ArrowRight className="size-4 text-muted-foreground" />
            <Badge variant="success">Approved</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
