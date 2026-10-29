/* Aksatix shared storefront shell: satu-satunya sumber navbar (desktop + hamburger mobile).
   Dipakai SEMUA halaman publik termasuk index.html. Jangan membuat navbar terpisah per halaman. */
(function () {
  if (window.__sxShell) return;
  window.__sxShell = 1;

  var CSS = `
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:calc(84px + env(safe-area-inset-top,0px))}
body{overflow-x:hidden}
body.sx-lock{overflow:hidden}
h1,h2,h3{overflow-wrap:anywhere}
.sx-header{position:sticky;top:env(safe-area-inset-top,0px);z-index:60;background:#fff;padding:10px 0;box-shadow:0 1px 0 #E5E7EB;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:14px;line-height:1.55;color:#16211D}
.sx-header *{box-sizing:border-box}
.sx-header a{color:inherit;text-decoration:none}
.sx-w{max-width:1360px;margin:0 auto;padding:0 32px;display:flex;align-items:center;justify-content:space-between;gap:16px;position:relative}
.sx-logo{white-space:nowrap;font-weight:800;font-size:28px;letter-spacing:-.04em;display:flex;align-items:center;gap:8px}
.sx-logo img{height:52px;width:auto;display:block}
.sx-pills{display:flex;flex-wrap:nowrap;white-space:nowrap;gap:4px;margin-right:auto;margin-left:32px}
.sx-pills a{flex:none;white-space:nowrap;padding:8px 16px;border-radius:99px;font-weight:600;font-size:14px;color:#374151;transition:color .15s}
.sx-pills a.on,.sx-pills a:hover,.sx-pills a:active{color:#16211D}
.sx-navdrop{position:relative}
.sx-navdrop>a{display:flex;align-items:center;gap:6px}
.sx-navdrop>a:after{content:"";width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg);margin-top:-3px}
.sx-navmenu{display:none;position:absolute;top:100%;left:0;padding:12px;min-width:230px;background:#fff;border:1px solid #E5E7EB;border-radius:16px;box-shadow:0 16px 38px #16211d1a;z-index:150}
.sx-navdrop:hover .sx-navmenu,.sx-navdrop:focus-within .sx-navmenu{display:grid}
.sx-navmenu a{display:block;padding:10px 12px;border-radius:9px;font-size:13px!important}
.sx-navmenu a:hover{background:#F5F7F6;color:#16211D}
.sx-navmenu .sx-navlabel{padding:8px 12px 4px;font-size:10px;font-weight:800;letter-spacing:.1em;color:#16211D;text-transform:uppercase}
.sx-hr{display:flex;gap:10px;align-items:center}
.sx-ib{position:relative;height:42px;width:42px;min-width:42px;border-radius:99px;background:none;color:#16211D;display:flex;align-items:center;justify-content:center;padding:0;border:0;cursor:pointer;transition:background .15s}
.sx-ib:hover{color:#16211D}.sx-ib:hover svg{stroke:#16211D}
.sx-ib svg{width:20px;height:20px;fill:none;stroke:#16211D;stroke-width:2;stroke-linecap:round}
.sx-bdg{position:absolute;top:3px;right:1px;min-width:17px;height:17px;padding:0 4px;border-radius:99px;background:#00FF96;color:#16211D;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
.sx-bdg[hidden]{display:none}
.sx-header .sx-account-trigger{display:flex!important;align-items:center;justify-content:center;gap:9px;width:auto!important;min-width:0!important;max-width:none;height:48px;min-height:48px;padding:5px 14px 5px 7px!important;border:0!important;border-radius:999px!important;background:#00FF96!important;color:#16211D!important;cursor:pointer;flex:0 0 auto;white-space:nowrap;position:relative;z-index:121;pointer-events:auto;font:700 14px/1.2 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:none!important}
.sx-header .sx-account-trigger:hover{background:#00FF96!important;color:#16211D!important}
.sx-account-avatar{width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;border-radius:50%;background:#00FF96;color:#16211D;font-size:14px;font-weight:800}
.sx-account-name{display:inline-block;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#16211D}
.sx-header .sx-account-trigger svg{width:18px;height:18px;flex:0 0 18px;stroke:#16211D!important;stroke-width:2;pointer-events:none}
.sx-account{position:relative;display:flex;align-items:center;flex:0 0 auto;z-index:120}
.sx-account-menu{position:absolute;right:0;top:calc(100% + 10px);width:min(340px,calc(100vw - 24px));padding:10px;background:#fff;border:1px solid #E5E7EB;border-radius:18px;box-shadow:0 16px 44px rgba(22,33,29,.16);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#16211D;z-index:100;pointer-events:auto}
.sx-account-menu[hidden]{display:none}
.sx-account-head{padding:12px 12px 14px;border-bottom:1px solid #ECEFF1;margin-bottom:5px}
.sx-account-head b{display:block;font-size:17px;line-height:1.35}
.sx-account-head span{display:block;overflow-wrap:anywhere;color:#6B7280;font-size:12px;margin-top:4px}
.sx-account-menu a,.sx-account-menu button{display:flex;width:100%;align-items:center;gap:12px;padding:12px;border:0;border-radius:10px;background:#fff;color:#16211D;text-decoration:none;font:600 14px "Plus Jakarta Sans",system-ui,sans-serif;text-align:left;cursor:pointer}
.sx-account-menu a:hover,.sx-account-menu button:hover{background:#F5F7F6}
.sx-account-menu .sx-account-item>svg{width:21px;height:21px;flex:0 0 21px;fill:none;stroke:#16211D;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.sx-account-menu .sx-account-item>span{display:block;min-width:0}
.sx-account-menu .sx-account-item small{display:block;font-size:11px;color:#6B7280;font-weight:500;margin-top:2px}
.sx-account-menu a[hidden],.sx-account-menu button[hidden]{display:none!important}
.sx-account-menu .sx-logout{color:#e11d48}.sx-account-menu .sx-logout:hover{background:#fff1f2}
.sx-mobile-menu-btn{display:none}
.sx-mobile-menu-btn .sx-ico-x{display:none}
.sx-mobile-menu-btn[aria-expanded="true"] .sx-ico-x{display:block}
.sx-mobile-menu-btn[aria-expanded="true"] .sx-ico-bars{display:none}
.sx-mobile-menu-btn:hover,.sx-mobile-menu-btn:active,.sx-mobile-menu-btn:focus-visible{background:transparent!important;color:#16211D!important;box-shadow:none!important}

/* ===== Menu hamburger mobile (panel penuh di bawah header) ===== */
.sx-mp{display:none}
.sx-mp-backdrop{display:none}
.sx-bn{display:none}
@media (max-width:1023px){
.sx-pills{display:none}
.sx-mobile-menu-btn{display:flex!important}
.sx-header .sx-hr>a.sx-ib,.sx-header .sx-account{display:none!important}
body{padding-bottom:64px!important}
body.sx-nonav{padding-bottom:0!important}
.sx-mp{position:fixed;left:0;right:0;top:var(--sx-mt,64px);bottom:auto;height:auto;max-height:calc(100vh - var(--sx-mt,64px) - 84px);max-height:calc(100dvh - var(--sx-mt,64px) - 84px - env(safe-area-inset-bottom,0px));z-index:55;display:none;flex-direction:column;background:#fff;border-radius:0 0 22px 22px;box-shadow:0 18px 40px rgba(22,33,29,.14);overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;font-family:"Plus Jakarta Sans",system-ui,sans-serif;font-size:15px;line-height:1.5;color:#16211D;border-top:1px solid #E5E7EB;padding:4px 24px 6px}
.sx-mp.open{display:flex;animation:sxMpIn .18s ease-out}
@keyframes sxMpIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.sx-mp *{box-sizing:border-box}
.sx-mp a{color:inherit;text-decoration:none}
.sx-mp-list{display:flex;flex-direction:column}
.sx-mp-link,.sx-acc-btn{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:15px 0;border:0;background:none;font:600 15px/1.4 "Plus Jakarta Sans",system-ui,sans-serif;color:#16211D;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sx-mp-link:hover,.sx-mp-link:active,.sx-acc-btn:hover,.sx-acc-btn:active,.sx-acc-btn[aria-expanded="true"]{color:#16211D}
.sx-chev{width:18px;height:18px;flex:0 0 18px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;transition:transform .22s ease}
.sx-acc-btn[aria-expanded="true"] .sx-chev{transform:rotate(180deg)}
.sx-acc-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows .24s ease}
.sx-acc.open>.sx-acc-body{grid-template-rows:1fr}
.sx-acc-in{overflow:hidden;min-height:0}
.sx-acc-in a{display:block;padding:11px 0 11px 14px;margin-left:2px;border-left:2px solid #E5E7EB;font-weight:500;font-size:14px;color:#374151}
.sx-acc-in a:first-child{margin-top:0}
.sx-acc-in a:active{color:#16211D;border-left-color:#00FF96}
.sx-acc.open>.sx-acc-body .sx-acc-in{padding-bottom:8px}
.sx-mp-tools{display:flex;gap:10px;padding:10px 0 10px}
.sx-mp-tools button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid #E2E7E5;border-radius:12px;padding:12px 8px;background:#fff;font:600 14px "Plus Jakarta Sans",system-ui,sans-serif;color:#16211D;cursor:pointer}
.sx-mp-tools button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.sx-mp-tools button:hover,.sx-mp-tools button:active,.sx-mp-tools button:focus-visible{background:#fff;color:#16211D}
.sx-mp-bottom{margin-top:0;padding-top:0}
.sx-mp-div{height:1px;background:#E5E7EB;margin:0 -24px}
.sx-mp-prof{border-top:0}
.sx-prof-btn{display:flex;align-items:center;gap:12px;width:100%;padding:14px 0;border:0;background:none;font:600 15px/1.3 "Plus Jakarta Sans",system-ui,sans-serif;color:#16211D;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sx-prof-btn[hidden]{display:none}
.sx-prof-btn .sx-prof-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sx-prof-btn .sx-chev{margin-left:auto}
.sx-prof-av{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border-radius:50%;background:#00FF96;color:#16211D;font-size:14px;font-weight:800}
.sx-prof-btn[aria-expanded="true"] .sx-chev{transform:rotate(180deg)}
.sx-prof-btn[aria-expanded="true"]{color:#16211D}
.sx-prof-info{padding:2px 0 8px}
.sx-prof-info b{display:block;font-size:17px;line-height:1.35;font-weight:800;letter-spacing:-.01em;overflow-wrap:anywhere}
.sx-prof-row{display:flex;align-items:flex-start;gap:10px;margin-top:8px;color:#6B7280;font-size:13.5px;font-weight:500;overflow-wrap:anywhere}
.sx-prof-row svg{width:17px;height:17px;flex:0 0 17px;margin-top:2px;fill:none;stroke:#16211D;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.sx-prof-links{display:flex;flex-direction:column;margin-top:8px}
.sx-prof-links a,.sx-prof-links button{display:block;width:100%;margin:0;border:0;padding:12px 0;border:0;background:none;text-align:left;font:600 14.5px "Plus Jakarta Sans",system-ui,sans-serif;color:#374151;cursor:pointer}
.sx-prof-links a:active,.sx-prof-links button:active{color:#16211D}
.sx-prof-links .sx-logout{color:#e11d48}
.sx-prof-links [hidden]{display:none!important}
.sx-mp-backdrop.open{display:block;position:fixed;left:0;right:0;bottom:0;top:var(--sx-mt,64px);z-index:54;background:rgba(22,33,29,.22)}
#toast{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}.checkin-toast{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}
/* ===== Bottom nav mobile (ikon Flaticon Uicons) ===== */
.sx-bn{display:grid;grid-template-columns:repeat(5,1fr);position:fixed;left:0;right:0;bottom:0;z-index:56;background:#fff;border-top:1px solid #E5E7EB;box-shadow:0 -6px 20px rgba(22,33,29,.06);padding:6px 6px calc(6px + env(safe-area-inset-bottom,0px));font-family:"Plus Jakarta Sans",system-ui,sans-serif}
.sx-bn[hidden]{display:none}
.sx-bn a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:52px;border-radius:14px;background:transparent!important;color:#6B7280;font-size:11px;font-weight:600;line-height:1.2;text-decoration:none;-webkit-tap-highlight-color:transparent;transition:color .15s}
.sx-bn i{display:block;height:20px;font-size:19px;line-height:20px}
.sx-bn i:before{display:block;line-height:20px}
.sx-bn .sx-i-on{display:none}
.sx-bn a.on{color:#000;font-weight:700}.sx-bn a.on .sx-i-on{display:block}.sx-bn a.on .sx-i-off{display:none}
.sx-bn a.sx-bn-ticket{position:relative;z-index:1;gap:4px;margin-top:-20px;padding-top:0;color:#6B7280;font-weight:700;overflow:visible}
.sx-bn a.sx-bn-ticket i{display:grid;place-items:center;width:54px;height:54px;border-radius:50%;background:#00FF96!important;color:#000!important;font-size:25px;line-height:1;box-shadow:0 2px 10px rgba(22,33,29,.13);border:1px solid #00FF96}
.sx-bn a.sx-bn-ticket .sx-i-off{display:grid}.sx-bn a.sx-bn-ticket .sx-i-on{display:none}
.sx-bn a.sx-bn-ticket.on{color:#000}.sx-bn a.sx-bn-ticket.on i{color:#000!important;background:#00FF96!important;border-color:#00FF96}
.sx-bn a:hover,.sx-bn a:active,.sx-bn a:focus-visible{background:transparent!important;box-shadow:none!important}
.sx-bn a:hover,.sx-bn a:active{color:#000}
body.sx-nonav .sx-bn{display:none}
}
@media (min-width:1024px){.sx-bn,.sx-mp-backdrop{display:none!important}}
@media (max-width:900px){.sx-w{padding:0 16px}}
@media (max-width:600px){.sx-logo img{height:42px}.sx-header .sx-account-name{display:none}.sx-header .sx-account-trigger{gap:4px;padding:5px 9px 5px 6px!important}.sx-hr{gap:4px}}
`;

  var CHEV = '<svg class="sx-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  var CATS = [['Musik','Musik'],['Festival','Festival'],['Workshop','Workshop'],['Olahraga','Olahraga'],['Pameran','Pameran &amp; Seni'],['Seminar','Seminar &amp; Edukasi'],['Komunitas','Komunitas'],['Kuliner','Kuliner'],['Keluarga','Keluarga']];
  var catDesktop = CATS.map(function (c) { return '<a href="/?kategori=' + c[0] + '#terdekat">' + c[1] + '</a>'; }).join('');

  var HEADER = `
<div class="sx-w">
  <a href="/" class="sx-logo" aria-label="Aksatix"><img src="assets/logo.png" alt=""></a>
  <nav class="sx-pills" id="sxPills" aria-label="Navigasi utama"><a data-p="home" href="/">Beranda</a><div class="sx-navdrop"><a data-p="find" href="/#terdekat">Temukan Acara</a><div class="sx-navmenu"><span class="sx-navlabel">Jelajahi kategori</span>${catDesktop}<a href="/#terdekat">Semua Acara →</a></div></div><div class="sx-navdrop"><a data-p="make" href="/jual-tiket">Membuat Event</a><div class="sx-navmenu"><span class="sx-navlabel">Untuk penyelenggara</span><a href="/jual-tiket">Mulai Membuat Event</a><a href="/tarif-layanan">Layanan Kerja Sama</a><a href="/hubungi-kami">Partnership &amp; Collaboration</a><a href="/client-dashboard.html">Dashboard Penyelenggara</a></div></div><a data-p="help" href="/#bantuan">Bantuan</a><a data-p="contact" href="https://wa.me/628924687866" target="_blank" rel="noopener">Kontak Kami</a></nav>
  <div class="sx-hr">
    <button class="sx-ib sx-mobile-menu-btn" id="sxMobileMenuTrigger" type="button" aria-label="Buka menu" aria-haspopup="true" aria-expanded="false" aria-controls="sxMobilePanel" title="Menu"><svg class="sx-ico-bars" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg><svg class="sx-ico-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <a class="sx-ib" id="sxSearchBtn" data-sx="search" href="/#terdekat" aria-label="Cari acara" title="Cari acara"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></a>
    <a class="sx-ib" id="sxCartBtn" data-sx="cart" href="/login?next=/checkout" aria-label="Keranjang" title="Keranjang"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.5"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg><span class="sx-bdg" id="sxCartBadge" hidden>0</span></a>
    <div class="sx-account"><button class="sx-ib sx-account-trigger" id="sxAccountTrigger" type="button" aria-label="Profil" aria-expanded="false" title="Akun"><span class="sx-account-avatar" id="sxAccountAvatar">A</span><span class="sx-account-name" id="sxAccountShortName">Akun</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="sx-account-menu" id="sxAccountMenu" hidden><div class="sx-account-head"><b id="sxAccountName">Akun Aksatix</b><span id="sxAccountEmail">Masuk untuk mengelola tiket</span></div><a class="sx-account-item" href="/tiket-saya"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M9 7h7M9 10h5"/></svg><span>Tiket Saya<small>E-Voucher &amp; QR</small></span></a><a class="sx-account-item" href="/riwayat-transaksi"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg><span>Riwayat Transaksi<small>Detail pesanan dan pembayaran</small></span></a><a class="sx-account-item" href="/pengaturan-akun" id="sxSettingsLink"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.8-1.8 3.1-2.1-.4a8 8 0 0 1-1.5.9l-.7 2h-3.6l-.7-2a8 8 0 0 1-1.5-.9l-2.1.4-1.8-3.1 1.1-1.8a8 8 0 0 1 0-1.8l-1.1-1.8 1.8-3.1 2.1.4a8 8 0 0 1 1.5-.9l.7-2h3.6l.7 2a8 8 0 0 1 1.5.9l2.1-.4 1.8 3.1-1.1 1.8a8 8 0 0 1 .3 1.7Z" transform="translate(-1 -1) scale(.95)"/></svg><span>Pengaturan Akun<small>Profil dan kata sandi</small></span></a><a href="/login?next=/" id="sxLoginLink">Masuk / Daftar</a><button class="sx-logout" id="sxLogout" type="button" hidden>Keluar dari akun</button></div></div>
  </div>
</div>`;

  var catMobile = CATS.map(function (c) { return '<a href="/?kategori=' + c[0] + '#terdekat">' + c[1] + '</a>'; }).join('');

  function acc(id, label, inner) {
    return '<div class="sx-acc" data-acc><button class="sx-acc-btn" type="button" aria-expanded="false" aria-controls="' + id + '"><span>' + label + '</span>' + CHEV + '</button><div class="sx-acc-body" id="' + id + '"><div class="sx-acc-in">' + inner + '</div></div></div>';
  }

  var ICO_MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
  var ICO_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/></svg>';

  var MENU = `
<div class="sx-mp-list">
  <a class="sx-mp-link" data-p="home" href="/">Beranda</a>
  ${acc('sxAccEvent', 'Event', '<a href="/#terdekat">Semua Acara</a>' + catMobile)}
  ${acc('sxAccMake', 'Buat Event', '<a href="/jual-tiket">Mulai Membuat Event</a><a href="/tarif-layanan">Layanan Kerja Sama</a><a href="/hubungi-kami">Partnership &amp; Collaboration</a><a href="/client-dashboard.html">Dashboard Penyelenggara</a>')}
  ${acc('sxAccContact', 'Hubungi Kami', '<a href="https://wa.me/628924687866" target="_blank" rel="noopener">WhatsApp</a><a href="/hubungi-kami">Form Hubungi Kami</a><a href="/pusat-bantuan">Pusat Bantuan</a>')}
</div>
<div class="sx-mp-tools"><button type="button" data-sx="search"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>Cari Acara</button><button type="button" data-sx="cart"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.5"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>Keranjang <span id="sxMpCartCount"></span></button></div>
<div class="sx-mp-bottom">
  <div class="sx-mp-div"></div>
  <div class="sx-mp-prof sx-acc" data-acc id="sxMpProf">
    <a class="sx-prof-btn" id="sxMpLogin" href="/login?next=/" hidden><span class="sx-prof-av">↗</span><span class="sx-prof-name">Masuk / Daftar</span></a>
    <button class="sx-prof-btn" id="sxMpProfBtn" type="button" aria-expanded="false" aria-controls="sxMpProfBody"><span class="sx-prof-av" id="sxMpAvatar">A</span><span class="sx-prof-name" id="sxMpShortName">Akun</span>${CHEV}</button>
    <div class="sx-acc-body" id="sxMpProfBody"><div class="sx-acc-in">
      <div class="sx-prof-info"><b id="sxMpFullName">Akun Aksatix</b><div class="sx-prof-row">${ICO_MAIL}<span id="sxMpEmail">-</span></div><div class="sx-prof-row">${ICO_PHONE}<span id="sxMpPhone">-</span></div></div>
      <div class="sx-prof-links"><a href="/tiket-saya">Tiket Saya</a><a href="/riwayat-transaksi">Riwayat Transaksi</a><a href="/pengaturan-akun">Pengaturan Akun</a><button class="sx-logout" id="sxMpLogout" type="button">Keluar</button></div>
    </div></div>
  </div>
</div>`;

  function bnItem(key, href, label, ico, cls) {
    return '<a data-p="' + key + '" href="' + href + '"' + (cls ? ' class="' + cls + '"' : '') + '><i class="fi fi-rr-' + ico + ' sx-i-off" aria-hidden="true"></i><i class="fi fi-sr-' + ico + ' sx-i-on" aria-hidden="true"></i><span>' + label + '</span></a>';
  }
  var BN = bnItem('home', '/', 'Home', 'home') +
    bnItem('find', '/#terdekat', 'Event', 'calendar') +
    bnItem('ticket', '/tiket-saya', 'Tiket Saya', 'ticket', 'sx-bn-ticket') +
    bnItem('help', '/#faq', 'FAQ', 'interrogation') +
    bnItem('contact', 'https://wa.me/628924687866', 'Kontak', 'headset');

  var cartCount = +window.__sxCartCount || 0;
  var state = {};

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

    ['uicons-regular-rounded', 'uicons-solid-rounded'].forEach(function (n) {
      if (document.querySelector('link[href*="' + n + '"]')) return;
      var l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://cdn-uicons.flaticon.com/' + n + '/css/' + n + '.css';
      document.head.appendChild(l);
    });

    var old = document.querySelector('body > header, body > div > header');
    if (old) old.remove();
    var h = document.createElement('div');
    h.className = 'sx-header';
    h.setAttribute('role', 'banner');
    h.innerHTML = HEADER;
    document.body.insertBefore(h, document.body.firstChild);

    var panel = document.createElement('div');
    panel.className = 'sx-mp';
    panel.id = 'sxMobilePanel';
    panel.setAttribute('aria-label', 'Menu');
    panel.innerHTML = MENU;
    document.body.appendChild(panel);

    var backdrop = document.createElement('div');
    backdrop.className = 'sx-mp-backdrop';
    document.body.appendChild(backdrop);

    var bn = document.createElement('nav');
    bn.className = 'sx-bn';
    bn.id = 'sxBottomNav';
    bn.setAttribute('aria-label', 'Navigasi bawah');
    bn.innerHTML = BN;
    document.body.appendChild(bn);
    var bnPage = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    if (bnPage === 'checkout') document.body.classList.add('sx-nonav');

    var $ = function (id) { return document.getElementById(id); };
    var menuBtn = $('sxMobileMenuTrigger');

    /* ---------- hamburger panel ---------- */
    function openMenu() {
      var r = h.getBoundingClientRect();
      panel.style.setProperty('--sx-mt', Math.max(0, Math.round(r.bottom)) + 'px');
      panel.classList.add('open');
      backdrop.style.setProperty('--sx-mt', Math.max(0, Math.round(r.bottom)) + 'px');
      backdrop.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Tutup menu');
      document.body.classList.add('sx-lock');
    }
    function closeMenu() {
      panel.classList.remove('open');
      backdrop.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Buka menu');
      document.body.classList.remove('sx-lock');
    }
    menuBtn.addEventListener('click', function () { panel.classList.contains('open') ? closeMenu() : openMenu(); });
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1024) closeMenu(); });

    function setAcc(el, open) {
      el.classList.toggle('open', open);
      var b = el.querySelector(':scope > button');
      if (b) b.setAttribute('aria-expanded', String(open));
    }
    panel.querySelectorAll('[data-acc]').forEach(function (el) {
      var b = el.querySelector(':scope > button');
      if (!b) return;
      b.addEventListener('click', function () {
        var willOpen = !el.classList.contains('open');
        panel.querySelectorAll('[data-acc]').forEach(function (o) { setAcc(o, false); });
        setAcc(el, willOpen);
        if (willOpen) setTimeout(function () { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 260);
      });
    });
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && !a.closest('.sx-prof-btn[hidden]')) closeMenu();
    });

    /* ---------- aksi cari & keranjang (halaman boleh menangani sendiri lewat event) ---------- */
    document.querySelectorAll('[data-sx]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var kind = el.getAttribute('data-sx');
        var ev = new CustomEvent('sx:' + kind, { cancelable: true });
        var handled = !document.dispatchEvent(ev);
        if (handled) { e.preventDefault(); closeMenu(); }
        else if (el.tagName === 'BUTTON') {
          closeMenu();
          location.href = kind === 'search' ? '/#terdekat' : '/login?next=/checkout';
        }
      });
    });

    /* ---------- akun (desktop dropdown + profil di hamburger) ---------- */
    var accountTrigger = $('sxAccountTrigger'), accountMenu = $('sxAccountMenu');
    function readUser() {
      try {
        var raw = localStorage.getItem('aksatix-auth-v1');
        if (raw) { var p = JSON.parse(raw); var s = p.currentSession || p; return s && s.user ? s.user : null; }
      } catch (_) {}
      return null;
    }
    function refreshAccount() {
      var user = readUser(), md = (user && user.user_metadata) || {};
      var nm = user && (md.full_name || md.name || (user.email && user.email.split('@')[0]));
      var displayName = nm || 'Akun Aksatix';
      var shortName = user ? (displayName.split(/\s+/)[0] || 'Akun') : 'Masuk / Daftar';
      var initials = user ? displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x.charAt(0); }).join('').toUpperCase() : '↗';
      var phone = (user && (user.phone || md.phone || md.phone_number || md.no_hp)) || '-';
      $('sxAccountName').textContent = displayName;
      $('sxAccountEmail').textContent = (user && user.email) || 'Masuk untuk mengelola tiket';
      $('sxAccountShortName').textContent = shortName.length > 15 ? shortName.slice(0, 14) + '…' : shortName;
      $('sxAccountAvatar').textContent = initials;
      $('sxLoginLink').hidden = !!user;
      $('sxLoginLink').setAttribute('aria-hidden', String(!!user));
      $('sxLogout').hidden = !user;
      $('sxMpFullName').textContent = displayName;
      $('sxMpEmail').textContent = (user && user.email) || '-';
      $('sxMpPhone').textContent = phone;
      $('sxMpAvatar').textContent = initials;
      $('sxMpShortName').textContent = displayName;
      $('sxMpProfBtn').hidden = !user;
      $('sxMpLogin').hidden = !!user;
      if (!user) setAcc($('sxMpProf'), false);
    }
    async function logout() {
      function ld(src) { return new Promise(function (ok) { var s = document.createElement('script'); s.src = src; s.onload = s.onerror = function () { ok(); }; document.head.appendChild(s); }); }
      try {
        if (!window.AKSATIX_SUPABASE_URL) await ld('./supabase-config.js');
        if (!window.supabase) await ld('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        if (window.supabase && window.AKSATIX_SUPABASE_URL && window.AKSATIX_SUPABASE_ANON_KEY) {
          var client = window.supabase.createClient(window.AKSATIX_SUPABASE_URL, window.AKSATIX_SUPABASE_ANON_KEY, { auth: { storageKey: 'aksatix-auth-v1', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
          await client.auth.signOut({ scope: 'local' });
        }
      } catch (err) { console.warn('Logout Aksatix:', err); }
      try { localStorage.removeItem('aksatix-auth-v1'); } catch (_) {}
      accountMenu.hidden = true; closeMenu(); refreshAccount(); location.reload();
    }
    refreshAccount();
    accountTrigger.addEventListener('click', function (e) {
      e.preventDefault(); e.stopImmediatePropagation();
      var open = accountMenu.hidden;
      accountMenu.hidden = !open;
      accountTrigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.sx-account')) { accountMenu.hidden = true; accountTrigger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { accountMenu.hidden = true; accountTrigger.setAttribute('aria-expanded', 'false'); } });
    $('sxLogout').addEventListener('click', logout);
    $('sxMpLogout').addEventListener('click', logout);
    window.addEventListener('storage', refreshAccount);

    /* ---------- badge keranjang ---------- */
    function setCartCount(n) {
      cartCount = +n || 0;
      var b = $('sxCartBadge'); if (b) { b.textContent = cartCount; b.hidden = !cartCount; }
      var m = $('sxMpCartCount'); if (m) m.textContent = cartCount ? '(' + cartCount + ')' : '';
    }
    setCartCount(cartCount);

    /* ---------- penanda halaman aktif ---------- */
    function setActive(k) {
      document.querySelectorAll('#sxPills [data-p], .sx-bn [data-p]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-p') === k); });
    }
    var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var map = { 'index': 'home', '': 'home', 'detail-event': 'find', 'jual-tiket': 'make', 'tarif-layanan': 'make', 'hubungi-kami': 'contact', 'pusat-bantuan': 'help', 'tiket-saya': 'ticket', 'riwayat-transaksi': 'ticket' };
    function syncActive() {
      var hash = (location.hash || '').toLowerCase();
      var active = map[page] || '';
      if (page === 'index' || page === '') {
        if (hash === '#terdekat') active = 'find';
        else if (hash === '#faq') active = 'help';
        else active = 'home';
      }
      setActive(active);
    }
    syncActive();
    window.addEventListener('hashchange', syncActive);

    window.sxShell = { setCartCount: setCartCount, refreshAccount: refreshAccount, setActive: setActive, openMenu: openMenu, closeMenu: closeMenu };
  }

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
