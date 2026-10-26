-- AKSATIX HOTFIX: run this in Supabase SQL Editor AFTER supabase-setup.sql
-- and supabase-client-setup.sql. Safe to run more than once.

create table if not exists public.aksatix_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.aksatix_records (
  kind text not null check (kind in ('events','tickets','orders','attendees','organizers','promos','settings')),
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (kind, record_id)
);
create index if not exists aksatix_records_kind_idx on public.aksatix_records(kind);
alter table public.aksatix_admins enable row level security;
alter table public.aksatix_records enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.aksatix_records to anon;
grant select, insert, update, delete on public.aksatix_records to authenticated;
grant select on public.aksatix_admins to authenticated;

-- Rebuild public read policies using case-insensitive status matching.
drop policy if exists "public read published events" on public.aksatix_records;
create policy "public read published events" on public.aksatix_records
for select to anon, authenticated
using (kind = 'events' and lower(trim(coalesce(payload->>'status',''))) = 'published');

drop policy if exists "public read active tickets" on public.aksatix_records;
create policy "public read active tickets" on public.aksatix_records
for select to anon, authenticated
using (kind = 'tickets' and lower(trim(coalesce(payload->>'status',''))) = 'active');

-- Admin policy is explicit and keyed to the authenticated user's UUID.
drop policy if exists "admins full access records" on public.aksatix_records;
create policy "admins full access records" on public.aksatix_records
for all to authenticated
using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

drop policy if exists "admin can read own admin record" on public.aksatix_admins;
create policy "admin can read own admin record" on public.aksatix_admins
for select to authenticated using (user_id = (select auth.uid()));

-- Refresh PostgREST schema cache after table/policy changes.
notify pgrst, 'reload schema';
