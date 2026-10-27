-- AKSATIX: penerbitan e-tiket otomatis + antrean email/WA + cek keaslian tiket
-- Jalankan SETELAH supabase-setup.sql, supabase-client-setup.sql, supabase-fix-connection.sql.
-- Aman dijalankan berulang.

create extension if not exists pgcrypto with schema extensions;

-- 1) Kode tiket acak (60 bit, tanpa huruf/angka yang mirip: I O 0 1) --------------------
create or replace function public.aksatix_new_ticket_code()
returns text
language plpgsql
volatile
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 karakter
  b bytea := gen_random_bytes(12);
  s text := '';
  i int;
begin
  for i in 0..11 loop
    s := s || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return 'AKS-' || substr(s, 1, 4) || '-' || substr(s, 5, 4) || '-' || substr(s, 9, 4);
end $$;

create index if not exists aksatix_attendee_code_idx
  on public.aksatix_records ((payload->>'code')) where kind = 'attendees';
create index if not exists aksatix_attendee_order_idx
  on public.aksatix_records ((payload->>'orderId')) where kind = 'attendees';

-- 2) Antrean notifikasi (hanya service role / admin yang boleh baca) ---------------------
create table if not exists public.aksatix_outbox (
  id          bigint generated always as identity primary key,
  order_id    text        not null,               -- record_id baris order
  channel     text        not null check (channel in ('email','whatsapp')),
  recipient   text        not null,
  status      text        not null default 'pending' check (status in ('pending','sent','failed')),
  attempts    int         not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  unique (order_id, channel)
);
alter table public.aksatix_outbox enable row level security;
revoke all on public.aksatix_outbox from anon, authenticated;
grant select on public.aksatix_outbox to authenticated;
drop policy if exists "admins read outbox" on public.aksatix_outbox;
create policy "admins read outbox" on public.aksatix_outbox
  for select to authenticated
  using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

-- 3) Guard order: harga, total & status dihitung SERVER, bukan dipercaya dari browser -----
--    (sebelumnya customer bisa insert order status 'Paid' dengan total 0 untuk tiket berbayar)
create or replace function public.aksatix_guard_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid_ uuid := auth.uid();
  t jsonb; tid text; price numeric; q int; line numeric;
begin
  -- SQL editor / service_role / edge function: lewati. Admin: lewati.
  if uid_ is null then return new; end if;
  if exists (select 1 from public.aksatix_admins a where a.user_id = uid_) then return new; end if;

  if tg_op = 'UPDATE' then
    if new.payload->>'status' is distinct from old.payload->>'status'
       or new.payload->>'total' is distinct from old.payload->>'total' then
      raise exception 'Status/total pesanan hanya dapat diubah admin';
    end if;
    return new;
  end if;

  tid := new.payload->>'ticketId';
  select payload into t from public.aksatix_records
   where kind = 'tickets' and (record_id = tid or payload->>'id' = tid) limit 1;
  if t is null or lower(coalesce(t->>'status','')) <> 'active' then
    raise exception 'Tiket tidak tersedia';
  end if;

  q     := greatest(1, least(coalesce(nullif(new.payload->>'qty','')::int, 1), 10));
  price := coalesce(nullif(t->>'price','')::numeric, 0);
  line  := price * q;

  if line = 0 then
    -- tiket gratis: kunci baris tiket & cek kuota secara atomik
    update public.aksatix_records
       set payload = jsonb_set(payload, '{sold}', to_jsonb(coalesce(nullif(payload->>'sold','')::int, 0) + q))
     where kind = 'tickets' and record_id = (select record_id from public.aksatix_records
                                              where kind='tickets' and (record_id = tid or payload->>'id' = tid) limit 1)
       and coalesce(nullif(payload->>'sold','')::int, 0) + q
           <= coalesce(nullif(payload->>'quota','')::int, 2147483647);
    if not found then raise exception 'Kuota tiket tidak mencukupi'; end if;
  end if;

  new.payload := new.payload || jsonb_build_object(
    'qty', q,
    'total', line,
    'organizer_id', coalesce(t->>'organizer_id', new.payload->>'organizer_id', ''),
    'status', case when line = 0 then 'Paid' else 'Pending' end,
    'paymentMethod', case when line = 0 then 'Free' else 'QRIS' end,
    'userId', uid_::text
  );
  return new;
end $$;

drop trigger if exists aksatix_guard_order_trg on public.aksatix_records;
create trigger aksatix_guard_order_trg
  before insert or update on public.aksatix_records
  for each row when (new.kind = 'orders')
  execute function public.aksatix_guard_order();

-- 4) Order jadi Paid -> terbitkan tiket + antrekan email/WA. Dibatalkan -> tiket Void ----
create or replace function public.aksatix_on_order_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  p jsonb := new.payload;
  old_status text := case when tg_op = 'UPDATE' then coalesce(old.payload->>'status','') else '' end;
  qty int; i int; mail text; phone text;
