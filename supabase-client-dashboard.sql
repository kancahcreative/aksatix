-- AKSATIX: fitur lengkap Dashboard Client (upload poster, scan/check-in, peserta manual).
-- Jalankan SETELAH supabase-setup.sql, supabase-client-setup.sql, supabase-fix-connection.sql,
-- supabase-tickets.sql, supabase-quota-patch.sql. Aman diulang.

-- 1) Client boleh upload/ganti/hapus poster HANYA di folder miliknya: org/<user-id>/... -------------
drop policy if exists "Organizers can upload own event banners" on storage.objects;
create policy "Organizers can upload own event banners" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-banners'
    and (storage.foldername(name))[1] = 'org'
    and (storage.foldername(name))[2] = (select auth.uid())::text);

drop policy if exists "Organizers can update own event banners" on storage.objects;
create policy "Organizers can update own event banners" on storage.objects
  for update to authenticated
  using (bucket_id = 'event-banners' and (storage.foldername(name))[1] = 'org' and (storage.foldername(name))[2] = (select auth.uid())::text)
  with check (bucket_id = 'event-banners' and (storage.foldername(name))[1] = 'org' and (storage.foldername(name))[2] = (select auth.uid())::text);

drop policy if exists "Organizers can delete own event banners" on storage.objects;
create policy "Organizers can delete own event banners" on storage.objects
  for delete to authenticated
  using (bucket_id = 'event-banners' and (storage.foldername(name))[1] = 'org' and (storage.foldername(name))[2] = (select auth.uid())::text);

