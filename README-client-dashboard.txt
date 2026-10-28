AKSATIX CLIENT / ORGANIZER DASHBOARD

Files:
- client-dashboard.html: organizer dashboard with Supabase Auth and database CRUD for events, tickets, promos, and profile settings.
- supabase-config.js: existing Supabase project URL and public anon key (never put service_role keys in the browser).
- supabase-setup.sql: base schema and admin policies already included in the original project.
- supabase-client-setup.sql: organizer-scoped RLS policies for the client dashboard.
- index.html / admin.html / assets: original Aksatix site and admin dashboard.

SETUP REQUIRED BEFORE USE
1. In Supabase SQL Editor, run supabase-setup.sql if it has not already been run.
2. Then run supabase-client-setup.sql.
3. In Supabase Authentication settings, configure the allowed site URL and redirect URLs for the domain where this dashboard is hosted. Keep email confirmation enabled for production.
4. Deploy client-dashboard.html, supabase-config.js, assets/, and the other site files together to the same static hosting origin (or an appropriate subdirectory). Do not open as file://.
5. Test signup/login with a separate organizer account. Create an event, refresh the page, edit it, add a ticket, and verify it remains after signing in on another browser/device.
6. Confirm the public website displays only published events and active tickets.

BACKEND BEHAVIOR
- Supabase Auth signs organizers in with email/password.
- Event, ticket, promo, and organizer profile/bank-setting records are stored in aksatix_records with organizer_id ownership metadata.
- RLS restricts organizer CRUD to their own events/tickets/promos/settings. Existing admins retain their separate admin policy.
- Orders/attendees are read-only in the client dashboard and only visible for events owned by the organizer.
- Empty database means empty dashboard; demo event/order data is not inserted automatically.

IMPORTANT LIMITATIONS — NOT PAYMENT-PRODUCTION READY
- This connects the organizer dashboard to the existing Supabase backend once the SQL migrations are applied. The current environment cannot apply migrations or verify live login/read/write, so deployment is not claimed as tested.
- Payment gateway, trusted server-side webhook verification, atomic ticket inventory reservation, refund processing, e-ticket/QR issuance, secure check-in writes, and real payout ledger are not implemented by these static dashboard files. Do not accept real payments or treat estimated payout figures as actual funds until those backend functions are built and tested.
- The existing generic aksatix_records schema is retained for compatibility with the current admin/public website. A normalized schema with database constraints and Edge Functions is recommended before scaling ticket sales.

DATABASE CONNECTION FIX (IMPORTANT)
1. Open Supabase Dashboard > SQL Editor for project mfbcnlukdthxswzlfkcu.
2. Run supabase-setup.sql first, then supabase-client-setup.sql, then supabase-fix-connection.sql.
3. In Authentication > Users, copy the UUID of the intended admin account. In SQL Editor run:
   insert into public.aksatix_admins (user_id) values ('YOUR-AUTH-USER-UUID') on conflict do nothing;
4. In Table Editor > aksatix_records, confirm event records use kind='events', payload.status='Published', and tickets use kind='tickets', payload.status='Active'.
5. Keep supabase-config.js beside index.html, admin.html, login.html, and client-dashboard.html on the same deployed origin. Do not open pages using file://.
6. The client dashboard now waits for Supabase write success before showing a successful CRUD message. If a write is denied, it shows the database error and reloads persisted records.
7. Never put a service_role key in a browser file. Only use the public anon/publishable key.

==================== UPDATE: DASHBOARD CLIENT = ADMIN (SCOPE EVENT SENDIRI) ====================
client-dashboard.html dibangun ulang dari admin.html (CSS/tampilan identik). Bedanya hanya data: client hanya melihat & mengelola
event miliknya. Admin tetap mengontrol semuanya.
Fitur client: Event (poster upload, syarat & ketentuan, link Maps, slug, kuota event, duplikasi, lihat halaman publik),
Jenis tiket & kuota, Pesanan (baca saja + detail + ekspor), Peserta & Check-in (scanner QR kamera, input kode manual,
tambah tamu manual, edit, nonaktifkan, hapus tamu manual, ekspor), Promo & Kupon, Laporan & Analitik, Pengaturan (profil + rekening).

URUTAN SQL (jalankan di Supabase SQL Editor, semuanya aman diulang):
 1. supabase-setup.sql  2. supabase-client-setup.sql  3. supabase-fix-connection.sql  4. supabase-tickets.sql
 5. supabase-quota-patch.sql      <- BARU: kuota berkurang saat checkout (lihat di bawah)
 6. supabase-client-dashboard.sql <- BARU: upload poster client, check-in & tamu manual lewat fungsi server

KUOTA (supabase-quota-patch.sql)
 - Kuota ("sold") bertambah saat pesanan DIBUAT (Pending/Paid). Cancelled/Refunded/dihapus -> kuota kembali otomatis.
 - Dihitung atomik di database, jadi 2 pembeli bersamaan tidak bisa melewati kuota. Field "sold" tidak bisa diubah dari browser.
 - Langkah 4 di file itu menghitung ulang "sold" dari pesanan aktif yang ada (angka "sold" manual lama akan diganti hasil hitung).
 - Opsional: aksatix_expire_pending(24) membatalkan pesanan Pending > 24 jam agar kuota kembali (jadwalkan dengan pg_cron).
