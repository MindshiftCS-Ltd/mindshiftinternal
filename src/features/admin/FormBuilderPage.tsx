import { GripVertical, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { demoDepartments } from '@/lib/demoData'
import { FIELD_TYPE_OPTIONS, fieldTypeLabel } from '@/lib/fieldTypes'
import type { FieldType } from '@/types/domain'

interface FieldDraft {
  id: string
  label: string
  field_type: FieldType
  is_required: boolean
}

interface FormDraft {
  id: string
  name: string
  departmentCode: string
  referencePrefix: string
  status: 'draft' | 'published'
  fields: FieldDraft[]
}

const initialForms: FormDraft[] = [
  {
    id: 'hr-leave-request',
    name: 'Leave Request',
    departmentCode: 'HR',
    referencePrefix: 'LR',
    status: 'published',
    fields: [
      { id: 'f1', label: 'Leave Type', field_type: 'dropdown', is_required: true },
      { id: 'f2', label: 'Start Date', field_type: 'date', is_required: true },
      { id: 'f3', label: 'End Date', field_type: 'date', is_required: true },
      { id: 'f4', label: 'Reason', field_type: 'long_text', is_required: false },
    ],
  },
  {
    id: 'fin-expense-reimbursement',
    name: 'Expense Reimbursement',
    departmentCode: 'FIN',
    referencePrefix: 'EXP',
    status: 'draft',
    fields: [{ id: 'f1', label: 'Amount', field_type: 'number', is_required: true }],
  },
  {
    id: 'ops-procurement-request',
    name: 'Procurement Request',
    departmentCode: 'OPS',
    referencePrefix: 'PR',
    status: 'draft',
    fields: [],
  },
]

function NewFormDialog({ onCreate }: { onCreate: (form: FormDraft) => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [departmentCode, setDepartmentCode] = React.useState(demoDepartments[0]!.code)
  const [prefix, setPrefix] = React.useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate({
      id: crypto.randomUUID(),
      name,
      departmentCode,
      referencePrefix: prefix || name.slice(0, 3).toUpperCase(),
      status: 'draft',
      fields: [],
    })
    setName('')
    setPrefix('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New Form
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Form</DialogTitle>
          <DialogDescription>Any department can publish its own forms independently.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-name">Form name</Label>
            <Input id="form-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor Registration" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Department</Label>
            <Select value={departmentCode} onValueChange={setDepartmentCode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {demoDepartments.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="form-prefix">Reference code prefix</Label>
            <Input id="form-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="VR" maxLength={6} />
          </div>
          <DialogFooter>
            <Button type="submit">Create Form</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddFieldDialog({ onAdd }: { onAdd: (field: FieldDraft) => void }) {
  const [open, setOpen] = React.useState(false)
  const [label, setLabel] = React.useState('')
  const [type, setType] = React.useState<FieldType>('short_text')
  const [required, setRequired] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ id: crypto.randomUUID(), label, field_type: type, is_required: required })
    setLabel('')
    setType('short_text')
    setRequired(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus /> Add Field
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="field-label">Field label</Label>
            <Input id="field-label" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Vendor Name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Field type</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={required} onCheckedChange={(v) => setRequired(v === true)} />
            Required field
          </label>
          <DialogFooter>
            <Button type="submit">Add Field</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FormBuilderPage() {
  const [forms, setForms] = React.useState<FormDraft[]>(initialForms)
  const [selectedId, setSelectedId] = React.useState(initialForms[0]!.id)
  const selected = forms.find((f) => f.id === selectedId) ?? forms[0]!

  function updateSelected(update: (form: FormDraft) => FormDraft) {
    setForms((prev) => prev.map((f) => (f.id === selected.id ? update(f) : f)))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Forms</h2>
          <NewFormDialog
            onCreate={(form) => {
              setForms((prev) => [...prev, form])
              setSelectedId(form.id)
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          {forms.map((form) => (
            <button
              key={form.id}
              onClick={() => setSelectedId(form.id)}
              className={cn(
                'flex flex-col items-start rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-accent',
                form.id === selected.id && 'border-border bg-accent',
              )}
            >
              <span className="font-medium">{form.name}</span>
              <span className="text-xs text-muted-foreground">
                {form.departmentCode} · {form.fields.length} fields
              </span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{selected.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {selected.departmentCode} · Reference prefix {selected.referencePrefix}-0001
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selected.status === 'published' ? 'success' : 'secondary'}>{selected.status}</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateSelected((f) => ({ ...f, status: f.status === 'published' ? 'draft' : 'published' }))
                toast.success(selected.status === 'published' ? 'Form moved to draft' : 'Form published')
              }}
            >
              {selected.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Fields</p>
            <AddFieldDialog onAdd={(field) => updateSelected((f) => ({ ...f, fields: [...f.fields, field] }))} />
          </div>

          {selected.fields.length === 0 && (
            <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No fields yet. Add the first field to start building this form.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {selected.fields.map((field) => (
              <div key={field.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                <GripVertical className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground">{fieldTypeLabel(field.field_type)}</p>
                </div>
                {field.is_required && <Badge variant="outline">Required</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updateSelected((f) => ({ ...f, fields: f.fields.filter((fl) => fl.id !== field.id) }))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
