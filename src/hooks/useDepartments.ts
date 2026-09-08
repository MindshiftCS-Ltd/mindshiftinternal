import * as React from 'react'

import { demoDepartments } from '@/lib/demoData'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import type { Department } from '@/types/domain'

export interface DepartmentView {
  id: string
  name: string
  code: string
  description: string
  memberCount: number
  openRecords: number
}

function fromRow(row: Department): DepartmentView {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description ?? '',
    memberCount: 0,
    openRecords: 0,
  }
}

export function useDepartments() {
  const [departments, setDepartments] = React.useState<DepartmentView[]>(
    isSupabaseConfigured ? [] : demoDepartments,
  )
  const [loading, setLoading] = React.useState(isSupabaseConfigured)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDepartments(demoDepartments)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    if (err) {
      setError(err.message)
    } else {
      setError(null)
      setDepartments((data ?? []).map(fromRow))
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  return { departments, loading, error, refresh }
}
