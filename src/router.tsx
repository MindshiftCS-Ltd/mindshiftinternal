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
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { MyWorkPage } from '@/features/mywork/MyWorkPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ReportsPage } from '@/features/reports/ReportsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage />, handle: { title: 'Dashboard' } },
          { path: 'my-work', element: <MyWorkPage />, handle: { title: 'My Work' } },
          { path: 'departments', element: <DepartmentsListPage />, handle: { title: 'Departments' } },
          { path: 'departments/:departmentId', element: <DepartmentDetailPage />, handle: { title: 'Department' } },
          { path: 'documents', element: <DocumentsPage />, handle: { title: 'Documents' } },
          { path: 'reports', element: <ReportsPage />, handle: { title: 'Reports' } },
          { path: 'profile', element: <ProfilePage />, handle: { title: 'My Profile' } },
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
