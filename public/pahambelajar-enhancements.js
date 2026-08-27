(()=>{
const KEY='pahambelajar_profile_v1';
const state={practiceLocks:new Set(),quizLocks:new Set(),miniLocks:new Set()};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const css=`
.pb-profile-btn{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:8px 12px;font:800 13px/1.2 Inter,system-ui,sans-serif;cursor:pointer;color:#1d2433}
.pb-overlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#eef2ff,#f5f3ff);display:flex;align-items:center;justify-content:center;padding:20px}
.pb-overlay[hidden]{display:none}.pb-card{width:min(520px,100%);background:#fff;border:1px solid #e5e7eb;border-radius:28px;padding:26px;box-shadow:0 24px 70px rgba(15,23,42,.16);font-family:Inter,system-ui,sans-serif;color:#1d2433}.pb-icon{width:58px;height:58px;border-radius:18px;background:#eef0ff;display:grid;place-items:center;font-size:30px;margin-bottom:16px}.pb-kicker{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#5965d8}.pb-card h1{font-size:30px;line-height:1.15;margin:7px 0 8px}.pb-card p{color:#6b7280;line-height:1.6;margin:0 0 18px}.pb-field{margin:14px 0}.pb-field label{display:block;font-size:14px;font-weight:850;margin-bottom:7px}.pb-field input,.pb-field select{box-sizing:border-box;width:100%;border:1px solid #e5e7eb;border-radius:14px;padding:13px 14px;background:#fff;color:#1d2433;font:inherit}.pb-start{width:100%;border:0;border-radius:13px;padding:12px 15px;background:#5965d8;color:#fff;font-weight:850;cursor:pointer;margin-top:7px}.pb-error{font-size:13px;color:#b42318;margin-top:9px;min-height:18px}.pb-greeting{margin:6px 0 18px}.pb-greeting h2{font-size:30px;margin:0 0 5px}.pb-greeting div{font-size:14px;color:#6b7280}.pb-lock-note{font-size:13px;color:#6b7280;margin-top:8px}.pb-locked{pointer-events:none;opacity:.78}.pb-test-rule{padding:11px 13px;border:1px solid #bfdbfe;background:#eff6ff;border-radius:13px;font-size:13px;line-height:1.5;margin:10px 0 14px}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

function readProfile(){try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}}
function saveProfile(p){localStorage.setItem(KEY,JSON.stringify(p))}
function gradeButton(g){return $(`.grade[data-g="${g}"]`)||$(`.grade[data-grade="${g}"]`)}
function gradeWrap(){return $('.grades')||$('.grade-row')}
function selectGrade(g){const b=gradeButton(g);if(b)b.click();const w=gradeWrap();if(w)w.style.display='none'}
function updateHome(profile){
 selectGrade(profile.grade);
 const home=$('#home'); if(!home)return;
 let greet=$('.pb-greeting',home);
 if(!greet){greet=document.createElement('div');greet.className='pb-greeting';const catalog=$('#catalog',home)||$('#subjects',home);if(catalog)catalog.before(greet);else home.appendChild(greet)}
 greet.innerHTML=`<h2>Hai, ${escapeHtml(profile.name)} 👋</h2><div>Materi Kelas ${profile.grade} yang tersedia untukmu</div>`;
 const heading=$('h2',home);if(heading&&/pilih kelas/i.test(heading.textContent))heading.style.display='none';
 const hero=$('.hero p',home);if(hero)hero.textContent='Pilih satu bab dan belajar sedikit demi sedikit. Materi otomatis disesuaikan dengan kelasmu.';
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

const overlay=document.createElement('div');overlay.className='pb-overlay';overlay.hidden=true;overlay.innerHTML=`<div class="pb-card"><div class="pb-icon">👋</div><div class="pb-kicker">Selamat datang di PahamBelajar</div><h1>Siapa yang mau belajar hari ini?</h1><p>Isi nama panggilan dan kelas. Materi yang tampil akan menyesuaikan kelasmu.</p><div class="pb-field"><label>Nama panggilan</label><input id="pbName" maxlength="24" autocomplete="off" placeholder="Contoh: Raka"></div><div class="pb-field"><label>Kelas</label><select id="pbGrade"><option value="">Pilih kelas</option><option value="1">Kelas 1</option><option value="3">Kelas 3</option><option value="4">Kelas 4</option></select></div><button class="pb-start" id="pbStart">Mulai Belajar →</button><div class="pb-error" id="pbError"></div></div>`;document.body.appendChild(overlay);
function openProfile(edit=false){const p=readProfile();$('#pbName').value=edit&&p?p.name:'';$('#pbGrade').value=edit&&p?String(p.grade):'';$('#pbError').textContent='';overlay.hidden=false;setTimeout(()=>$('#pbName').focus(),50)}
function closeProfile(){overlay.hidden=true}
$('#pbStart').onclick=()=>{const name=$('#pbName').value.trim(),grade=Number($('#pbGrade').value);if(!name){$('#pbError').textContent='Isi nama panggilan dulu ya.';return}if(!grade){$('#pbError').textContent='Pilih kelas dulu ya.';return}const old=readProfile();const p={id:old?.id||('profile_'+Math.random().toString(36).slice(2,10)),name,grade};saveProfile(p);closeProfile();updateHome(p);updateProfileButton(p)};

function updateProfileButton(p){let btn=$('.pb-profile-btn');if(!btn){btn=document.createElement('button');btn.className='pb-profile-btn';btn.type='button';const top=$('.topin');if(top){const old=top.querySelector('.small');if(old)old.replaceWith(btn);else top.appendChild(btn)}else document.body.appendChild(btn);btn.onclick=()=>openProfile(true)}btn.textContent=`👤 ${p.name} · Kelas ${p.grade}`}

function lockGroup(el,noteText){if(!el)return;el.classList.add('pb-locked');$$('input,button',el).forEach(x=>x.disabled=true);if(noteText&&!el.parentElement.querySelector('.pb-lock-note')){const n=document.createElement('div');n.className='pb-lock-note';n.textContent=noteText;el.after(n)}}
function applyLocks(){
 // Mini checks
 $$('.mini-options,.miniopts').forEach((group,i)=>{const key=currentChapterKey()+':mini:'+i;if(state.miniLocks.has(key))lockGroup(group,'Jawaban pertama sudah dikunci.')});
 // Practice radio groups
 const names=[...new Set($$('input[type="radio"][name^="p"]').map(x=>x.name))];
 names.forEach(name=>{const key=currentChapterKey()+':practice:'+name;if(state.practiceLocks.has(key)){const first=$(`input[name="${CSS.escape(name)}"]`);const group=first?.closest('.choices');lockGroup(group,'Jawaban pertama disimpan dan tidak bisa diganti.')}});
 // Quiz current question
 const qa=$('input[type="radio"][name="qa"]');if(qa){const q=quizQuestionKey();if(state.quizLocks.has(q)){lockGroup(qa.closest('.choices'),'Jawaban sudah tersimpan. Lanjut ke soal berikutnya.');hidePrevious();addQuizRule()}}
}
function currentChapterKey(){const c=$('#crumb')?.textContent?.trim();return c||$('#chapterTitle')?.textContent?.trim()||'chapter'}
function quizQuestionKey(){const text=$('#quizArea .small')?.textContent||$('#quiz .small')?.textContent||'';const m=text.match(/Soal\s+(\d+)/i);return currentChapterKey()+':quiz:'+(m?m[1]:text)}
function hidePrevious(){const b=$('#prevQ');if(b)b.style.display='none'}
function addQuizRule(){const area=$('#quizArea')||$('#quiz');if(!area||area.querySelector('.pb-test-rule'))return;const d=document.createElement('div');d.className='pb-test-rule';d.innerHTML='<b>Tes Pemahaman:</b> jawaban pertama akan dikunci. Benar atau salah baru terlihat setelah tes selesai.';area.prepend(d)}

// Capture first answers before the app can accept a second choice.
document.addEventListener('click',e=>{const b=e.target.closest('.mini-option,.miniopt');if(!b)return;const group=b.closest('.mini-options,.miniopts');const groups=$$('.mini-options,.miniopts');const idx=groups.indexOf(group);const key=currentChapterKey()+':mini:'+idx;if(state.miniLocks.has(key)){e.preventDefault();e.stopImmediatePropagation();return}state.miniLocks.add(key);setTimeout(applyLocks,0)},true);
document.addEventListener('change',e=>{const r=e.target;if(!(r instanceof HTMLInputElement)||r.type!=='radio')return;if(r.name==='qa'){const key=quizQuestionKey();if(state.quizLocks.has(key)){e.preventDefault();e.stopImmediatePropagation();return}state.quizLocks.add(key);setTimeout(()=>{applyLocks();hidePrevious();addQuizRule()},0);return}if(r.name.startsWith('p')){const key=currentChapterKey()+':practice:'+r.name;if(state.practiceLocks.has(key)){e.preventDefault();e.stopImmediatePropagation();return}state.practiceLocks.add(key);setTimeout(applyLocks,0)}},true);

const observer=new MutationObserver(()=>{applyLocks();if($('#quiz.active')||$('#quiz')?.classList.contains('active')){hidePrevious();addQuizRule()}});observer.observe(document.body,{childList:true,subtree:true});

const profile=readProfile();if(profile){updateHome(profile);updateProfileButton(profile)}else openProfile(false);
applyLocks();
})();