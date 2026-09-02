import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const errors=[];
const app=read('app-router.js'),math=read('public/math-engine-v2.js'),english=read('public/english-engine-v2.js'),css=read('public/learning-room.css'),launch=read('public/english-launch-patch.js');
if(!app.includes('/learning-room.css'))errors.push('shared learning-room.css not injected');
if(!launch.includes('/english-engine-v2.js'))errors.push('English launcher not using engine v2');
for(const [name,src] of [['Math',math],['English',english]])for(const label of ['Pelajari','Latihan','Tes','Hasil'])if(!src.includes(label))errors.push(`${name}: missing ${label} step`);
for(const token of ['.pm,.pe','.pm-choice,.pe-choice','.pm-hero,.pe-hero','.pm-tabs,.pe-tabs','.pm-feedback,.pe-feedback'])if(!css.includes(token))errors.push(`shared style token missing: ${token}`);
if(!english.includes('Baca soal dengan teliti, lalu pilih satu jawaban.'))errors.push('English helper instruction missing/separate');
if(!english.includes('Jawaban sudah dikunci. Baca penjelasannya sebelum lanjut.'))errors.push('English answer-lock feedback mismatch');
if(errors.length){console.error(`UI consistency audit FAILED with ${errors.length} issue(s):`);for(const e of errors)console.error('-',e);process.exit(1)}
console.log('UI consistency audit PASS: Math and English share learning-room styling and Pelajari → Latihan → Tes → Hasil flow.');
