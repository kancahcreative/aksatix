-- AKSATIX / SOLO SPEAK UP — jalankan di Supabase SQL Editor.
-- Tidak mengubah tabel tiket Aksatix yang sudah ada.
create extension if not exists pgcrypto;

create table if not exists public.solo_speak_up_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_code text not null unique,
  email text not null,
  full_name text not null,
  nickname text,
  domicile text not null,
  whatsapp text not null,
  current_activity text not null,
  reasons jsonb not null default '[]'::jsonb,
  attendance_count text not null check (attendance_count in ('Pertama kali','2 kali','3 kali atau lebih')),
  topics jsonb not null default '[]'::jsonb,
  requested_skills text not null,
  venue_agreement boolean not null default false,
  donation_willing boolean not null default false,
  donation_amount numeric(12,2) not null default 0 check (donation_amount >= 0),
  payment_method text,
  proof_path text,
  proof_filename text,
  donation_status text not null default 'Tidak Berdonasi' check (donation_status in ('Tidak Berdonasi','Menunggu Verifikasi','Terverifikasi','Perlu Perbaikan')),
  registration_status text not null default 'Menunggu Konfirmasi' check (registration_status in ('Menunggu Konfirmasi','Terkonfirmasi','Ditolak','Dibatalkan')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ssu_donation_consistency check (
    (donation_willing = false and donation_amount = 0 and payment_method is null and proof_path is null)
    or (donation_willing = true and donation_amount > 0 and payment_method in ('Transfer BRI','DANA','ShopeePay'))
  )
);
create index if not exists ssu_reg_created_idx on public.solo_speak_up_registrations(created_at desc);
create index if not exists ssu_reg_status_idx on public.solo_speak_up_registrations(registration_status, donation_status);

alter table public.solo_speak_up_registrations enable row level security;
drop policy if exists "SSU public submit registration" on public.solo_speak_up_registrations;
create policy "SSU public submit registration" on public.solo_speak_up_registrations
  for insert to anon, authenticated with check (
    length(trim(full_name)) between 2 and 120
    and length(trim(email)) between 5 and 180
    and length(trim(whatsapp)) between 8 and 25
    and venue_agreement = true
    and registration_status = 'Menunggu Konfirmasi'
    and ((donation_willing = false and donation_status = 'Tidak Berdonasi' and donation_amount = 0)
      or (donation_willing = true and donation_status = 'Menunggu Verifikasi' and donation_amount > 0 and proof_path is not null))
  );
drop policy if exists "SSU admins read registrations" on public.solo_speak_up_registrations;
create policy "SSU admins read registrations" on public.solo_speak_up_registrations
  for select to authenticated using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));
drop policy if exists "SSU admins update registrations" on public.solo_speak_up_registrations;
create policy "SSU admins update registrations" on public.solo_speak_up_registrations
  for update to authenticated using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));
revoke all on public.solo_speak_up_registrations from anon, authenticated;
grant insert on public.solo_speak_up_registrations to anon, authenticated;
grant select, update on public.solo_speak_up_registrations to authenticated;

-- Private bucket for donation receipts. Receipts are not publicly readable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('solo-speak-up-proofs','solo-speak-up-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=5242880, allowed_mime_types=array['image/jpeg','image/png','image/webp','application/pdf'];

drop policy if exists "SSU public upload donation proof" on storage.objects;
create policy "SSU public upload donation proof" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'solo-speak-up-proofs' and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
drop policy if exists "SSU admins view donation proofs" on storage.objects;
create policy "SSU admins view donation proofs" on storage.objects for select to authenticated
using (bucket_id = 'solo-speak-up-proofs' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));
drop policy if exists "SSU admins delete donation proofs" on storage.objects;
create policy "SSU admins delete donation proofs" on storage.objects for delete to authenticated
using (bucket_id = 'solo-speak-up-proofs' and exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));

-- NOTE: public submission is intentionally insert-only; visitors cannot list or read other registrations.
-- To prevent abuse at scale, add CAPTCHA/rate-limiting or route submissions through a server-side function.


-- Pengaturan event/form dikelola melalui dashboard admin, bukan hard-coded di halaman publik.
create table if not exists public.solo_speak_up_config (
  id integer primary key default 1 check (id = 1),
  event_title text not null default 'Solo Speak Up',
  tagline text not null default 'Berani Bicara, Siap Bersinar',
  description text not null default 'Ruang untuk belajar public speaking, membangun rasa percaya diri, dan berkembang bersama dalam lingkungan yang suportif.',
  event_date text not null default 'Jadwal diumumkan panitia',
  venue text not null default 'Konco Space, Colomadu',
  venue_rules text not null default 'Saya bersedia mematuhi aturan tempat kegiatan dan tidak membawa makanan atau minuman dari luar apabila aturan venue mengharuskannya.',
  donation_note text not null default 'Donasi bersifat sukarela untuk mendukung pengembangan komunitas. Nominal rekomendasi Rp10.000 atau lebih.',
  donation_minimum integer not null default 10000 check (donation_minimum >= 0),
  bri_account text not null default '644701016709537',
  ewallet_number text not null default '082138010258',
  account_name text not null default 'KHILYA AZ ZAHRA',
  help_text text not null default 'Jika ada kendala pengisian formulir atau pembayaran, hubungi panitia Solo Speak Up melalui kanal resmi komunitas.',
  published boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
insert into public.solo_speak_up_config (id) values (1) on conflict (id) do nothing;
alter table public.solo_speak_up_config enable row level security;
drop policy if exists "SSU public read published config" on public.solo_speak_up_config;
create policy "SSU public read published config" on public.solo_speak_up_config for select to anon, authenticated using (published = true);
drop policy if exists "SSU admin read config" on public.solo_speak_up_config;
create policy "SSU admin read config" on public.solo_speak_up_config for select to authenticated using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));
drop policy if exists "SSU admin update config" on public.solo_speak_up_config;
create policy "SSU admin update config" on public.solo_speak_up_config for update to authenticated using (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.aksatix_admins a where a.user_id = (select auth.uid())));
revoke all on public.solo_speak_up_config from anon, authenticated;
grant select on public.solo_speak_up_config to anon, authenticated;
grant update on public.solo_speak_up_config to authenticated;
