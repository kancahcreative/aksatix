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
.sx-header .sx-account-trigger{display:flex!important;align-items:center;justify-content:center;gap:9px;width:auto!important;min-width:0!important;max-width:none;height:48px;min-height:48px;padding:5px 14px 5px 7px!important;border:0!important;border-radius:999px!important;background:#392bb0!important;color:#fff!important;cursor:pointer;flex:0 0 auto;white-space:nowrap;position:relative;z-index:121;pointer-events:auto;font:700 14px/1.2 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:none!important}
.sx-header .sx-account-trigger:hover{background:#30239f!important;color:#fff!important}
.sx-account-avatar{width:36px;height:36px;flex:0 0 36px;display:grid;place-items:center;border-radius:50%;background:#675bd0;color:#fff;font-size:14px;font-weight:800}
.sx-account-name{display:inline-block;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff}
.sx-header .sx-account-trigger svg{width:18px;height:18px;flex:0 0 18px;stroke:#fff!important;stroke-width:2;pointer-events:none}
.sx-account-menu{pointer-events:auto}
.sx-account{position:relative;display:flex;align-items:center;flex:0 0 auto;z-index:120}.sx-account-menu{position:absolute;right:0;top:calc(100% + 10px);width:min(340px,calc(100vw - 24px));padding:10px;background:#fff;border:1px solid #E2EBE7;border-radius:18px;box-shadow:0 16px 44px rgba(22,33,29,.16);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#16211D;z-index:100}.sx-account-menu[hidden]{display:none}.sx-account-head{padding:12px 12px 14px;border-bottom:1px solid #edf1ef;margin-bottom:5px}.sx-account-head b{display:block;font-size:15px}.sx-account-head span{display:block;overflow-wrap:anywhere;color:#64746d;font-size:12px;margin-top:4px}.sx-account-menu a,.sx-account-menu button{display:flex;width:100%;align-items:center;gap:12px;padding:12px;border:0;border-radius:10px;background:#fff;color:#16211D;text-decoration:none;font:600 14px "Plus Jakarta Sans",system-ui,sans-serif;text-align:left;cursor:pointer}.sx-account-menu a:hover,.sx-account-menu button:hover{background:#f2fbf6}.sx-account-menu .sx-logout{color:#e11d48}.sx-account-menu .sx-logout:hover{background:#fff1f2}.sx-ib svg{width:20px;height:20px;fill:none;stroke:#16211D;stroke-width:2;stroke-linecap:round}
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
    <div class="sx-account"><button class="sx-ib sx-account-trigger" id="sxAccountTrigger" type="button" aria-label="Profil" aria-expanded="false" title="Akun"><span class="sx-account-avatar" id="sxAccountAvatar">A</span><span class="sx-account-name" id="sxAccountShortName">Akun</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div class="sx-account-menu" id="sxAccountMenu" hidden><div class="sx-account-head"><b id="sxAccountName">Akun Aksatix</b><span id="sxAccountEmail">Masuk untuk mengelola tiket</span></div><a href="/client-dashboard">Tiket Saya <span style="margin-left:auto;color:#64746d;font-size:12px">E-Voucher &amp; QR</span></a><a href="/client-dashboard?view=history">Riwayat Transaksi</a><a href="/login?next=/" id="sxLoginLink">Masuk / Daftar</a><button class="sx-logout" id="sxLogout" hidden>Keluar dari akun</button></div></div>
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

    // Shared account menu: reads the same persisted Supabase session as index/detail/checkout.
    var accountTrigger=h.querySelector('#sxAccountTrigger'), accountMenu=h.querySelector('#sxAccountMenu');
    function refreshAccount(){
      var session=null;try{var raw=localStorage.getItem('aksatix-auth-v1');if(raw){var parsed=JSON.parse(raw);session=parsed.currentSession||parsed;}}catch(_){}
      var user=session&&session.user;var nm=user&&((user.user_metadata&&(user.user_metadata.full_name||user.user_metadata.name))||user.email&&user.email.split('@')[0]);
      var displayName=nm||'Akun Aksatix';
      h.querySelector('#sxAccountName').textContent=displayName;
      h.querySelector('#sxAccountEmail').textContent=(user&&user.email)||'Masuk untuk mengelola tiket';
      var shortName=user?(displayName.split(/\s+/)[0]||'Akun'):'Masuk';
      h.querySelector('#sxAccountShortName').textContent=shortName.length>15?shortName.slice(0,14)+'…':shortName;
      h.querySelector('#sxAccountAvatar').textContent=user?displayName.split(/\s+/).filter(Boolean).slice(0,2).map(function(x){return x.charAt(0)}).join('').toUpperCase():'↗';
      h.querySelector('#sxLoginLink').hidden=!!user;h.querySelector('#sxLogout').hidden=!user;
    }
    if(accountTrigger&&accountMenu){refreshAccount();accountTrigger.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();var open=accountMenu.hidden;accountMenu.hidden=!open;accountTrigger.setAttribute('aria-expanded',String(open));});
      document.addEventListener('click',function(e){if(!e.target.closest('.sx-account')){accountMenu.hidden=true;accountTrigger.setAttribute('aria-expanded','false');}});
      h.querySelector('#sxLogout').addEventListener('click',async function(){try{if(window.supabase&&window.AKSATIX_SUPABASE_URL&&window.AKSATIX_SUPABASE_ANON_KEY){var client=window.supabase.createClient(window.AKSATIX_SUPABASE_URL,window.AKSATIX_SUPABASE_ANON_KEY,{auth:{storageKey:'aksatix-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});await client.auth.signOut({scope:'local'});} }catch(err){console.warn('Logout Aksatix:',err)}accountMenu.hidden=true;refreshAccount();location.reload();});
      window.addEventListener('storage',refreshAccount);
    }

    var page = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    var active = { 'index': 'home', 'checkout': 'buy' }[page] || (/^(about-aksatix|jual-tiket|tarif-layanan|gelang-tiket|pusat-bantuan|hubungi-kami|syarat-ketentuan|kebijakan-privasi|cek-keaslian-tiket)$/.test(page) ? 'menu' : 'jdw');
    var el = nav.querySelector('[data-n="' + active + '"]');
    if (el) el.classList.add('on');
  }

  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
