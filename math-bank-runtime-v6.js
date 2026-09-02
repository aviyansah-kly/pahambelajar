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

function diversifyChapter(chapter,grade){
  const seenBySkill=new Map();
  const occurrenceBySkill=new Map();
  const practice=(chapter.practice||[]).map(q=>{
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
  const quiz=(chapter.skills||[]).map(skill=>{
    const q=practice.filter(x=>x.skill===skill).at(-1);
    return q?{...q,id:String(q.id).replace(/-q$/,'')+'-q'}:null;
  }).filter(Boolean);
  return {...chapter,practice,quiz};
}

export function buildMathBank(curriculum,grade){
  const bank=buildV5(curriculum,grade);
  if(!bank)return bank;
  const chapters={};
  for(const [title,chapter] of Object.entries(bank.chapters||{}))chapters[title]=diversifyChapter(chapter,Number(grade));
  return {...bank,version:'6.0-age-context-dedup',updated:'2026-09-02',generation_policy:{...bank.generation_policy,exact_stem_dedup:'age-context-v6',meaningful_stem_variation:true},chapters};
}
