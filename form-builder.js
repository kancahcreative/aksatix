/* Aksatix – Form Pendaftaran Event (seperti Google Form).
   Dipakai oleh: admin.html & client-dashboard.html (builder + lihat jawaban) dan checkout.html (isi form).
   Skema disimpan di event: event.regForm = {enabled,title,description,scope,fields:[...]}.
   Jawaban disimpan di order: payload.formResponses = [{n,scope,answers:[{id,label,type,value}]}].
   File upload -> bucket Supabase Storage "event-form-uploads" (privat). Jalankan supabase-event-forms.sql. */
(function(){
if(window.AksatixForm)return;
var BUCKET='event-form-uploads';
var TYPES=[
 ['short','Jawaban singkat'],['long','Paragraf'],['number','Angka'],['email','Email'],['phone','Nomor telepon / WhatsApp'],['url','Link (URL)'],
 ['date','Tanggal'],['time','Jam'],['select','Dropdown'],['radio','Pilihan ganda'],['checkbox','Kotak centang (multi pilih)'],
 ['agree','Persetujuan (1 centang)'],['scale','Skala linear'],['file','Upload file / gambar'],['section','Judul bagian / teks info']
];
var CHOICE={select:1,radio:1,checkbox:1};
var ACCEPT={image:['Gambar (JPG, PNG, WebP)','image/*'],pdf:['PDF','application/pdf'],image_pdf:['Gambar atau PDF','image/*,application/pdf'],doc:['Dokumen (PDF, Word, Excel, PPT, TXT, CSV)','.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'],any:['Semua jenis file','']};
var seq=0;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function rid(){return 'f_'+Math.random().toString(36).slice(2,8)}
function clone(o){return JSON.parse(JSON.stringify(o))}
function typeName(t){for(var i=0;i<TYPES.length;i++)if(TYPES[i][0]===t)return TYPES[i][1];return t}
function newField(type){
  var f={id:rid(),type:type,label:type==='section'?'Judul bagian':'Pertanyaan tanpa judul',help:'',required:false,placeholder:''};
  if(CHOICE[type]){f.options=['Opsi 1','Opsi 2'];if(type!=='select')f.allowOther=false}
  if(type==='scale'){f.min=1;f.max=5;f.lowLabel='';f.highLabel=''}
  if(type==='file'){f.accept='image';f.maxMB=5;f.maxFiles=1}
  if(type==='agree')f.label='Saya menyetujui syarat dan ketentuan';
  return f;
}
function defaultForm(){return{enabled:true,title:'Form Pendaftaran',description:'',scope:'order',fields:[newField('short')]}}
function hasForm(e){var f=e&&e.regForm;return !!(f&&f.enabled&&Array.isArray(f.fields)&&f.fields.some(function(x){return x.type!=='section'}))}

/* ---------------- CSS ---------------- */
function css(){
  if(document.getElementById('axf-css'))return;
  var s=document.createElement('style');s.id='axf-css';
  s.textContent=
'.axf{font-family:inherit;color:#16211D}.axf *{box-sizing:border-box}'+
'.axf{max-width:100%;min-width:0;overflow-wrap:anywhere}.axf input,.axf select,.axf textarea{max-width:100%;min-width:0}'+
'.axf input[type=date],.axf input[type=time],.axf select{-webkit-appearance:none;appearance:none;display:block;text-align:left;line-height:1.3}.axf select{padding-right:34px;text-overflow:ellipsis;background:#fff url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' fill=\'none\' stroke=\'%2316211D\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E") no-repeat right 12px center}'+
'.axf-o span{min-width:0}.axf-o .axf-oth{flex:1 1 0;width:auto!important;min-width:0}.axf input[type=file]{max-width:100%;overflow:hidden}'+
'@media(max-width:600px){.axf-q{margin-bottom:18px}.axf-o{padding:10px 0;font-size:15px}.axf-sc{justify-content:space-between;gap:6px}.axf-sc label{flex:1 1 0;min-width:0}.axf-sc small{flex:1 0 100%;text-align:left}.axf textarea{min-height:110px}}'+
'.axf-q{margin:0 0 16px}.axf-q[hidden]{display:none}.axf-l{display:block;font-weight:700;font-size:14px;margin-bottom:6px}.axf-l i{color:#e11d48;font-style:normal}'+
'.axf-h{display:block;font-size:12px;color:#64746d;margin:-2px 0 6px}'+
'.axf input[type=text],.axf input[type=number],.axf input[type=email],.axf input[type=tel],.axf input[type=url],.axf input[type=date],.axf input[type=time],.axf select,.axf textarea{width:100%;min-height:44px;border:1px solid #cfdcd6;border-radius:12px;padding:10px 12px;font:inherit;font-size:16px;background:#fff;color:#16211D}'+
'.axf textarea{min-height:96px;resize:vertical}.axf input:focus,.axf select:focus,.axf textarea:focus{outline:2px solid #00FF96;border-color:#008F55}'+
'.axf-o{display:flex;align-items:flex-start;gap:10px;padding:8px 0;font-size:14px;cursor:pointer}.axf-o input{margin-top:3px;width:18px;height:18px;flex:none;accent-color:#008F55}.axf-o .axf-oth{margin-left:4px;min-height:36px}'+
'.axf-sc{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.axf-sc label{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px;font-weight:600;min-width:36px;cursor:pointer}.axf-sc input{width:18px;height:18px;accent-color:#008F55}.axf-sc small{color:#64746d;font-size:12px}'+
'.axf-err{display:none;color:#e11d48;font-size:12px;font-weight:600;margin-top:5px}.axf-q.bad .axf-err{display:block}.axf-q.bad input[type=text],.axf-q.bad textarea,.axf-q.bad select{border-color:#e11d48}'+
'.axf-sec{margin:22px 0 8px;padding-top:14px;border-top:1px solid #E2EBE7}.axf-sec b{display:block;font-size:16px}.axf-sec span{display:block;font-size:13px;color:#64746d;margin-top:2px}'+
'.axf-fl{margin-top:6px;font-size:12px;color:#64746d}.axf input[type=file]{width:100%;font-size:14px;padding:10px;border:1px dashed #9db9ad;border-radius:12px;background:#f7fbf9}'+
/* builder */
'.axb-ov{position:fixed;inset:0;z-index:9999;background:rgba(13,25,20,.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px;font-family:"Plus Jakarta Sans",system-ui,sans-serif}'+
'.axb{background:#f3f7f5;border-radius:20px;width:min(860px,100%);color:#16211D;box-shadow:0 24px 70px rgba(0,0,0,.35)}.axb *{box-sizing:border-box}'+
'.axb-hd{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:18px 22px;background:#fff;border-radius:20px 20px 0 0;border-bottom:1px solid #E2EBE7;position:sticky;top:0;z-index:2}.axb-hd h2{margin:0;font-size:18px}.axb-hd p{margin:2px 0 0;font-size:12px;color:#64746d}'+
'.axb-bd{padding:18px 22px}.axb-ft{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;padding:14px 22px;background:#fff;border-radius:0 0 20px 20px;border-top:1px solid #E2EBE7;position:sticky;bottom:0}'+
'.axb-card{background:#fff;border:1px solid #E2EBE7;border-radius:16px;padding:16px;margin-bottom:12px}.axb-card.on{border-left:5px solid #008F55}'+
'.axb-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.axb-row.one{grid-template-columns:1fr}@media(max-width:640px){.axb-row{grid-template-columns:1fr}}'+
'.axb label.f{display:block;font-size:12px;font-weight:700;color:#4a5a54;margin:10px 0 4px}'+
'.axb input[type=text],.axb input[type=number],.axb select,.axb textarea{width:100%;min-height:40px;border:1px solid #cfdcd6;border-radius:10px;padding:8px 10px;font:inherit;font-size:14px;background:#fff;color:#16211D}.axb textarea{min-height:84px;resize:vertical}'+
'.axb-top{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.axb-tools{display:flex;gap:6px;flex-wrap:wrap}'+
'.axb-btn{border:1px solid #cfdcd6;background:#fff;color:#16211D;border-radius:10px;padding:8px 12px;font:600 13px inherit;cursor:pointer}.axb-btn:hover{background:#f2fbf6}.axb-btn.g{background:#00FF96;border-color:#00FF96}.axb-btn.r{color:#e11d48}.axb-btn[disabled]{opacity:.4;cursor:default}'+
'.axb-sw{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600}.axb-sw input{width:18px;height:18px;accent-color:#008F55}'+
'.axb-badge{display:inline-block;font-size:11px;font-weight:800;color:#008F55;background:#e6fff3;border-radius:99px;padding:3px 9px}'+
'.axb-add{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;margin-top:6px}'+
'.axb-note{font-size:12px;color:#64746d;margin:4px 0 0}'+
'.axr-wrap{overflow:auto;border:1px solid #E2EBE7;border-radius:14px;background:#fff}.axr{border-collapse:collapse;width:100%;font-size:13px}.axr th,.axr td{padding:9px 12px;border-bottom:1px solid #edf1ef;text-align:left;vertical-align:top;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis}.axr th{background:#f7fbf9;font-size:12px;position:sticky;top:0}.axr a{color:#008F55;font-weight:700;cursor:pointer;text-decoration:underline}';
  document.head.appendChild(s);
}

/* ---------------- RENDERER ---------------- */
function mount(root,form,o){
  css();o=o||{};var pre=o.prefix||('axf'+(++seq)),fs=(form&&form.fields)||[];
  root.classList.add('axf');
  function fieldHTML(f){
    var id=pre+'_'+f.id,req=f.required?' <i>*</i>':'',lab='<label class="axf-l" for="'+id+'">'+esc(f.label)+req+'</label>'+(f.help?'<span class="axf-h">'+esc(f.help)+'</span>':'');
    var ph=f.placeholder?' placeholder="'+esc(f.placeholder)+'"':'',inner='';
    var t=f.type;
    if(t==='section')return '<div class="axf-sec" data-f="'+f.id+'"><b>'+esc(f.label)+'</b>'+(f.help?'<span>'+esc(f.help)+'</span>':'')+'</div>';
    if(t==='long')inner='<textarea id="'+id+'"'+ph+(f.maxLen?' maxlength="'+(+f.maxLen)+'"':'')+'></textarea>';
    else if(t==='short')inner='<input type="text" id="'+id+'"'+ph+(f.maxLen?' maxlength="'+(+f.maxLen)+'"':'')+'>';
    else if(t==='number')inner='<input type="number" inputmode="decimal" id="'+id+'"'+ph+(f.min!==''&&f.min!=null?' min="'+esc(f.min)+'"':'')+(f.max!==''&&f.max!=null?' max="'+esc(f.max)+'"':'')+'>';
    else if(t==='email')inner='<input type="email" id="'+id+'"'+ph+' autocomplete="email">';
    else if(t==='phone')inner='<input type="tel" id="'+id+'"'+ph+' autocomplete="tel">';
    else if(t==='url')inner='<input type="url" id="'+id+'"'+(ph||' placeholder="https://"')+'>';
    else if(t==='date')inner='<input type="date" id="'+id+'"'+(f.min?' min="'+esc(f.min)+'"':'')+(f.max?' max="'+esc(f.max)+'"':'')+'>';
    else if(t==='time')inner='<input type="time" id="'+id+'">';
    else if(t==='select')inner='<select id="'+id+'"><option value="">Pilih…</option>'+(f.options||[]).map(function(x){return '<option>'+esc(x)+'</option>'}).join('')+'</select>';
    else if(t==='radio'||t==='checkbox'){
      var ty=t==='radio'?'radio':'checkbox';
      inner=(f.options||[]).map(function(x){return '<label class="axf-o"><input type="'+ty+'" name="'+id+'" value="'+esc(x)+'"><span>'+esc(x)+'</span></label>'}).join('');
      if(f.allowOther)inner+='<label class="axf-o"><input type="'+ty+'" name="'+id+'" value="__other"><span>Lainnya:</span><input type="text" class="axf-oth" aria-label="Lainnya"></label>';
    }
    else if(t==='agree')return '<div class="axf-q" data-f="'+f.id+'"><label class="axf-o"><input type="checkbox" id="'+id+'"><span><b>'+esc(f.label)+req+'</b>'+(f.help?'<br><small style="color:#64746d">'+esc(f.help)+'</small>':'')+'</span></label><div class="axf-err"></div></div>';
    else if(t==='scale'){
      var a=+f.min||1,b=+f.max||5,r='';for(var n=a;n<=b;n++)r+='<label><span>'+n+'</span><input type="radio" name="'+id+'" value="'+n+'"></label>';
      inner='<div class="axf-sc">'+(f.lowLabel?'<small>'+esc(f.lowLabel)+'</small>':'')+r+(f.highLabel?'<small>'+esc(f.highLabel)+'</small>':'')+'</div>';
    }
    else if(t==='file'){
      var ac=(ACCEPT[f.accept||'image']||ACCEPT.image);
      inner='<input type="file" id="'+id+'"'+(ac[1]?' accept="'+ac[1]+'"':'')+((+f.maxFiles||1)>1?' multiple':'')+'><div class="axf-fl">'+esc(ac[0])+' · maks. '+(+f.maxMB||5)+' MB'+((+f.maxFiles||1)>1?' per file · hingga '+(+f.maxFiles)+' file':'')+'</div>';
    }
    return '<div class="axf-q" data-f="'+f.id+'">'+lab+inner+'<div class="axf-err"></div></div>';
  }
  root.innerHTML=fs.map(fieldHTML).join('');
  function wrap(f){return root.querySelector('[data-f="'+f.id+'"]')}
  function byId(id){for(var i=0;i<fs.length;i++)if(fs[i].id===id)return fs[i];return null}
  function val(f){
    var w=wrap(f);if(!w)return '';var t=f.type;
    if(t==='agree')return w.querySelector('input').checked;
    if(t==='file'){return Array.prototype.slice.call(w.querySelector('input').files||[])}
    if(t==='radio'||t==='scale'){var c=w.querySelector('input[type=radio]:checked');if(!c)return '';if(c.value==='__other'){var x=(w.querySelector('.axf-oth').value||'').trim();return x?'Lainnya: '+x:''}return c.value}
    if(t==='checkbox'){var out=[];w.querySelectorAll('input[type=checkbox]:checked').forEach(function(c){if(c.value==='__other'){var x=(w.querySelector('.axf-oth').value||'').trim();if(x)out.push('Lainnya: '+x)}else out.push(c.value)});return out}
    var el=w.querySelector('input,textarea,select');return el?String(el.value||'').trim():'';
  }
  function empty(v){return v===''||v===false||v==null||(Array.isArray(v)&&!v.length)}
  function visible(f,d){
    d=d||0;if(d>8)return true;var c=f.showIf;if(!c||!c.field)return true;
    var src=byId(c.field);if(!src)return true;if(!visible(src,d+1))return false;
    var v=val(src),has=Array.isArray(v)?v.indexOf(c.value)>-1:String(v)===String(c.value);
    if(c.op==='filled')return !empty(v);if(c.op==='neq')return !has;return has;
  }
  function refresh(){fs.forEach(function(f){var w=wrap(f);if(w)w.hidden=!visible(f)})}
  root.addEventListener('input',refresh);root.addEventListener('change',refresh);refresh();
  function fail(f,m){var w=wrap(f);if(!w)return;w.classList.add('bad');w.querySelector('.axf-err').textContent=m}
  function validate(){
    var first=null;root.querySelectorAll('.axf-q.bad').forEach(function(w){w.classList.remove('bad')});
    fs.forEach(function(f){
      if(f.type==='section'||!visible(f))return;var v=val(f),bad=null,t=f.type;
      if(empty(v)){if(f.required)bad=t==='file'?'Wajib upload file.':'Wajib diisi.'}
      else if(t==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))bad='Format email belum benar.';
      else if(t==='url'&&!/^https?:\/\/\S+\.\S+/i.test(v))bad='Link harus diawali http:// atau https://';
      else if(t==='phone'&&!/^[0-9+()\-\s]{8,20}$/.test(v))bad='Nomor telepon belum benar.';
      else if(t==='number'){var n=Number(v);if(isNaN(n))bad='Harus berupa angka.';else if(f.min!==''&&f.min!=null&&n<Number(f.min))bad='Minimal '+f.min+'.';else if(f.max!==''&&f.max!=null&&n>Number(f.max))bad='Maksimal '+f.max+'.'}
      else if((t==='short'||t==='long')&&f.minLen&&v.length<+f.minLen)bad='Minimal '+f.minLen+' karakter.';
      else if(t==='date'&&((f.min&&v<f.min)||(f.max&&v>f.max)))bad='Tanggal di luar rentang yang diizinkan.';
      else if(t==='checkbox'){if(f.minSel&&v.length<+f.minSel)bad='Pilih minimal '+f.minSel+'.';else if(f.maxSel&&v.length>+f.maxSel)bad='Pilih maksimal '+f.maxSel+'.'}
      else if(t==='file'){
        var mb=(+f.maxMB||5),mx=(+f.maxFiles||1),ac=f.accept||'image';
        if(v.length>mx)bad='Maksimal '+mx+' file.';
        else for(var i=0;i<v.length;i++){var fl=v[i],nm=fl.name.toLowerCase();
          if(fl.size>mb*1048576){bad='"'+fl.name+'" melebihi '+mb+' MB.';break}
          if(ac==='image'&&!/^image\//.test(fl.type)){bad='"'+fl.name+'" harus berupa gambar.';break}
          if(ac==='pdf'&&!/\.pdf$/.test(nm)){bad='"'+fl.name+'" harus PDF.';break}
          if(ac==='image_pdf'&&!/^image\//.test(fl.type)&&!/\.pdf$/.test(nm)){bad='"'+fl.name+'" harus gambar atau PDF.';break}
          if(ac==='doc'&&!/\.(pdf|docx?|xlsx?|pptx?|txt|csv)$/.test(nm)){bad='"'+fl.name+'" bukan format dokumen yang diizinkan.';break}}
      }
      if(bad){fail(f,bad);if(!first)first=f}
    });
    if(first){var w=wrap(first);w.scrollIntoView({behavior:'smooth',block:'center'});var el=w.querySelector('input,textarea,select');if(el)try{el.focus({preventScroll:true})}catch(_){}}
    return !first;
  }
  function collect(){
    var answers=[],files=[];
    fs.forEach(function(f){
      if(f.type==='section'||!visible(f))return;var v=val(f);if(empty(v)&&!f.required)return;
      var a={id:f.id,label:f.label,type:f.type,value:f.type==='file'?[]:v};answers.push(a);
      if(f.type==='file'&&v.length)files.push({answer:a,list:v});
    });
    return {answers:answers,files:files};
  }
  return {validate:validate,collect:collect,root:root};
}
/* Upload file ke Storage, ganti value jawaban file jadi metadata. base = "<userId>/<eventKey>/<orderNo>" */
async function finalize(col,sb,base){
  var n=0;
  for(var i=0;i<col.files.length;i++){
    var it=col.files[i],out=[];
    for(var j=0;j<it.list.length;j++){
      var fl=it.list[j],ext=(fl.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'bin';
      var path=base+'/'+it.answer.id+'-'+(++n)+'-'+Math.random().toString(36).slice(2,7)+'.'+ext;
      var r=await sb.storage.from(BUCKET).upload(path,fl,{contentType:fl.type||'application/octet-stream',upsert:false});
      if(r.error)throw new Error('Upload "'+fl.name+'" gagal: '+(r.error.message||'periksa policy storage (jalankan supabase-event-forms.sql)'));
      out.push({path:path,name:fl.name,size:fl.size,type:fl.type||''});
    }
    it.answer.value=out;
  }
  return col.answers;
}

/* ---------------- BUILDER (admin & client dashboard) ---------------- */
function openBuilder(eventId){
  css();
  var e=eventBy(eventId);if(!e){toast('Event tidak ditemukan');return}
  var F=e.regForm?clone(e.regForm):defaultForm(),preview=false,ov=document.createElement('div');
  F.fields=F.fields||[];ov.className='axb-ov';document.body.appendChild(ov);
  function close(){ov.remove()}
  function opt(v,l,s){return '<option value="'+esc(v)+'"'+(s?' selected':'')+'>'+esc(l)+'</option>'}
  function settings(f,i){
    var t=f.type,h='';
    function inp(k,l,ty,extra){return '<div><label class="f">'+l+'</label><input type="'+(ty||'text')+'" data-i="'+i+'" data-k="'+k+'" value="'+esc(f[k]==null?'':f[k])+'" '+(extra||'')+'></div>'}
    if(t==='section')return '';
    if(CHOICE[t]){
      h+='<label class="f">Pilihan jawaban (satu per baris)</label><textarea data-i="'+i+'" data-k="options">'+esc((f.options||[]).join('\n'))+'</textarea>';
      if(t!=='select')h+='<label class="axb-sw" style="margin-top:8px"><input type="checkbox" data-i="'+i+'" data-k="allowOther"'+(f.allowOther?' checked':'')+'> Sediakan opsi "Lainnya" (isian bebas)</label>';
      if(t==='checkbox')h+='<div class="axb-row">'+inp('minSel','Minimal dipilih','number','min="0"')+inp('maxSel','Maksimal dipilih','number','min="0"')+'</div>';
    }
    if(t==='short'||t==='long')h+='<div class="axb-row">'+inp('placeholder','Placeholder (contoh isian)')+inp('minLen','Minimal karakter','number','min="0"')+inp('maxLen','Maksimal karakter','number','min="0"')+'</div>';
    if(t==='number')h+='<div class="axb-row">'+inp('placeholder','Placeholder')+'<div></div>'+inp('min','Nilai minimum','number')+inp('max','Nilai maksimum','number')+'</div>';
    if(t==='email'||t==='phone'||t==='url')h+='<div class="axb-row one">'+inp('placeholder','Placeholder')+'</div>';
    if(t==='date')h+='<div class="axb-row"><div><label class="f">Tanggal paling awal</label><input type="date" data-i="'+i+'" data-k="min" value="'+esc(f.min||'')+'"></div><div><label class="f">Tanggal paling akhir</label><input type="date" data-i="'+i+'" data-k="max" value="'+esc(f.max||'')+'"></div></div>';
    if(t==='scale')h+='<div class="axb-row">'+'<div><label class="f">Dari</label><select data-i="'+i+'" data-k="min">'+[0,1].map(function(x){return opt(x,x,+f.min===x)}).join('')+'</select></div><div><label class="f">Sampai</label><select data-i="'+i+'" data-k="max">'+[2,3,4,5,6,7,8,9,10].map(function(x){return opt(x,x,+f.max===x)}).join('')+'</select></div>'+inp('lowLabel','Label kiri (opsional)')+inp('highLabel','Label kanan (opsional)')+'</div>';
    if(t==='file')h+='<div class="axb-row"><div><label class="f">Jenis file yang diizinkan</label><select data-i="'+i+'" data-k="accept">'+Object.keys(ACCEPT).map(function(k){return opt(k,ACCEPT[k][0],(f.accept||'image')===k)}).join('')+'</select></div>'+inp('maxMB','Ukuran maks. per file (MB, 1–10)','number','min="1" max="10"')+inp('maxFiles','Jumlah file maks. (1–5)','number','min="1" max="5"')+'</div>';
    return h;
  }
  function cond(f,i){
    if(f.type==='section'&&false)return '';
    var prev=F.fields.slice(0,i).filter(function(x){return x.type!=='section'}),c=f.showIf||{},src=null;
    if(!prev.length)return '';
    prev.forEach(function(x){if(x.id===c.field)src=x});
    var h='<label class="f">Logika tampil (opsional)</label><div class="axb-row"><div><select data-i="'+i+'" data-k="sf"><option value="">Selalu tampil</option>'+prev.map(function(x){return opt(x.id,'Tampil jika: '+x.label.slice(0,40),x.id===c.field)}).join('')+'</select></div>';
    if(src){
      h+='<div><select data-i="'+i+'" data-k="so">'+opt('eq','sama dengan',c.op!=='neq'&&c.op!=='filled')+opt('neq','tidak sama dengan',c.op==='neq')+opt('filled','sudah diisi',c.op==='filled')+'</select></div>';
      if(c.op!=='filled'){
        var os=src.type==='agree'?['true']:src.type==='scale'?(function(){var a=[];for(var n=+src.min||1;n<=(+src.max||5);n++)a.push(String(n));return a})():(src.options||null);
        h+='<div class="axb-row one" style="grid-column:1/-1">'+(os?'<select data-i="'+i+'" data-k="sv">'+os.map(function(x){return opt(x,x,x===c.value)}).join('')+'</select>':'<input type="text" data-i="'+i+'" data-k="sv" placeholder="Nilai jawaban" value="'+esc(c.value||'')+'">')+'</div>';
      }
    }
    return h+'</div>';
  }
  function card(f,i){
    var n=F.fields.length;
    return '<div class="axb-card on"><div class="axb-top"><span class="axb-badge">'+esc(typeName(f.type))+'</span><div class="axb-tools">'+
      '<button type="button" class="axb-btn" data-a="up" data-i="'+i+'"'+(i===0?' disabled':'')+'>↑</button><button type="button" class="axb-btn" data-a="down" data-i="'+i+'"'+(i===n-1?' disabled':'')+'>↓</button>'+
      '<button type="button" class="axb-btn" data-a="dup" data-i="'+i+'">Duplikat</button><button type="button" class="axb-btn r" data-a="del" data-i="'+i+'">Hapus</button></div></div>'+
      '<div class="axb-row"><div><label class="f">'+(f.type==='section'?'Judul bagian':'Pertanyaan')+'</label><input type="text" data-i="'+i+'" data-k="label" value="'+esc(f.label)+'"></div>'+
      '<div><label class="f">Jenis</label><select data-i="'+i+'" data-k="type">'+TYPES.map(function(t){return opt(t[0],t[1],t[0]===f.type)}).join('')+'</select></div></div>'+
      '<label class="f">'+(f.type==='section'?'Teks penjelasan (opsional)':'Keterangan / petunjuk (opsional)')+'</label><input type="text" data-i="'+i+'" data-k="help" value="'+esc(f.help||'')+'">'+
      settings(f,i)+cond(f,i)+
      (f.type!=='section'?'<label class="axb-sw" style="margin-top:12px"><input type="checkbox" data-i="'+i+'" data-k="required"'+(f.required?' checked':'')+'> Wajib diisi</label>':'')+'</div>';
  }
  function draw(){
    var keep=ov.scrollTop;
    if(preview){
      ov.innerHTML='<div class="axb"><div class="axb-hd"><div><h2>Pratinjau form</h2><p>Begini tampilan form di halaman checkout.</p></div></div><div class="axb-bd"><div class="axb-card"><h3 style="margin:0 0 4px">'+esc(F.title||'Form Pendaftaran')+'</h3>'+(F.description?'<p class="axb-note" style="margin:0 0 14px">'+esc(F.description)+'</p>':'<div style="height:10px"></div>')+'<div id="axbPv"></div></div></div><div class="axb-ft"><button type="button" class="axb-btn g" data-a="back">← Kembali ke editor</button></div></div>';
      var c=mount(ov.querySelector('#axbPv'),F,{prefix:'pv'});
      var b=document.createElement('button');b.type='button';b.className='axb-btn';b.textContent='Tes validasi';b.onclick=function(){if(c.validate())toast('Semua isian valid')};ov.querySelector('#axbPv').appendChild(b);
    }else{
      ov.innerHTML='<div class="axb"><div class="axb-hd"><div><h2>Form pendaftaran · '+esc(e.name)+'</h2><p>Pembeli wajib mengisi form ini sebelum checkout. Jawaban bisa dilihat di tombol "Jawaban form" pada daftar event.</p></div><button type="button" class="axb-btn" data-a="x">✕</button></div><div class="axb-bd">'+
        '<div class="axb-card"><label class="axb-sw"><input type="checkbox" data-g="enabled"'+(F.enabled?' checked':'')+'> Aktifkan form pendaftaran untuk event ini</label>'+
        '<div class="axb-row"><div><label class="f">Judul form</label><input type="text" data-g="title" value="'+esc(F.title||'')+'"></div><div><label class="f">Form diisi</label><select data-g="scope">'+opt('order','Sekali per pesanan',F.scope!=='ticket')+opt('ticket','Untuk setiap tiket (data tiap peserta)',F.scope==='ticket')+'</select></div></div>'+
        '<label class="f">Deskripsi / petunjuk pengisian</label><textarea data-g="description">'+esc(F.description||'')+'</textarea></div>'+
        F.fields.map(card).join('')+
        '<div class="axb-card"><b style="font-size:14px">+ Tambah pertanyaan</b><div class="axb-add">'+TYPES.map(function(t){return '<button type="button" class="axb-btn" data-a="add" data-t="'+t[0]+'">'+esc(t[1])+'</button>'}).join('')+'</div></div></div>'+
        '<div class="axb-ft"><button type="button" class="axb-btn" data-a="x">Batal</button><button type="button" class="axb-btn" data-a="pv">Pratinjau</button><button type="button" class="axb-btn g" data-a="save">Simpan form</button></div></div>';
    }
    ov.scrollTop=keep;
  }
  function problems(){
    for(var i=0;i<F.fields.length;i++){var f=F.fields[i];
      if(!String(f.label||'').trim())return 'Pertanyaan #'+(i+1)+' belum punya judul.';
      if(CHOICE[f.type]&&(!f.options||!f.options.length))return '"'+f.label+'" butuh minimal 1 pilihan jawaban.';
      if(f.type==='scale'&&+f.max<=+f.min)return '"'+f.label+'": batas skala tidak valid.';
      if(f.type==='file'){if(!(+f.maxMB>=1&&+f.maxMB<=10))return '"'+f.label+'": ukuran file 1–10 MB.';if(!(+f.maxFiles>=1&&+f.maxFiles<=5))return '"'+f.label+'": jumlah file 1–5.'}
    }
    return F.enabled&&!F.fields.some(function(x){return x.type!=='section'})?'Tambahkan minimal satu pertanyaan.':'';
  }
  ov.addEventListener('input',function(ev){
    var t=ev.target,g=t.dataset.g,k=t.dataset.k,i=t.dataset.i;
    if(g){F[g]=t.type==='checkbox'?t.checked:t.value;return}
    if(i==null||!k||k==='type'||k==='sf'||k==='so')return;var f=F.fields[+i];if(!f)return;
    if(k==='options')f.options=t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean);
    else if(k==='sv'){f.showIf=f.showIf||{};f.showIf.value=t.value}
    else if(t.type==='checkbox')f[k]=t.checked;else f[k]=t.value;
  });
  ov.addEventListener('change',function(ev){
    var t=ev.target,k=t.dataset.k,i=t.dataset.i;if(t.dataset.g==='enabled'){F.enabled=t.checked;return}if(t.dataset.g){F[t.dataset.g]=t.value;return}
    if(i==null)return;var f=F.fields[+i];if(!f)return;
    if(k==='type'){var nf=newField(t.value);nf.id=f.id;nf.label=f.label;nf.help=f.help;nf.required=f.required&&t.value!=='section';if(CHOICE[t.value]&&CHOICE[f.type]&&f.options)nf.options=f.options;if(f.showIf)nf.showIf=f.showIf;F.fields[+i]=nf;draw()}
    else if(k==='sf'){if(t.value){var s=F.fields.filter(function(x){return x.id===t.value})[0];f.showIf={field:t.value,op:'eq',value:s&&s.options?s.options[0]:s&&s.type==='agree'?'true':''}}else delete f.showIf;draw()}
    else if(k==='so'){f.showIf.op=t.value;draw()}
    else if(k==='sv'){f.showIf=f.showIf||{};f.showIf.value=t.value}
    else if(t.tagName==='SELECT')f[k]=t.value;
  });
  ov.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-a]');if(!b)return;var a=b.dataset.a,i=+b.dataset.i;
    if(a==='x')return close();
    if(a==='pv'){var p=problems();if(p){toast(p);return}preview=true;return draw()}
    if(a==='back'){preview=false;return draw()}
    if(a==='add'){F.fields.push(newField(b.dataset.t));draw();var cs=ov.querySelectorAll('.axb-card.on');if(cs.length)cs[cs.length-1].scrollIntoView({behavior:'smooth',block:'center'});return}
    if(a==='del'){F.fields.splice(i,1);F.fields.forEach(function(f){if(f.showIf&&f.showIf.field&&!F.fields.some(function(x){return x.id===f.showIf.field}))delete f.showIf});return draw()}
    if(a==='dup'){var c=clone(F.fields[i]);c.id=rid();c.label+=' (salinan)';F.fields.splice(i+1,0,c);return draw()}
    if(a==='up'&&i>0){var x=F.fields[i];F.fields[i]=F.fields[i-1];F.fields[i-1]=x;return draw()}
    if(a==='down'&&i<F.fields.length-1){var y=F.fields[i];F.fields[i]=F.fields[i+1];F.fields[i+1]=y;return draw()}
    if(a==='save'){
      var m=problems();if(m){toast(m);return}
      F.fields.forEach(function(f){['min','max','maxLen','minLen','minSel','maxSel','maxMB','maxFiles'].forEach(function(k){if(f[k]===''||f[k]==null)delete f[k]})});
      e.regForm=clone(F);save();toast(F.enabled?'Form pendaftaran disimpan & aktif':'Form disimpan (nonaktif)');close();
    }
  });
  draw();
}

