import { Outlet, useMatches } from 'react-router-dom'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const matches = useMatches()
  const title = [...matches].reverse().find((m) => (m.handle as { title?: string } | undefined)?.title)
    ?.handle as { title?: string } | undefined

  return (
    <div className="flex min-h-screen gap-3 bg-background p-3">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_-4px_rgba(16,24,40,0.08)]">
        <Topbar title={title?.title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
