import { buildMathBank as buildV4 } from './math-bank-runtime-v4.js';

const H=s=>[...String(s)].reduce((a,c)=>(a*33+c.charCodeAt(0))>>>0,41);
const R=s=>{let x=H(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function opts(correct,wrong,seed){const r=R(seed),a=[String(correct),...wrong.map(String)].filter((x,i,z)=>z.indexOf(x)===i);let k=1;while(a.length<4){const n=Number(correct);const v=Number.isFinite(n)?String(n+k++):`pilihan ${k++}`;if(!a.includes(v))a.push(v)}const o=a.slice(0,4);for(let i=o.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[o[i],o[j]]=[o[j],o[i]]}return [o,o.indexOf(String(correct))]}
function make(q,stem,correct,wrong,why,seed){const [o,a]=opts(correct,wrong,seed);return {...q,q:stem,o,a,why,validation:{basic:true,reasons:[],repetition_warning:false}}}

const words0to100={11:'sebelas',12:'dua belas',13:'tiga belas',14:'empat belas',15:'lima belas',16:'enam belas',17:'tujuh belas',18:'delapan belas',19:'sembilan belas',20:'dua puluh',24:'dua puluh empat',31:'tiga puluh satu',42:'empat puluh dua',53:'lima puluh tiga',67:'enam puluh tujuh',75:'tujuh puluh lima',86:'delapan puluh enam',94:'sembilan puluh empat'};

function g1Numbers(q,i){
  if(q.skill==='membaca bilangan'){
    const nums=[11,13,15,17,18,20,12,19],n=nums[i],word=words0to100[n];
    const stems=[`Bilangan ${n} dibaca ...`,`Rani melihat angka ${n}. Cara membacanya adalah ...`,`Pilih nama bilangan untuk ${n}.`,`Di kartu tertulis ${n}. Bilangan itu dibaca ...`,`Angka ${n} mempunyai nama bilangan ...`,`Baca angka ini: ${n}. Jawabannya ...`,`Guru menulis ${n} di papan. Cara membacanya ...`,`Nama yang tepat untuk bilangan ${n} adalah ...`];
    const wrong=nums.filter(x=>x!==n).slice(0,3).map(x=>words0to100[x]);
    return make(q,stems[i],word,wrong,`${n} dibaca “${word}”.`,`g1-read-${i}`);
  }
  if(q.skill==='puluhan dan satuan awal'){
    const nums=[12,14,16,18,20,13,15,17],n=nums[i],t=Math.floor(n/10),u=n%10;
    const stems=[`Bilangan ${n} terdiri dari berapa puluhan dan satuan?`,`Raka menyusun ${n} dengan kelompok sepuluh. Susunannya adalah ...`,`Pada bilangan ${n}, ada berapa puluhan dan berapa satuan?`,`Dina punya ${n} stik. Jika 10 stik diikat menjadi satu puluhan, hasilnya ...`,`Uraikan ${n} menjadi puluhan dan satuan.`,`Bilangan ${n} dapat dibuat dari ...`,`Pilih pasangan puluhan dan satuan yang membentuk ${n}.`,`Untuk membuat ${n}, kita membutuhkan ...`];
    const correct=`${t} puluhan dan ${u} satuan`;
    const wrong=[`${t} puluhan dan ${Math.min(9,u+1)} satuan`,`${Math.max(0,t-1)} puluhan dan ${u} satuan`,`${t+1} puluhan dan ${u} satuan`];
    return make(q,stems[i],correct,wrong,`${n} = ${t*10} + ${u}, jadi ada ${t} puluhan dan ${u} satuan.`,`g1-tu-${i}`);
  }
  return q;
}

function g2Numbers(q,i){
  if(q.skill==='membaca dan menulis bilangan'){
    const nums=[24,31,42,53,67,75,86,94],n=nums[i],word=words0to100[n];
    if(i%2===0){const stems=[`Bilangan “${word}” ditulis ...`,`Siti mendengar “${word}”. Lambang bilangannya adalah ...`,`Pilih angka yang menunjukkan “${word}”.`,`Guru menyebut “${word}”. Raka harus menulis ...`];return make(q,stems[Math.floor(i/2)],n,[Math.max(0,n-1),n+1,Number(String(n).split('').reverse().join(''))],`“${word}” ditulis ${n}.`,`g2-write-${i}`)}
    const stems=[`Bilangan ${n} dibaca ...`,`Di papan tertulis ${n}. Cara membacanya adalah ...`,`Pilih nama bilangan untuk ${n}.`,`Rani membaca angka ${n} sebagai ...`];
    const wrong=nums.filter(x=>x!==n).slice(0,3).map(x=>words0to100[x]);
    return make(q,stems[Math.floor(i/2)],word,wrong,`${n} dibaca “${word}”.`,`g2-read-${i}`);
  }
  if(q.skill==='puluhan dan satuan'){
    const nums=[24,31,42,53,67,75,86,94],n=nums[i],t=Math.floor(n/10),u=n%10,correct=`${t} puluhan dan ${u} satuan`;
    const stems=[`Bilangan ${n} terdiri dari ...`,`Pada ${n}, banyak puluhannya dan satuannya adalah ...`,`Uraikan ${n} menjadi puluhan dan satuan.`,`Raka membuat ${n} dari batang puluhan dan kubus satuan. Ia membutuhkan ...`,`Pilih susunan nilai tempat untuk ${n}.`,`Jika ${n} dikelompokkan per sepuluh, hasilnya ...`,`Dina memiliki ${n} manik-manik. Dalam kelompok puluhan dan satuan, jumlahnya ...`,`Susunan yang tepat untuk membentuk ${n} adalah ...`];
    const wrong=[`${t} puluhan dan ${Math.min(9,u+1)} satuan`,`${Math.max(0,t-1)} puluhan dan ${u} satuan`,`${t+1} puluhan dan ${u} satuan`];
    return make(q,stems[i],correct,wrong,`${n} = ${t*10} + ${u}. Jadi ada ${t} puluhan dan ${u} satuan.`,`g2-tu-${i}`);
  }
  return q;
}

function perimeter(q,i){
  if(q.skill==='konsep keliling'){
    const rows=[
      ['Keliling adalah jumlah panjang semua ... pada batas bangun.','sisi',['sudut','warna','luas']],
      ['Rani berjalan mengitari tepi lapangan. Panjang lintasan satu putaran disebut ...','keliling',['luas','tinggi','isi']],
      ['Untuk mencari keliling sebuah bangun, kita menjumlahkan panjang semua ...','sisi',['sudut','titik','warna']],
      ['Pita dipasang tepat mengelilingi tepi bingkai. Panjang pita yang dibutuhkan menunjukkan ... bingkai.','keliling',['luas','berat','tinggi']],
      ['Bagian bangun yang dihitung saat mencari keliling adalah panjang ...','tepinya',['bagian dalamnya','warnanya','permukaannya']],
      ['Budi mengukur seluruh batas luar taman. Ia sedang mencari ... taman.','keliling',['luas','volume','berat']],
      ['Keliling berhubungan dengan panjang garis yang ... bangun.','mengelilingi',['mengisi','membagi','mewarnai']],
      ['Untuk mengetahui panjang pagar di sekeliling kebun, kita perlu menghitung ... kebun.','keliling',['luas','isi','tinggi']]
    ],x=rows[i];return make(q,x[0],x[1],x[2],`Jawaban yang tepat adalah “${x[1]}”.`,`peri-concept-${i}`)
  }
  if(q.skill==='keliling persegi'){
    const sides=[3,4,5,6,7,8,9,10],s=sides[i],k=4*s;
    const stems=[`Persegi memiliki sisi ${s} cm. Kelilingnya ...`,`Sebuah ubin berbentuk persegi dengan sisi ${s} cm. Berapa keliling ubin?`,`Bingkai persegi panjang sisinya ${s} cm pada setiap sisi. Kelilingnya ...`,`Taman kecil berbentuk persegi. Satu sisinya ${s} m. Panjang pagar di sekelilingnya ...`,`Hitung keliling persegi yang panjang sisinya ${s} cm.`,`Empat sisi persegi masing-masing ${s} cm. Jumlah panjang semua sisinya ...`,`Kertas berbentuk persegi dengan sisi ${s} cm. Berapa panjang tepinya seluruhnya?`,`Lapangan mini berbentuk persegi dengan sisi ${s} m. Kelilingnya ...`];
    return make(q,stems[i],k,[k-4,k+4,k+s],`Keliling persegi = 4 × ${s} = ${k}.`,`peri-square-${i}`)
  }
  if(q.skill==='keliling persegi panjang'){
    const dims=[[5,3],[7,4],[8,5],[9,6],[10,4],[11,5],[12,7],[13,6]], [p,l]=dims[i],k=2*(p+l);
    const stems=[`Persegi panjang memiliki panjang ${p} cm dan lebar ${l} cm. Kelilingnya ...`,`Buku berbentuk persegi panjang berukuran ${p} cm × ${l} cm. Berapa kelilingnya?`,`Sebuah kartu panjangnya ${p} cm dan lebarnya ${l} cm. Panjang seluruh tepinya ...`,`Taman berbentuk persegi panjang dengan panjang ${p} m dan lebar ${l} m. Panjang pagar yang dibutuhkan ...`,`Hitung keliling persegi panjang berukuran ${p} cm dan ${l} cm.`,`Meja memiliki permukaan persegi panjang ${p} cm × ${l} cm. Keliling permukaan meja ...`,`Bingkai persegi panjang panjangnya ${p} cm dan lebarnya ${l} cm. Jumlah panjang semua sisinya ...`,`Lapangan kecil berukuran ${p} m × ${l} m. Kelilingnya ...`];
    return make(q,stems[i],k,[p+l,2*p+l,p+2*l],`Keliling = 2 × (${p} + ${l}) = ${k}.`,`peri-rect-${i}`)
  }
  return q;
}

function patch(ch){const id=ch.chapter_id;const counters=new Map();const practice=ch.practice.map(q=>{const i=counters.get(q.skill)||0;counters.set(q.skill,i+1);if(id==='m1s2-01')return g1Numbers(q,i);if(id==='m2s1-01')return g2Numbers(q,i);if(id==='m3s2-02')return perimeter(q,i);return q});const quiz=ch.skills.map(skill=>{const x=practice.filter(q=>q.skill===skill).at(-1);return {...x,id:x.id+'-q'}});return {...ch,practice,quiz}}

export function buildMathBank(curriculum,grade){const bank=buildV4(curriculum,grade);if(!bank)return bank;const chapters={};for(const [title,ch] of Object.entries(bank.chapters))chapters[title]=patch(ch);return {...bank,version:'5.0-repetition-fixes',updated:'2026-09-02',generation_policy:{...bank.generation_policy,meaningful_stem_variation:true},chapters}}
