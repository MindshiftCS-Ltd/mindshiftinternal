import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { AuditLogPage } from '@/features/admin/AuditLogPage'
import { AdminDepartmentsPage } from '@/features/admin/AdminDepartmentsPage'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { FormBuilderPage } from '@/features/admin/FormBuilderPage'
import { SystemSettingsPage } from '@/features/admin/SystemSettingsPage'
import { WorkflowBuilderPage } from '@/features/admin/WorkflowBuilderPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DepartmentDetailPage } from '@/features/departments/DepartmentDetailPage'
import { DepartmentsListPage } from '@/features/departments/DepartmentsListPage'
import { PlaceholderPage } from '@/features/misc/PlaceholderPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
          {
            path: 'my-work',
            element: <PlaceholderPage title="My Work" description="Tasks assigned to you and requests awaiting your action." />,
            handle: { title: 'My Work' },
          },
          { path: 'departments', element: <DepartmentsListPage />, handle: { title: 'Departments' } },
          { path: 'departments/:departmentId', element: <DepartmentDetailPage />, handle: { title: 'Department' } },
          {
            path: 'documents',
            element: <PlaceholderPage title="Documents" description="Company, HR, Finance, project and client documents in one place." />,
            handle: { title: 'Documents' },
          },
          {
            path: 'reports',
            element: <PlaceholderPage title="Reports" description="Organisation-wide reporting across every department." />,
            handle: { title: 'Reports' },
          },
          {
            path: 'profile',
            element: <PlaceholderPage title="My Profile" description="Your personal details, documents and staff record." />,
            handle: { title: 'My Profile' },
          },
          { path: 'admin/departments', element: <AdminDepartmentsPage />, handle: { title: 'Administration · Departments' } },
          { path: 'admin/users', element: <AdminUsersPage />, handle: { title: 'Administration · Users & Roles' } },
          { path: 'admin/forms', element: <FormBuilderPage />, handle: { title: 'Administration · Form Builder' } },
          { path: 'admin/workflows', element: <WorkflowBuilderPage />, handle: { title: 'Administration · Workflow Builder' } },
          { path: 'admin/audit-log', element: <AuditLogPage />, handle: { title: 'Administration · Audit Log' } },
          { path: 'admin/settings', element: <SystemSettingsPage />, handle: { title: 'Administration · System Settings' } },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
