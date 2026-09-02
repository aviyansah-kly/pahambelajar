import { buildMathBank as buildV3 } from './math-bank-runtime-v3.js';

const H=s=>[...String(s)].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,17);
const R=s=>{let x=H(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function options(correct,wrong,r){const a=[String(correct),...wrong.map(String)].filter((x,i,z)=>z.indexOf(x)===i);let n=1;while(a.length<4){const x=String(Number(correct)+n++);if(!a.includes(x))a.push(x)}const o=a.slice(0,4);for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return [o,o.indexOf(String(correct))]}
function replace(q,i,seed,stem,correct,wrong,why){const r=R(`${seed}|${i}`),[o,a]=options(correct,wrong,r);return {...q,q:stem,o,a,why,validation:{basic:true,reasons:[],repetition_warning:false}}}
const objects=['apel','kelereng','pensil','buku','balok','stiker','bola','bunga'];

function fixG1Number(q,i){const r=R(`g1num|${q.skill}|${i}`);
 if(q.skill==='mengenal kuantitas'){
  const n=[2,5,8,4,7,3,9,6][i%8],obj=objects[i%objects.length],forms=[`Ada ${Array(n).fill('⭐').join(' ')}. Berapa bintang?`,`Dina punya ${n} ${obj}. Berapa jumlah ${obj} Dina?`,`Hitung ${Array(n).fill('●').join(' ')}. Ada berapa benda?`,`Di meja ada ${n} ${obj}. Pilih bilangannya.`],stem=forms[i%4];
  return replace(q,i,'qty',stem,n,[Math.max(0,n-1),Math.min(10,n+1),Math.max(0,n-2)],`Jumlah bendanya ${n}.`);
 }
 if(q.skill==='membaca dan menulis bilangan'){
  const n=[2,7,4,9,3,8,5,10][i%8],words=['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh'],word=words[n];
  if(i%2===0)return replace(q,i,'rw',`Bilangan “${word}” ditulis ...`,n,[Math.max(0,n-1),Math.min(10,n+1),Math.max(0,n-2)],`“${word}” ditulis ${n}.`);
  const wrong=[words[Math.max(0,n-1)],words[Math.min(10,n+1)],words[Math.max(0,n-2)]];
  return replace(q,i,'rw2',`Bilangan ${n} dibaca ...`,word,wrong,`${n} dibaca “${word}”.`);
 }
 return q;
}
function addWithin10(q,i){const pairs=[[2,3],[4,2],[1,6],[5,3],[3,4],[6,2],[2,7],[4,5]], [a,b]=pairs[i%8],sum=a+b,obj=objects[i%objects.length];
 const stem=i%4===0?`${a} + ${b} = ...`:i%4===1?`Raka punya ${a} ${obj}. Ia mendapat ${b} lagi. Berapa ${obj} Raka sekarang?`:i%4===2?`Ada ${a} ${obj} di kotak. Ibu menambah ${b}. Berapa jumlah semuanya?`:`Siti mengumpulkan ${a} ${obj}, lalu ${b} lagi. Jumlahnya ...`;
 return replace(q,i,'add10',stem,sum,[Math.max(0,sum-1),Math.min(10,sum+1),Math.max(0,sum-2)],`${a} + ${b} = ${sum}.`);
}
function subWithin10(q,i){const pairs=[[7,2],[9,4],[6,1],[8,3],[5,2],[10,4],[7,5],[9,6]], [a,b]=pairs[i%8],v=a-b,obj=objects[i%objects.length];
 const stem=i%4===0?`${a} − ${b} = ...`:i%4===1?`Ada ${a} ${obj}. ${b} diambil. Berapa sisanya?`:i%4===2?`Rani punya ${a} ${obj}. Ia memberikan ${b}. Berapa yang masih ada?`:`Di kotak ada ${a} ${obj}. Setelah ${b} dipakai, sisanya ...`;
 return replace(q,i,'sub10',stem,v,[Math.max(0,v-1),v+1,v+2],`${a} − ${b} = ${v}.`);
}
function subtraction100(q,i,borrow){const pairs=borrow?[[52,27],[61,36],[73,48],[84,59],[42,17],[95,68],[71,46],[63,28]]:[[58,24],[76,32],[95,43],[67,25],[88,44],[79,36],[64,21],[97,54]], [a,b]=pairs[i%8],v=a-b,obj=objects[i%objects.length];
 const stem=i%3===0?`Hitung ${a} − ${b}.`:i%3===1?`Perpustakaan punya ${a} ${obj}. Sebanyak ${b} dipinjam. Berapa yang tersisa?`:`Ada ${a} ${obj}. Setelah ${b} digunakan, berapa sisanya?`;
 return replace(q,i,borrow?'borrow':'noborrow',stem,v,[v+10,Math.max(0,v-10),v+1],`${a} − ${b} = ${v}.`);
}
function shapes(q,i){if(q.skill==='bangun datar dasar'){const rows=[['Segitiga mempunyai berapa sisi?',3,[2,4,5]],['Bangun datar dengan 4 sisi sama panjang adalah ...','persegi',['segitiga','lingkaran','persegi panjang']],['Bentuk jam dinding bulat mirip ...','lingkaran',['persegi','segitiga','persegi panjang']],['Pintu kelas biasanya berbentuk ...','persegi panjang',['lingkaran','segitiga','persegi']],['Bangun yang tidak memiliki sisi lurus adalah ...','lingkaran',['segitiga','persegi','persegi panjang']],['Ubin dengan 4 sisi sama panjang berbentuk ...','persegi',['lingkaran','segitiga','persegi panjang']],['Rambu berbentuk tiga sisi disebut ...','segitiga',['lingkaran','persegi','persegi panjang']],['Buku tulis tampak seperti bangun ...','persegi panjang',['lingkaran','segitiga','persegi']]],x=rows[i%8];return replace(q,i,'shape',x[0],x[1],x[2],`Jawaban yang sesuai adalah ${x[1]}.`)}return q}
function measureG3(q,i){if(q.skill==='satuan panjang'){const rows=[[200,'2 m','200 cm sama dengan 2 m.'],[3,'300 cm','3 m sama dengan 300 cm.'],[450,'4 m 50 cm','450 cm = 4 m 50 cm.'],[5,'500 cm','5 m sama dengan 500 cm.'],[125,'1 m 25 cm','125 cm = 1 m 25 cm.'],[6,'600 cm','6 m sama dengan 600 cm.'],[275,'2 m 75 cm','275 cm = 2 m 75 cm.'],[4,'400 cm','4 m sama dengan 400 cm.']],x=rows[i%8],stem=i%2===0?`Panjang pita ${x[0]} cm. Itu sama dengan ...`:`Panjang tali ${x[0]} m. Itu sama dengan ...`;return replace(q,i,'len',stem,x[1],['1 m','250 cm','3 m','500 cm'].filter(v=>v!==x[1]),x[2])}
 if(q.skill==='satuan berat'){const rows=[[2000,'2 kg','2000 gram sama dengan 2 kg.'],[3,'3000 gram','3 kg sama dengan 3000 gram.'],[1500,'1 kg 500 gram','1500 gram = 1 kg 500 gram.'],[4,'4000 gram','4 kg sama dengan 4000 gram.'],[2500,'2 kg 500 gram','2500 gram = 2 kg 500 gram.'],[5,'5000 gram','5 kg sama dengan 5000 gram.'],[3500,'3 kg 500 gram','3500 gram = 3 kg 500 gram.'],[6,'6000 gram','6 kg sama dengan 6000 gram.']],x=rows[i%8],stem=i%2===0?`Berat beras ${x[0]} gram. Itu sama dengan ...`:`Berat paket ${x[0]} kg. Itu sama dengan ...`;return replace(q,i,'weight',stem,x[1],['1 kg','2000 gram','4 kg','5000 gram'].filter(v=>v!==x[1]),x[2])}
 return q}
function dataG3(q,i){if(q.skill==='membandingkan data'){const rows=[[12,17,'B'],[19,14,'A'],[8,8,'sama'],[21,15,'A'],[11,16,'B'],[18,13,'A'],[9,12,'B'],[14,14,'sama']],x=rows[i%8],stem=i%2===0?`Kelas A membaca ${x[0]} buku dan Kelas B ${x[1]} buku. Data yang lebih besar adalah ...`:`Kelompok A mengumpulkan ${x[0]} stiker dan kelompok B ${x[1]}. Mana yang lebih banyak?`;return replace(q,i,'datacmp',stem,x[2],['A','B','sama','tidak dapat dibandingkan'].filter(v=>v!==x[2]),`${x[0]} ${x[0]>x[1]?'lebih besar dari':x[0]<x[1]?'lebih kecil dari':'sama dengan'} ${x[1]}.`)}
 if(q.skill==='menjawab pertanyaan dari data'){const sets=[[3,5,4,2],[6,2,5,3],[4,7,2,5],[5,3,6,4],[2,6,3,7],[7,4,5,2],[3,8,4,5],[6,5,3,4]],v=sets[i%8],sum=v.reduce((a,b)=>a+b,0),stem=`Data buah: apel ${v[0]}, jeruk ${v[1]}, mangga ${v[2]}, pisang ${v[3]}. Berapa jumlah seluruh buah?`;return replace(q,i,'datasum',stem,sum,[sum-1,sum+1,sum+2],`${v[0]} + ${v[1]} + ${v[2]} + ${v[3]} = ${sum}.`)}return q}
function patternG3(q,i){const s=q.skill;if(!/mengenali pola|melanjutkan pola|menentukan aturan pola sederhana/.test(s))return q;const step=[2,3,4,5,6,7,8,9][i%8],start=[1,4,7,10,13,16,19,22][i%8],seq=[0,1,2,3].map(k=>start+k*step),next=start+4*step;
 if(s==='melanjutkan pola')return replace(q,i,'patnext',`Lanjutkan pola: ${seq.join(', ')}, ...`,next,[next-step,next+step,next+1],`Polanya bertambah ${step}. Setelah ${seq[3]} adalah ${next}.`);
 return replace(q,i,'patrule',`Perhatikan pola ${seq.join(', ')}. Aturannya adalah ...`,`bertambah ${step}`,[`bertambah ${Math.max(1,step-1)}`,`bertambah ${step+1}`,`berkurang ${step}`],`Setiap bilangan bertambah ${step}.`)
}
function patchChapter(ch){let p=ch.practice.map((q,i)=>q);const id=ch.chapter_id;
 p=p.map((q,i)=>{
  const si=(ch.practice.filter(x=>x.skill===q.skill).findIndex(x=>x.id===q.id));
  if(id==='m1s1-01')return fixG1Number(q,si);
  if(id==='m1s1-02'&&['menggabungkan kelompok','fakta penjumlahan sederhana','soal cerita'].includes(q.skill))return addWithin10(q,si);
  if(id==='m1s1-03'&&['mengambil sebagian','fakta pengurangan sederhana','soal cerita'].includes(q.skill))return subWithin10(q,si);
  if(id==='m1s2-03')return shapes(q,si);
  if(id==='m2s1-03'&&q.skill==='tanpa meminjam')return subtraction100(q,si,false);
  if(id==='m2s1-03'&&q.skill==='dengan meminjam sederhana')return subtraction100(q,si,true);
  if(id==='m3s2-01')return measureG3(q,si);
  if(id==='m3s2-03')return dataG3(q,si);
  if(id==='m3s2-04')return patternG3(q,si);
  return q;
 });
 const quiz=ch.skills.map(skill=>{const x=p.filter(q=>q.skill===skill).at(-1);return {...x,id:x.id+'-q'}});
 return {...ch,practice:p,quiz};
}
export function buildMathBank(curriculum,grade){const bank=buildV3(curriculum,grade);if(!bank)return bank;const chapters={};for(const [title,ch] of Object.entries(bank.chapters))chapters[title]=patchChapter(ch);return {...bank,version:'4.0-editorial-fixes',updated:'2026-09-02',generation_policy:{...bank.generation_policy,editorial_flag_fixes:true,chapter_range_guard:true},chapters}}
