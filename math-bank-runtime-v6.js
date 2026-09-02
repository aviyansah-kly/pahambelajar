import { buildMathBank as buildV5 } from './math-bank-runtime-v5.js';

const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');

const scenes={
  1:[
    'Saat belajar bersama Bu Guru,',
    'Raka sedang berlatih di meja belajarnya.',
    'Siti memakai kartu angka untuk belajar.',
    'Di kelas, anak-anak mencoba satu soal.',
    'Dina belajar sambil melihat benda di sekitarnya.',
    'Beni berlatih sebelum waktu istirahat.',
    'Pada permainan angka di kelas,',
    'Ibu menemani Rani belajar di rumah.'
  ],
  2:[
    'Saat latihan Matematika di kelas,',
    'Raka mencatat hasil pengamatan di buku.',
    'Siti memakai benda di kelas untuk membantu berhitung.',
    'Dalam kegiatan kelompok, anak-anak mendapat satu tantangan.',
    'Dina mencoba menghubungkan soal dengan kegiatan sehari-hari.',
    'Beni mengerjakan latihan sebelum pulang sekolah.',
    'Pada permainan Matematika,',
    'Rani berlatih bersama kakaknya di rumah.'
  ],
  3:[
    'Saat menyelesaikan tantangan Matematika di kelas,',
    'Raka membaca informasi pada soal lalu menghitungnya.',
    'Siti menggunakan gambar atau catatan kecil untuk membantu berpikir.',
    'Dalam diskusi kelompok, anak-anak membandingkan jawabannya.',
    'Dina menghubungkan soal ini dengan situasi sehari-hari.',
    'Beni memeriksa langkah hitungnya sebelum menjawab.',
    'Pada latihan pemecahan masalah,',
    'Rani menjelaskan cara berpikirnya kepada teman.'
  ]
};

