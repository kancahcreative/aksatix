AKSATIX STOREFRONT MULTI-PAGE

Halaman yang dipisah:
- index.html: beranda dan daftar event. Klik card atau tombol Daftar sekarang membuka detail-event.html?id=EVENT_ID.
- detail-event.html: detail event dan pilihan tiket dari Supabase.
- login.html: login/daftar melalui Google OAuth.
- auth-callback.html: callback OAuth, lalu kembali ke halaman tujuan.
- checkout.html: data pemesan, metode pembayaran, dan pembuatan order.
- client-dashboard.html dan admin.html: dashboard sebelumnya.

Konfigurasi:
1. Supabase URL dan anon key ada di supabase-config.js.
2. Aktifkan Google provider di Supabase Authentication.
3. Tambahkan URL callback produksi ke Supabase Auth > URL Configuration > Redirect URLs, misalnya https://domain-anda/auth-callback.html.
4. Pastikan tabel aksatix_records dan policy RLS untuk membaca events/tickets published serta insert order milik user telah diaktifkan.
5. Atur AKSATIX_QRIS_IMAGE_URL ke URL QRIS merchant resmi. Pesanan berbayar sengaja diblokir jika QRIS belum dikonfigurasi.

Catatan: checkout menulis order ke aksatix_records (kind=orders). Integrasi pembayaran otomatis/webhook dan penerbitan QR e-ticket masih perlu backend tepercaya sebelum produksi. Jangan gunakan status order dari browser sebagai bukti pembayaran lunas.
