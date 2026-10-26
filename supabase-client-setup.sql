-- AKSATIX CLIENT / ORGANIZER ACCESS POLICIES
-- Run supabase-setup.sql first, then run this file in Supabase SQL Editor.
-- Keeps existing admin access while restricting client CRUD to their own events.

-- SECURITY DEFINER avoids recursive RLS evaluation when checking a ticket/order's parent event.
create or replace function public.aksatix_organizer_owns_event(p_event_id text, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.aksatix_records e
    where e.kind = 'events'
      and e.record_id = p_event_id
      and e.payload->>'organizer_id' = p_user_id::text
  );
$$;
revoke all on function public.aksatix_organizer_owns_event(text, uuid) from public;
grant execute on function public.aksatix_organizer_owns_event(text, uuid) to authenticated;

-- Own events, promo codes, and organizer settings.
drop policy if exists "organizers manage own events promos settings" on public.aksatix_records;
create policy "organizers manage own events promos settings"
on public.aksatix_records for all to authenticated
using (
  payload->>'organizer_id' = (select auth.uid())::text
  and kind in ('events','promos','settings')
)
with check (
  payload->>'organizer_id' = (select auth.uid())::text
  and kind in ('events','promos','settings')
);

-- Tickets can be managed only when their parent event belongs to the signed-in organizer.
drop policy if exists "organizers manage tickets for own events" on public.aksatix_records;
create policy "organizers manage tickets for own events"
on public.aksatix_records for all to authenticated
using (
  kind = 'tickets' and payload->>'organizer_id' = (select auth.uid())::text
)
with check (
  kind = 'tickets'
  and payload->>'organizer_id' = (select auth.uid())::text
  and public.aksatix_organizer_owns_event(payload->>'eventId', (select auth.uid()))
);

-- Read-only access to orders and attendees belonging to an organizer's own events.
-- Client-side users cannot fabricate payment statuses or check-in records.
drop policy if exists "organizers read orders for own events" on public.aksatix_records;
create policy "organizers read orders for own events"
on public.aksatix_records for select to authenticated
using (
  kind in ('orders','attendees')
  and public.aksatix_organizer_owns_event(payload->>'eventId', (select auth.uid()))
);

-- Published events and active tickets remain publicly readable under the policies in supabase-setup.sql.
-- Existing admins retain their separate full-access policy through aksatix_admins.