begin
  if coalesce(p->>'status','') = 'Paid' and old_status <> 'Paid' then
    qty := greatest(1, least(coalesce(nullif(p->>'qty','')::int, 1), 20));
    for i in 1..qty loop
      insert into public.aksatix_records (kind, record_id, payload)
      values ('attendees', new.record_id || '-T' || i, jsonb_build_object(
        'id',          new.record_id || '-T' || i,
        'orderId',     new.record_id,
        'orderNumber', coalesce(p->>'orderNumber', new.record_id),
        'eventId',     p->>'eventId',
        'eventName',   coalesce(p->>'eventName', p->>'event_name', 'Event'),
        'ticketId',    p->>'ticketId',
        'ticketName',  coalesce(p->>'ticketName', 'Tiket'),
        'name',        coalesce(nullif(p->>'buyerName',''), p->>'buyer', ''),
        'email',       coalesce(nullif(p->>'buyerEmail',''), p->>'email', ''),
        'phone',       coalesce(nullif(p->>'buyerPhone',''), p->>'phone', ''),
        'userId',      p->>'userId',
        'organizer_id', coalesce(p->>'organizer_id', ''),
        'code',        public.aksatix_new_ticket_code(),
        'status',      'Valid',
        'checkedIn',   false,
        'checkinAt',   null,
        'issuedAt',    now()
      ))
      on conflict (kind, record_id) do nothing;
    end loop;

    mail  := nullif(trim(coalesce(nullif(p->>'buyerEmail',''), p->>'email', '')), '');
    phone := nullif(regexp_replace(coalesce(nullif(p->>'buyerPhone',''), p->>'phone', ''), '[^0-9+]', '', 'g'), '');
    if mail is not null then
      insert into public.aksatix_outbox (order_id, channel, recipient)
      values (new.record_id, 'email', mail) on conflict do nothing;
    end if;
    if phone is not null then
      insert into public.aksatix_outbox (order_id, channel, recipient)
      values (new.record_id, 'whatsapp', phone) on conflict do nothing;
    end if;

  elsif old_status = 'Paid' and coalesce(p->>'status','') in ('Cancelled','Refunded') then
    update public.aksatix_records
       set payload = payload || '{"status":"Void"}'::jsonb
     where kind = 'attendees' and payload->>'orderId' = new.record_id;
  end if;
  return new;
end $$;

drop trigger if exists aksatix_on_order_change_trg on public.aksatix_records;
create trigger aksatix_on_order_change_trg
  after insert or update on public.aksatix_records
  for each row when (new.kind = 'orders')
  execute function public.aksatix_on_order_change();

-- 5) Pembeli boleh melihat tiketnya sendiri ------------------------------------------------
drop policy if exists "customers read own attendees" on public.aksatix_records;
create policy "customers read own attendees" on public.aksatix_records
  for select to authenticated
  using (kind = 'attendees' and payload->>'userId' = (select auth.uid())::text);

-- 6) Cek keaslian tiket (publik, hanya lewat RPC; tabel attendees tetap tertutup) ---------
create or replace function public.aksatix_verify_ticket(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  raw text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g'));
  c1 text := raw;
  c2 text := raw;
  compact text := regexp_replace(raw, '[^A-Z0-9]', '', 'g');
  a jsonb; e jsonb; nm text; st text;
begin
  if length(raw) < 6 or length(raw) > 40 then
    return jsonb_build_object('found', false);
  end if;
  if compact ~ '^AKS[A-Z0-9]{12}$' then
    c2 := substr(compact,1,3) || '-' || substr(compact,4,4) || '-' || substr(compact,8,4) || '-' || substr(compact,12,4);
  end if;

  -- Prioritas kode e-tiket; fallback mendukung ID/nomor pesanan seperti AKS-ZH48-QXFQ-X4ZG.
  select payload into a from public.aksatix_records
   where kind = 'attendees'
     and upper(regexp_replace(coalesce(payload->>'code',''), '\s', '', 'g')) in (c1, c2, compact)
   limit 1;
  if a is null then
    select jsonb_build_object(
      'orderId', record_id,
      'orderNumber', coalesce(payload->>'orderNumber', payload->>'id', record_id),
      'eventId', payload->>'eventId',
      'ticketName', coalesce(payload->>'ticketName','Tiket'),
      'name', coalesce(payload->>'buyerName', payload->>'buyer',''),
      'status', case when coalesce(payload->>'status','') in ('Cancelled','Refunded','Void') then 'Void' else 'Valid' end,
      'checkedIn', false
    ) into a
    from public.aksatix_records
    where kind = 'orders'
      and upper(regexp_replace(coalesce(payload->>'orderNumber', payload->>'id', record_id), '[^A-Z0-9]', '', 'g')) = compact
    limit 1;
  end if;
  if a is null then return jsonb_build_object('found', false); end if;

  select payload into e from public.aksatix_records
   where kind = 'events' and (record_id = a->>'eventId' or payload->>'id' = a->>'eventId') limit 1;
  -- event non-published tidak terbaca anon, tapi fungsi ini definer sehingga tetap terbaca.

  st := case
          when coalesce(a->>'status','Valid') = 'Void' then 'void'
          when coalesce((a->>'checkedIn')::boolean, false) then 'used'
          else 'valid' end;

  nm := coalesce(a->>'name', '');
  nm := case when length(nm) <= 2 then repeat('*', length(nm))
             else left(nm, 2) || repeat('*', least(length(nm) - 2, 8)) end;

  return jsonb_build_object(
    'found', true,
    'status', st,
    'holder', nm,
    'ticketName', coalesce(a->>'ticketName', 'Tiket'),
    'eventName', coalesce(e->>'name', e->>'title', 'Event'),
    'eventDate', e->>'date',
    'eventTime', e->>'time',
    'venue', coalesce(e->>'venue', ''),
    'city', coalesce(e->>'city', '')
  );
end $$;

revoke all on function public.aksatix_verify_ticket(text) from public;
grant execute on function public.aksatix_verify_ticket(text) to anon, authenticated;

notify pgrst, 'reload schema';
