/* Aksatix shared storefront shell: header + mobile bottom navbar + menu sheet.
   Dibuat identik dengan index.html. Dipakai oleh semua halaman publik selain index. */
(function () {
  if (window.__sxShell) return;
  window.__sxShell = 1;

  var CSS = `
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:calc(84px + env(safe-area-inset-top,0px))}
body{overflow-x:hidden}
h1,h2,h3{overflow-wrap:anywhere}
.sx-header{position:sticky;top:env(safe-area-inset-top,0px);z-index:60;background:#fff;padding:10px 0;box-shadow:0 1px 0 #E2EBE7;font-family:"Plus Jakarta Sans",system-ui,sans-serif}
.sx-header *{box-sizing:border-box}
.sx-header a{color:inherit;text-decoration:none}
.sx-w{max-width:1360px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative}
.sx-logo{white-space:nowrap;font-weight:800;font-size:28px;letter-spacing:-.04em;display:flex;align-items:center;gap:8px}
.sx-logo img{height:52px;width:auto;display:block}
.sx-pills{display:flex;flex-wrap:nowrap;white-space:nowrap;gap:4px;margin-right:auto;margin-left:32px}
.sx-pills a{flex:none;white-space:nowrap;padding:8px 16px;border-radius:99px;font-weight:600;font-size:14px;color:#3A4A44;transition:color .15s}
.sx-pills a.on,.sx-pills a:hover,.sx-pills a:active{color:#008F55}
.sx-hr{display:flex;gap:10px;align-items:center}
.sx-ib{height:42px;width:42px;min-width:42px;border-radius:99px;background:none;color:#16211D;display:flex;align-items:center;justify-content:center;padding:0;border:0;cursor:pointer;transition:background .15s}
.sx-ib:hover{color:#008F55}.sx-ib:hover svg{stroke:#008F55}
.sx-ib svg{width:20px;height:20px;fill:none;stroke:#16211D;stroke-width:2;stroke-linecap:round}
.sx-bn{display:none}
dialog#sxmnu{border:0;border-radius:28px;background:#fff;color:#16211D;padding:24px;width:min(92vw,400px);box-shadow:0 20px 60px rgba(22,33,29,.35);font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:14px;line-height:1.55}
dialog#sxmnu::backdrop{background:rgba(13,25,20,.58);backdrop-filter:blur(3px)}
dialog#sxmnu h3{margin:0;font-size:20px;font-weight:800;letter-spacing:-.03em}
#sxmnu .sx-ml{display:flex;flex-direction:column;margin-top:8px}
#sxmnu .sx-ml a{padding:14px 0;font-weight:600;border-bottom:1px solid #E2EBE7;color:#16211D;text-decoration:none}
@media (max-width:1023px){
.sx-pills{display:none}
.sx-bn{display:grid;grid-template-columns:repeat(5,1fr);align-items:end;position:fixed;left:0;right:0;bottom:0;z-index:40;background:#fff;border-top:1px solid #E2EBE7;padding:8px 4px calc(8px + env(safe-area-inset-bottom,0px));box-shadow:0 -6px 20px rgba(22,33,29,.07);font-family:"Plus Jakarta Sans",system-ui,sans-serif}
body{padding-bottom:calc(78px + env(safe-area-inset-bottom,0px))}
.sx-bn a,.sx-bn button{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:600;color:#5E6F68;padding:2px 0;background:none;border:0;cursor:pointer;font-family:inherit;text-decoration:none;line-height:1.55}
.sx-bn svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.sx-bn .on{color:#16211D;font-weight:800}
.sx-bn .fab{margin-top:-30px;color:#16211D;font-weight:700}
.sx-bn .fab i{width:56px;height:56px;border-radius:50%;background:#00FF96;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px #fff,0 6px 14px rgba(0,204,120,.45)}
dialog#sxmnu{margin:auto auto 0;width:100%;max-width:none;border-radius:28px 28px 0 0;padding:20px 24px calc(24px + env(safe-area-inset-bottom,0px))}
}
@media (max-width:900px){.sx-w{padding:0 16px}}
@media (max-width:600px){.sx-logo img{height:42px}}
`;

  var HEADER = `
<div class="sx-w">
  <a href="/" class="sx-logo" aria-label="Aksatix"><img src="assets/logo.png" alt=""></a>
  <nav class="sx-pills" aria-label="Navigasi utama"><a data-p="home" href="/">Beranda</a><a href="/#terdekat">Temukan Acara</a><a href="/#bantuan">Bantuan</a></nav>
  <div class="sx-hr">
    <a class="sx-ib" href="/#terdekat" aria-label="Cari acara" title="Cari acara"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></a>
    <a class="sx-ib" href="/login?next=/checkout" aria-label="Keranjang" title="Keranjang"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.5"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg></a>
    <a class="sx-ib" href="/login?next=/" aria-label="Profil" title="Masuk / Daftar"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></a>
  </div>
</div>`;

  var NAV = `
<a data-n="home" href="/"><svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>Home</a>
<a data-n="jdw" href="/#terdekat"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>Jadwal</a>
<a class="fab" href="https://wa.me/" target="_blank" rel="noopener"><i><svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 0 0-7 12l-1 4 4-1a8 8 0 1 0 4-15z"/></svg></i>Tanya Aksatix</a>
<a data-n="buy" href="/login?next=/checkout"><svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 6v12" stroke-dasharray="2 2"/></svg>Pembelian</a>
<button type="button" data-n="menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Menu</button>`;

  var MENU = `<h3>Menu</h3><nav class="sx-ml"><a href="/about-aksatix">Tentang Aksatix</a><a href="/jual-tiket">Jual Tiket</a><a href="/tarif-layanan">Tarif Layanan</a><a href="/gelang-tiket">Gelang Tiket</a><a href="/pusat-bantuan">Pusat Bantuan</a><a href="/#faq">FAQ</a></nav>`;

  function mount() {
    var st = document.createElement('style');
    st.id = 'sx-shell-style';
    st.textContent = CSS;
    document.head.appendChild(st);

    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"]')) {
      var f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(f);
    }

    var old = document.querySelector('body > header, body > div > header');
    if (old) old.remove();
    var h = document.createElement('div');
    h.className = 'sx-header';
    h.setAttribute('role', 'banner');
    h.innerHTML = HEADER;
    document.body.insertBefore(h, document.body.firstChild);

    var nav = document.createElement('nav');
    nav.className = 'sx-bn';
    nav.setAttribute('aria-label', 'Navigasi utama');
    nav.innerHTML = NAV;
    document.body.appendChild(nav);

    var dlg = document.createElement('dialog');
    dlg.id = 'sxmnu';
    dlg.innerHTML = MENU;
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('a')) dlg.close(); });
    document.body.appendChild(dlg);

    nav.querySelector('[data-n="menu"]').addEventListener('click', function () { dlg.showModal(); });

    var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var active = { 'index': 'home', 'checkout': 'buy' }[page] || (/^(about-aksatix|jual-tiket|tarif-layanan|gelang-tiket|pusat-bantuan|hubungi-kami|syarat-ketentuan|kebijakan-privasi|cek-keaslian-tiket)$/.test(page) ? 'menu' : 'jdw');
    var el = nav.querySelector('[data-n="' + active + '"]');
    if (el) el.classList.add('on');
  }

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
