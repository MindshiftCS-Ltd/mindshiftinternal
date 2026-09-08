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

**Connected to a live Supabase project** — `nmigitalvbvutkrosvby` ("MCS
internal", eu-west-2). All 15 migrations are applied (schema, RLS policies,
function privilege lockdown, FK indexes, seed data), and `giftakerele1@gmail.com`
exists as the first Super Admin (staff number `MS-STAFF-0001`). Set
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env` (see below) to point
your local dev server at it.

Without a `.env`, the app still runs against a bundled demo dataset
(`src/lib/demoData.ts`) so every screen is clickable without a backend —
`isSupabaseConfigured` in `src/lib/supabase.ts` gates the fallback, and while
unconfigured the app also treats the session as a full-access demo admin so
Administration can be previewed too.

## Getting started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Copy `.env.example` to `.env` and fill in the
project URL/anon key below to hit the live database; without a `.env` you'll
see the full app running on demo data with a "Demo data · backend not
connected" badge in the header instead.

```
VITE_SUPABASE_URL=https://nmigitalvbvutkrosvby.supabase.co
VITE_SUPABASE_ANON_KEY=<the publishable/anon key from Supabase → Project Settings → API>
```

The same values need to be set as environment variables in Vercel
(Project Settings → Environment Variables) when you deploy.

### First login

`giftakerele1@gmail.com` is already set up as Super Admin. Sign in with the
temporary password shared in chat when the account was created, then change
it from Supabase Auth (or wire up a "change password" screen — not built
yet). To add more people:

- They sign up from the login screen's "Create an account" link (creates an
  `auth.users` row → a `profiles` row via the `handle_new_auth_user` trigger,
  with no role yet).
- An admin then grants them a role from Administration → Users & Roles (a
  department-scoped role via `department_members`, or a global one —
  `super_admin`/`flm` — via `user_global_roles`).

To bootstrap a *new* Super Admin directly by SQL (e.g. before the Users &
Roles screen can do it), run in the Supabase SQL Editor:
```sql
insert into public.user_global_roles (user_id, role_id)
select '<the user''s auth.users id>', id from public.roles where slug = 'super_admin';
```

### Applying future schema changes

New files in `supabase/migrations/` can be applied via `supabase db push`
(Supabase CLI) or pasted into Supabase Dashboard → SQL Editor → New query →
Run, in filename order. After a schema change, regenerate the TypeScript
types:
```
npx supabase gen types typescript --project-id nmigitalvbvutkrosvby > src/types/database.generated.ts
```

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
    brand/         Logo (LogoMark / LogoWordmark) — vector placeholder for the
                    real Mindshift logo asset, swap in src/components/brand/Logo.tsx
  features/
    auth/          AuthProvider, LoginPage (sign in + self-service sign-up), ProtectedRoute
    dashboard/     DashboardPage (live stats/activity/records)
    departments/   DepartmentsListPage, DepartmentDetailPage (Forms/Records/Workflows/Reports tabs)
    mywork/        MyWorkPage (My Approvals / My Tasks / My Submissions)
    documents/     DocumentsPage (live list; no upload flow yet)
    reports/       ReportsPage (submissions by department)
    profile/       ProfilePage (self view/edit)
    admin/         CreateDepartmentDialog, AdminDepartmentsPage, AdminUsersPage,
                    FormBuilderPage, WorkflowBuilderPage, AuditLogPage, SystemSettingsPage
  hooks/
    useDepartments.ts  live department list, demo-data fallback
  lib/
    supabase.ts    typed Supabase client + isSupabaseConfigured flag
    demoData.ts    fallback dataset shown until a backend is connected
    fieldTypes.ts  Form Builder field type catalogue
  types/
    domain.ts             hand-written convenience types mirroring the SQL schema,
                          used for casts in AuthProvider etc.
    database.generated.ts generated via the Supabase Management API from the live
                          project — regenerate after every schema change (see above)
supabase/
  migrations/      full schema, RLS policies, function privilege lockdown,
                   FK indexes, triggers and seed data (15 files, all applied)
```

## What's built vs. what's next

Every screen reads and writes the live Supabase project when `.env` is set
(falls back to `demoData.ts` only when it isn't):

- Real auth: sign in, self-service sign-up, protected routes
- Dashboard: live stat cards (active staff, departments, published forms, my
  approvals, my open tasks, total submissions), a recent-activity feed from
  `audit_logs`, and recent submission cards
- Department directory + detail (live department list; the Forms tab reads
  real `forms` rows for that department)
- My Work: My Approvals (approve/reject with the real workflow engine —
  deciding an approval advances the chain via the DB trigger), My Tasks,
  My Submissions
- Documents: live list from the `documents` table (upload isn't wired up —
  needs a Supabase Storage bucket, noted on the page)
- Reports: submissions-by-department, computed from live `form_submissions`
- My Profile: view/edit your own profile; shows whether HR has a
  confidential record on file for you
- Administration → Departments (`+ Create Department`, no code required)
- Administration → Form Builder (create a form, add/remove fields,
  publish/draft — writes `forms`/`form_fields` directly)
- Administration → Workflow Builder (create a workflow, add approval steps
  by reporting-manager/department-head/role/specific-person — writes
  `workflows`/`workflow_steps` directly)
- Administration → Users & Roles (grants department-scoped or org-wide
  roles to any signed-up user — no invite-by-email flow, since that needs a
  service-role key this build doesn't have; people self-register from the
  login screen and an admin grants their role here)
- Administration → Audit Log (live `audit_logs`, newest first)
- Administration → System Settings (still a static preview — org
  name/logo/numbering-convention fields aren't persisted yet)

Genuinely not built yet: file upload to Documents (needs a Storage
bucket + policies), email/Teams notification delivery (the `notifications`
table and in-app rows exist; nothing sends email yet), and a dedicated
Staff Master Data → HR review → staff number assignment UI (the generic
form/workflow engine already supports building this as an ordinary form).
