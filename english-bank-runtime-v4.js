import { buildEnglishBank as buildV3 } from './english-bank-runtime-v3.js';

const scenarios={
 'Hello!':'You meet a friend at school. What can you say?',
 'Good morning!':'You meet your teacher before the first lesson. What can you say?',
 'Goodbye!':'School is over and you are leaving. What can you say?',
 'See you!':'You are leaving a friend and plan to meet again. What can you say?',
 'Thank you!':'A classmate helps you pick up your books. What can you say?'
};

export function buildEnglishBank(curriculum,grade){
 const bank=buildV3(curriculum,grade);if(!bank)return bank;
 for(const chapter of Object.values(bank.chapters)){
  chapter.practice=chapter.practice.map(q=>{
   if(q.skill!=='greetings and parting')return q;
   const answer=String(q.o[q.a]);
   return {...q,q:scenarios[answer]||'Choose the best expression for the situation.',why:`“${answer}” is the best expression for this situation.`};
  });
  chapter.quiz=chapter.skills.map(skill=>{const q=chapter.practice.filter(x=>x.skill===skill).at(-1);return{...q,id:q.id+'-q'}});
 }
 bank.version='3.1-contextual-pedagogy';
 bank.generation_policy={...bank.generation_policy,answer_leak_guard:'enforced-v4'};
 return bank;
}
