/* Aksatix - Verifikasi pembayaran (admin & client dashboard).
   Transfer: admin lihat bukti -> setujui / tolak. Cash di lokasi: admin atau client terima uang -> Paid -> e-tiket terbit.
   Semua perubahan status lewat RPC server aksatix_order_action (supabase-payments.sql). */
(function(){
if(window.AksatixPay)return;
var B='event-form-uploads';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function base(o){return o.orderNumber||o.id}
function group(o){var b=base(o);return db.orders.filter(function(x){return base(x)===b})}
function fdt(v){try{return v?new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}):'—'}catch(_){return '—'}}
function row(k,v){return '<div><label class="f">'+k+'</label><div style="font-weight:700;font-size:14px;overflow-wrap:anywhere">'+(v||'—')+'</div></div>'}
async function act(ov,b,action,note,okMsg){
  if(!sb||!window.__aksatixRemoteReady){toast('Belum tersambung ke database.');return}
  var r=await sb.rpc('aksatix_order_action',{p_order:b,p_action:action,p_note:note||''});
  if(r.error||!r.data||!r.data.ok){toast('Gagal: '+((r.error&&r.error.message)||(r.data&&r.data.message)||'periksa koneksi'));return}
  (r.data.orders||[]).forEach(function(p){var i=db.orders.findIndex(function(x){return x.id===p.id});if(i>-1)Object.assign(db.orders[i],p)});
  try{renderAll()}catch(_){}
  toast(okMsg);ov.remove();
  try{var p=refreshLive();if(p&&p.catch)p.catch(function(){})}catch(_){}
}
function open(id,role){
  AksatixForm.css();
  var o=db.orders.find(function(x){return x.id===id});if(!o){toast('Pesanan tidak ditemukan');return}
  var rows=group(o),adm=role==='admin',b=base(o),method=o.paymentMethod||'—',pend=rows.some(function(x){return x.status==='Pending'});
  var total=rows.reduce(function(s,x){return s+(+x.total||0)},0),isCash=method==='Cash',isTf=method==='Transfer'||method==='QRIS';
  var proof=o.paymentProof&&o.paymentProof.path?o.paymentProof:null;
  var lines=rows.map(function(x){return esc((eventBy(x.eventId)&&eventBy(x.eventId).name)||x.eventName||'Event')+' - '+esc((ticketBy(x.ticketId)&&ticketBy(x.ticketId).name)||x.ticketName||'Tiket')+' x '+esc(x.qty)}).join('<br>');
  var can=pend&&(adm||isCash);
  var ov=document.createElement('div');ov.className='axb-ov';document.body.appendChild(ov);
  var pf='';
  if(isTf){
    pf='<div class="axb-card"><b style="font-size:14px">Bukti transfer</b> '+(o.proofStatus?'<span class="axb-badge">'+esc(o.proofStatus)+'</span>':'')+
      (o.rejectReason?'<p class="axb-note" style="color:#e11d48">Ditolak: '+esc(o.rejectReason)+'</p>':'')+
      (adm?(proof?'<div id="axpProof" style="margin-top:10px">Memuat bukti…</div>':'<p class="axb-note">Pembeli belum mengunggah bukti.</p>'):'<p class="axb-note">Pembayaran transfer diverifikasi oleh admin Aksatix.</p>')+'</div>';
  }
  ov.innerHTML='<div class="axb" style="max-width:640px"><div class="axb-hd"><div><h2>'+(isCash?'Terima pembayaran cash':'Verifikasi pembayaran')+'</h2><p>Pesanan '+esc(b)+'</p></div><button type="button" class="axb-btn" data-a="x">✕</button></div><div class="axb-bd">'+
    '<div class="axb-card"><div class="axb-row">'+row('Status',statusBadge(o.status))+row('Metode',esc(isCash?'Cash di lokasi':isTf?'Transfer / QRIS':method))+row('Pembeli',esc(o.buyer||o.buyerName))+row('Email / WA',esc(o.email||o.buyerEmail)+(o.phone||o.buyerPhone?'<br>'+esc(o.phone||o.buyerPhone):''))+'</div>'+
    '<div class="axb-row one" style="margin-top:6px">'+row('Tiket',lines)+row('Total yang harus dibayar',money(total))+(isCash?row('Batas bayar cash',fdt(o.cashExpiresAt)):'')+'</div></div>'+pf+
    (can?'':'<p class="axb-note">'+(pend?'Pesanan ini hanya dapat diproses oleh admin.':'Pesanan sudah tidak berstatus Pending.')+'</p>')+
    '</div><div class="axb-ft"><button type="button" class="axb-btn" data-a="x">Tutup</button>'+
    (can?'<button type="button" class="axb-btn r" data-a="cancel">Batalkan pesanan</button>':'')+
    (can&&adm&&isTf?'<button type="button" class="axb-btn r" data-a="reject">Tolak bukti</button>':'')+
    (can?'<button type="button" class="axb-btn g" data-a="approve">'+(isCash?'Terima cash '+money(total):'Setujui pembayaran')+'</button>':'')+'</div></div>';
  if(adm&&proof){
    sb.storage.from(B).createSignedUrl(proof.path,900).then(function(r){
      var h=document.getElementById('axpProof');if(!h)return;
      if(r.error||!r.data){h.textContent='Bukti tidak bisa dibuka (cek policy storage di supabase-event-forms.sql).';return}
      var u=r.data.signedUrl,img=/^image\//.test(proof.type||'')||/\.(png|jpe?g|webp|gif)$/i.test(proof.name||'');
      h.innerHTML=(img?'<a href="'+esc(u)+'" target="_blank" rel="noopener"><img src="'+esc(u)+'" alt="Bukti transfer" style="max-width:100%;max-height:420px;border-radius:12px;border:1px solid #E2EBE7"></a>':'')+'<p class="axb-note"><a href="'+esc(u)+'" target="_blank" rel="noopener" style="color:#008F55;font-weight:700">Buka '+esc(proof.name||'file bukti')+'</a> · diunggah '+fdt(proof.uploadedAt)+'</p>';
    });
  }
  ov.addEventListener('click',async function(ev){
    var a=ev.target.closest('[data-a]');if(!a)return;var k=a.dataset.a;
    if(k==='x')return ov.remove();
    if(k==='approve'){
      var msg=isCash?'Konfirmasi: uang tunai '+money(total)+' sudah diterima dari '+(o.buyer||o.buyerName||'pembeli')+'? E-tiket akan langsung terbit.':'Setujui pembayaran ini? E-tiket akan langsung terbit.';
      if(isTf&&!proof&&!(await AksatixUI.confirm('Pembeli belum mengunggah bukti. Tetap setujui?',{okText:'Tetap setujui',title:'Bukti belum ada',type:'warning'})))return;
      if(await AksatixUI.confirm(msg,{okText:isCash?'Cash diterima':'Setujui',title:isCash?'Terima pembayaran cash':'Setujui pembayaran'}))act(ov,b,'approve','',isCash?'Cash diterima, e-tiket terbit':'Pembayaran disetujui, e-tiket terbit');
    }
    if(k==='reject'){var n=await AksatixUI.prompt('Alasan penolakan (dilihat pembeli):','Bukti tidak jelas / nominal tidak sesuai',{title:'Tolak bukti',okText:'Tolak bukti',danger:true,multiline:true,required:true});if(n!==null)act(ov,b,'reject',n,'Bukti ditolak, pembeli diminta upload ulang')}
    if(k==='cancel'){var m=await AksatixUI.prompt('Batalkan pesanan ini? Kuota tiket dikembalikan.\nAlasan pembatalan (opsional):','',{title:'Batalkan pesanan',okText:'Batalkan pesanan',cancelText:'Kembali',danger:true,multiline:true});if(m!==null)act(ov,b,'cancel',m,'Pesanan dibatalkan')}
  });
}
/* Dipanggil scanner/pencarian: kode = nomor pesanan yang masih Pending -> buka dialog pembayaran. */
function scan(code,role){
  var c=String(code||'').replace(/\s/g,'').toUpperCase();if(!c)return false;
  var o=db.orders.find(function(x){return x.status==='Pending'&&(String(x.orderNumber||'').toUpperCase()===c||String(x.id||'').toUpperCase()===c)});
  if(!o)return false;open(o.id,role);return true;
}
window.AksatixPay={open:open,scan:scan};
})();
