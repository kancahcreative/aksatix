-- AKSATIX: Form pendaftaran event (builder di admin/client, isian di checkout, upload file privat).
-- Jalankan di Supabase SQL Editor SETELAH supabase-setup.sql, supabase-tickets.sql, supabase-quota-patch.sql,
-- supabase-client-dashboard.sql. Aman diulang.

-- 1) Bucket PRIVAT untuk file upload pembeli (KTP, bukti, foto, dll) ------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('event-form-uploads', 'event-form-uploads', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

-- Pembeli hanya boleh upload & baca file di folder miliknya: <user-id>/<event-id>/<order-no>/...
drop policy if exists "form uploads insert own" on storage.objects;
create policy "form uploads insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'event-form-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "form uploads read own" on storage.objects;
create policy "form uploads read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-form-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Admin boleh melihat semua file.
drop policy if exists "form uploads admin read" on storage.objects;
create policy "form uploads admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-form-uploads'
    and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

-- Client/penyelenggara hanya boleh melihat file dari event miliknya.
drop policy if exists "form uploads organizer read" on storage.objects;
create policy "form uploads organizer read" on storage.objects
  for select to authenticated
  using (bucket_id = 'event-form-uploads'
    and exists (select 1 from public.aksatix_records r
                where r.kind = 'events'
                  and r.record_id = (storage.foldername(name))[2]
                  and r.payload->>'organizer_id' = (select auth.uid())::text));

-- 2) Validasi di server: pesanan untuk event ber-form harus memuat jawaban pertanyaan wajib ----------
--    (client tidak bisa melewati form dengan memanggil API langsung). Admin / SQL editor dilewati.
--    Pertanyaan ber-logika tampil (showIf) tidak dicek di server karena bergantung pada jawaban lain.
create or replace function public.aksatix_check_form()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid_ uuid := auth.uid();
  ev jsonb; frm jsonb; f jsonb; r jsonb; a jsonb; v jsonb; resp jsonb;
  found boolean; qty int;
begin
  if uid_ is null or new.kind <> 'orders' then return new; end if;
  if exists (select 1 from public.aksatix_admins x where x.user_id = uid_) then return new; end if;

  select payload into ev from public.aksatix_records
   where kind = 'events'
     and (record_id = new.payload->>'eventId' or payload->>'id' = new.payload->>'eventId')
   limit 1;
  frm := ev->'regForm';
  if frm is null or coalesce(frm->>'enabled', 'false') <> 'true' then return new; end if;

  resp := coalesce(new.payload->'formResponses', '[]'::jsonb);
  if jsonb_typeof(resp) <> 'array' or jsonb_array_length(resp) = 0 then
    raise exception 'Form pendaftaran wajib diisi';
  end if;
  qty := greatest(1, least(coalesce(nullif(new.payload->>'qty', '')::int, 1), 10));
  if frm->>'scope' = 'ticket' and jsonb_array_length(resp) < qty then
    raise exception 'Form pendaftaran wajib diisi untuk setiap tiket';
  end if;

  for f in select * from jsonb_array_elements(coalesce(frm->'fields', '[]'::jsonb)) loop
    if f->>'type' = 'section' or coalesce(f->>'required', 'false') <> 'true' or f->'showIf' is not null then
      continue;
    end if;
    for r in select * from jsonb_array_elements(resp) loop
      found := false;
      for a in select * from jsonb_array_elements(coalesce(r->'answers', '[]'::jsonb)) loop
        if a->>'id' = f->>'id' then
          v := a->'value';
          if v is not null and v not in ('""'::jsonb, '[]'::jsonb, 'false'::jsonb, 'null'::jsonb) then found := true; end if;
        end if;
      end loop;
      if not found then raise exception 'Pertanyaan wajib belum diisi: %', f->>'label'; end if;
    end loop;
  end loop;
  return new;
end $$;

drop trigger if exists aksatix_check_form on public.aksatix_records;
create trigger aksatix_check_form
  before insert on public.aksatix_records
  for each row execute function public.aksatix_check_form();