-- 2) Operasi peserta untuk client (check-in, tambah manual, void, ubah, hapus) -----------------------
--    Lewat fungsi server agar client TIDAK bisa memalsukan status pembayaran / data pesanan.
--    Admin juga boleh memakai fungsi ini. Tiap aksi dicek: peserta harus milik event si pemanggil.
create or replace function public.aksatix_org_attendee(
  p_action text,
  p_id     text  default null,
  p_data   jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid_ uuid := auth.uid();
  is_admin boolean;
  a jsonb; rid text; ev jsonb; t jsonb; ord jsonb; evid text; tid text;
  raw text; compact text; c2 text; manual boolean; st text;
begin
  if uid_ is null then return jsonb_build_object('ok', false, 'message', 'Silakan login terlebih dahulu.'); end if;
  is_admin := exists (select 1 from public.aksatix_admins x where x.user_id = uid_);

  ---------------------------------------------------------------- tambah peserta manual
  if p_action = 'add' then
    evid := p_data->>'eventId';
    tid  := nullif(p_data->>'ticketId', '');
    select payload into ev from public.aksatix_records
     where kind = 'events' and (record_id = evid or payload->>'id' = evid) limit 1;
    if ev is null then return jsonb_build_object('ok', false, 'message', 'Event tidak ditemukan.'); end if;
    if not is_admin and ev->>'organizer_id' is distinct from uid_::text then
      return jsonb_build_object('ok', false, 'message', 'Event ini bukan milik akun Anda.');
    end if;
    if length(trim(coalesce(p_data->>'name', ''))) < 2 then
      return jsonb_build_object('ok', false, 'message', 'Nama peserta wajib diisi.');
    end if;
    if tid is not null then
      select payload into t from public.aksatix_records
       where kind = 'tickets' and (record_id = tid or payload->>'id' = tid) limit 1;
      if t is null or (t->>'eventId') is distinct from (ev->>'id') then
        return jsonb_build_object('ok', false, 'message', 'Jenis tiket tidak cocok dengan event.');
      end if;
      perform public.aksatix_quota_change(tid, 1);  -- peserta manual memakai 1 kuota (error jika habis)
    end if;
    rid := 'MAN-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10));
    insert into public.aksatix_records (kind, record_id, payload)
    values ('attendees', rid, jsonb_build_object(
      'id', rid, 'manual', true, 'orderId', null, 'orderNumber', rid,
      'eventId', ev->>'id', 'eventName', coalesce(ev->>'name', ev->>'title', 'Event'),
      'ticketId', tid, 'ticketName', coalesce(t->>'name', 'Tamu / Undangan'),
      'name', trim(p_data->>'name'), 'email', coalesce(trim(p_data->>'email'), ''), 'phone', coalesce(trim(p_data->>'phone'), ''),
      'organizer_id', coalesce(ev->>'organizer_id', ''),
      'code', public.aksatix_new_ticket_code(),
      'status', 'Valid', 'checkedIn', false, 'checkinAt', null, 'issuedAt', now()));
    return jsonb_build_object('ok', true, 'message', 'Peserta ditambahkan.', 'id', rid);
  end if;

  ---------------------------------------------------------------- aksi lain: cari peserta
  raw     := upper(regexp_replace(coalesce(p_id, ''), '\s', '', 'g'));
  compact := regexp_replace(raw, '[^A-Z0-9]', '', 'g');
  c2      := raw;
  if compact ~ '^AKS[A-Z0-9]{12}$' then
    c2 := substr(compact,1,3) || '-' || substr(compact,4,4) || '-' || substr(compact,8,4) || '-' || substr(compact,12,4);
  end if;
  if length(raw) < 4 then return jsonb_build_object('ok', false, 'message', 'Kode tiket tidak valid.'); end if;

  select record_id, payload into rid, a from public.aksatix_records
   where kind = 'attendees'
     and (record_id = p_id or payload->>'id' = p_id
          or upper(regexp_replace(coalesce(payload->>'code',''), '\s', '', 'g')) in (raw, c2, compact))
   limit 1;
  if a is null then
    return jsonb_build_object('ok', false, 'code', 'notfound', 'message', 'Tiket tidak ditemukan.');
  end if;
  if not is_admin
     and a->>'organizer_id' is distinct from uid_::text
     and not public.aksatix_organizer_owns_event(a->>'eventId', uid_) then
    return jsonb_build_object('ok', false, 'code', 'forbidden', 'message', 'Tiket ini bukan untuk event Anda.');
  end if;

  manual := coalesce((a->>'manual')::boolean, false);
  st     := coalesce(a->>'status', 'Valid');
  tid    := nullif(a->>'ticketId', '');

  if p_action = 'checkin' then
    if st = 'Void' then
      return jsonb_build_object('ok', false, 'code', 'void', 'message', 'Tiket dibatalkan / tidak berlaku.', 'name', a->>'name');
    end if;
    -- Tiket dari pesanan berbayar hanya boleh check-in setelah pesanan benar-benar Paid.
    -- Peserta manual dan tiket gratis tidak membutuhkan verifikasi pembayaran pesanan.
    if not manual and coalesce(a->>'paymentMethod', '') <> 'Free' then
      select payload into ord from public.aksatix_records
       where kind = 'orders'
         and (record_id = coalesce(a->>'orderId', '')
              or payload->>'id' = coalesce(a->>'orderId', '')
              or (coalesce(a->>'orderNumber', '') <> '' and payload->>'orderNumber' = a->>'orderNumber'))
       order by updated_at desc limit 1;
      if ord is not null and coalesce(ord->>'status', 'Pending') <> 'Paid' then
        return jsonb_build_object('ok', false, 'code', 'unpaid',
          'message', 'Pembayaran belum diterima. Silakan bayar kepada petugas sebelum melakukan check-in.',
          'name', a->>'name');
      end if;
    end if;
    if coalesce((a->>'checkedIn')::boolean, false) then
      return jsonb_build_object('ok', false, 'code', 'used', 'message', 'Tiket sudah digunakan.',
                                'name', a->>'name', 'checkinAt', a->>'checkinAt');
    end if;
    update public.aksatix_records
       set payload = payload || jsonb_build_object('checkedIn', true, 'checkinAt', now(), 'checkedInBy', uid_::text),
           updated_at = now()
     where kind = 'attendees' and record_id = rid;
    return jsonb_build_object('ok', true, 'message', 'Check-in berhasil.', 'name', a->>'name',
                              'eventName', a->>'eventName', 'ticketName', a->>'ticketName');

  elsif p_action = 'undo' then
    update public.aksatix_records
       set payload = payload || jsonb_build_object('checkedIn', false, 'checkinAt', null), updated_at = now()
     where kind = 'attendees' and record_id = rid;
    return jsonb_build_object('ok', true, 'message', 'Check-in dibatalkan.');

  elsif p_action = 'void' then
    if st <> 'Void' then
      update public.aksatix_records set payload = payload || '{"status":"Void"}'::jsonb, updated_at = now()
       where kind = 'attendees' and record_id = rid;
      if manual and tid is not null then perform public.aksatix_quota_change(tid, -1); end if;
    end if;
    return jsonb_build_object('ok', true, 'message', 'Tiket dinonaktifkan.');

  elsif p_action = 'restore' then
    if st = 'Void' then
      if manual and tid is not null then perform public.aksatix_quota_change(tid, 1); end if;
      update public.aksatix_records set payload = payload || '{"status":"Valid"}'::jsonb, updated_at = now()
       where kind = 'attendees' and record_id = rid;
    end if;
    return jsonb_build_object('ok', true, 'message', 'Tiket diaktifkan kembali.');

  elsif p_action = 'update' then
    update public.aksatix_records
       set payload = payload || jsonb_build_object(
             'name',  coalesce(nullif(trim(p_data->>'name'), ''), a->>'name'),
             'email', coalesce(trim(p_data->>'email'), a->>'email'),
             'phone', coalesce(trim(p_data->>'phone'), a->>'phone')), updated_at = now()
     where kind = 'attendees' and record_id = rid;
    return jsonb_build_object('ok', true, 'message', 'Data peserta diperbarui.');

  elsif p_action = 'delete' then
    if not manual then
      return jsonb_build_object('ok', false, 'message', 'Peserta dari pesanan tidak bisa dihapus. Gunakan "Nonaktifkan".');
    end if;
    delete from public.aksatix_records where kind = 'attendees' and record_id = rid;
    if st <> 'Void' and tid is not null then perform public.aksatix_quota_change(tid, -1); end if;
    return jsonb_build_object('ok', true, 'message', 'Peserta dihapus.');
  end if;

  return jsonb_build_object('ok', false, 'message', 'Aksi tidak dikenal.');
end $$;

revoke all on function public.aksatix_org_attendee(text, text, jsonb) from public;
grant execute on function public.aksatix_org_attendee(text, text, jsonb) to authenticated;

notify pgrst, 'reload schema';
