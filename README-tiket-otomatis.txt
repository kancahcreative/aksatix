AKSATIX — E-TIKET OTOMATIS (EMAIL/WA) + CEK KEASLIAN TIKET

ALUR
Checkout -> order masuk (status dihitung server) -> status Paid -> tiket terbit (kode acak AKS-XXXX-XXXX-XXXX)
-> baris antrean di aksatix_outbox -> Database Webhook -> Edge Function send-ticket -> email (Resend) + WA.
- Tiket gratis: Paid otomatis saat checkout, tiket langsung terbit & terkirim.
- Tiket berbayar (QRIS manual): terbit saat admin mengubah status ke Paid. Jika nanti pakai payment gateway
  (Midtrans/Xendit), webhook gateway cukup mengubah status order ke Paid; trigger yang sama jalan.
- Order Cancelled/Refunded -> tiket otomatis berstatus Void (cek keaslian menampilkan "tidak berlaku").

SETUP (urut)
1. SQL Editor: jalankan supabase-tickets.sql (setelah 3 file SQL sebelumnya).
2. Resend: daftar, verifikasi domain aksatix.kancah.com (tambahkan record SPF/DKIM di DNS), buat API key.
3. WhatsApp: pilih salah satu
   a) Fonnte (cepat, tidak resmi): hubungkan nomor di fonnte.com, ambil token.  WA_PROVIDER=fonnte
   b) Meta WhatsApp Cloud API (resmi, untuk produksi): buat & setujui template "aksatix_e_tiket" dengan 4 variabel
      ({{1}} nama, {{2}} event, {{3}} kode tiket, {{4}} link cek).  WA_PROVIDER=meta
4. Deploy function (Supabase CLI, dari folder aksatix):
   supabase link --project-ref mfbcnlukdthxswzlfkcu
   supabase secrets set RESEND_API_KEY=... MAIL_FROM="Aksatix <tiket@aksatix.kancah.com>" \
     WEBHOOK_SECRET=<string-acak-panjang> SITE_URL=https://aksatix.kancah.com \
     WA_PROVIDER=fonnte FONNTE_TOKEN=...
     (jika Meta: WA_PROVIDER=meta WA_PHONE_NUMBER_ID=... WA_ACCESS_TOKEN=... WA_TEMPLATE=aksatix_e_tiket)
   supabase functions deploy send-ticket --no-verify-jwt
5. Dashboard Supabase > Database > Webhooks > Create:
   Table: public.aksatix_outbox | Events: Insert | Type: HTTP Request (POST)
   URL: https://mfbcnlukdthxswzlfkcu.supabase.co/functions/v1/send-ticket
   HTTP Header: x-webhook-secret = <WEBHOOK_SECRET yang sama>
6. Deploy ulang file web: cek-keaslian-tiket.html, checkout.html (+ semua file lama).
7. Tes: checkout tiket gratis dengan email/WA sendiri -> cek inbox/WA -> buka /cek-keaslian-tiket, masukkan kode.

PENGIRIMAN ULANG (opsional)
Pesan gagal tercatat di aksatix_outbox (status failed + last_error). Proses ulang dengan:
  curl -X POST https://mfbcnlukdthxswzlfkcu.supabase.co/functions/v1/send-ticket \
    -H "x-webhook-secret: <WEBHOOK_SECRET>" -H "Content-Type: application/json" -d '{"retry":true}'
Bisa dijadwalkan dengan pg_cron + pg_net tiap 5 menit.

CATATAN KEAMANAN
- Kode lama dari admin ("Tambah peserta") dibuat dengan Date.now()+Math.random sehingga bisa ditebak; gunakan kode
  hasil server (AKS-...). Cek keaslian tetap bisa membaca kode manual, tetapi sebaiknya ganti uid('AX') di admin.html
  dengan pemanggilan sb.rpc('aksatix_new_ticket_code') bila ingin menambah peserta manual.
- supabase-tickets.sql juga menutup celah lama: sebelumnya customer bisa membuat order berstatus Paid/total 0 untuk
  tiket berbayar. Sekarang harga, total, status, dan kuota tiket gratis ditentukan di server.
- Cek keaslian hanya lewat fungsi aksatix_verify_ticket (nama disamarkan, tabel attendees tidak terbuka untuk publik).
- Satu pesan per baris order (admin mengubah status per baris order; keranjang berisi 2 jenis tiket = 2 email).