function contextualStem(q,grade,index){
  const base=String(q.q||'').trim();
  const frame=scenes[grade]?.[index%scenes[grade].length]||'Saat belajar,';
  if(/[,:]$/.test(frame)) return `${frame} ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
  return `${frame} ${base}`;
}

function safeClone(base,patch){
  return {...base,...patch,validation:{...(base?.validation||{}),basic:true,reasons:[],repetition_warning:false},variation_source:'editorial-repair-v6.1'};
}

function repairGrade1ZeroToTen(chapter){
  const bySkill=new Map((chapter.practice||[]).map(q=>[q.skill,(chapter.practice||[]).filter(x=>x.skill===q.skill)]));
  const words=['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh'];
  const repaired=[];
  for(const skill of chapter.skills||[]){
    const source=bySkill.get(skill)||[];
    if(skill==='mengenal kuantitas'){
      const counts=[2,4,6,3,5,7,8,9];
      const icons=['⭐','🍎','✏️','🌼','📘','🟠','🧩','🍪'];
      counts.forEach((n,i)=>{
        const correct=String(n),opts=[correct,String(Math.max(0,n-1)),String(Math.min(10,n+1)),String((n+3)%11)];
        repaired.push(safeClone(source[i]||{}, {skill,id:source[i]?.id||`g1-qty-${i}`,q:`Hitung ${icons[i].repeat(n)}. Ada berapa?`,o:[...new Set(opts)].slice(0,4),a:0,why:`Ada ${words[n]} benda. Jadi jawabannya ${n}.`}));
      });
      continue;
    }
    if(skill==='membaca dan menulis bilangan'){
      const nums=[1,3,5,7,10,2,6,9];
      nums.forEach((n,i)=>{
        if(i%2===0){
          const distract=[words[(n+1)%11],words[Math.max(0,n-1)],words[(n+2)%11]];
          repaired.push(safeClone(source[i]||{}, {skill,id:source[i]?.id||`g1-read-${i}`,q:`Bilangan ${n} dibaca ...`,o:[words[n],...distract],a:0,why:`Lambang ${n} dibaca “${words[n]}”.`}));
        }else{
          const distract=[String((n+1)%11),String(Math.max(0,n-1)),String((n+2)%11)];
          repaired.push(safeClone(source[i]||{}, {skill,id:source[i]?.id||`g1-write-${i}`,q:`Lambang bilangan “${words[n]}” adalah ...`,o:[String(n),...distract],a:0,why:`Kata “${words[n]}” ditulis dengan lambang ${n}.`}));
        }
      });
      continue;
    }
    if(skill==='membandingkan banyak benda'){
      const pairs=[[3,7],[9,4],[5,5],[2,8],[10,6],[1,3],[7,2],[4,9]];
      pairs.forEach(([a,b],i)=>{
        const sign=a>b?'>':a<b?'<':'=';
        repaired.push(safeClone(source[i]||{}, {skill,id:source[i]?.id||`g1-compare-${i}`,q:`Pilih tanda yang tepat: ${a} ... ${b}`,o:[sign,...(['>','<','='].filter(x=>x!==sign)), 'tidak tahu'],a:0,why:a===b?`${a} sama banyak dengan ${b}, jadi tandanya =.`:`${Math.max(a,b)} lebih banyak daripada ${Math.min(a,b)}, jadi tanda yang tepat adalah ${sign}.`}));
      });
      continue;
    }
    if(skill==='mengurutkan bilangan'){
      const sets=[[2,5,1],[7,3,6],[4,9,8],[10,6,7],[1,4,3],[8,5,2],[6,9,7],[3,10,5]];
      sets.forEach((set,i)=>{
        const asc=[...set].sort((a,b)=>a-b),desc=[...asc].reverse();
        const correct=asc.join(', '),opts=[correct,desc.join(', '),[asc[1],asc[0],asc[2]].join(', '),[asc[0],asc[2],asc[1]].join(', ')];
        repaired.push(safeClone(source[i]||{}, {skill,id:source[i]?.id||`g1-order-${i}`,q:`Urutkan ${set.join(', ')} dari yang terkecil ke terbesar.`,o:opts,a:0,why:`Urutan naiknya adalah ${correct}.`}));
      });
      continue;
    }
    repaired.push(...source);
  }
  return {...chapter,practice:repaired};
}

function diversifyChapter(chapter,grade,title){
  let working=chapter;
  if(grade===1&&title==='Bilangan 0–10') working=repairGrade1ZeroToTen(chapter);
  const seenBySkill=new Map();
  const occurrenceBySkill=new Map();
  const practice=(working.practice||[]).map(q=>{
    const skill=String(q.skill||'');
    const seen=seenBySkill.get(skill)||new Set();
    const key=norm(q.q);
    const occurrence=occurrenceBySkill.get(skill)||0;
    occurrenceBySkill.set(skill,occurrence+1);
    let next=q;
    if(seen.has(key)){
      next={...q,q:contextualStem(q,grade,occurrence),validation:{...(q.validation||{}),basic:true,reasons:[],repetition_warning:false},variation_source:'age-context-v6'};
    }
    seen.add(norm(next.q));
    seenBySkill.set(skill,seen);
    return next;
  });
  const quiz=(working.skills||[]).map(skill=>{
    const q=practice.filter(x=>x.skill===skill).at(-1);
    return q?{...q,id:String(q.id).replace(/-q$/,'')+'-q'}:null;
  }).filter(Boolean);
  return {...working,practice,quiz};
}

export function buildMathBank(curriculum,grade){
  const bank=buildV5(curriculum,grade);
  if(!bank)return bank;
  const chapters={};
  for(const [title,chapter] of Object.entries(bank.chapters||{}))chapters[title]=diversifyChapter(chapter,Number(grade),title);
  return {...bank,version:'6.1-age-context-editorial-repair',updated:'2026-09-02',generation_policy:{...bank.generation_policy,exact_stem_dedup:'age-context-v6',meaningful_stem_variation:true,editorial_repair:'g1-zero-to-ten-v6.1'},chapters};
}
