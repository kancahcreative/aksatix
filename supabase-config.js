// Supabase public browser configuration for Aksatix. Never put service_role/secret keys here.
window.AKSATIX_SUPABASE_URL = 'https://mfbcnlukdthxswzlfkcu.supabase.co';
window.AKSATIX_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mYmNubHVrZHRoeHN3emxma2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NjU3NDksImV4cCI6MjEwODE0MTc0OX0.nZ7M6iPqW24LzlmyFEZvXRToIK3VcIv78t5WctUcjPA';

// Optional public URL for the official static QRIS image. Configure only with the merchant's real QRIS.
window.AKSATIX_QRIS_IMAGE_URL = '';

// Clean event URLs: aksatix.kancah.com/<slug>
window.AKSATIX_RESERVED_SLUGS = ['index','login','checkout','tiket-saya','riwayat-transaksi','admin','client-dashboard','auth-callback','about-aksatix','gelang-tiket','jual-tiket','tarif-layanan','hubungi-kami','pusat-bantuan','syarat-ketentuan','kebijakan-privasi','cek-keaslian-tiket','detail-event','solo-speak-up','solo-speak-up-admin','assets','404'];
window.aksatixMakeSlug = function (v) {
  return String(v || 'event').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'event';
};
// Returns an array of slugs aligned with `list` (events). Uses e.slug if set, otherwise derives it from the event name.
window.aksatixSlugs = function (list) {
  const reserved = window.AKSATIX_RESERVED_SLUGS, make = window.aksatixMakeSlug, counts = {};
  const explicit = new Set(list.filter(e => e.slug).map(e => String(e.slug).toLowerCase()));
  list.forEach(e => { if (!e.slug) { const b = make(e.name || e.title); counts[b] = (counts[b] || 0) + 1; } });
  return list.map(e => {
    if (e.slug) return String(e.slug);
    const b = make(e.name || e.title), tail = String(e.id || '').replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase();
    if (counts[b] > 1 || explicit.has(b)) return b + '-' + tail;
    return reserved.includes(b) ? b + '-event' : b;
  });
};
