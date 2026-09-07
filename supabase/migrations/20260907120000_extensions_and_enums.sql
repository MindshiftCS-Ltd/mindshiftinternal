-- Mindshift Internal Operations & Administration Platform
-- Core extensions and shared enum types.

create extension if not exists "pgcrypto";

create type public.submission_status as enum (
  'draft',
  'submitted',
  'in_review',
  'approved',
  'rejected',
  'cancelled'
);

create type public.approval_status as enum (
  'pending',
  'approved',
  'rejected',
  'skipped'
);

create type public.task_status as enum (
  'open',
  'in_progress',
  'blocked',
  'done',
  'cancelled'
);

create type public.document_access_level as enum (
  'public',
  'department',
  'restricted'
);

create type public.form_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.field_type as enum (
  'short_text',
  'long_text',
  'number',
  'date',
  'dropdown',
  'multi_select',
  'checkbox',
  'file_upload',
  'email',
  'phone',
  'signature'
);

create type public.approver_type as enum (
  'specific_user',
  'role',
  'department_head',
  'reporting_manager'
);

create type public.staff_status as enum (
  'probation',
  'active',
  'on_leave',
  'suspended',
  'exited'
);
