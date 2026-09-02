import { buildEnglishBank as buildV5 } from './english-bank-runtime-v5.js';

const hash=s=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,71);
const rng=s=>{let x=hash(s)||1;return()=>((x=(x*1664525+1013904223)>>>0)/4294967296)};
function mix(correct,wrong,seed){const options=[String(correct),...wrong.map(String)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,4);const r=rng(seed);for(let i=options.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[options[i],options[j]]=[options[j],options[i]]}return[options,options.indexOf(String(correct))]}
function repaired(old,stem,correct,wrong,why,seed){const [o,a]=mix(correct,wrong,seed);return{...old,q:stem,o,a,why,variation_source:'editorial-repair-v6'}}

function repairDays(rows,grade){
 const items=[
  ['The day after Sunday is ...','Monday',['Tuesday','Friday','Saturday'],'Sunday comes before Monday.'],
  ['The day after Monday is ...','Tuesday',['Wednesday','Sunday','Friday'],'Monday comes before Tuesday.'],
  ['The day before Thursday is ...','Wednesday',['Tuesday','Friday','Monday'],'Wednesday comes before Thursday.'],
  ['The day after Thursday is ...','Friday',['Wednesday','Saturday','Monday'],'Thursday comes before Friday.'],
  ['Today is Friday. Tomorrow is ...','Saturday',['Thursday','Sunday','Tuesday'],'The day after Friday is Saturday.'],
  ['Today is Sunday. Tomorrow is ...','Monday',['Saturday','Tuesday','Friday'],'The day after Sunday is Monday.'],
  ['Today is Wednesday. Yesterday was ...','Tuesday',['Thursday','Monday','Friday'],'The day before Wednesday is Tuesday.'],
  ['Today is Saturday. Yesterday was ...','Friday',['Sunday','Thursday','Monday'],'The day before Saturday is Friday.']
 ];
 return rows.map((q,i)=>{const [stem,correct,wrong,why]=items[i%items.length];const prefix=grade===1?'':grade===2?'Read and choose. ':'Read the short sentence. ';return repaired(q,prefix+stem,correct,wrong,why,`days-${grade}-${i}`)});
}

function repairFamily(rows,grade){
 const items=[
  ['This is my mom. She is my ...','mother',['father','sister','brother']],
  ['This is my dad. He is my ...','father',['mother','sister','brother']],
  ['Mira is my sister. She is a girl in my family. Choose the family word.','sister',['mother','father','brother']],
  ['Beni is my brother. He is a boy in my family. Choose the family word.','brother',['mother','father','sister']],
  ['My mother is in the kitchen. Which word means “ibu”?','mother',['father','sister','brother']],
  ['My father reads a book. Which word means “ayah”?','father',['mother','sister','brother']],
  ['I have one sister. Which family word matches?','sister',['mother','father','brother']],
  ['I have one brother. Which family word matches?','brother',['mother','father','sister']]
 ];
 return rows.map((q,i)=>{let [stem,correct,wrong]=items[i%items.length];if(grade===1){stem=[
  'This is my mom. She is my ...','This is my dad. He is my ...','Mira is my sister. Choose the family word.','Beni is my brother. Choose the family word.','Which word means “ibu”?','Which word means “ayah”?','Choose the word: sister.','Choose the word: brother.'
 ][i%8]}
 return repaired(q,stem,correct,wrong,`“${correct}” is the family word that matches.`,`family-${grade}-${i}`)});
}

export function buildEnglishBank(curriculum,grade){
 const bank=buildV5(curriculum,grade);if(!bank)return bank;
 for(const chapter of Object.values(bank.chapters)){
  for(const skill of chapter.skills||[]){
   const key=String(skill).toLowerCase();
   const rows=chapter.practice.filter(q=>q.skill===skill);
   let next=rows;
   if(key==='days of the week')next=repairDays(rows,grade);
   if(key==='family members')next=repairFamily(rows,grade);
   if(next!==rows)chapter.practice=chapter.practice.filter(q=>q.skill!==skill).concat(next);
  }
  chapter.practice.sort((a,b)=>chapter.skills.indexOf(a.skill)-chapter.skills.indexOf(b.skill));
  chapter.quiz=chapter.skills.map(skill=>{const q=chapter.practice.filter(x=>x.skill===skill).at(-1);return{...q,id:q.id+'-q'}});
 }
 bank.version='3.3-editorial-language-repair';
 bank.updated='2026-09-02';
 bank.generation_policy={...bank.generation_policy,editorial_repair:'days-of-week + family-language',days_sequence_truth_guard:true,progressive_family_vocabulary:true};
 return bank;
}
