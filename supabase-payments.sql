-- AKSATIX: Pembayaran Transfer (wajib bukti) + Cash di lokasi.
-- Jalankan SETELAH supabase-setup.sql, supabase-tickets.sql, supabase-quota-patch.sql,
-- supabase-client-dashboard.sql dan supabase-event-forms.sql (bucket event-form-uploads dipakai untuk bukti bayar). Aman diulang.
--
-- Aturan:
--  * Transfer/QRIS : pembeli wajib upload bukti. Hanya ADMIN yang bisa menyetujui / menolak bukti.
--  * Cash          : hanya jika event mengaktifkan (event.payCash = 'on'). Pesanan Pending + kuota dipesan.
--                    ADMIN atau CLIENT pemilik event menerima uang di lokasi -> status Paid -> e-tiket terbit.
--                    Otomatis batal jika melewati batas bayar (cashExpiresAt) - butuh pg_cron (lihat bawah).
--  * Batas anti-iseng: maks. tiket cash per pesanan (event.cashMaxQty, default 4) dan maks. 3 pesanan cash Pending per akun per event.

-- 1) Guard pesanan (menggantikan versi sebelumnya) -------------------------------------------------
create or replace function public.aksatix_guard_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid_ uuid := auth.uid();
  t jsonb; ev jsonb; tid text; evid text; price numeric; q int; line numeric;
  m text; extra jsonb := '{}'::jsonb; hrs numeric; maxq int; cnt int; start_ts timestamptz; exp_ts timestamptz;
begin
  -- SQL editor / service_role / cron: lewati. Admin: lewati.
  if uid_ is null then return new; end if;
  if exists (select 1 from public.aksatix_admins a where a.user_id = uid_) then return new; end if;

  if tg_op = 'UPDATE' then
    if current_setting('aksatix.trusted', true) = '1' then return new; end if;   -- dipasang fungsi RPC di bawah
    if new.payload->>'status'        is distinct from old.payload->>'status'
       or new.payload->>'total'      is distinct from old.payload->>'total'
       or new.payload->>'qty'        is distinct from old.payload->>'qty'
       or new.payload->>'ticketId'   is distinct from old.payload->>'ticketId'
       or new.payload->>'paymentMethod' is distinct from old.payload->>'paymentMethod'
       or new.payload->'paymentProof'   is distinct from old.payload->'paymentProof'
       or new.payload->>'proofStatus'   is distinct from old.payload->>'proofStatus'
       or new.payload->>'cashExpiresAt' is distinct from old.payload->>'cashExpiresAt'
       or new.payload->>'userId'     is distinct from old.payload->>'userId'
       or new.payload->>'organizer_id' is distinct from old.payload->>'organizer_id' then
      raise exception 'Status/pembayaran/jumlah pesanan hanya dapat diubah admin';
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

  evid := coalesce(nullif(t->>'eventId',''), new.payload->>'eventId');
  select payload into ev from public.aksatix_records
   where kind = 'events' and (record_id = evid or payload->>'id' = evid) limit 1;

  m := case when line = 0 then 'Free' when new.payload->>'paymentMethod' = 'Cash' then 'Cash' else 'Transfer' end;

  if m = 'Cash' then
    if coalesce(ev->>'payCash','off') <> 'on' then
      raise exception 'Event ini tidak menerima pembayaran cash di lokasi';
    end if;
    maxq := greatest(1, least(coalesce(nullif(ev->>'cashMaxQty','')::int, 4), 10));
    if q > maxq then raise exception 'Pembayaran cash maksimal % tiket per pesanan', maxq; end if;
    select count(*) into cnt from public.aksatix_records r
     where r.kind = 'orders' and r.payload->>'userId' = uid_::text
       and r.payload->>'paymentMethod' = 'Cash' and r.payload->>'status' = 'Pending'
       and r.payload->>'eventId' = new.payload->>'eventId';
    if cnt >= 3 then raise exception 'Kamu masih punya 3 pesanan cash yang belum dibayar untuk event ini'; end if;
    hrs := greatest(0, coalesce(nullif(ev->>'cashDeadlineHours','')::numeric, 0));
    begin
      start_ts := ((ev->>'date') || ' ' || coalesce(nullif(ev->>'time',''), '00:00'))::timestamp at time zone 'Asia/Jakarta';
      exp_ts := start_ts - (hrs || ' hours')::interval;
    exception when others then exp_ts := null; end;
    if exp_ts is not null and now() >= exp_ts then
      raise exception 'Batas pemesanan cash untuk event ini sudah lewat. Gunakan transfer.';
    end if;
    extra := jsonb_build_object('cashExpiresAt', exp_ts, 'cashNote', coalesce(ev->>'cashNote',''));
  elsif m = 'Transfer' then
    if coalesce(new.payload->'paymentProof'->>'path','') = ''
       or left(new.payload->'paymentProof'->>'path', length(uid_::text) + 1) <> uid_::text || '/' then
      raise exception 'Upload bukti pembayaran terlebih dahulu';
    end if;
    extra := jsonb_build_object('proofStatus', 'Menunggu');
  end if;

  new.payload := (new.payload - 'proofStatus' - 'cashExpiresAt' - 'cashNote' - 'paidAt' - 'paidBy' - 'rejectReason' - 'cancelReason')
    || jsonb_build_object(
      'qty', q,
      'total', line,
      'organizer_id', coalesce(t->>'organizer_id', new.payload->>'organizer_id', ''),
      'status', case when line = 0 then 'Paid' else 'Pending' end,
      'paymentMethod', m,
      'userId', uid_::text
    ) || extra;
  if m = 'Free' or m = 'Cash' then new.payload := new.payload - 'paymentProof'; end if;
  return new;
