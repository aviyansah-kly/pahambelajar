(()=>{
const KEY='pahambelajar_profile_v2';
const LEGACY='pahambelajar_profile_v1';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
let CURRICULUM=null, semester=1;

const css=`
.pb-profile-btn{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:8px 12px;font:800 13px/1.2 Inter,system-ui,sans-serif;cursor:pointer;color:#1d2433}
.pb-overlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#eef2ff,#f5f3ff);display:flex;align-items:center;justify-content:center;padding:20px}
.pb-overlay[hidden]{display:none}.pb-card{width:min(560px,100%);max-height:92vh;overflow:auto;background:#fff;border:1px solid #e5e7eb;border-radius:28px;padding:26px;box-shadow:0 24px 70px rgba(15,23,42,.16);font-family:Inter,system-ui,sans-serif;color:#1d2433}.pb-icon{width:58px;height:58px;border-radius:18px;background:#eef0ff;display:grid;place-items:center;font-size:30px;margin-bottom:16px}.pb-kicker{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#5965d8}.pb-card h1{font-size:30px;line-height:1.15;margin:7px 0 8px}.pb-card p{color:#6b7280;line-height:1.55;margin:0 0 18px}.pb-field{margin:14px 0}.pb-field label{display:block;font-size:14px;font-weight:850;margin-bottom:7px}.pb-field input,.pb-field select{box-sizing:border-box;width:100%;border:1px solid #e5e7eb;border-radius:14px;padding:13px 14px;background:#fff;color:#1d2433;font:inherit}.pb-start{width:100%;border:0;border-radius:13px;padding:12px 15px;background:#5965d8;color:#fff;font-weight:850;cursor:pointer;margin-top:7px}.pb-error{font-size:13px;color:#b42318;margin-top:9px;min-height:18px}.pb-check{display:flex;gap:9px;align-items:flex-start;padding:11px 12px;border:1px solid #e5e7eb;border-radius:14px;background:#fafafa}.pb-check input{margin-top:3px}
.pb-curriculum{margin:8px 0 28px}.pb-c-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:14px;flex-wrap:wrap}.pb-c-head h2{margin:0;font-size:28px}.pb-sem-tabs{display:flex;gap:8px}.pb-sem{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:9px 12px;font-weight:800;cursor:pointer}.pb-sem.on{background:#172033;color:white}.pb-subject-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pb-subject{background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:17px}.pb-subject h3{margin:0 0 4px}.pb-track{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;font-weight:850}.pb-chapters{margin-top:12px;display:grid;gap:8px}.pb-chapter{display:flex;justify-content:space-between;gap:12px;align-items:center;padding-top:9px;border-top:1px solid #eef0f3}.pb-chapter:first-child{border-top:0;padding-top:0}.pb-chapter button{border:0;background:#eef0ff;color:#4f46e5;border-radius:10px;padding:7px 10px;font-weight:800;cursor:pointer}.pb-preview{position:fixed;inset:0;z-index:10000;background:#10182899;display:flex;align-items:center;justify-content:center;padding:20px}.pb-preview[hidden]{display:none}.pb-preview-card{width:min(540px,100%);background:#fff;border-radius:24px;padding:24px}.pb-preview-card h2{margin:6px 0 8px}.pb-preview-card p{color:#6b7280;line-height:1.55}.pb-close{border:0;background:#172033;color:#fff;border-radius:12px;padding:10px 13px;font-weight:800;cursor:pointer}.pb-greeting{margin:6px 0 18px}.pb-greeting h2{font-size:30px;margin:0 0 5px}.pb-greeting div{font-size:14px;color:#6b7280}.pb-lock-note{font-size:13px;color:#6b7280;margin-top:8px}.pb-locked{pointer-events:none;opacity:.78}.pb-test-rule{padding:11px 13px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:13px;font-size:13px;line-height:1.5;margin:10px 0 14px}
@media(max-width:760px){.pb-subject-grid{grid-template-columns:1fr}.pb-card h1{font-size:26px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

function readProfile(){
 try{
   const p=JSON.parse(localStorage.getItem(KEY)||'null');
   if(p)return p;
   const old=JSON.parse(localStorage.getItem(LEGACY)||'null');
   return old?{...old,school:null,cambridge:false}:null;
 }catch{return null}
}
function saveProfile(p){localStorage.setItem(KEY,JSON.stringify(p))}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

const overlay=document.createElement('div');
overlay.className='pb-overlay';overlay.hidden=true;
overlay.innerHTML=`<div class="pb-card"><div class="pb-icon">👋</div><div class="pb-kicker">PahamBelajar</div><h1>Siapa yang mau belajar hari ini?</h1><p>Pilih jenis sekolah dan kelas supaya materi yang tampil lebih sesuai.</p>
<div class="pb-field"><label>Nama panggilan</label><input id="pbName" maxlength="24" autocomplete="off" placeholder="Contoh: Raka"></div>
<div class="pb-field"><label>Jenis sekolah</label><select id="pbSchool"><option value="">Pilih jenis sekolah</option><option value="sd">SD</option><option value="mi">MI</option><option value="sdit">SDIT</option></select></div>
<div class="pb-field"><label>Kelas</label><select id="pbGrade"><option value="">Pilih kelas</option>${[1,2,3,4,5,6].map(x=>`<option value="${x}">Kelas ${x}</option>`).join('')}</select></div>
<div id="pbCambridgeWrap" class="pb-field" hidden><label class="pb-check"><input id="pbCambridge" type="checkbox"><span><b>Tambahkan Cambridge enrichment</b><br><small>English, Mathematics, Science, dan Global Perspectives.</small></span></label></div>
<button class="pb-start" id="pbStart">Mulai Belajar →</button><div class="pb-error" id="pbError"></div></div>`;
document.body.appendChild(overlay);

const preview=document.createElement('div');preview.className='pb-preview';preview.hidden=true;preview.innerHTML=`<div class="pb-preview-card"><div class="pb-kicker">Curriculum Preview</div><h2 id="pbPreviewTitle"></h2><p id="pbPreviewText"></p><button class="pb-close" id="pbClose">Tutup</button></div>`;document.body.appendChild(preview);
$('#pbClose').onclick=()=>preview.hidden=true;

function openProfile(edit=false){
 const p=readProfile();
 $('#pbName').value=edit&&p?p.name:'';
 $('#pbSchool').value=edit&&p&&p.school?p.school:'';
 $('#pbGrade').value=edit&&p?String(p.grade||''):'';
 $('#pbCambridge').checked=!!(edit&&p&&p.cambridge);
 $('#pbCambridgeWrap').hidden=$('#pbSchool').value!=='sdit';
 $('#pbError').textContent='';
 overlay.hidden=false;
}
$('#pbSchool').onchange=()=>{$('#pbCambridgeWrap').hidden=$('#pbSchool').value!=='sdit'};
$('#pbStart').onclick=()=>{
 const name=$('#pbName').value.trim(), school=$('#pbSchool').value, grade=Number($('#pbGrade').value), cambridge=$('#pbCambridge').checked&&school==='sdit';
 if(!name){$('#pbError').textContent='Isi nama panggilan dulu ya.';return}
 if(!school){$('#pbError').textContent='Pilih jenis sekolah dulu ya.';return}
 if(!grade){$('#pbError').textContent='Pilih kelas dulu ya.';return}
 const old=readProfile();
 saveProfile({id:old?.id||('profile_'+Math.random().toString(36).slice(2,10)),name,school,grade,cambridge});
 overlay.hidden=true; updateProfileButton(); renderCurriculum();
};

function updateProfileButton(){
 const p=readProfile(); if(!p)return;
 let btn=$('.pb-profile-btn');
 if(!btn){btn=document.createElement('button');btn.className='pb-profile-btn';btn.type='button';const top=$('.topin');if(top){const old=top.querySelector('.small');if(old)old.replaceWith(btn);else top.appendChild(btn)}btn.onclick=()=>openProfile(true)}
 btn.textContent=`👤 ${p.name} · ${String(p.school||'').toUpperCase()} · Kelas ${p.grade}`;
}

function hideOldChooser(){
 const g=$('.grades'); if(g)g.style.display='none';
 const home=$('#home'); if(home){$$('h2',home).forEach(h=>{if(/pilih kelas/i.test(h.textContent))h.style.display='none'})}
 const subj=$('#subjects')||$('#catalog'); if(subj)subj.style.display='none';
}
function tryOpenExisting(title,grade){
 const gb=$(`.grade[data-g="${grade}"],.grade[data-grade="${grade}"]`);
 if(gb)gb.click();
 const chapters=$$('.chapter');
 const norm=s=>s.toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
 const target=chapters.find(c=>norm(c.textContent).includes(norm(title)));
 if(target){const b=$('button',target);if(b){b.click();return true}}
 return false;
}
function openChapter(ch,grade){
 if(tryOpenExisting(ch.title,grade)) return;
 $('#pbPreviewTitle').textContent=ch.title;
 $('#pbPreviewText').innerHTML=`Peta materi untuk bab ini sudah masuk Curriculum V1. Modul interaktif lengkap—rangkuman ramah anak, mini-check, latihan, dan tes pemahaman—masih dalam tahap pengembangan. Status ini sengaja ditampilkan supaya coverage kelas 1–6 bisa diuji lebih dulu tanpa menganggap kontennya sudah final.`;
 preview.hidden=false;
}

function curriculumFor(p){
 const g=String(p.grade), sem=String(semester);
 const baseObj=CURRICULUM?.sd?.[g]?.[sem]||{};
 let arr=Object.entries(baseObj).map(([name,chapters])=>({name,track:'national',chapters:chapters.map((title,i)=>({title,id:`nat-${g}-${sem}-${i+1}`}))}));
 if(p.school==='mi'||p.school==='sdit'){
   const add=CURRICULUM?.mi_add?.[g]?.[sem]||{};
   arr=arr.concat(Object.entries(add).map(([name,chapters])=>({name,track:p.school==='mi'?'madrasah':'islamic-enrichment',chapters:chapters.map((title,i)=>({title,id:`isl-${g}-${sem}-${i+1}`}))})));
 }
 if(p.school==='sdit'&&p.cambridge){
   const subjects=CURRICULUM?.cambridge?.subjects||{};
   arr=arr.concat(Object.entries(subjects).map(([name,bySem])=>({name,track:'cambridge',chapters:(bySem[sem]||[]).map((title,i)=>({title,id:`cam-${g}-${sem}-${i+1}`}))})));
 }
 return arr;
}
function renderCurriculum(){
 if(!CURRICULUM)return;
 const p=readProfile(); if(!p||!p.school){openProfile(!!p);return}
 hideOldChooser(); updateProfileButton();
 const home=$('#home'); if(!home)return;
 let root=$('#pbCurriculum');
 if(!root){root=document.createElement('section');root.id='pbCurriculum';root.className='pb-curriculum';const old=$('#subjects')||$('#catalog');if(old)old.before(root);else home.appendChild(root)}
 const label={sd:'SD',mi:'MI',sdit:'SDIT'}[p.school]||p.school;
 const subjects=curriculumFor(p);
 root.innerHTML=`<div class="pb-greeting"><h2>Hai, ${esc(p.name)} 👋</h2><div>${label} · Kelas ${p.grade}${p.school==='sdit'&&p.cambridge?' · Cambridge enrichment aktif':''}</div></div>
 <div class="pb-c-head"><div><div class="pb-kicker">Curriculum V1</div><h2>Mau belajar apa hari ini?</h2></div><div class="pb-sem-tabs"><button class="pb-sem ${semester===1?'on':''}" data-sem="1">Semester 1</button><button class="pb-sem ${semester===2?'on':''}" data-sem="2">Semester 2</button></div></div>
 <div class="pb-subject-grid">${subjects.map(s=>`<div class="pb-subject"><div class="pb-track">${esc(s.track||'nasional')}</div><h3>${esc(s.name)}</h3><div class="pb-chapters">${s.chapters.map((c,i)=>`<div class="pb-chapter"><span>${i+1}. ${esc(c.title)}</span><button data-ch="${esc(c.id)}" data-title="${esc(c.title)}">Buka</button></div>`).join('')}</div></div>`).join('')}</div>`;
 $$('.pb-sem',root).forEach(b=>b.onclick=()=>{semester=Number(b.dataset.sem);renderCurriculum()});
 $$('button[data-ch]',root).forEach(b=>b.onclick=()=>openChapter({id:b.dataset.ch,title:b.dataset.title},p.grade));
}

function addLocks(){
 const practice=new Map();
 document.addEventListener('change',e=>{
  const r=e.target;if(!(r instanceof HTMLInputElement)||r.type!=='radio')return;
  if(r.name==='qa'||r.name.startsWith('p')){
   if(practice.has(r.name)){e.preventDefault();e.stopImmediatePropagation();return}
   practice.set(r.name,r.value);
   setTimeout(()=>{
    $$(`input[name="${CSS.escape(r.name)}"]`).forEach(x=>x.disabled=true);
    const group=r.closest('.choices');if(group&&!group.nextElementSibling?.classList.contains('pb-lock-note')){const n=document.createElement('div');n.className='pb-lock-note';n.textContent='Jawaban pertama sudah dikunci.';group.after(n)}
    if(r.name==='qa'){const prev=$('#prevQ');if(prev)prev.style.display='none'}
   },0)
  }
 },true);
}
async function init(){
 try{CURRICULUM=await fetch('/data/curriculum-v1.json',{cache:'no-store'}).then(r=>r.json())}catch(e){console.error('Curriculum load failed',e)}
 addLocks();
 const p=readProfile();
 if(!p||!p.school)openProfile(!!p);
 else renderCurriculum();
}
init();
})();