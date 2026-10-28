-- AKSATIX: direktori akun pengguna untuk dashboard admin. Aman dijalankan berulang.
-- Data disinkronkan dari Supabase Auth; tidak ada akses publik ke direktori ini.
create table if not exists public.aksatix_user_directory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text, full_name text, phone text, avatar_url text, provider text,
  created_at timestamptz, last_sign_in_at timestamptz, user_metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.aksatix_user_directory enable row level security;
grant select on public.aksatix_user_directory to authenticated;
drop policy if exists "Admins can read Aksatix user directory" on public.aksatix_user_directory;
create policy "Admins can read Aksatix user directory" on public.aksatix_user_directory
 for select to authenticated using (exists(select 1 from public.aksatix_admins a where a.user_id=(select auth.uid())));
create or replace function public.aksatix_sync_user_directory() returns trigger language plpgsql security definer set search_path=public,auth as $$
begin
 insert into public.aksatix_user_directory(user_id,email,full_name,phone,avatar_url,provider,created_at,last_sign_in_at,user_metadata,updated_at)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'),coalesce(new.phone,new.raw_user_meta_data->>'phone',new.raw_user_meta_data->>'whatsapp'),new.raw_user_meta_data->>'avatar_url',coalesce(new.raw_app_meta_data->>'provider','email'),new.created_at,new.last_sign_in_at,coalesce(new.raw_user_meta_data,'{}'::jsonb),now())
 on conflict(user_id) do update set email=excluded.email,full_name=excluded.full_name,phone=excluded.phone,avatar_url=excluded.avatar_url,provider=excluded.provider,last_sign_in_at=excluded.last_sign_in_at,user_metadata=excluded.user_metadata,updated_at=now();
 return new;
end $$;
drop trigger if exists aksatix_auth_user_directory_sync on auth.users;
create trigger aksatix_auth_user_directory_sync after insert or update of email,phone,raw_user_meta_data,raw_app_meta_data,last_sign_in_at on auth.users for each row execute function public.aksatix_sync_user_directory();
-- Backfill akun yang sudah ada sebelum trigger dipasang.
insert into public.aksatix_user_directory(user_id,email,full_name,phone,avatar_url,provider,created_at,last_sign_in_at,user_metadata,updated_at)
select id,email,coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name'),coalesce(phone,raw_user_meta_data->>'phone',raw_user_meta_data->>'whatsapp'),raw_user_meta_data->>'avatar_url',coalesce(raw_app_meta_data->>'provider','email'),created_at,last_sign_in_at,coalesce(raw_user_meta_data,'{}'::jsonb),now() from auth.users
on conflict(user_id) do update set email=excluded.email,full_name=excluded.full_name,phone=excluded.phone,avatar_url=excluded.avatar_url,provider=excluded.provider,last_sign_in_at=excluded.last_sign_in_at,user_metadata=excluded.user_metadata,updated_at=now();
