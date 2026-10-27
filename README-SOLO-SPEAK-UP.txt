AKSATIX — MODUL PENDAFTARAN SOLO SPEAK UP
========================================

FILE BARU
- solo-speak-up.html       : formulir publik pendaftaran komunitas.
- solo-speak-up-admin.html : dashboard admin untuk mengatur event/form, memeriksa peserta, bukti donasi, dan memperbarui status.
- admin.html               : menu Solo Speak Up ditambahkan sebagai pintasan ke pengelolaan komunitas.
- solo-speak-up-setup.sql  : tabel, RLS, dan private storage bucket untuk bukti transfer.

ASUMSI FITUR VERSI PERTAMA
- Donasi bersifat sukarela; peserta boleh memilih Tidak Berdonasi.
- Jika peserta memilih berdonasi, nominal, metode, dan bukti transfer wajib diisi.
- Nominal rekomendasi donasi Rp10.000; nominal aktual dapat diisi peserta.
- Tanggal acara awal diisi "Jadwal diumumkan panitia" karena tanggal pada contoh lama (11 Oktober 2026) telah lewat; admin bisa mengubahnya sebelum publikasi.
- Akun admin memakai autentikasi Supabase yang sudah ada dan harus tercatat pada public.aksatix_admins.

CARA MEMASANG
1. Backup project Aksatix dan database terlebih dahulu.
2. Buka Supabase Dashboard > SQL Editor.
3. Jalankan seluruh isi solo-speak-up-setup.sql. SQL ini membuat tabel terpisah dan tidak mengubah tabel tiket.
4. Setelah SQL dijalankan, buka admin.html lalu pilih menu Solo Speak Up (atau langsung solo-speak-up-admin.html). Edit nama event, tagline, deskripsi, jadwal, venue, aturan, informasi donasi/pembayaran, dan bantuan. Centang "Terbitkan formulir" lalu klik Simpan pengaturan agar form terlihat oleh publik. Jika belum diterbitkan, halaman publik akan menampilkan pesan bahwa formulir belum tersedia.
5. Pastikan supabase-config.js berisi URL project dan anon/publishable key yang benar. File ini menggunakan konfigurasi yang telah ada pada project.
6. Upload/deploy seluruh file project. Halaman pendaftaran: /solo-speak-up.html. Pengelolaan event/form dan pendaftar: /solo-speak-up-admin.html.
7. Login ke halaman admin menggunakan akun yang sudah ada di Authentication, dan pastikan UUID akun tersebut tercatat di public.aksatix_admins.
8. Uji pendaftaran tanpa donasi, lalu uji pendaftaran dengan bukti JPG/PNG/WEBP/PDF maksimal 5 MB. Verifikasi data hanya terlihat di dashboard admin.

PENTING
- File bukti disimpan dalam bucket private; dashboard membuat signed URL yang hanya berlaku 5 menit.
- Formulir publik memiliki izin INSERT saja. Pengunjung tidak dapat membaca daftar pendaftar melalui API.
- Kebijakan upload publik dibatasi ke bucket khusus, nama folder UUID, jenis file, dan ukuran 5 MB. Untuk publikasi luas, tambahkan CAPTCHA/rate limiting dan pemindaian file di server-side.
- Email dan WhatsApp otomatis belum diaktifkan di modul ini. Status disimpan dan dikelola dari dashboard; jangan menganggap notifikasi telah terkirim. Langkah lanjutan dapat menghubungkan Resend/Fonnte atau WhatsApp Business Platform melalui Edge Function dengan secrets server-side.
- Jangan memasukkan service_role key ke file browser.
- Informasi rekening/e-wallet ditampilkan sesuai detail yang diberikan. Pastikan data penerima dan nomor pembayaran benar sebelum halaman dipublikasikan.
- Perbarui tanggal, jam, aturan venue, tautan grup WhatsApp, dan kanal bantuan sebelum event berikutnya.
