# Mindshift Internal — Operations & Administration Platform

A single internal system where every department gets its own workspace —
forms, records, workflows and reports — while Admin/FLM get an
organisation-wide view. The core idea: **departments, forms, fields,
workflows, statuses and permissions are configuration, not code.** Creating
a new department, publishing a new form, or wiring up a new approval chain
is an action inside the app, never a source change.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui-style primitives (Radix UI + CVA), hand-authored in `src/components/ui` |
| Backend / BaaS | Supabase (Postgres, Auth, Storage) |
| Routing | React Router v7 |
| Forms/validation | React Hook Form + Zod (wired, not yet used by every screen) |

No other framework or backend was substituted — per the project brief, this
stays on Supabase; Vercel is the intended deploy target.

## Current status

**A live Supabase project has not been provisioned yet.** The app runs
today against a bundled demo dataset (`src/lib/demoData.ts`) so every screen
is fully clickable and visually complete without a backend. The moment
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (see below) and the
migrations in `supabase/migrations/` are applied, the same UI starts reading
and writing real data — the demo dataset is only ever a fallback
(`isSupabaseConfigured` in `src/lib/supabase.ts` gates it).

While unconfigured, the app also treats the current session as a full-access
demo admin (see `AuthProvider`) so every screen, including Administration,
can be reviewed before real auth/roles exist.

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Without a `.env`, you'll see the full app
running on demo data with a "Demo data · backend not connected" badge in
the header.

### Connecting Supabase

1. Create a Supabase project (dashboard or `supabase projects create`).
2. Apply the schema: `supabase db push` (or run the files in
   `supabase/migrations/` in order against the project's SQL editor).
3. Copy `.env.example` to `.env` and fill in your project's URL and anon key:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
4. Sign a user up through Supabase Auth (or the app's login screen once a
   sign-up flow is added), then bootstrap that user as the first Super
   Admin:
   ```sql
   insert into public.user_global_roles (user_id, role_id)
   select '<the user''s auth.users id>', id from public.roles where slug = 'super_admin';
   ```
   Every other role and department assignment can be managed from the app
   from that point on.

## Data model & configuration engine

The schema (`supabase/migrations/`) is the heart of the "no code changes"
promise:

- **`departments`** — the org's workspaces. Admin/FLM create rows here;
  the app has zero hard-coded department list. 21 starter departments are
  seeded (`20260907121000_seed_reference_data.sql`) matching the org's
  initial structure, but they're ordinary rows, editable and extendable.
- **`roles` / `department_members` / `user_global_roles`** — implements
  `User → Role → Department → Permissions`. `super_admin` and `flm` are
  organisation-wide; `department_head`, `department_officer`, `hr_admin`,
  `finance_admin`, `project_manager` are scoped per department per user.
- **`forms` / `form_fields`** — the Form Builder engine. A form belongs to
  a department (or is organisation-wide when `department_id` is null);
  fields carry type (`short_text`, `dropdown`, `file_upload`, `signature`,
  …), required flag and order. The Form Builder UI
  (`/admin/forms`) edits these tables directly.
- **`form_submissions`** — every submission becomes a record/card, with an
  auto-generated reference code (`LR-0042`, `LD-0187`, …) driven by the
  `sequences` table and `next_reference_code()` — so numbering conventions
  are configuration too.
- **`workflows` / `workflow_steps` / `submission_approvals`** — the
  Workflow Builder engine: WHEN a form is submitted, THEN route it through
  an ordered chain of steps (reporting manager → a named role → a specific
  person → the department head). Triggers
  (`start_submission_workflow`, `advance_submission_workflow`) instantiate
  and progress the chain automatically, and fire notifications at each
  hand-off.
- **`tasks`** — "My Work" items, optionally linked back to a submission.
- **`documents`** — company/department/project/client files with an
  `access_level` (`public` / `department` / `restricted`).
- **`notifications`** — in-app notifications created by the workflow
  engine (extend to email/Teams via a Supabase Edge Function later).
- **`audit_logs`** — a generic `audit_log_trigger()` records who/what/when
  and before/after state on every sensitive table (departments, forms,
  submissions, profiles, staff_confidential, role assignments).
- **`profiles` / `staff_confidential`** — deliberately split: `profiles`
  holds the non-sensitive directory info visible department-wide;
  `staff_confidential` (NIN, BVN, bank details, salary) is a separate
  table with much tighter Row Level Security, so a broad "read profiles"
  grant can never leak payroll or ID data.

### Security model (Row Level Security)

Every table has RLS enabled — nothing is "everyone can see everything"
(`supabase/migrations/20260907120900_rls_policies.sql`):

- Staff see their own profile, submissions and tasks, plus whatever their
  department role grants.
- Department heads / HR admins / Finance admins see their department's
  records.
- FLM and Super Admin see across the organisation.
- `staff_confidential` is readable only by its owner, HR admins and Super
  Admin — never by a generic "department member" grant.
- `audit_logs` is readable only by FLM/Super Admin.

All of this is enforced with SQL security-definer helper functions
(`is_super_admin()`, `is_flm()`, `is_department_head(dept_id)`, …) rather
than duplicated subqueries, so policies stay short and auditable.

## App structure

```
src/
  components/
    ui/            shadcn-style primitives (button, card, dialog, table, ...)
    layout/        AppShell, Sidebar, Topbar
    dashboard/     StatCard, RecordCard (the "everything is a card" pattern)
  features/
    auth/          AuthProvider, LoginPage, ProtectedRoute
    dashboard/     DashboardPage
    departments/   DepartmentsListPage, DepartmentDetailPage (Forms/Records/Workflows/Reports tabs)
    admin/         CreateDepartmentDialog, AdminDepartmentsPage, AdminUsersPage,
                    FormBuilderPage, WorkflowBuilderPage, AuditLogPage, SystemSettingsPage
    misc/          PlaceholderPage (My Work, Documents, Reports, Profile — scaffolded
                    in the nav and data model, not yet built out)
  lib/
    supabase.ts    typed Supabase client + isSupabaseConfigured flag
    demoData.ts    fallback dataset shown until a backend is connected
    fieldTypes.ts  Form Builder field type catalogue
  types/
    domain.ts      hand-written types mirroring the SQL schema
    database.ts    Supabase Database generic built from domain.ts
                   (swap for `supabase gen types typescript` once a project exists)
supabase/
  migrations/      full schema, RLS policies, triggers and seed data
```

## What's built vs. what's next

Built end-to-end (schema + RLS + UI, demo-data backed until Supabase is
connected):

- Department directory + detail (Forms/Records/Workflows/Reports tabs)
- Administration → Departments (`+ Create Department`, no code required)
- Administration → Form Builder (create a form, add/remove fields, publish/draft)
- Administration → Workflow Builder (WHEN/THEN approval chain editor)
- Administration → Users & Roles, Audit Log, System Settings
- Dashboard with stat cards, record cards and an activity feed
- Auth scaffolding (login, protected routes, role-aware sidebar)

Scaffolded in the data model and navigation, ready to build out next:
My Work (task inbox), Documents, Reports, My Profile, email/Teams
notification delivery, and a Staff Master Data → HR review → staff number
assignment flow on top of the generic form/workflow engine that already
supports it.
