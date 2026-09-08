import { GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
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
import { useAuth } from '@/features/auth/AuthProvider'
import { useDepartments } from '@/hooks/useDepartments'
import { FIELD_TYPE_OPTIONS, fieldTypeLabel } from '@/lib/fieldTypes'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { FieldType, FormDef, FormField, FormStatus } from '@/types/domain'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function fieldKeyFrom(label: string, existing: string[]) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '') || 'field'
  let key = base
  let i = 2
  while (existing.includes(key)) {
    key = `${base}_${i}`
    i += 1
  }
  return key
}

function NewFormDialog({
  departments,
  onCreate,
}: {
  departments: { id: string; name: string; code: string }[]
  onCreate: (form: { name: string; departmentId: string; prefix: string }) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState(departments[0]?.id ?? '')
  const [prefix, setPrefix] = React.useState('')

  React.useEffect(() => {
    if (!departmentId && departments[0]) setDepartmentId(departments[0].id)
  }, [departments, departmentId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onCreate({ name, departmentId, prefix: prefix || name.slice(0, 3).toUpperCase() })
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

function AddFieldDialog({ onAdd }: { onAdd: (field: { label: string; type: FieldType; required: boolean }) => void }) {
  const [open, setOpen] = React.useState(false)
  const [label, setLabel] = React.useState('')
  const [type, setType] = React.useState<FieldType>('short_text')
  const [required, setRequired] = React.useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ label, type, required })
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
  const { departments } = useDepartments()
  const { profile } = useAuth()
  const [forms, setForms] = React.useState<FormDef[]>([])
  const [fields, setFields] = React.useState<FormField[]>([])
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  const loadForms = React.useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    const { data, error } = await supabase.from('forms').select('*').order('name')
    if (error) {
      toast.error(error.message)
    } else {
      setForms(data ?? [])
      setSelectedId((current) => current ?? data?.[0]?.id ?? null)
    }
    setLoading(false)
  }, [])

  const loadFields = React.useCallback(async (formId: string) => {
    if (!isSupabaseConfigured) return
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('order_index')
    if (error) toast.error(error.message)
    else setFields(data ?? [])
  }, [])

  React.useEffect(() => {
    void loadForms()
  }, [loadForms])

  React.useEffect(() => {
    if (selectedId) void loadFields(selectedId)
  }, [selectedId, loadFields])

  const selected = forms.find((f) => f.id === selectedId) ?? null

  async function handleCreateForm({ name, departmentId, prefix }: { name: string; departmentId: string; prefix: string }) {
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase
      .from('forms')
      .insert({
        name,
        slug,
        department_id: departmentId,
        reference_prefix: prefix,
        status: 'draft',
        requires_approval: true,
        created_by: profile?.id,
      })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${name} created`)
    await loadForms()
    setSelectedId(data.id)
  }

  async function handleTogglePublish() {
    if (!selected) return
    const next: FormStatus = selected.status === 'published' ? 'draft' : 'published'
    const { error } = await supabase.from('forms').update({ status: next }).eq('id', selected.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(next === 'published' ? 'Form published' : 'Form moved to draft')
    await loadForms()
  }

  async function handleAddField({ label, type, required }: { label: string; type: FieldType; required: boolean }) {
    if (!selected) return
    const key = fieldKeyFrom(label, fields.map((f) => f.field_key))
    const { error } = await supabase.from('form_fields').insert({
      form_id: selected.id,
      label,
      field_key: key,
      field_type: type,
      is_required: required,
      order_index: fields.length + 1,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    await loadFields(selected.id)
  }

  async function handleDeleteField(fieldId: string) {
    const { error } = await supabase.from('form_fields').delete().eq('id', fieldId)
    if (error) {
      toast.error(error.message)
      return
    }
    if (selected) await loadFields(selected.id)
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to build forms — this screen edits the real <code>forms</code> and{' '}
          <code>form_fields</code> tables directly.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Forms</h2>
          <NewFormDialog departments={departments} onCreate={handleCreateForm} />
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : forms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No forms yet. Create the first one.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {forms.map((form) => {
              const dept = departments.find((d) => d.id === form.department_id)
              return (
                <button
                  key={form.id}
                  onClick={() => setSelectedId(form.id)}
                  className={cn(
                    'flex flex-col items-start rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-accent',
                    form.id === selected?.id && 'border-border bg-accent',
                  )}
                >
                  <span className="font-medium">{form.name}</span>
                  <span className="text-xs text-muted-foreground">{dept?.code ?? 'Org-wide'} · {form.status}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selected ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">{selected.name}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {departments.find((d) => d.id === selected.department_id)?.code ?? 'Org-wide'} · Reference prefix{' '}
                {selected.reference_prefix}-0001
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selected.status === 'published' ? 'success' : 'secondary'}>{selected.status}</Badge>
              <Button variant="outline" size="sm" onClick={handleTogglePublish}>
                {selected.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Fields</p>
              <AddFieldDialog onAdd={handleAddField} />
            </div>

            {fields.length === 0 && (
              <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No fields yet. Add the first field to start building this form.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <GripVertical className="size-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">{fieldTypeLabel(field.field_type)}</p>
                  </div>
                  {field.is_required && <Badge variant="outline">Required</Badge>}
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Select a form, or create one to get started.
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
