import { FileText, Loader2 } from 'lucide-react'
import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Document } from '@/types/domain'

export function DocumentsPage() {
  const { departments } = useDepartments()
  const [documents, setDocuments] = React.useState<Document[]>([])
  const [loading, setLoading] = React.useState(isSupabaseConfigured)

  React.useEffect(() => {
    if (!isSupabaseConfigured) return
    supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDocuments(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Documents</h2>
        <p className="text-sm text-muted-foreground">
          Company, HR, Finance, project and client documents in one place.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Connect Supabase (see README) to see documents.
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No documents yet. Uploading requires a Supabase Storage bucket, which isn't wired up in this build —
            the <code>documents</code> table (title, department, access level, owner) is ready for it.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="h-20">
              <CardContent className="flex h-full items-start gap-3 py-4">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{doc.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {departments.find((d) => d.id === doc.department_id)?.name ?? 'Organisation-wide'}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {doc.access_level}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