/* ---------------- LIHAT JAWABAN (admin & client dashboard) ---------------- */
function fmtCell(v){
  if(Array.isArray(v))return v.map(function(x){return x&&x.path?'<a data-p="'+esc(x.path)+'">'+esc(x.name||'file')+'</a>':esc(x)}).join(', ');
  if(v===true)return 'Ya';return esc(v);
}
function openResponses(eventId){
  css();var e=eventBy(eventId);if(!e){toast('Event tidak ditemukan');return}
  var form=e.regForm||{fields:[]},cols=[],seen={};
  (form.fields||[]).forEach(function(f){if(f.type!=='section'){cols.push({id:f.id,label:f.label});seen[f.id]=1}});
  var rows=[];
  db.orders.filter(function(o){return o.eventId===eventId&&Array.isArray(o.formResponses)&&o.formResponses.length}).forEach(function(o){
    o.formResponses.forEach(function(r,k){
      var map={};(r.answers||[]).forEach(function(a){map[a.id]=a.value;if(!seen[a.id]){seen[a.id]=1;cols.push({id:a.id,label:a.label})}});
      rows.push({o:o,n:o.formResponses.length>1?k+1:'',map:map});
    });
  });
  var ov=document.createElement('div');ov.className='axb-ov';document.body.appendChild(ov);
  var head=['Order','Pembeli','Email','Tiket','Status','Peserta #'].concat(cols.map(function(c){return c.label}));
  ov.innerHTML='<div class="axb"><div class="axb-hd"><div><h2>Jawaban form · '+esc(e.name)+'</h2><p>'+rows.length+' isian dari pembeli. File upload dibuka lewat tautan (berlaku sementara).</p></div><button type="button" class="axb-btn" data-a="x">✕</button></div><div class="axb-bd">'+
    (rows.length?'<div class="axr-wrap"><table class="axr"><thead><tr>'+head.map(function(h){return '<th>'+esc(h)+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){
      var o=r.o;return '<tr><td>'+esc(o.orderNumber||o.id)+'</td><td>'+esc(o.buyer||o.buyerName||'')+'</td><td>'+esc(o.email||o.buyerEmail||'')+'</td><td>'+esc(o.ticketName||'')+'</td><td>'+esc(o.status||'')+'</td><td>'+esc(r.n)+'</td>'+cols.map(function(c){return '<td>'+fmtCell(r.map[c.id])+'</td>'}).join('')+'</tr>';
    }).join('')+'</tbody></table></div>':'<div class="axb-card"><b>Belum ada jawaban.</b><p class="axb-note">Jawaban muncul setelah pembeli checkout pada event yang form-nya aktif.</p></div>')+
    '</div><div class="axb-ft"><button type="button" class="axb-btn" data-a="x">Tutup</button><button type="button" class="axb-btn g" data-a="csv"'+(rows.length?'':' disabled')+'>Unduh CSV</button></div></div>';
  async function signed(paths){
    var m={};if(!paths.length)return m;
    var r=await sb.storage.from(BUCKET).createSignedUrls(paths,604800);
    if(r.error)throw r.error;(r.data||[]).forEach(function(x){m[x.path]=x.signedUrl});return m;
  }
  ov.addEventListener('click',async function(ev){
    var a=ev.target.closest('a[data-p]');
    if(a){try{var m=await signed([a.dataset.p]);if(m[a.dataset.p])window.open(m[a.dataset.p],'_blank','noopener');else toast('Tidak punya akses ke file ini')}catch(err){toast('Gagal membuka file: '+(err.message||err))}return}
    var b=ev.target.closest('[data-a]');if(!b)return;
    if(b.dataset.a==='x')return ov.remove();
    if(b.dataset.a==='csv'){
      try{
        var paths=[];rows.forEach(function(r){cols.forEach(function(c){var v=r.map[c.id];if(Array.isArray(v))v.forEach(function(x){if(x&&x.path)paths.push(x.path)})})});
        var m=await signed(paths);
        var q=function(s){return '"'+String(s==null?'':s).replace(/"/g,'""')+'"'};
        var lines=[head.map(q).join(',')].concat(rows.map(function(r){var o=r.o;return [o.orderNumber||o.id,o.buyer||o.buyerName||'',o.email||o.buyerEmail||'',o.ticketName||'',o.status||'',r.n].concat(cols.map(function(c){
          var v=r.map[c.id];if(Array.isArray(v))return v.map(function(x){return x&&x.path?(m[x.path]||x.path):x}).join(' | ');return v===true?'Ya':v}))
          .map(q).join(',')}));
        var blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),l=document.createElement('a');
        l.href=u;l.download='jawaban-form-'+(window.aksatixMakeSlug?aksatixMakeSlug(e.name):'event')+'.csv';document.body.appendChild(l);l.click();l.remove();setTimeout(function(){URL.revokeObjectURL(u)},3000);
      }catch(err){toast('Gagal membuat CSV: '+(err.message||err))}
    }
  });
}

window.AksatixForm={css:css,mount:mount,finalize:finalize,openBuilder:openBuilder,openResponses:openResponses,hasForm:hasForm,BUCKET:BUCKET};
})();
