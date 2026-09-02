import fs from 'node:fs';
import { buildEnglishBank } from '../english-bank-runtime-v2.js';
const curriculum=JSON.parse(fs.readFileSync('public/data/core-curriculum-v2.json','utf8'));
const errors=[];let chapters=0,skills=0,questions=0;
const norm=v=>String(v??'').trim().toLowerCase().replace(/\s+/g,' ');
for(const grade of [1,2,3]){
 const bank=buildEnglishBank(curriculum,grade);
 if(!bank){errors.push(`Grade ${grade}: bank missing`);continue}
 for(const sem of ['1','2'])for(const ch of curriculum.grades[String(grade)].semesters[sem]['Bahasa Inggris']||[]){
  chapters++;const runtime=bank.chapters[ch.title];if(!runtime){errors.push(`${ch.id}: runtime chapter missing`);continue}
  if(runtime.chapter_id!==ch.id)errors.push(`${ch.id}: chapter id mismatch`);
  for(const skill of ch.skills||[]){skills++;const rows=runtime.practice.filter(q=>q.skill===skill);if(rows.length!==8)errors.push(`${ch.id}/${skill}: expected 8 practice, got ${rows.length}`);questions+=rows.length;
   for(const q of rows){if(q.type!=='choice')errors.push(`${q.id}: not choice`);if(!Array.isArray(q.o)||q.o.length!==4)errors.push(`${q.id}: options != 4`);if(!Number.isInteger(q.a)||q.a<0||q.a>3)errors.push(`${q.id}: invalid answer index`);if(Array.isArray(q.o)&&new Set(q.o.map(norm)).size!==4)errors.push(`${q.id}: duplicate options`);if(!q.q?.trim())errors.push(`${q.id}: empty stem`);if(!q.why?.trim())errors.push(`${q.id}: empty explanation`);if(/Option \d/i.test(q.o?.join(' ')||''))errors.push(`${q.id}: placeholder option`);if(/Perhatikan informasi dengan teliti sebelum menjawab/i.test(q.q||''))errors.push(`${q.id}: helper leaked into stem`)}
  }
  if(runtime.quiz.length!==ch.skills.length)errors.push(`${ch.id}: quiz coverage mismatch`);
 }
}
if(errors.length){console.error(`English runtime audit FAILED with ${errors.length} issue(s):`);for(const e of errors)console.error('-',e);process.exit(1)}
console.log(`English runtime audit PASS: ${chapters} chapters, ${skills} skills, ${questions} practice questions.`);
