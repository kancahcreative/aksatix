AKSATIX + SUPABASE — PETUNJUK SETUP

Isi paket:
- aksatix-admin-connected.html : dashboard admin
- aksatix-public-connected.html: website publik yang membaca event dari database
- supabase-config.js          : Project URL dan anon key untuk browser
- supabase-setup.sql          : skema tabel dan kebijakan database

LANGKAH SETUP
1. Buka Supabase Dashboard untuk project yang sesuai.
2. Buka SQL Editor, tempel seluruh isi supabase-setup.sql, lalu jalankan.
3. Buat akun admin melalui Authentication > Users (email/password).
4. Salin UUID user tersebut, lalu ikuti instruksi SQL dalam file setup untuk memberikan akses admin pada tabel aksatix_admins.
5. Letakkan file HTML dan supabase-config.js di folder yang sama. Buka melalui hosting/static server; hindari membuka file lokal jika browser memblokir request lintas-origin.
6. Login ke dashboard menggunakan akun yang sudah diizinkan. Pastikan RLS dan kebijakan tabel telah dibuat oleh SQL setup.

CATATAN PENTING
- Browser config menggunakan Project URL dan anon key publik. Jangan pernah masukkan service_role/secret key ke HTML atau JavaScript publik.
- Konfigurasi sudah diisi berdasarkan URL dan anon key yang diberikan pengguna, tetapi koneksi belum dapat dianggap teruji sampai SQL dijalankan dan login/read/write diuji.
- Paket ini bukan sistem pembayaran produksi lengkap. Integrasi payment gateway, verifikasi webhook di backend, penerbitan QR tiket, dan penguncian kuota transaksional perlu ditambahkan sebelum menerima pembayaran nyata.
- Supabase free tier memiliki batas penggunaan dan proyek yang tidak aktif dapat dijeda. Periksa batas terbaru sebelum peluncuran.


UPLOAD POSTER EVENT
- Poster/banner diupload melalui form Event di dashboard admin ke Supabase Storage bucket event-banners.
- Rasio banner hero dan kartu poster event website publik diseragamkan menjadi 16:5. Ukuran file yang direkomendasikan secara pasti: 1920 x 600 px. Upload melalui form Event admin; tidak perlu memasukkan URL manual.
- Kode publik menampilkan banner dari field image event yang dipublikasikan; slide SVG/manual tidak lagi digunakan sebagai poster event.
- File yang tidak memiliki poster tidak masuk ke slider utama.
- Batas upload di dashboard: JPG/PNG/WebP, maksimal 5 MB.
