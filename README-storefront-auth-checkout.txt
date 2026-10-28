AKSATIX STOREFRONT + AUTH + CHECKOUT UPDATE

FILES
- index.html: event listing, clickable event details, ticket selection, cart, Google login/register, checkout and order history.
- admin.html: existing admin console.
- client-dashboard.html: client/organizer dashboard.
- supabase-config.js: existing Supabase project URL + anon key and optional QRIS image URL.
- supabase-setup.sql: schema and RLS policies including customer-owned order insertion/read.

IMPORTANT SETUP
1. In Supabase SQL Editor, run the complete supabase-setup.sql. If your project already has the schema, run the policy section at the bottom too. Do not remove the existing admin policies.
2. Supabase Dashboard > Authentication > Providers > Google: enable Google and configure Google OAuth Client ID/Secret.
3. Authentication > URL Configuration: set Site URL to your real website URL and add the exact deployed URL(s) to Redirect URLs, including /index.html if applicable.
4. Keep the existing URL and anon key in supabase-config.js. Never put a service_role key in browser files.
5. Configure the merchant's real static QRIS image by setting window.AKSATIX_QRIS_IMAGE_URL in supabase-config.js to a public image URL. Do not use a personal QR or an unverified QR. Until this is configured, paid checkout shows a clear setup warning; no real payment is captured automatically.
6. Deploy the full package together so index.html, admin.html, client-dashboard.html, assets/, and supabase-config.js are on the same origin.
7. Test: event card -> event details -> select ticket -> free checkout / paid QRIS checkout -> order appears in admin. Test with a non-admin customer account and separately with an admin account.

BEHAVIOR
- Free tickets create a Confirmed order without payment.
- Paid tickets create a Pending Payment order with QRIS as the selected method. This is not automatic payment verification; configure the official QRIS image and implement a secure payment confirmation/reconciliation process before accepting real funds.
- Other methods (bank transfer / virtual account / e-wallet) are marked Segera hadir.
- Google sign-in uses the same Supabase Auth project as the admin/client dashboards; organizer dashboard now also has a Google sign-in button. Dashboard permissions still depend on their own role/authorization policies; signing in does not grant admin privileges.

SECURITY NOTE
The order RLS policy allows authenticated users to insert an order only when payload.userId matches auth.uid(), and read only their own orders. Organizer RLS policies allow CRUD only for records whose payload.organizer_id matches auth.uid(); order visibility is limited to the buyer or organizer attached to the event. The admin policy remains the authority for admin access. Review all organizer/client RLS policies before production, as this existing project uses a shared aksatix_records JSON table.

CLEAN EVENT URL (aksatix.kancah.com/<slug>)
- Link event sekarang https://aksatix.kancah.com/<slug>. Slug diambil dari field "Slug URL event" di admin, atau otomatis dari nama event jika kosong.
- 404.html adalah salinan detail-event.html: hosting statis (GitHub Pages / Cloudflare Pages) menyajikannya untuk path /<slug> yang tidak punya file. Jika detail-event.html diubah, salin ulang ke 404.html.
- Link lama detail-event.html?slug=... / ?id=... tetap jalan dan otomatis diganti ke URL bersih.
- Nama slug yang sama dengan nama halaman (login, admin, checkout, dll) dihindari otomatis.

SHARED STOREFRONT SHELL (header + bottom navbar mobile + menu)
- storefront-shell.js memasang header, bottom navbar (<1024px) dan sheet Menu yang identik dengan index.html di semua halaman publik: detail-event, 404, checkout, about-aksatix, jual-tiket, tarif-layanan, hubungi-kami, pusat-bantuan, syarat-ketentuan, kebijakan-privasi, gelang-tiket, cek-keaslian-tiket.
- Ubah tampilan/menu navigasi cukup di storefront-shell.js. Jika mengubah header/nav/menu di index.html, samakan juga di file ini.
- Deploy storefront-shell.js bersama file lain (satu folder root).

HERO BANNER (index.html)
- Hero bisa digeser manual (sentuh di HP, drag dengan mouse di desktop), tombol panah tetap ada. Sudut membulat ikut slide saat digeser; ada jarak 10px antar slide.

Pembaruan fitur (Oktober 2026)
- Sesi pelanggan memakai storage key Supabase yang sama pada halaman login, callback OAuth, beranda, detail event, dan checkout. Sesi tetap tersimpan selama pengguna tidak memilih Logout atau mencabut sesi.
- Menu akun di beranda menampilkan nama/email, Tiket Saya, Riwayat Transaksi, dan Logout.
- Setiap e-tiket yang sudah diterbitkan menampilkan QR berdasarkan kode unik tiket di menu Tiket Saya.
- Dashboard admin > Peserta & Check-in memiliki scanner QR berbasis kamera dan input kode manual. Scanner kamera membutuhkan HTTPS (atau localhost) dan izin kamera. Check-in disimpan ke data admin yang terhubung ke Supabase.
- QR hanya diterbitkan setelah tiket muncul sebagai peserta/e-tiket. Pesanan berbayar yang masih Pending belum memiliki e-tiket aktif.

