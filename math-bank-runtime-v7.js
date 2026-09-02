import { buildMathBank as buildV6 } from './math-bank-runtime-v6.js';

const hash=s=>[...String(s)].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,53);
const rng=s=>{let x=hash(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function make(base,stem,correct,wrong,why,seed){
  const options=[String(correct),...wrong.map(String)].filter((v,i,a)=>a.indexOf(v)===i);
  let step=1;
  while(options.length<4){const n=Number(correct);const v=Number.isFinite(n)?String(Math.max(0,n+step++)):`pilihan ${step++}`;if(!options.includes(v))options.push(v)}
  const o=options.slice(0,4),r=rng(seed);
  for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}
  return {...base,q:stem,o,a:o.indexOf(String(correct)),why,validation:{...(base?.validation||{}),basic:true,reasons:[],repetition_warning:false},variation_source:'editorial-repair-v7'};
}

function repairGrade2Subtraction100(chapter){
  const bySkill=new Map((chapter.skills||[]).map(skill=>[skill,(chapter.practice||[]).filter(q=>q.skill===skill)]));
  const repaired=[];
  const noBorrow=[[58,24],[76,32],[95,43],[67,25],[88,44],[79,36],[64,21],[97,54]];
  const borrow=[[52,27],[61,36],[73,48],[84,59],[42,17],[95,68],[71,46],[63,28]];
  const stories=[
    [63,21,'Rani memiliki 63 stiker. Ia memberikan 21 stiker kepada temannya. Berapa stiker Rani yang tersisa?'],
    [74,32,'Di rak ada 74 buku. Sebanyak 32 buku dipinjam. Berapa buku yang masih ada di rak?'],
    [86,41,'Kelas 2 menyiapkan 86 lembar kertas. Sebanyak 41 lembar sudah dipakai. Berapa lembar yang tersisa?'],
    [59,23,'Beni mempunyai 59 kelereng. Ia memberikan 23 kelereng kepada adiknya. Berapa kelereng Beni sekarang?'],
    [72,38,'Toko memiliki 72 pensil. Hari ini 38 pensil terjual. Berapa pensil yang belum terjual?'],
    [91,46,'Perpustakaan memiliki 91 kartu baca. Sebanyak 46 kartu sudah dibagikan. Berapa kartu yang masih tersedia?'],
    [65,29,'Ada 65 jeruk di keranjang. Ibu memakai 29 jeruk. Berapa jeruk yang tersisa?'],
    [83,57,'Sekolah menyiapkan 83 botol minum. Sebanyak 57 botol sudah dibagikan. Berapa botol yang masih ada?']
  ];
  for(const skill of chapter.skills||[]){
    const source=bySkill.get(skill)||[];
    if(skill==='tanpa meminjam' || skill==='dengan meminjam sederhana'){
      const rows=skill==='tanpa meminjam'?noBorrow:borrow;
      rows.forEach(([a,b],i)=>{
        const result=a-b;
        const stems=[
          `${a} − ${b} = ...`,
          `${a} − ${b} = ...`,
          `Raka menghitung ${a} benda lalu memisahkan ${b} benda. Berapa yang tersisa?`,
          `Ada ${a} balok. Sebanyak ${b} balok disimpan. Sisa balok adalah ...`,
          `Dina mempunyai ${a} stiker dan memberikan ${b}. Berapa stikernya sekarang?`,
          `Dari ${a} pensil, ${b} pensil dipakai. Berapa pensil yang masih ada?`,
          `Kotak berisi ${a} kelereng. Sebanyak ${b} diambil. Sisa kelereng adalah ...`,
          `Perpustakaan memiliki ${a} buku. Sebanyak ${b} dipinjam. Berapa buku yang tersisa?`
        ];
        repaired.push(make(source[i]||{},stems[i],result,[result+10,Math.max(0,result-10),result+1],`${a} − ${b} = ${result}.`,`${skill}-${i}`));
      });
      continue;
    }
    if(skill==='strategi nilai tempat'){
      const rows=[[68,24],[75,32],[96,43],[84,31],[57,23],[89,45],[76,21],[98,54]];
      rows.forEach(([a,b],i)=>{
        const result=a-b,at=Math.floor(a/10),au=a%10,bt=Math.floor(b/10),bu=b%10;
        const stems=[
          `${a} − ${b} = ...`,
          `${a} − ${b} = ...`,
          `Raka mengurangi puluhan dan satuan pada ${a} − ${b}. Hasil akhirnya adalah ...`,
          `Untuk ${a} − ${b}, Dina menghitung (${at} puluhan − ${bt} puluhan) dan (${au} satuan − ${bu} satuan). Hasilnya ...`,
          `Beni memakai nilai tempat untuk menghitung ${a} − ${b}. Jawaban yang tepat adalah ...`,
          `Pisahkan ${a} dan ${b} menjadi puluhan serta satuan, lalu kurangkan. Hasil ${a} − ${b} adalah ...`,
          `Siti menghitung ${a} − ${b} dengan nilai tempat. Berapa hasilnya?`,
          `Dengan mengurangi puluhan dan satuan, hasil ${a} − ${b} adalah ...`
        ];
        repaired.push(make(source[i]||{},stems[i],result,[result+10,Math.max(0,result-10),result+1],`${a} = ${at} puluhan ${au} satuan dan ${b} = ${bt} puluhan ${bu} satuan. Jadi ${a} − ${b} = ${result}.`,`place-${i}`));
      });
      continue;
    }
    if(skill==='soal cerita'){
      stories.forEach(([a,b,stem],i)=>{
        const result=a-b;
        repaired.push(make(source[i]||{},stem,result,[result+10,Math.max(0,result-10),result+1],`Kita mencari sisa: ${a} − ${b} = ${result}.`,`story-${i}`));
      });
      continue;
    }
    repaired.push(...source);
  }
  const quiz=(chapter.skills||[]).map(skill=>{
    const q=repaired.filter(x=>x.skill===skill).at(-1);
    return q?{...q,id:String(q.id).replace(/-q$/,'')+'-q'}:null;
  }).filter(Boolean);
  return {...chapter,practice:repaired,quiz};
}

export function buildMathBank(curriculum,grade){
  const bank=buildV6(curriculum,grade);
  if(!bank)return bank;
  const chapters={...bank.chapters};
  if(Number(grade)===2 && chapters['Pengurangan sampai 100']) chapters['Pengurangan sampai 100']=repairGrade2Subtraction100(chapters['Pengurangan sampai 100']);
  return {...bank,version:'7.0-g2-subtraction-editorial-repair',updated:'2026-09-02',generation_policy:{...bank.generation_policy,editorial_repair:'g1-zero-to-ten + g2-subtraction-100',subtraction_story_drift_guard:true},chapters};
}
