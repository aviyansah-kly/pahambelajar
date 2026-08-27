(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const style=document.createElement('style');style.textContent=`
#pbCurriculum .pb-track{display:none!important}
#pbCurriculum .pb-chapter button{min-height:48px;min-width:72px;padding:10px 14px;font-size:14px}
#pbCurriculum .pb-chapter{min-height:54px;gap:14px}
#pbCurriculum .pb-chapter span{font-size:15px;line-height:1.45}
.pb-sem{min-height:44px;padding:10px 15px}
.pb-start{min-height:50px;font-size:16px}
.pb-field input,.pb-field select{min-height:50px;font-size:16px}
@media(max-width:760px){#pbCurriculum .pb-chapter button{min-width:78px}.pb-profile-btn{max-width:175px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
`;document.head.appendChild(style);
function profile(){try{return JSON.parse(localStorage.getItem('pahambelajar_profile_v2')||'null')}catch{return null}}
function tuneOnboarding(){
 const card=$('.pb-card');if(!card)return;
 const kicker=$('.pb-kicker',card);if(kicker)kicker.textContent='Setup oleh Orang Tua';
 const h=$('h1',card);if(h)h.textContent='Atur profil belajar anak';
 const p=$('p',card);if(p)p.textContent='Isi sekali saja. Setelah ini anak langsung melihat materi sesuai kelasnya.';
 const labels=$$('.pb-field label',card);
 labels.forEach(l=>{if(l.textContent.trim()==='Jenis sekolah')l.childNodes[0].textContent='Jenis sekolah anak';if(l.textContent.trim()==='Kelas')l.childNodes[0].textContent='Kelas anak'});
 const cam=$('#pbCambridgeWrap small');if(cam)cam.textContent='Aktifkan hanya jika sekolah anak menggunakan program Cambridge.';
 const btn=$('#pbStart');if(btn)btn.textContent='Simpan & Mulai Belajar →';
}
function tuneChildHome(){
 const p=profile();if(!p)return;
 const root=$('#pbCurriculum');if(!root)return;
 const kick=$('.pb-c-head .pb-kicker',root);if(kick)kick.textContent='Pilih pelajaran';
 const title=$('.pb-c-head h2',root);if(title)title.textContent='Mau belajar apa hari ini?';
 const greet=$('.pb-greeting div',root);if(greet)greet.textContent=`Kelas ${p.grade}${p.cambridge?' · Materi tambahan aktif':''}`;
 const profileBtn=$('.pb-profile-btn');if(profileBtn)profileBtn.textContent=`👤 ${p.name} · Kelas ${p.grade}`;
 $$('.pb-subject',root).forEach(card=>{const h=$('h3',card);if(!h)return;const icons={'Matematika':'🔢','Bahasa Indonesia':'📖','IPAS':'🌱','Pendidikan Pancasila':'🇮🇩','PAI dan Budi Pekerti':'🤲','Bahasa Inggris':'🔤','Al-Qur\'an Hadis':'📗','Akidah Akhlak':'💚','Fikih':'🕌','SKI':'📜','Bahasa Arab':'🗣️'};if(icons[h.textContent.trim()]&&!h.dataset.iconed){h.textContent=`${icons[h.textContent.trim()]} ${h.textContent.trim()}`;h.dataset.iconed='1'}});
}
function run(){tuneOnboarding();tuneChildHome()}
new MutationObserver(run).observe(document.body,{childList:true,subtree:true});run();
})();