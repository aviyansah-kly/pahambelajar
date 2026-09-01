const contexts=[
  {name:'perpustakaan',item:'buku'},
  {name:'kelas',item:'stiker'},
  {name:'kantin',item:'buah'},
  {name:'koperasi sekolah',item:'pensil'},
  {name:'taman sekolah',item:'bibit'},
  {name:'kegiatan kelas',item:'kartu angka'},
  {name:'rak baca',item:'majalah'},
  {name:'meja belajar',item:'penghapus'}
];

const norm=s=>String(s??'').toLowerCase().replace(/\d+/g,'#').replace(/[^a-z#]+/g,' ').trim();
const ctxFor=(id,i=0)=>contexts[([...String(id)].reduce((a,c)=>a+c.charCodeAt(0),i))%contexts.length];
const num=v=>Number(String(v??'').replace(/[^\d.-]/g,''));

function replaceAmbiguousPlaceValue(q){
  if(!/nilai tempat ratusan-puluhan-satuan/.test(q.skill||''))return q;
  const m=String(q.q).match(/bilangan\s+(\d{3}).*angka\s+(\d)/i);
  if(!m)return q;
  const number=m[1],digit=m[2];
  if([...number].filter(x=>x===digit).length<2)return q;
  const expected=String(q.o?.[q.a]||'').toLowerCase();
  const pos={ratusan:0,puluhan:1,satuan:2}[expected];
  if(pos===undefined)return q;
  const digits=['2','5','8'],target=digits[pos],n=digits.join('');
  return {...q,
    q:`Pada bilangan ${n}, angka ${target} menempati nilai tempat ...`,
    why:`${n} terdiri dari ${digits[0]} ratusan, ${digits[1]} puluhan, dan ${digits[2]} satuan. Jadi angka ${target} berada di tempat ${expected}.`
  };
}

function contextualStem(c,index,a,b,kind){
  const variant=index%3;
  if(kind==='add'){
    if(variant===0)return `Di ${c.name} ada ${a} ${c.item}. Datang lagi ${b} ${c.item}. Berapa jumlahnya sekarang?`;
    if(variant===1)return `Petugas ${c.name} mencatat ${a} ${c.item}, lalu menambah ${b} lagi. Berapa ${c.item} yang tercatat sekarang?`;
    return `Awalnya ada ${a} ${c.item} di ${c.name}. Setelah ditambah ${b}, berapa jumlah seluruhnya?`;
  }
  if(kind==='sub'){
    if(variant===0)return `Di ${c.name} ada ${a} ${c.item}. Sebanyak ${b} digunakan. Berapa yang tersisa?`;
    if(variant===1)return `${c.name} memiliki ${a} ${c.item}. Setelah ${b} dipakai, berapa sisanya?`;
    return `Catatan ${c.name} menunjukkan ${a} ${c.item}. ${b} diambil. Berapa yang masih ada?`;
  }
  if(variant===0)return `Ada ${a} kelompok. Tiap kelompok berisi ${b} ${c.item}. Berapa jumlah semuanya?`;
  if(variant===1)return `Di ${c.name}, ${a} kelompok mendapat masing-masing ${b} ${c.item}. Berapa ${c.item} seluruhnya?`;
  return `${a} kelompok di ${c.name} berisi ${b} ${c.item} per kelompok. Berapa totalnya?`;
}

function literacyTransform(q,index){
  const c=ctxFor(q.id,index),stem=String(q.q||'');
  let m;
  if((m=stem.match(/^(\d+) \+ (\d+) = \.\.\.$/))){
    const a=Number(m[1]),b=Number(m[2]);
    return {...q,q:contextualStem(c,index,a,b,'add'),why:`Jumlah awal ${a}, lalu bertambah ${b}. Jadi ${a} + ${b} = ${a+b}.`};
  }
  if((m=stem.match(/^(\d+) − (\d+) = \.\.\.$/))){
    const a=Number(m[1]),b=Number(m[2]);
    return {...q,q:contextualStem(c,index,a,b,'sub'),why:`Dari ${a} dikurangi ${b}. Jadi ${a} − ${b} = ${a-b}.`};
  }
  if((m=stem.match(/^(\d+) × (\d+) = \.\.\.$/))){
    const a=Number(m[1]),b=Number(m[2]);
    return {...q,q:contextualStem(c,index,a,b,'mul'),why:`Ada ${a} kelompok dengan masing-masing ${b}. Jadi ${a} × ${b} = ${a*b}.`};
  }
  if((m=stem.match(/^Tanda yang tepat untuk (\d+) \.\.\. (\d+) adalah \.\.\.$/))){
    const a=Number(m[1]),b=Number(m[2]);
    const forms=[
      `Kelas A mengumpulkan ${a} ${c.item} dan Kelas B ${b} ${c.item}. Tanda yang tepat untuk ${a} ... ${b} adalah ...`,
      `Catatan pertama berisi ${a} ${c.item}, catatan kedua ${b}. Bagaimana membandingkan ${a} ... ${b}?`,
      `Jumlah ${c.item} pada dua kelompok adalah ${a} dan ${b}. Pilih tanda yang tepat untuk ${a} ... ${b}.`
    ];
    return {...q,q:forms[index%forms.length],why:`${a} ${a>b?'lebih besar':a<b?'lebih kecil':'sama dengan'} ${b}, sehingga tandanya ${a>b?'>':a<b?'<':'='}.`};
  }
  if(/Urutan dari yang terkecil ke terbesar/.test(stem)){
    const nums=stem.match(/\d+/g)||[];
    if(nums.length>=4){
      const forms=[
        `Empat kelompok mencatat jumlah ${c.item}: ${nums.slice(0,4).join(', ')}. Urutkan dari paling sedikit ke paling banyak.`,
        `Data ${c.item} dari empat kelompok adalah ${nums.slice(0,4).join(', ')}. Urutan naik yang benar adalah ...`,
        `Jumlah ${c.item} yang tercatat: ${nums.slice(0,4).join(', ')}. Mana urutan dari terkecil ke terbesar?`
      ];
      return {...q,q:forms[index%forms.length]};
    }
  }
  if(/Bentuk panjang dari bilangan/.test(stem)){
    const n=stem.match(/\d+/)?.[0];
    if(n){
      const forms=[
        `Nomor koleksi di ${c.name} adalah ${n}. Bentuk panjang bilangan itu adalah ...`,
        `Pada kartu nomor tertulis ${n}. Pilih bentuk panjang yang benar.`,
        `Bilangan ${n} muncul pada catatan ${c.name}. Bagaimana bentuk panjangnya?`
      ];
      return {...q,q:forms[index%forms.length]};
    }
  }
  return q;
}

function equationAnswerMismatch(q){
  const why=String(q.why||'');
  const matches=[...why.matchAll(/(\d+)\s*([+−×])\s*(\d+)\s*=\s*(\d+)/g)];
  if(!matches.length)return false;
  const m=matches.at(-1),a=Number(m[1]),op=m[2],b=Number(m[3]),rhs=Number(m[4]);
  const expected=op==='+'?a+b:op==='−'?a-b:a*b;
  if(expected!==rhs)return true;
  const answer=q.o?.[q.a];
  const answerNum=num(answer);
  return Number.isFinite(answerNum)&&answerNum!==rhs;
}

function validateBasic(q){
  const reasons=[];
  if(!Array.isArray(q.o)||q.o.length!==4)reasons.push('options_not_four');
  if(!Number.isInteger(q.a)||q.a<0||q.a>3)reasons.push('invalid_answer_index');
  if(new Set((q.o||[]).map(x=>String(x).trim().toLowerCase())).size!==4)reasons.push('duplicate_options');
  if(!String(q.q||'').trim())reasons.push('empty_stem');
  if(!String(q.why||'').trim())reasons.push('empty_explanation');
  const m=String(q.q||'').match(/bilangan\s+(\d{3}).*angka\s+(\d)/i);
  if(/nilai tempat ratusan-puluhan-satuan/.test(q.skill||'')&&m&&[...m[1]].filter(x=>x===m[2]).length>1)reasons.push('ambiguous_repeated_digit');
  if(equationAnswerMismatch(q))reasons.push('answer_index_math_mismatch');
  return reasons;
}

function diversify(list){
  const seen=new Map();
  return list.map((raw,i)=>{
    let q=replaceAmbiguousPlaceValue(raw);
    if(i%4!==0)q=literacyTransform(q,i);
    const key=norm(q.q),count=seen.get(key)||0;
    seen.set(key,count+1);
    const validation=validateBasic(q);
    return {...q,validation:{basic:validation.length===0,reasons:validation,repetition_warning:count>1}};
  });
}

export function enhanceMathBank(bank){
  if(!bank?.chapters)return bank;
  const chapters={};
  for(const [title,ch] of Object.entries(bank.chapters)){
    const practice=diversify(ch.practice||[]);
    const byId=new Map(practice.map(x=>[x.id,x]));
    const quiz=(ch.quiz||[]).map((q,i)=>{
      const sourceId=String(q.id||'').replace(/-q$/,'');
      const source=byId.get(sourceId);
      const base=source?{...source,id:q.id}:{...replaceAmbiguousPlaceValue(q)};
      const transformed=literacyTransform(base,i+1);
      const reasons=validateBasic(transformed);
      return {...transformed,validation:{basic:reasons.length===0,reasons,repetition_warning:false}};
    });
    chapters[title]={...ch,practice,quiz};
  }
  return {...bank,
    version:'3.1-literacy-quality',
    updated:'2026-09-02',
    generation_policy:{...(bank.generation_policy||{}),literacy_mix:'about 75% contextual + 25% direct fluency',ambiguity_guard:true,basic_runtime_validation:true,answer_index_math_guard:true},
    chapters
  };
}
