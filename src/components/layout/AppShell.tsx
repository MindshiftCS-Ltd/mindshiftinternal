import { Outlet, useMatches } from 'react-router-dom'

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function AppShell() {
  const matches = useMatches()
  const title = [...matches].reverse().find((m) => (m.handle as { title?: string } | undefined)?.title)
    ?.handle as { title?: string } | undefined

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title?.title} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
