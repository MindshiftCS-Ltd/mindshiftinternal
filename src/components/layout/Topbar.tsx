import { Bell, Building2, ClipboardList, FileText, Folder, LayoutDashboard, LogOut, Menu, Search, Settings, User } from 'lucide-react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'

import { SidebarContent } from '@/components/layout/Sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/AuthProvider'
import { useDepartments } from '@/hooks/useDepartments'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function roleLabel(isSuperAdmin: boolean, isFlm: boolean, departmentRoles: { role: { name: string } }[]) {
  if (isSuperAdmin) return 'Super Admin'
  if (isFlm) return 'FLM'
  return departmentRoles[0]?.role.name ?? 'Staff'
}

const staticResults = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'My Work', to: '/my-work', icon: ClipboardList },
  { label: 'Documents', to: '/documents', icon: Folder },
  { label: 'Admin · Form Builder', to: '/admin/forms', icon: FileText },
]

function SearchBox() {
  const navigate = useNavigate()
  const { departments } = useDepartments()
  const [query, setQuery] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const q = query.trim().toLowerCase()
  const matchedPages = q ? staticResults.filter((r) => r.label.toLowerCase().includes(q)) : staticResults
  const matchedDepartments = q ? departments.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 5) : []

  function go(to: string) {
    navigate(to)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex h-10 items-center gap-2 rounded-full border border-input bg-secondary/60 px-4 text-sm">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search departments, forms, or anything…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden shrink-0 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </div>
      {open && (matchedPages.length > 0 || matchedDepartments.length > 0) && (
        <div className="absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-lg">
          {matchedPages.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {matchedPages.map((r) => (
                <button
                  key={r.to}
                  onClick={() => go(r.to)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <r.icon className="size-4 text-muted-foreground" />
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {matchedDepartments.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-1">
              {matchedDepartments.map((d) => (
                <button
                  key={d.id}
                  onClick={() => go(`/departments/${d.id}`)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Topbar({ title }: { title?: string }) {
  const { profile, isSuperAdmin, isFlm, departmentRoles, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const displayName = profile?.full_name ?? 'Demo User'

  React.useEffect(() => {
    if (!isSupabaseConfigured || !profile) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [profile])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-card/95 px-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] backdrop-blur">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setMobileOpen(true)}>
        <Menu className="size-5" />
      </Button>

      <h1 className="hidden shrink-0 truncate text-sm font-semibold lg:block">{title ?? 'Dashboard'}</h1>
      <div className="hidden flex-1 justify-center px-4 lg:flex">
        <SearchBox />
      </div>
      <div className="flex flex-1 lg:hidden">
        <SearchBox />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {!isSupabaseConfigured && (
          <Badge variant="warning" className="hidden sm:inline-flex">
            Demo data · backend not connected
          </Badge>
        )}
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-accent">
              <Avatar className="size-8">
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-semibold">{displayName}</span>
                <span className="block text-xs text-muted-foreground">
                  {roleLabel(isSuperAdmin, isFlm, departmentRoles)}
                </span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
              <Settings /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
