import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Folder,
  LayoutDashboard,
  Plus,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react'
import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

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
  { label: 'Reports', to: '/reports', icon: BarChart3 },
]

const adminNav: NavItem[] = [
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Users & Roles', to: '/admin/users', icon: Users },
  { label: 'Form Builder', to: '/admin/forms', icon: FileText },
  { label: 'Workflow Builder', to: '/admin/workflows', icon: Workflow },
  { label: 'Audit Log', to: '/admin/audit-log', icon: ShieldCheck },
  { label: 'System Settings', to: '/admin/settings', icon: Settings },
]

interface QuickAction {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

const quickActions: QuickAction[] = [
  { label: 'Create Department', to: '/admin/departments', icon: Building2 },
  { label: 'Create Form', to: '/admin/forms', icon: FileText },
  { label: 'Create Workflow', to: '/admin/workflows/new', icon: Workflow },
  { label: 'Add Staff', to: '/admin/users', icon: UserPlus },
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
              'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function QuickActionsList({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  return (
    <nav className="flex flex-col gap-0.5">
      {quickActions.map((action) => (
        <button
          key={action.label}
          onClick={() => {
            navigate(action.to)
            onNavigate?.()
          }}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-sidebar-accent/50">
            <Plus className="size-3" />
          </span>
          {action.label}
        </button>
      ))}
    </nav>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isFlm } = useAuth()

  return (
    <div className="flex h-full flex-col rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary p-1">
          <img src="/brand/logo-icon.png" alt="Mindshift" className="size-full object-contain" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold">Mindshift</p>
          <p className="text-[10px] font-medium tracking-widest text-sidebar-foreground/45 uppercase">Internal System</p>
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

        <p className="mt-6 mb-1 px-3 text-xs font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
          Quick Actions
        </p>
        <QuickActionsList onNavigate={onNavigate} />
      </div>

      <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-accent p-4">
        <p className="text-sm leading-snug font-semibold text-accent-foreground">
          Better systems.
          <br />
          Greater impact.
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-3 h-[calc(100vh-1.5rem)] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_-4px_rgba(16,24,40,0.08)]">
        <SidebarContent />
      </div>
    </aside>
  )
}
