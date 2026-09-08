import {
  Building2,
  ClipboardList,
  FileText,
  Folder,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react'
import * as React from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '@/features/auth/AuthProvider'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  end?: boolean
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'My Work', to: '/my-work', icon: ClipboardList },
  { label: 'Departments', to: '/departments', icon: Building2 },
  { label: 'Documents', to: '/documents', icon: Folder },
  { label: 'Reports', to: '/reports', icon: FileText },
]

const adminNav: NavItem[] = [
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Users & Roles', to: '/admin/users', icon: Users },
  { label: 'Form Builder', to: '/admin/forms', icon: FileText },
  { label: 'Workflow Builder', to: '/admin/workflows', icon: Workflow },
  { label: 'Audit Log', to: '/admin/audit-log', icon: ShieldCheck },
  { label: 'System Settings', to: '/admin/settings', icon: Settings },
]

function NavGroup({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isFlm } = useAuth()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <img src="/brand/logo-icon.png" alt="Mindshift" className="size-full object-contain" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Mindshift Internal</p>
          <p className="text-xs text-sidebar-foreground/50">Ops &amp; Admin Platform</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <NavGroup items={primaryNav} onNavigate={onNavigate} />

        {isFlm && (
          <>
            <p className="mt-6 mb-1 px-3 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
              Administration
            </p>
            <NavGroup items={adminNav} onNavigate={onNavigate} />
          </>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
      <div className="sticky top-0 h-screen">
        <SidebarContent />
      </div>
    </aside>
  )
}
