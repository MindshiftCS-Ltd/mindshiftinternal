-- Singleton organisation settings row, backing System Settings > Organisation.
create table public.org_settings (
  id boolean primary key default true,
  name text not null default 'Mindshift',
  logo_path text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now(),
  constraint org_settings_singleton check (id)
);

insert into public.org_settings (id, name) values (true, 'Mindshift');

alter table public.org_settings enable row level security;

create policy "org_settings_select" on public.org_settings
  for select to authenticated using (true);

create policy "org_settings_write" on public.org_settings
  for update to authenticated using (public.is_flm()) with check (public.is_flm());

-- Public bucket for org branding assets (logo). Writes restricted to FLM/super_admin.
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

create policy "branding_flm_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding' and public.is_flm());

create policy "branding_flm_update" on storage.objects
  for update to authenticated using (bucket_id = 'branding' and public.is_flm());

create policy "branding_flm_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'branding' and public.is_flm());
