-- AKSATIX: KUOTA BERKURANG SAAT CHECKOUT (reservasi kuota) — jalankan di Supabase SQL Editor.
-- Jalankan PALING AKHIR (setelah supabase-tickets.sql). Aman diulang.
--
-- Aturan baru:
--  * Kuota (field "sold" pada tiket) bertambah SAAT PESANAN DIBUAT (Pending/Paid), bukan menunggu admin melunasi.
--  * Pesanan Cancelled / Refunded / Expired -> kuota dikembalikan otomatis.
--  * Pesanan dihapus -> kuota dikembalikan. Pesanan dihidupkan lagi -> kuota dipesan lagi (dicek ulang).
--  * Perhitungan atomik di database (baris tiket dikunci), jadi dua pembeli bersamaan tidak bisa melebihi kuota.
--  * Browser (organizer/client) tidak bisa mengubah "sold" langsung; hanya trigger ini.

-- 1) Guard order: validasi & harga dihitung server. Kuota TIDAK lagi diubah di sini (lihat trigger sync di bawah).
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
       or new.payload->>'total' is distinct from old.payload->>'total'
       or new.payload->>'qty' is distinct from old.payload->>'qty'
       or new.payload->>'ticketId' is distinct from old.payload->>'ticketId' then
      raise exception 'Status/total/jumlah pesanan hanya dapat diubah admin';
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

-- 2) Reservasi / pelepasan kuota (berlaku untuk SEMUA pengguna, termasuk admin) ----------------
create or replace function public.aksatix_quota_active(p_status text)
returns boolean language sql immutable as $$
  select lower(trim(coalesce(p_status,''))) not in ('cancelled','canceled','refunded','expired','void','dibatalkan')
$$;

create or replace function public.aksatix_quota_change(p_ticket text, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if p_ticket is null or p_ticket = '' or p_delta = 0 then return; end if;
  perform set_config('aksatix.quota_sync', '1', true);  -- izinkan perubahan "sold" oleh trigger ini
  update public.aksatix_records r
     set payload = jsonb_set(r.payload, '{sold}',
           to_jsonb(greatest(0, coalesce(nullif(r.payload->>'sold','')::int, 0) + p_delta)))
   where r.kind = 'tickets'
     and (r.record_id = p_ticket or r.payload->>'id' = p_ticket)
     and (p_delta < 0
          or coalesce(nullif(r.payload->>'quota','')::int, 0) <= 0
          or coalesce(nullif(r.payload->>'sold','')::int, 0) + p_delta <= (r.payload->>'quota')::int);
  get diagnostics n = row_count;
  if n = 0 and p_delta > 0 then
    raise exception 'Kuota tiket tidak mencukupi';
  end if;
end $$;
revoke all on function public.aksatix_quota_change(text, int) from public;

create or replace function public.aksatix_sync_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o_act boolean := false; n_act boolean := false;
  o_tid text; n_tid text; o_q int := 0; n_q int := 0;
begin
  if tg_op = 'DELETE' then
    if old.kind <> 'orders' then return null; end if;
  elsif new.kind <> 'orders' then
    return null;
  end if;
  if tg_op in ('UPDATE','DELETE') then
    o_act := public.aksatix_quota_active(old.payload->>'status');
    o_tid := old.payload->>'ticketId';
    o_q   := greatest(1, coalesce(nullif(old.payload->>'qty','')::int, 1));
  end if;
  if tg_op in ('INSERT','UPDATE') then
    n_act := public.aksatix_quota_active(new.payload->>'status');
    n_tid := new.payload->>'ticketId';
    n_q   := greatest(1, coalesce(nullif(new.payload->>'qty','')::int, 1));
  end if;

  -- tidak ada perubahan efektif pada kuota
  if tg_op = 'UPDATE' and o_act = n_act and o_tid is not distinct from n_tid and o_q = n_q then
    return null;
  end if;

  if o_act then perform public.aksatix_quota_change(o_tid, -o_q); end if;
  if n_act then perform public.aksatix_quota_change(n_tid,  n_q); end if;
  return null;
end $$;

drop trigger if exists aksatix_sync_quota_trg on public.aksatix_records;
create trigger aksatix_sync_quota_trg
  after insert or update or delete on public.aksatix_records
  for each row
  execute function public.aksatix_sync_quota();

-- 3) Lindungi field "sold": hanya trigger kuota / SQL editor yang boleh mengubahnya --------------
create or replace function public.aksatix_guard_ticket_sold()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(current_setting('aksatix.quota_sync', true), '') = '1' then
    return new;  -- SQL editor / service_role / trigger kuota
  end if;
  if tg_op = 'INSERT' then
    new.payload := jsonb_set(new.payload, '{sold}', '0'::jsonb);
  else
    new.payload := jsonb_set(new.payload, '{sold}', to_jsonb(coalesce(nullif(old.payload->>'sold','')::int, 0)));
  end if;
  return new;
end $$;

drop trigger if exists aksatix_guard_ticket_sold_trg on public.aksatix_records;
create trigger aksatix_guard_ticket_sold_trg
  before insert or update on public.aksatix_records
  for each row when (new.kind = 'tickets')
  execute function public.aksatix_guard_ticket_sold();

-- 4) HITUNG ULANG kuota terpakai dari pesanan yang masih aktif (sekali jalan, aman diulang) -------
select set_config('aksatix.quota_sync', '1', false);
update public.aksatix_records t
   set payload = jsonb_set(t.payload, '{sold}', to_jsonb(coalesce((
     select sum(greatest(1, coalesce(nullif(o.payload->>'qty','')::int, 1)))
       from public.aksatix_records o
      where o.kind = 'orders'
        and (o.payload->>'ticketId' = t.record_id or o.payload->>'ticketId' = t.payload->>'id')
        and public.aksatix_quota_active(o.payload->>'status')
   ), 0)::int))
 where t.kind = 'tickets';

-- 5) (Opsional) pesanan berbayar yang tidak dibayar otomatis dibatalkan agar kuota kembali -------
create or replace function public.aksatix_expire_pending(p_hours int default 24)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  update public.aksatix_records
     set payload = payload || '{"status":"Cancelled","cancelReason":"Pembayaran tidak diterima tepat waktu"}'::jsonb
   where kind = 'orders'
     and payload->>'status' = 'Pending'
     and coalesce(nullif(payload->>'createdAt','')::timestamptz, updated_at) < now() - make_interval(hours => p_hours);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.aksatix_expire_pending(int) from public;
-- Jadwalkan tiap 15 menit (Database > Extensions > aktifkan pg_cron), lalu hapus tanda komentar:
-- select cron.schedule('aksatix-expire-pending', '*/15 * * * *', $$select public.aksatix_expire_pending(24)$$);

notify pgrst, 'reload schema';
