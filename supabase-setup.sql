-- AKSATIX: Supabase setup (run once in SQL Editor)
-- The browser must use only the publishable/anon key, never service_role.
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
create index if not exists aksatix_records_payload_gin_idx on public.aksatix_records using gin(payload);

alter table public.aksatix_admins enable row level security;
alter table public.aksatix_records enable row level security;

drop policy if exists "admin can read own admin record" on public.aksatix_admins;
create policy "admin can read own admin record" on public.aksatix_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "admins full access records" on public.aksatix_records;
create policy "admins full access records" on public.aksatix_records
  for all to authenticated
  using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

drop policy if exists "public read published events" on public.aksatix_records;
create policy "public read published events" on public.aksatix_records
  for select to anon, authenticated
  using (kind = 'events' and lower(trim(coalesce(payload->>'status',''))) = 'published');

drop policy if exists "public read active tickets" on public.aksatix_records;
create policy "public read active tickets" on public.aksatix_records
  for select to anon, authenticated
  using (kind = 'tickets' and lower(trim(coalesce(payload->>'status',''))) = 'active');

grant select on public.aksatix_admins to authenticated;
grant select, insert, update, delete on public.aksatix_records to authenticated;
grant select on public.aksatix_records to anon;

-- After creating the first user in Authentication > Users, copy its UUID and run:
-- insert into public.aksatix_admins (user_id) values ('PASTE_AUTH_USER_UUID_HERE');
-- Do NOT enable public signup for admin access. Add admin UUIDs manually.


-- Storage bucket untuk banner event (public read, admin upload/update/delete)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-banners', 'event-banners', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view event banners" on storage.objects;
create policy "Public can view event banners" on storage.objects
  for select to anon, authenticated using (bucket_id = 'event-banners');

drop policy if exists "Admins can upload event banners" on storage.objects;
create policy "Admins can upload event banners" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-banners' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can update event banners" on storage.objects;
create policy "Admins can update event banners" on storage.objects
  for update to authenticated using (bucket_id = 'event-banners' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())))
  with check (bucket_id = 'event-banners' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete event banners" on storage.objects;
create policy "Admins can delete event banners" on storage.objects
  for delete to authenticated using (bucket_id = 'event-banners' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));


-- Customer order access: customers may create and read only their own orders.
-- Existing admins retain full access through "admins full access records".
drop policy if exists "customers create own orders" on public.aksatix_records;
create policy "customers create own orders" on public.aksatix_records
  for insert to authenticated
  with check (
    kind = 'orders'
    and payload->>'userId' = (select auth.uid())::text
  );
drop policy if exists "customers read own orders" on public.aksatix_records;
create policy "customers read own orders" on public.aksatix_records
  for select to authenticated
  using (
    kind = 'orders'
    and payload->>'userId' = (select auth.uid())::text
  );
grant insert on public.aksatix_records to authenticated;


-- Organizer/client workspace policies. Organizer ownership is stored in payload.organizer_id.
drop policy if exists "organizers read own records" on public.aksatix_records;
create policy "organizers read own records" on public.aksatix_records
  for select to authenticated using (
    (kind in ('events','tickets','promos') and payload->>'organizer_id' = (select auth.uid())::text)
    or (kind = 'settings' and (record_id = 'client:' || (select auth.uid())::text or payload->>'organizer_id' = (select auth.uid())::text))
    or (kind = 'orders' and (payload->>'userId' = (select auth.uid())::text or payload->>'organizer_id' = (select auth.uid())::text))
  );
drop policy if exists "organizers insert own records" on public.aksatix_records;
create policy "organizers insert own records" on public.aksatix_records
  for insert to authenticated with check (
    (kind in ('events','tickets','promos') and payload->>'organizer_id' = (select auth.uid())::text)
    or (kind = 'settings' and (record_id = 'client:' || (select auth.uid())::text) and payload->>'organizer_id' = (select auth.uid())::text)
  );
drop policy if exists "organizers update own records" on public.aksatix_records;
create policy "organizers update own records" on public.aksatix_records
  for update to authenticated using (
    (kind in ('events','tickets','promos') and payload->>'organizer_id' = (select auth.uid())::text)
    or (kind = 'settings' and record_id = 'client:' || (select auth.uid())::text)
  ) with check (
    (kind in ('events','tickets','promos') and payload->>'organizer_id' = (select auth.uid())::text)
    or (kind = 'settings' and record_id = 'client:' || (select auth.uid())::text and payload->>'organizer_id' = (select auth.uid())::text)
  );
drop policy if exists "organizers delete own records" on public.aksatix_records;
create policy "organizers delete own records" on public.aksatix_records
  for delete to authenticated using (
    (kind in ('events','tickets','promos') and payload->>'organizer_id' = (select auth.uid())::text)
    or (kind = 'settings' and record_id = 'client:' || (select auth.uid())::text)
  );