end $$;

-- 2) Aksi pesanan: terima cash / setujui bukti / tolak bukti / batalkan -----------------------------
--    Admin: semua. Client: hanya pesanan CASH milik event-nya.
create or replace function public.aksatix_order_action(p_order text, p_action text, p_note text default '')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid_ uuid := auth.uid(); adm boolean; base text; r record; np jsonb; out_ jsonb := '[]'::jsonb; n int := 0;
begin
  if uid_ is null then return jsonb_build_object('ok', false, 'message', 'Silakan login terlebih dahulu.'); end if;
  if p_action not in ('approve','reject','cancel') then return jsonb_build_object('ok', false, 'message', 'Aksi tidak dikenal.'); end if;
  adm := exists (select 1 from public.aksatix_admins x where x.user_id = uid_);

  select coalesce(nullif(payload->>'orderNumber',''), record_id) into base from public.aksatix_records
   where kind = 'orders' and (record_id = p_order or payload->>'id' = p_order or payload->>'orderNumber' = p_order) limit 1;
  if base is null then return jsonb_build_object('ok', false, 'message', 'Pesanan tidak ditemukan.'); end if;

  perform set_config('aksatix.trusted', '1', true);
  for r in
    select * from public.aksatix_records
     where kind = 'orders' and (payload->>'orderNumber' = base or record_id = base)
       and payload->>'status' = 'Pending'
       and (adm or (payload->>'organizer_id' = uid_::text and payload->>'paymentMethod' = 'Cash'))
     for update
  loop
    if p_action = 'reject' and r.payload->>'paymentMethod' not in ('Transfer','QRIS') then continue; end if;
    update public.aksatix_records set updated_at = now(),
      payload = r.payload || case p_action
        when 'approve' then jsonb_build_object('status','Paid','paidAt',now(),'paidBy',uid_::text,'proofStatus',case when r.payload->>'paymentMethod'='Transfer' then 'Disetujui' else coalesce(r.payload->>'proofStatus','') end)
        when 'reject'  then jsonb_build_object('proofStatus','Ditolak','rejectReason',left(coalesce(p_note,''),300))
        else jsonb_build_object('status','Cancelled','cancelReason',left(coalesce(nullif(p_note,''),'Dibatalkan oleh petugas'),300)) end
     where record_id = r.record_id returning payload into np;
    out_ := out_ || jsonb_build_array(np); n := n + 1;
  end loop;
  perform set_config('aksatix.trusted', '', true);

  if n = 0 then
    return jsonb_build_object('ok', false, 'message', 'Tidak ada pesanan Pending yang bisa Anda proses (client hanya bisa memproses pesanan cash miliknya).');
  end if;
  return jsonb_build_object('ok', true, 'orders', out_);
