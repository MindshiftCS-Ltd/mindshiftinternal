// Static fallback data shown when no Supabase project is connected yet
// (see isSupabaseConfigured in src/lib/supabase.ts). Mirrors the shape of
// supabase/migrations/20260907121000_seed_reference_data.sql so the UI looks
// and behaves the same once a real backend is wired in.

export interface DemoDepartment {
  id: string
  name: string
  code: string
  description: string
  memberCount: number
  openRecords: number
}

export const demoDepartments: DemoDepartment[] = [
  { id: 'exec', name: 'Executive / Management', code: 'EXEC', description: 'Executive leadership and organisational management.', memberCount: 3, openRecords: 1 },
  { id: 'ops', name: 'Operations & Projects', code: 'OPS', description: 'Day-to-day operations and project delivery.', memberCount: 8, openRecords: 5 },
  { id: 'hr', name: 'Human Resources', code: 'HR', description: 'Recruitment, staff records, leave, attendance and performance.', memberCount: 4, openRecords: 7 },
  { id: 'fin', name: 'Finance & Accounts', code: 'FIN', description: 'Budgets, payments, invoices and financial reporting.', memberCount: 3, openRecords: 4 },
  { id: 'admin', name: 'Administration', code: 'ADMIN', description: 'General administration and office management.', memberCount: 2, openRecords: 2 },
  { id: 'it', name: 'Information Technology / Systems', code: 'IT', description: 'Systems, infrastructure and internal tooling.', memberCount: 2, openRecords: 3 },
  { id: 'legal', name: 'Legal & Compliance', code: 'LEGAL', description: 'Contracts, regulatory compliance and legal review.', memberCount: 1, openRecords: 1 },
  { id: 'bd', name: 'Business Development & Sales', code: 'BD', description: 'Lead generation, proposals and new business.', memberCount: 5, openRecords: 9 },
  { id: 'client', name: 'Client Relations / Client Success', code: 'CLIENT', description: 'Client onboarding, retention and support.', memberCount: 3, openRecords: 3 },
  { id: 'partner', name: 'Partnerships & Stakeholder Engagement', code: 'PARTNER', description: 'External partnerships and stakeholder relationships.', memberCount: 2, openRecords: 1 },
  { id: 'pm', name: 'Project Management', code: 'PM', description: 'Cross-functional project planning and delivery oversight.', memberCount: 4, openRecords: 6 },
  { id: 'me', name: 'Monitoring & Evaluation (M&E)', code: 'ME', description: 'Programme monitoring, evaluation and learning.', memberCount: 2, openRecords: 2 },
  { id: 'train', name: 'Training & Learning', code: 'TRAIN', description: 'Internal and client-facing training programmes.', memberCount: 2, openRecords: 1 },
  { id: 'research', name: 'Research & Consulting', code: 'RESEARCH', description: 'Research services and consulting engagements.', memberCount: 3, openRecords: 2 },
  { id: 'mkt', name: 'Marketing', code: 'MKT', description: 'Marketing campaigns and market positioning.', memberCount: 3, openRecords: 4 },
  { id: 'comms', name: 'Communications', code: 'COMMS', description: 'Internal and external communications.', memberCount: 2, openRecords: 2 },
  { id: 'community', name: 'Community Management', code: 'COMM', description: 'Community engagement and moderation.', memberCount: 1, openRecords: 1 },
  { id: 'brand', name: 'Brand & Creative', code: 'BRAND', description: 'Brand identity and creative production.', memberCount: 2, openRecords: 3 },
  { id: 'proc', name: 'Procurement & Vendor Management', code: 'PROC', description: 'Purchasing and vendor relationships.', memberCount: 2, openRecords: 2 },
  { id: 'asset', name: 'Inventory & Asset Management', code: 'ASSET', description: 'Inventory tracking and asset management.', memberCount: 1, openRecords: 1 },
  { id: 'know', name: 'Knowledge & Documentation Management', code: 'KNOW', description: 'Institutional knowledge and documentation.', memberCount: 1, openRecords: 0 },
]

export const demoStats = [
  { label: 'Active Staff', value: 24 },
  { label: 'Active Projects', value: 8 },
  { label: 'Pending Requests', value: 12 },
  { label: 'Leave Requests', value: 3 },
  { label: 'New Leads', value: 17 },
  { label: 'Open Tasks', value: 31 },
]

export const demoActivity = [
  { id: 1, text: 'HR created new staff record', who: 'Ada N.', when: '2h ago' },
  { id: 2, text: 'Finance approved vendor payment', who: 'Chuka O.', when: '4h ago' },
  { id: 3, text: 'BD qualified new lead', who: 'Tomiwa A.', when: '6h ago' },
  { id: 4, text: 'Project Manager updated project', who: 'Dara A.', when: 'Yesterday' },
  { id: 5, text: 'Admin approved leave request', who: 'Gift A.', when: 'Yesterday' },
]

export const demoRecords = [
  {
    id: 'STAFF-026',
    kind: 'Staff',
    title: 'Precious O.',
    subtitle: 'Operations & Projects · Project Officer',
    meta: 'Joined 04 Sept 2026',
    status: 'Active' as const,
  },
  {
    id: 'LR-0042',
    kind: 'Leave Request',
    title: 'Dara Akerele',
    subtitle: 'Operations',
    meta: '12 Sept – 16 Sept · 5 working days',
    status: 'Pending Approval' as const,
  },
  {
    id: 'LD-0187',
    kind: 'Lead',
    title: 'ABC Consulting',
    subtitle: 'Business Advisory · Source: LinkedIn',
    meta: 'Value: ₦4,500,000',
    status: 'Qualified' as const,
  },
]

