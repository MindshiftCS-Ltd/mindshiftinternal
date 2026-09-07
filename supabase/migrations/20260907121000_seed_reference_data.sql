-- Reference data the platform needs to function on day one. Departments here
-- are a starting point, not a hard-coded list -- Administration > Departments
-- > + Create Department adds more without touching the schema or the app.

insert into public.roles (slug, name, description, is_system) values
  ('super_admin', 'Super Admin', 'Full access to every module, department and configuration screen.', true),
  ('flm', 'FLM', 'Organisation-wide oversight: approvals, reports and cross-department visibility.', true),
  ('department_head', 'Department Head', 'Full access to their own department''s forms, records and workflows.', true),
  ('department_officer', 'Department Officer', 'Operational access within their department.', true),
  ('project_manager', 'Project Manager', 'Project-related access plus assigned project records.', true),
  ('hr_admin', 'HR Admin', 'Staff records, recruitment, leave, attendance and HR documents.', true),
  ('finance_admin', 'Finance Admin', 'Financial records, invoices, expenses, payments and budgets.', true),
  ('staff', 'Staff', 'Own profile, own submissions, and whatever their department grants.', true)
on conflict (slug) do nothing;

insert into public.departments (name, code, description) values
  ('Executive / Management', 'EXEC', 'Executive leadership and organisational management.'),
  ('Operations & Projects', 'OPS', 'Day-to-day operations and project delivery.'),
  ('Human Resources', 'HR', 'Recruitment, staff records, leave, attendance and performance.'),
  ('Finance & Accounts', 'FIN', 'Budgets, payments, invoices and financial reporting.'),
  ('Administration', 'ADMIN', 'General administration and office management.'),
  ('Information Technology / Systems', 'IT', 'Systems, infrastructure and internal tooling.'),
  ('Legal & Compliance', 'LEGAL', 'Contracts, regulatory compliance and legal review.'),
  ('Business Development & Sales', 'BD', 'Lead generation, proposals and new business.'),
  ('Client Relations / Client Success', 'CLIENT', 'Client onboarding, retention and support.'),
  ('Partnerships & Stakeholder Engagement', 'PARTNER', 'External partnerships and stakeholder relationships.'),
  ('Project Management', 'PM', 'Cross-functional project planning and delivery oversight.'),
  ('Monitoring & Evaluation (M&E)', 'ME', 'Programme monitoring, evaluation and learning.'),
  ('Training & Learning', 'TRAIN', 'Internal and client-facing training programmes.'),
  ('Research & Consulting', 'RESEARCH', 'Research services and consulting engagements.'),
  ('Marketing', 'MKT', 'Marketing campaigns and market positioning.'),
  ('Communications', 'COMMS', 'Internal and external communications.'),
  ('Community Management', 'COMM', 'Community engagement and moderation.'),
  ('Brand & Creative', 'BRAND', 'Brand identity and creative production.'),
  ('Procurement & Vendor Management', 'PROC', 'Purchasing and vendor relationships.'),
  ('Inventory & Asset Management', 'ASSET', 'Inventory tracking and asset management.'),
  ('Knowledge & Documentation Management', 'KNOW', 'Institutional knowledge and documentation.')
on conflict (code) do nothing;
