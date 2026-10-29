/* Aksatix - Popup dialog (pengganti alert / confirm / prompt bawaan browser).
   API (semuanya Promise):
     AksatixUI.alert(pesan, {title, type:'info'|'success'|'warning'|'error', okText})  -> Promise<void>
     AksatixUI.confirm(pesan, {title, okText, cancelText, danger, type})                -> Promise<boolean>
     AksatixUI.prompt(pesan, nilaiAwal, {title, okText, cancelText, danger, multiline, placeholder}) -> Promise<string|null>
   Pakai: if(await AksatixUI.confirm('Hapus data ini?',{danger:true,okText:'Hapus'})){...} */
(function(){
if(window.AksatixUI&&window.AksatixUI.confirm)return;
var uid=0;
var ICON={
  info:'<path d="M12 11v5M12 8h.01"/><circle cx="12" cy="12" r="9"/>',
  success:'<path d="M7.5 12.5l3 3 6-7"/><circle cx="12" cy="12" r="9"/>',
  warning:'<path d="M12 8v5M12 16.5h.01"/><path d="M10.3 4.2L2.8 17.4A2 2 0 0 0 4.5 20.4h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z"/>',
  error:'<path d="M9 9l6 6M15 9l-6 6"/><circle cx="12" cy="12" r="9"/>',
  ask:'<path d="M9.6 9.2a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.2 1-1.2 1.9M12 17h.01"/><circle cx="12" cy="12" r="9"/>'
};
function css(){
  if(document.getElementById('axd-css'))return;
  var s=document.createElement('style');s.id='axd-css';
  s.textContent=
'.axd-ov{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px;padding-bottom:max(18px,env(safe-area-inset-bottom,0px));background:rgba(13,25,20,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;animation:axdFade .16s ease both}'+
'.axd-ov *{box-sizing:border-box}'+
'.axd{width:min(100%,400px);max-height:calc(100dvh - 36px);overflow:auto;background:#fff;color:#16211D;border-radius:24px;padding:26px 24px 22px;box-shadow:0 24px 70px rgba(22,33,29,.35);text-align:center;animation:axdPop .2s cubic-bezier(.2,.9,.3,1.2) both}'+
'.axd-ic{width:56px;height:56px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:#00FF96;color:#16211D}'+
'.axd-ic svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}'+
'.axd-ic.warning{background:#FFF4D6;color:#8A5A00}.axd-ic.error,.axd-ic.danger{background:#FFF0EF;color:#B42318}.axd-ic.ask{background:#E0FFF1;color:#008F55}'+
'.axd h2{margin:0 0 6px;font-size:18px;line-height:1.3;font-weight:800;letter-spacing:-.3px}'+
'.axd p{margin:0;font-size:14px;line-height:1.6;color:#5E6F68;white-space:pre-line;overflow-wrap:anywhere}'+
'.axd-in{display:block;width:100%;margin-top:14px;min-height:46px;border:1px solid #cfdcd6;border-radius:12px;padding:11px 13px;font:inherit;font-size:16px;color:#16211D;background:#fff;text-align:left}'+
'textarea.axd-in{min-height:92px;resize:vertical}.axd-in:focus{outline:2px solid #00FF96;border-color:#008F55}'+
'.axd-err{display:none;margin-top:6px;font-size:12px;font-weight:700;color:#B42318;text-align:left}.axd-err.on{display:block}'+
'.axd-ft{display:flex;gap:10px;margin-top:20px}.axd-ft button{flex:1 1 0;min-height:46px;border-radius:99px;padding:11px 18px;font:inherit;font-size:14px;font-weight:800;cursor:pointer;border:1.5px solid #16211D;transition:transform .12s ease,background .12s ease}'+
'.axd-ft button:hover{transform:translateY(-1px)}.axd-ft button:focus-visible{outline:3px solid rgba(0,255,150,.55);outline-offset:2px}'+
'.axd-ok{background:#00FF96;border-color:#00FF96!important;color:#16211D}.axd-ok.danger{background:#D92D20;border-color:#D92D20!important;color:#fff}'+
'.axd-no{background:#fff;color:#16211D;border-color:#E2EBE7!important}.axd-no:hover{border-color:#16211D!important}'+
'@media(max-width:480px){.axd{padding:22px 18px 18px;border-radius:22px}.axd-ft{flex-direction:column-reverse}}'+
'@keyframes axdFade{from{opacity:0}to{opacity:1}}@keyframes axdPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}'+
'@media(prefers-reduced-motion:reduce){.axd-ov,.axd{animation:none}.axd-ft button{transition:none}}';
  document.head.appendChild(s);
}
function guess(msg){return /gagal|tidak boleh|tidak valid|tidak bisa|maksimal|harus|belum tersedia|error|kurang dari/i.test(String(msg))?'warning':'info'}
function open(o){
  css();
  return new Promise(function(resolve){
    var id=++uid,mode=o.mode,type=o.type||(mode==='confirm'||mode==='prompt'?'ask':'info');
    if(o.danger)type='danger';
    var prev=document.activeElement;
    var ov=document.createElement('div');ov.className='axd-ov';
    var box=document.createElement('div');box.className='axd';box.setAttribute('role',mode==='alert'?'dialog':'alertdialog');box.setAttribute('aria-modal','true');
    box.setAttribute('aria-labelledby','axd-t'+id);box.setAttribute('aria-describedby','axd-m'+id);
    var ic=document.createElement('div');ic.className='axd-ic '+type;
    ic.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+(ICON[type==='danger'?'warning':type]||ICON.info)+'</svg>';
    var h=document.createElement('h2');h.id='axd-t'+id;h.textContent=o.title||'';
    var p=document.createElement('p');p.id='axd-m'+id;p.textContent=String(o.message==null?'':o.message);
    box.appendChild(ic);box.appendChild(h);box.appendChild(p);
    var input=null,err=null;
    if(mode==='prompt'){
      input=document.createElement(o.multiline?'textarea':'input');input.className='axd-in';if(!o.multiline)input.type='text';
      input.value=o.value==null?'':String(o.value);if(o.placeholder)input.placeholder=o.placeholder;input.setAttribute('aria-label',o.title||'Isian');
      err=document.createElement('div');err.className='axd-err';err.textContent='Wajib diisi.';
      box.appendChild(input);box.appendChild(err);
    }
    var ft=document.createElement('div');ft.className='axd-ft';
    var no=null,ok=document.createElement('button');ok.type='button';ok.className='axd-ok'+(o.danger?' danger':'');ok.textContent=o.okText||(mode==='alert'?'Mengerti':'OK');
    if(mode!=='alert'){no=document.createElement('button');no.type='button';no.className='axd-no';no.textContent=o.cancelText||'Batal';ft.appendChild(no)}
    ft.appendChild(ok);box.appendChild(ft);ov.appendChild(box);document.body.appendChild(ov);
    var done=false;
    function close(v){
      if(done)return;done=true;document.removeEventListener('keydown',onKey,true);
      ov.classList.add('axd-closing');ov.style.transition='opacity .12s ease';ov.style.opacity='0';
      setTimeout(function(){ov.remove()},120);
      try{if(prev&&prev.focus&&document.contains(prev))prev.focus()}catch(_){}
      resolve(v);
    }
    function submit(){
      if(mode==='alert')return close(undefined);
      if(mode==='confirm')return close(true);
      var v=input.value;if(o.required&&!v.trim()){err.classList.add('on');input.focus();return}
      close(v);
    }
    function cancel(){close(mode==='alert'?undefined:mode==='confirm'?false:null)}
    function onKey(e){
      if(!ov.isConnected)return;
      var top=document.querySelectorAll('.axd-ov:not(.axd-closing)');if(top[top.length-1]!==ov)return;
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel()}
      else if(e.key==='Enter'&&!(o.multiline&&!(e.ctrlKey||e.metaKey))&&e.target!==no){e.preventDefault();e.stopPropagation();submit()}
      else if(e.key==='Tab'){
        var f=[].slice.call(box.querySelectorAll('button,input,textarea')).filter(function(x){return !x.disabled});
        if(!f.length)return;var a=f.indexOf(document.activeElement);
        if(e.shiftKey&&a<=0){e.preventDefault();f[f.length-1].focus()}
        else if(!e.shiftKey&&(a===f.length-1||a===-1)){e.preventDefault();f[0].focus()}
      }
    }
    document.addEventListener('keydown',onKey,true);
    ok.addEventListener('click',submit);if(no)no.addEventListener('click',cancel);
    ov.addEventListener('mousedown',function(e){if(e.target===ov&&mode!=='alert')cancel()});
    if(input){input.addEventListener('input',function(){err.classList.remove('on')});setTimeout(function(){input.focus();if(!o.multiline)input.select()},30)}
    else setTimeout(function(){(o.danger&&no?no:ok).focus()},30);
  });
}
window.AksatixUI={
  alert:function(message,opts){opts=opts||{};var t=opts.type||guess(message);return open({mode:'alert',message:message,type:t,title:opts.title||(t==='success'?'Berhasil':t==='warning'||t==='error'?'Perhatian':'Informasi'),okText:opts.okText})},
  confirm:function(message,opts){opts=opts||{};return open({mode:'confirm',message:message,type:opts.type,danger:opts.danger,title:opts.title||(opts.danger?'Yakin mau lanjut?':'Konfirmasi'),okText:opts.okText||(opts.danger?'Ya, lanjut':'Ya'),cancelText:opts.cancelText})},
  prompt:function(message,value,opts){opts=opts||{};return open({mode:'prompt',message:message,value:value,type:opts.type,danger:opts.danger,multiline:opts.multiline,placeholder:opts.placeholder,required:opts.required,title:opts.title||'Isi data',okText:opts.okText||'Simpan',cancelText:opts.cancelText})}
};
})();
