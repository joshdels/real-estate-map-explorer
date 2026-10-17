-- Run in the Supabase SQL editor. Never expose a service-role key in Vite.
create table if not exists public.app_datasets (
  slug text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_datasets enable row level security;

create policy "public can read published dataset"
on public.app_datasets for select
to anon, authenticated
using (slug = 'default');

create policy "authenticated users can insert dataset"
on public.app_datasets for insert
to authenticated
with check (slug = 'default');

create policy "authenticated users can update dataset"
on public.app_datasets for update
to authenticated
using (slug = 'default')
with check (slug = 'default');

-- Seed the `default` row from data/data.json through the dashboard or a trusted
-- server-side migration. Do not weaken write policies for the browser passcode.
