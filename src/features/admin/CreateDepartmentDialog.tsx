import * as React from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function CreateDepartmentDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState('')
  const [code, setCode] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured) {
      toast.info('Connect Supabase to persist new departments. This is a preview of the flow.')
      setOpen(false)
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('departments').insert({
      name,
      code: code.toUpperCase(),
      description,
    })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${name} department created`)
    setName('')
    setCode('')
    setDescription('')
    setOpen(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Create Department</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>
            New departments become available across the platform immediately — no code change required.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">Department name</Label>
            <Input id="dept-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Technology & Innovation" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-code">Department code</Label>
            <Input
              id="dept-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TECH"
              maxLength={12}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-description">Description</Label>
            <Textarea
              id="dept-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this department is responsible for"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
