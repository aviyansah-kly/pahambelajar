(()=>{
if(window.PahamMath)return;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`
.pm{position:fixed;inset:0;z-index:500;background:#f5f6fb;color:#1d2433;overflow:auto;font-family:Inter,system-ui,sans-serif}.pm[hidden]{display:none}.pm-top{position:sticky;top:0;z-index:2;background:#fffffff2;border-bottom:1px solid #e5e7eb}.pm-topin,.pm-main{max-width:860px;margin:auto;padding:14px 16px}.pm-topin{display:flex;align-items:center;justify-content:space-between;gap:12px}.pm-back,.pm-btn,.pm-choice{border:0;border-radius:13px;min-height:46px;padding:11px 14px;font-weight:800;cursor:pointer}.pm-back,.pm-btn{background:#172033;color:#fff}.pm-hero{background:linear-gradient(135deg,#5360d9,#7c3aed);color:#fff;border-radius:24px;padding:22px;margin-bottom:14px}.pm-hero h1{margin:5px 0 7px;font-size:30px}.pm-tabs{display:flex;gap:8px;overflow:auto;margin-bottom:14px}.pm-tab{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:9px 13px;font-weight:800;cursor:pointer;white-space:nowrap}.pm-tab.on{background:#172033;color:#fff}.pm-panel{display:none}.pm-panel.on{display:block}.pm-card{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:18px;margin-bottom:12px}.pm-card h2,.pm-card h3{margin:4px 0 8px}.pm-card p{color:#475467;line-height:1.6}.pm-example{background:#eef2ff;border:1px solid #c7d2fe;border-radius:13px;padding:12px;margin-top:10px;line-height:1.55}.pm-progress{height:8px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin:12px 0}.pm-progress>div{height:100%;background:#5965d8}.pm-choices{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.pm-choice{border:1px solid #dfe3ea;background:#fff;text-align:left;font-size:16px}.pm-choice.selected{background:#eef0ff;border-color:#5965d8}.pm-choice:disabled{cursor:default}.pm-input,.pm-select{width:100%;border:1px solid #dfe3ea;border-radius:13px;padding:13px 14px;font-size:16px;background:#fff;margin-top:12px}.pm-feedback{border-radius:13px;padding:13px;margin-top:12px;line-height:1.55}.pm-good{background:#f0fdf4;color:#166534}.pm-bad{background:#fff7ed;color:#9a3412}.pm-lock{font-size:12px;color:#667085;margin-top:7px}.pm-full{width:100%;margin-top:12px}.pm-score{font-size:58px;font-weight:900}.pm-match{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:center;margin-top:9px}.pm-match select{border:1px solid #dfe3ea;border-radius:11px;padding:10px;background:#fff}.pm-order{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.pm-chip{background:#eef0ff;border-radius:11px;padding:10px 12px;font-weight:800}.pm-loading{text-align:center;padding:40px}.pm-error{background:#fff7f7;border:1px solid #fecaca;color:#991b1b;border-radius:16px;padding:16px}.pm-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:900;opacity:.86}@media(max-width:700px){.pm-choices{grid-template-columns:1fr}.pm-hero h1{font-size:26px}.pm-topin,.pm-main{padding-left:14px;padding-right:14px}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const root=document.createElement('div');root.className='pm';root.hidden=true;root.innerHTML=`<div class="pm-top"><div class="pm-topin"><b>PahamBelajar</b><button class="pm-back" id="pmBack">← Kembali</button></div></div><main class="pm-main"><div id="pmBody"></div></main>`;document.body.appendChild(root);
$('#pmBack',root).onclick=()=>{root.hidden=true;document.body.style.overflow=''};
let moduleIndex=null;
async function ensureIndex(){if(moduleIndex)return moduleIndex;const c=new AbortController(),t=setTimeout(()=>c.abort(),4500);try{const r=await fetch('/data/math-content-v1.json?v=PB-20260827-06',{cache:'no-store',signal:c.signal});if(!r.ok)throw new Error('HTTP '+r.status);moduleIndex=await r.json();return moduleIndex}finally{clearTimeout(t)}}
const g3Number={
 learn:[
  ['🔢','Nilai tempat','Setiap angka memiliki nilai sesuai posisinya.','Pada 1.398: 1 ribuan, 3 ratusan, 9 puluhan, 8 satuan.'],
  ['🧩','Bentuk panjang','Pisahkan bilangan menjadi ribuan, ratusan, puluhan, dan satuan.','1.954 = 1.000 + 900 + 50 + 4.'],
  ['⚖️','Bandingkan bilangan','Bandingkan dari angka paling kiri. Jika sama, lanjut ke kanan.','1.245 < 1.542.'],
  ['🚂','Urutkan bilangan','Tentukan dari yang terkecil atau terbesar dengan membandingkan nilai tempat.','738 < 837 < 937.']
 ],
 practice:[
  {type:'choice',q:'Nilai angka 9 pada bilangan 1.398 adalah …',o:['9','90','900','9.000'],a:1,why:'Angka 9 berada di tempat puluhan, jadi nilainya 90.'},
  {type:'text',q:'Tuliskan bentuk panjang dari 1.954.',a:['1.000+900+50+4','1000+900+50+4'],display:'1.000 + 900 + 50 + 4',why:'Pisahkan berdasarkan nilai tempat: ribuan, ratusan, puluhan, satuan.'},
  {type:'compare',q:'Pilih tanda yang tepat: 1.245 … 1.542',a:'<',why:'Angka ribu sama-sama 1. Bandingkan ratusan: 2 lebih kecil dari 5.'},
  {type:'text',q:'Pada bilangan 1.431, angka 4 menempati nilai tempat apa?',a:['ratusan'],display:'ratusan',why:'Urutannya dari kanan: satuan, puluhan, ratusan, ribuan.'},
  {type:'order',q:'Urutkan dari yang terkecil ke terbesar: 937, 837, 1.037, 737',a:['737','837','937','1.037'],why:'737 < 837 < 937 < 1.037.'},
  {type:'match',q:'Jodohkan angka dengan nilai tempatnya.',pairs:[['1 pada 1.398','ribuan'],['3 pada 1.398','ratusan'],['9 pada 1.398','puluhan'],['8 pada 1.398','satuan']]}
 ],
 quiz:[
  {type:'choice',q:'Angka 6 pada 1.654 bernilai …',o:['6','60','600','6.000'],a:2},
  {type:'text',q:'Tuliskan bentuk panjang 1.431.',a:['1.000+400+30+1','1000+400+30+1'],display:'1.000 + 400 + 30 + 1'},
  {type:'compare',q:'1.398 … 1.389',a:'>'},
  {type:'text',q:'Nilai tempat angka 8 pada 1.782 adalah …',a:['puluhan'],display:'puluhan'},
  {type:'order',q:'Urutkan kecil ke besar: 905, 950, 590, 509',a:['509','590','905','950']}
 ]
};
function normalize(v){return String(v??'').toLowerCase().replace(/\s+/g,'').replace(/,/g,'.')}
function genericBank(type,grade){
 const map={
 number:{learn:[['🔢','Nilai tempat','Perhatikan posisi setiap digit.','325 = 300 + 20 + 5.'],['⚖️','Membandingkan','Bandingkan dari digit paling kiri.','425 > 415.']],q:['325 terdiri dari …','Bilangan terbesar adalah …']},
 operations:{learn:[['➕','Hitung bertahap','Kerjakan satu langkah dengan rapi.','120 + 35 = 155.'],['🔁','Cek kembali','Gunakan operasi kebalikan bila memungkinkan.','24 ÷ 6 = 4 karena 4 × 6 = 24.']],q:['15 − 8 = …','6 × 4 = …']},
 fraction:{learn:[['🍕','Bagian dari keseluruhan','Pecahan menunjukkan bagian yang sama besar.','1/2 berarti satu dari dua bagian.']],q:['Setengah ditulis …','1/4 + 2/4 = …']},
 geometry:{learn:[['📐','Kenali bentuk','Amati sisi, sudut, panjang, luas, atau volume.','Persegi memiliki 4 sisi.']],q:['Persegi mempunyai … sisi','Keliling persegi sisi 6 cm adalah …']},
 measurement:{learn:[['📏','Pilih satuan','Gunakan satuan sesuai yang diukur.','Panjang buku cocok memakai cm.']],q:['100 cm = … m','2 jam = … menit']},
 data:{learn:[['📊','Baca data','Periksa judul dan nilai pada tabel/diagram.','Data membantu kita membandingkan informasi.']],q:['Tabel membuat data menjadi …','Diagram batang cocok untuk …']},
 pattern:{learn:[['🔁','Cari pola','Amati perubahan antarbilangan.','2, 4, 6, 8 bertambah 2.']],q:['3, 6, 9, 12 bertambah …','Kelipatan 5 adalah …']}
 };
 const b=map[type]||map.number;
 const practice=b.q.map((q,i)=>({type:'choice',q,o:i===0?['1','2','4','7']:['12','15','18','20'],a:i===0?2:1,why:'Periksa kembali konsep dan langkah hitungnya.'}));
 return {learn:b.learn,practice,quiz:practice};
}
function panel(n){$$('.pm-tab',root).forEach(b=>b.classList.toggle('on',b.dataset.tab===n));$$('.pm-panel',root).forEach(p=>p.classList.toggle('on',p.dataset.panel===n));root.scrollTo({top:0,behavior:'smooth'})}
function answerUI(item,state,onAnswer,showFeedback=true){
 const locked=state.done;
 if(item.type==='choice')return `<div class="pm-choices">${item.o.map((o,i)=>`<button class="pm-choice ${state.value===i?'selected':''}" data-ans="${i}" ${locked?'disabled':''}>${esc(o)}</button>`).join('')}</div>`;
 if(item.type==='compare')return `<div class="pm-choices">${['<','>','='].map(o=>`<button class="pm-choice ${state.value===o?'selected':''}" data-compare="${o}" ${locked?'disabled':''}>${o}</button>`).join('')}</div>`;
 if(item.type==='text')return `<input class="pm-input" data-text-answer placeholder="Ketik jawaban" value="${esc(state.value||'')}" ${locked?'disabled':''}><button class="pm-btn pm-full" data-submit-text ${locked?'disabled':''}>Kunci jawaban</button>`;
 if(item.type==='order')return `<div class="pm-order">${item.q.match(/[\d.]+/g)?.map(x=>`<span class="pm-chip">${x}</span>`).join('')||''}</div><input class="pm-input" data-order-answer placeholder="Contoh: 509, 590, 905, 950" value="${esc(state.value||'')}" ${locked?'disabled':''}><button class="pm-btn pm-full" data-submit-order ${locked?'disabled':''}>Kunci urutan</button>`;
 if(item.type==='match'){const opts=['ribuan','ratusan','puluhan','satuan'];return `<div>${item.pairs.map((p,i)=>`<div class="pm-match"><span>${esc(p[0])}</span><select data-match="${i}" ${locked?'disabled':''}><option value="">Pilih</option>${opts.map(o=>`<option ${state.value?.[i]===o?'selected':''}>${o}</option>`).join('')}</select></div>`).join('')}</div><button class="pm-btn pm-full" data-submit-match ${locked?'disabled':''}>Kunci jawaban</button>`}
 return '';
}
function check(item,value){
 if(item.type==='choice')return value===item.a;
 if(item.type==='compare')return value===item.a;
 if(item.type==='text')return item.a.some(a=>normalize(a)===normalize(value));
 if(item.type==='order'){const arr=String(value).split(/[,;]+/).map(x=>x.trim());return arr.length===item.a.length&&arr.every((x,i)=>normalize(x)===normalize(item.a[i]));}
 if(item.type==='match')return item.pairs.every((p,i)=>value?.[i]===p[1]);
 return false;
}
function bindAnswer(item,state,container,rerender){
 $$('[data-ans]',container).forEach(b=>b.onclick=()=>{if(state.done)return;state.value=+b.dataset.ans;state.done=true;state.correct=check(item,state.value);rerender()});
 $$('[data-compare]',container).forEach(b=>b.onclick=()=>{if(state.done)return;state.value=b.dataset.compare;state.done=true;state.correct=check(item,state.value);rerender()});
 const st=$('[data-submit-text]',container);if(st)st.onclick=()=>{if(state.done)return;state.value=$('[data-text-answer]',container).value;state.done=true;state.correct=check(item,state.value);rerender()};
 const so=$('[data-submit-order]',container);if(so)so.onclick=()=>{if(state.done)return;state.value=$('[data-order-answer]',container).value;state.done=true;state.correct=check(item,state.value);rerender()};
 const sm=$('[data-submit-match]',container);if(sm)sm.onclick=()=>{if(state.done)return;state.value=$$('[data-match]',container).map(s=>s.value);state.done=true;state.correct=check(item,state.value);rerender()};
}
function openRoom(meta,bank){
 const state={practice:bank.practice.map(()=>({done:false,value:null,correct:false})),pi:0,quiz:bank.quiz.map(()=>({done:false,value:null,correct:false})),qi:0};
 root.hidden=false;document.body.style.overflow='hidden';
 $('#pmBody',root).innerHTML=`<section class="pm-hero"><div class="pm-kicker">Matematika · Kelas ${meta.grade}</div><h1>${esc(meta.title)}</h1><div>Pelajari konsepnya, latihan dengan beberapa tipe soal, lalu tes pemahaman.</div></section><nav class="pm-tabs"><button class="pm-tab on" data-tab="learn">Pelajari</button><button class="pm-tab" data-tab="practice">Latihan</button><button class="pm-tab" data-tab="quiz">Tes</button><button class="pm-tab" data-tab="result">Hasil</button></nav><section class="pm-panel on" data-panel="learn" id="pmLearn"></section><section class="pm-panel" data-panel="practice" id="pmPractice"></section><section class="pm-panel" data-panel="quiz" id="pmQuiz"></section><section class="pm-panel" data-panel="result" id="pmResult"></section>`;
 $('#pmLearn',root).innerHTML=bank.learn.map(x=>`<article class="pm-card"><div style="font-size:36px">${x[0]}</div><h2>${esc(x[1])}</h2><p>${esc(x[2])}</p><div class="pm-example"><b>Contoh</b><br>${esc(x[3])}</div></article>`).join('')+`<button class="pm-btn pm-full" id="pmToPractice">Lanjut ke Latihan →</button>`;
 function drawPractice(){const i=state.pi,item=bank.practice[i],s=state.practice[i],box=$('#pmPractice',root);box.innerHTML=`<div class="pm-progress"><div style="width:${(i+1)/bank.practice.length*100}%"></div></div><article class="pm-card"><small>Latihan ${i+1} dari ${bank.practice.length} · ${esc(item.type)}</small><h2>${esc(item.q)}</h2>${answerUI(item,s)}${s.done?`<div class="pm-feedback ${s.correct?'pm-good':'pm-bad'}">${s.correct?'🌟 <b>Benar.</b> Jawaban pertama kamu tepat.':`😊 <b>Belum tepat.</b> ${esc(item.why||('Jawaban yang diharapkan: '+(item.display||item.a)))}`}</div><div class="pm-lock">Jawaban pertama sudah dikunci dan tidak bisa diganti.</div><button class="pm-btn pm-full" id="pmNextPractice">${i===bank.practice.length-1?'Lanjut ke Tes →':'Lanjut →'}</button>`:''}</article>`;bindAnswer(item,s,box,drawPractice);const n=$('#pmNextPractice',box);if(n)n.onclick=()=>{if(i<bank.practice.length-1){state.pi++;drawPractice()}else{panel('quiz');drawQuiz()}}}
 function drawQuiz(){const i=state.qi,item=bank.quiz[i],s=state.quiz[i],box=$('#pmQuiz',root);box.innerHTML=`<div class="pm-example"><b>Tes Pemahaman</b><br>Jawaban dikunci sekali. Benar/salah baru dihitung pada akhir tes.</div><div class="pm-progress"><div style="width:${(i+1)/bank.quiz.length*100}%"></div></div><article class="pm-card"><small>Soal ${i+1} dari ${bank.quiz.length}</small><h2>${esc(item.q)}</h2>${answerUI(item,s)}${s.done?`<div class="pm-lock">Jawaban sudah tersimpan.</div><button class="pm-btn pm-full" id="pmNextQuiz">${i===bank.quiz.length-1?'Lihat hasil →':'Lanjut →'}</button>`:''}</article>`;bindAnswer(item,s,box,()=>{s.correct=check(item,s.value);drawQuiz()});const n=$('#pmNextQuiz',box);if(n)n.onclick=()=>{if(i<bank.quiz.length-1){state.qi++;drawQuiz()}else{drawResult();panel('result')}}}
 function drawResult(){const correct=state.quiz.filter(x=>x.correct).length,score=Math.round(correct/state.quiz.length*100);$('#pmResult',root).innerHTML=`<article class="pm-card"><small>Hasil tes</small><div class="pm-score">${score}</div><h2>${correct} dari ${state.quiz.length} benar</h2><div class="pm-feedback ${score>=70?'pm-good':'pm-bad'}">${score>=80?'🌟 Hebat! Kamu sudah memahami bab ini.':score>=70?'👍 Bagus. Ulangi satu-dua konsep yang masih sulit.':'📚 Baca rangkuman lagi dan coba latihan sebelum mengulang tes.'}</div></article>`}
 $$('.pm-tab',root).forEach(b=>b.onclick=()=>{if(b.dataset.tab==='result'&&state.quiz.some(x=>!x.done))return;panel(b.dataset.tab)});$('#pmToPractice',root).onclick=()=>{panel('practice');drawPractice()};drawPractice();drawQuiz();
}
window.PahamMath={
 async open(meta){
  root.hidden=false;document.body.style.overflow='hidden';$('#pmBody',root).innerHTML=`<div class="pm-loading"><h2>Menyiapkan materi Matematika…</h2><p>Tunggu sebentar.</p></div>`;
  try{const idx=await ensureIndex();const m=idx.modules.find(x=>x.g===Number(meta.grade)&&x.s===Number(meta.semester)&&x.t===meta.title);if(!m)throw new Error('Bab Matematika belum ditemukan.');const bank=(Number(meta.grade)===3&&meta.title==='Bilangan sampai 1.000')?g3Number:genericBank(m.type,meta.grade);openRoom(meta,bank)}catch(e){$('#pmBody',root).innerHTML=`<div class="pm-error"><b>Materi belum berhasil dibuka.</b><br>${esc(e.name==='AbortError'?'Permintaan data terlalu lama dan dihentikan. Coba lagi.':e.message)}</div>`}
 }
};
})();