Perbaikan 28 Okt 2026 (auth-checkout-profile fix)
- Checkout sekarang satu halaman: /checkout. Dialog checkout di index.html dihapus (penyebab "×" muncul saat kembali dari detail event: flag aksatix_after_login_checkout sisa membuka dialog otomatis).
- Pencocokan tiket di checkout lebih toleran (record_id / payload.id / eventId / slug / nama tiket / harga) + pesan error yang spesifik.
- Setelah pesanan dibuat (tiket gratis), kode QR per tiket langsung tampil di halaman checkout. Butuh supabase-tickets.sql sudah dijalankan.
- Menu profil di index.html disamakan dengan storefront-shell.js (detail event dll).
- 404.html disalin ulang dari detail-event.html. storefront-shell.js?v=11.

Pembaruan lanjutan
- Checkout v2: langkah 1 Tiket, 2 Data pemesan, 3 Pembayaran + ringkasan & tombol di samping; setelah sukses tampil layar sukses terpisah.
- Tiket Saya: klik tiket -> detail (QR besar, data pemesan, event, status check-in, salin kode, simpan QR).
- Kuota: tampilan = quota - sold, tiket habis dinonaktifkan, qty dibatasi sisa. Jalankan supabase-quota-patch.sql (cek kuota juga untuk tiket berbayar di server).

Perbaikan 28 Okt 2026 (v6)
- "Sisa kuota: N tiket" tidak lagi tampil di index.html & detail event (404.html disalin ulang). Hanya tersisa label "Habis terjual"; angka kuota tetap ada di admin & client dashboard.
- Menu profil di semua halaman (storefront-shell.js?v=12) disamakan dengan index: saat login hanya tombol "Keluar dari akun" yang tampil, saat belum login hanya "Masuk / Daftar" (sebelumnya keduanya tampil karena aturan [hidden] tertimpa CSS). Logout kini juga jalan di halaman statis tanpa Supabase.

FORM PENDAFTARAN EVENT (seperti Google Form)
- Admin & Client Dashboard > Event: tombol 📝 (Form pendaftaran) untuk membuat/ubah form, 📋 (Jawaban form) untuk melihat jawaban + unduh CSV.
- Jenis pertanyaan: jawaban singkat, paragraf, angka, email, telepon, URL, tanggal, jam, dropdown, pilihan ganda, kotak centang (min/maks pilih), persetujuan, skala linear, upload file/gambar (jenis, ukuran maks 10 MB, jumlah file), judul bagian. Opsi "Lainnya", wajib diisi, validasi panjang/rentang, logika tampil (muncul jika jawaban lain = X), urutkan/duplikat/hapus, pratinjau.
- Form bisa diisi sekali per pesanan atau untuk setiap tiket (data tiap peserta).
- Checkout menampilkan form setelah "Data pemesan"; pembeli tidak bisa lanjut sebelum pertanyaan wajib terisi. Jawaban disimpan di order (payload.formResponses), file di bucket privat event-form-uploads.
- WAJIB: jalankan supabase-event-forms.sql (bucket privat + policy + validasi server). Deploy form-builder.js bersama file lain.

PEMBAYARAN: TRANSFER (BUKTI) + CASH DI LOKASI
- Checkout langkah 3 menawarkan dua metode:
  * Transfer / QRIS: tampil QRIS (AKSATIX_QRIS_IMAGE_URL) dan/atau rekening (AKSATIX_BANK_ACCOUNTS di supabase-config.js). Pembeli WAJIB upload screenshot bukti (JPG/PNG/PDF, maks 5 MB). Status Pending sampai ADMIN menyetujui (dialog 💳 di tabel Pesanan) atau menolak bukti dengan alasan; pembeli bisa upload ulang dari Riwayat Transaksi.
  * Cash di lokasi: hanya muncul jika event mengaktifkan "Pembayaran cash di lokasi" (form Edit event). Pesanan Pending, kuota ditahan, pembeli dapat nomor pesanan + QR + instruksi + batas bayar. Petugas (admin ATAU client pemilik event) klik 💳 pada pesanan atau scan/ketik nomor pesanan di kolom scanner Check-in -> "Terima cash" -> Paid -> e-tiket terbit otomatis.
- Pengaturan cash per event: batas tiket per pesanan (default 4), batas bayar (jam sebelum event mulai; 0 = sampai mulai), instruksi lokasi bayar. Batas anti-iseng server: maks 3 pesanan cash Pending per akun per event.
- Pesanan cash yang lewat batas bayar batal otomatis (kuota kembali) lewat aksatix_expire_pending - aktifkan pg_cron (baris cron.schedule di supabase-payments.sql).
- Keamanan: status pembayaran hanya bisa diubah lewat fungsi server aksatix_order_action; client hanya boleh memproses pesanan CASH miliknya, transfer hanya admin. Bukti transfer di bucket privat (hanya pembeli & admin; client pemilik event tidak bisa melihat).
- WAJIB: jalankan supabase-payments.sql (setelah supabase-event-forms.sql). Deploy payment-ops.js bersama file lain.