end $$;
revoke all on function public.aksatix_order_action(text, text, text) from public, anon;
grant execute on function public.aksatix_order_action(text, text, text) to authenticated;

-- 3) Pembeli mengunggah / mengganti bukti transfer (mis. setelah ditolak) ----------------------------
create or replace function public.aksatix_submit_proof(p_order text, p_proof jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare uid_ uuid := auth.uid(); base text; r record; np jsonb; n int := 0;
begin
  if uid_ is null then return jsonb_build_object('ok', false, 'message', 'Silakan login terlebih dahulu.'); end if;
  if coalesce(p_proof->>'path','') = '' or left(p_proof->>'path', length(uid_::text) + 1) <> uid_::text || '/' then
    return jsonb_build_object('ok', false, 'message', 'File bukti tidak valid.');
  end if;
  select coalesce(nullif(payload->>'orderNumber',''), record_id) into base from public.aksatix_records
   where kind = 'orders' and payload->>'userId' = uid_::text
     and (record_id = p_order or payload->>'id' = p_order or payload->>'orderNumber' = p_order) limit 1;
  if base is null then return jsonb_build_object('ok', false, 'message', 'Pesanan tidak ditemukan.'); end if;

  perform set_config('aksatix.trusted', '1', true);
  for r in
    select * from public.aksatix_records
     where kind = 'orders' and payload->>'userId' = uid_::text and (payload->>'orderNumber' = base or record_id = base)
       and payload->>'status' = 'Pending' and payload->>'paymentMethod' in ('Transfer','QRIS') for update
  loop
    update public.aksatix_records set updated_at = now(),
      payload = (r.payload - 'rejectReason') || jsonb_build_object(
        'paymentProof', jsonb_build_object('path', p_proof->>'path', 'name', left(coalesce(p_proof->>'name',''),120),
                                           'size', nullif(p_proof->>'size','')::bigint, 'type', left(coalesce(p_proof->>'type',''),80), 'uploadedAt', now()),
        'proofStatus', 'Menunggu')
     where record_id = r.record_id returning payload into np;
    n := n + 1;
  end loop;
  perform set_config('aksatix.trusted', '', true);
  if n = 0 then return jsonb_build_object('ok', false, 'message', 'Tidak ada pesanan transfer berstatus Pending untuk diperbarui.'); end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.aksatix_submit_proof(text, jsonb) from public, anon;
grant execute on function public.aksatix_submit_proof(text, jsonb) to authenticated;

-- 4) Kedaluwarsa: transfer tanpa bukti > p_hours jam, dan cash lewat cashExpiresAt -> Cancelled (kuota kembali) ---
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
   where kind = 'orders' and payload->>'status' = 'Pending'
     and (
       (coalesce(payload->>'paymentMethod','') <> 'Cash'
         and coalesce(payload->>'proofStatus','') <> 'Menunggu'
         and coalesce(nullif(payload->>'createdAt','')::timestamptz, updated_at) < now() - make_interval(hours => p_hours))
       or
       (payload->>'paymentMethod' = 'Cash' and nullif(payload->>'cashExpiresAt','') is not null
         and (payload->>'cashExpiresAt')::timestamptz < now())
     );
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.aksatix_expire_pending(int) from public, anon, authenticated;
-- Jadwalkan tiap 15 menit (Database > Extensions > aktifkan pg_cron), lalu hapus tanda komentar:
-- select cron.schedule('aksatix-expire-pending', '*/15 * * * *', $$select public.aksatix_expire_pending(24)$$);

notify pgrst, 'reload schema';
