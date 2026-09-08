import { Check, Loader2, X } from 'lucide-react'
import * as React from 'react'
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
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthProvider'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Task } from '@/types/domain'

interface ApprovalRow {
  id: string
  step_order: number
  submission: {
    reference_code: string
    status: string
    form: { name: string } | null
    submitter: { full_name: string } | null
  } | null
}

interface SubmissionRow {
  id: string
  reference_code: string
  status: string
  created_at: string
  form: { name: string } | null
}

function RejectDialog({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; onConfirm: (comment: string) => void }) {
  const [comment, setComment] = React.useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
        </DialogHeader>
        <Textarea placeholder="Reason (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(comment)
              setComment('')
              onOpenChange(false)
            }}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function MyWorkPage() {
  const { profile } = useAuth()
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [approvals, setApprovals] = React.useState<ApprovalRow[]>([])
  const [submissions, setSubmissions] = React.useState<SubmissionRow[]>([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)
  const [rejectTarget, setRejectTarget] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!isSupabaseConfigured || !profile) return
    setLoading(true)
    const [tasksRes, approvalsRes, submissionsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('assigned_to', profile.id).order('due_date', { ascending: true }),
      supabase
        .from('submission_approvals')
        .select('id, step_order, submission:form_submissions(reference_code, status, form:forms(name), submitter:profiles(full_name))')
        .eq('approver_id', profile.id)
        .eq('status', 'pending'),
      supabase
        .from('form_submissions')
        .select('id, reference_code, status, created_at, form:forms(name)')
        .eq('submitted_by', profile.id)
        .order('created_at', { ascending: false }),
    ])
    setTasks(tasksRes.data ?? [])
    setApprovals((approvalsRes.data ?? []) as unknown as ApprovalRow[])
    setSubmissions((submissionsRes.data ?? []) as unknown as SubmissionRow[])
    setLoading(false)
  }, [profile])

  React.useEffect(() => {
    void load()
  }, [load])

  async function markTaskDone(taskId: string) {
    const { error } = await supabase.from('tasks').update({ status: 'done' }).eq('id', taskId)
    if (error) toast.error(error.message)
    else void load()
  }

  async function decide(approvalId: string, status: 'approved' | 'rejected', comment?: string) {
    const { error } = await supabase
      .from('submission_approvals')
      .update({ status, comment: comment || null, decided_at: new Date().toISOString() })
      .eq('id', approvalId)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(status === 'approved' ? 'Approved' : 'Rejected')
    void load()
  }

  if (!isSupabaseConfigured) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Connect Supabase (see README) to see your tasks and approvals.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">My Work</h2>
        <p className="text-sm text-muted-foreground">Tasks assigned to you and requests awaiting your action.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <Tabs defaultValue="approvals">
          <TabsList>
            <TabsTrigger value="approvals">Approvals ({approvals.length})</TabsTrigger>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-4 flex flex-col gap-3">
            {approvals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nothing awaiting your approval.</p>
            ) : (
              approvals.map((a) => (
                <Card key={a.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {a.submission?.form?.name ?? 'Request'} · {a.submission?.reference_code}
                      </p>
                      <p className="text-xs text-muted-foreground">Submitted by {a.submission?.submitter?.full_name ?? 'Unknown'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRejectTarget(a.id)}>
                        <X /> Reject
                      </Button>
                      <Button size="sm" onClick={() => decide(a.id, 'approved')}>
                        <Check /> Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 flex flex-col gap-3">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No tasks assigned to you.</p>
            ) : (
              tasks.map((t) => (
                <Card key={t.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.due_date ? `Due ${t.due_date}` : 'No due date'} · <span className="capitalize">{t.priority}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={t.status === 'done' ? 'success' : 'secondary'} className="capitalize">
                        {t.status.replace('_', ' ')}
                      </Badge>
                      {t.status !== 'done' && (
                        <Button size="sm" variant="outline" onClick={() => markTaskDone(t.id)}>
                          Mark done
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="submissions" className="mt-4 flex flex-col gap-3">
            {submissions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">You haven't submitted anything yet.</p>
            ) : (
              submissions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {s.form?.name ?? 'Submission'} · {s.reference_code}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {s.status.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      <RejectDialog
        open={rejectTarget !== null}
        onOpenChange={(v) => !v && setRejectTarget(null)}
        onConfirm={(comment) => rejectTarget && decide(rejectTarget, 'rejected', comment)}
      />
    </div>
  )
}
