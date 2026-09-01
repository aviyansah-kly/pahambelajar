import baseRouter from './worker-router.js';
import { buildMathBank } from './math-bank-runtime-v3.js';

const REVIEWER_MODEL = 'gemini-3.5-flash';
const REVIEWER_URL = `https://generativelanguage.googleapis.com/v1beta/models/${REVIEWER_MODEL}:generateContent`;

const reviewSchema = {
  type: 'OBJECT',
  properties: {
    reviews: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          verdict: { type: 'STRING', enum: ['approved', 'needs_review', 'rejected'] },
          score: { type: 'INTEGER', minimum: 0, maximum: 100 },
          reasons: { type: 'ARRAY', items: { type: 'STRING' } },
          flags: { type: 'ARRAY', items: { type: 'STRING', enum: ['math_error','skill_drift','ambiguous','weak_explanation','repetitive','language_issue','none'] } }
        },
        required: ['id','verdict','score','reasons','flags']
      }
    }
  },
  required: ['reviews']
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
async function loadCurriculum(request,env){const response=await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json',request.url)));if(!response.ok)throw new Error('core-curriculum-v2.json tidak tersedia');return response.json()}
function normalize(v){return String(v??'').trim().toLowerCase().replace(/\s+/g,' ')}
function deterministicIntegrity(question){const flags=[];if(question.type!=='choice'||!Array.isArray(question.o)||question.o.length!==4)flags.push('format_invalid');if(!Number.isInteger(question.a)||question.a<0||question.a>3)flags.push('answer_index_invalid');if(Array.isArray(question.o)&&new Set(question.o.map(normalize)).size!==4)flags.push('duplicate_options');if(!String(question.q||'').trim())flags.push('empty_stem');if(!String(question.why||'').trim())flags.push('empty_explanation');return flags}
async function callReviewer(questions,meta,env){if(!env.GEMINI_API_KEY)throw new Error('GEMINI_API_KEY belum dikonfigurasi.');const prompt=`Anda adalah reviewer editorial soal matematika SD Indonesia. Nilai soal yang BENAR-BENAR dipakai aplikasi PahamBelajar.\nKelas ${meta.grade}, Semester ${meta.semester}, Bab ${meta.chapterTitle}.\nPeriksa khusus: kebenaran matematika, tepat satu jawaban benar, tidak ambigu, sesuai skill, bahasa sesuai umur kelas, kualitas literasi/numerasi, penjelasan, dan repetisi. Kelas 1 harus sangat pendek dan konkret; Kelas 2 sederhana dengan 1-2 informasi; Kelas 3 boleh narasi pendek dan familiar. Helper text bukan bagian dari soal. Beri verdict approved hanya jika aman ditampilkan ke anak.\nSOAL:\n${JSON.stringify(questions)}`;const response=await fetch(REVIEWER_URL,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',responseSchema:reviewSchema,temperature:0.1}})});if(!response.ok)throw new Error(`Reviewer Gemini gagal (${response.status}).`);const payload=await response.json();const text=payload?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';return JSON.parse(text).reviews||[]}
async function runtimeBankReview(request,env){try{const url=new URL(request.url),grade=Number(url.searchParams.get('grade')),semester=Number(url.searchParams.get('semester')),chapterId=String(url.searchParams.get('chapter_id')||'');if(![1,2,3].includes(grade)||![1,2].includes(semester)||!chapterId)return json({error:'grade, semester, dan chapter_id wajib valid.'},400);const curriculum=await loadCurriculum(request,env);const chapter=(curriculum?.grades?.[String(grade)]?.semesters?.[String(semester)]?.Matematika||[]).find(c=>c.id===chapterId);if(!chapter)return json({error:'Bab tidak ditemukan.'},404);const bank=buildMathBank(curriculum,grade),runtimeChapter=bank?.chapters?.[chapter.title];if(!runtimeChapter)return json({error:'Runtime bank bab tidak ditemukan.'},404);const questions=runtimeChapter.practice||[];const integrity=questions.map(q=>({id:q.id,flags:deterministicIntegrity(q)})).filter(x=>x.flags.length);const reviews=await callReviewer(questions,{grade,semester,chapterTitle:chapter.title},env);const byId=new Map(reviews.map(r=>[r.id,r]));const results=questions.map(q=>{const det=integrity.find(x=>x.id===q.id),review=byId.get(q.id)||{verdict:'needs_review',score:0,reasons:['Reviewer tidak mengembalikan hasil.'],flags:['language_issue']};const blocked=Boolean(det);return{...q,review_status:blocked?'rejected-deterministic':review.verdict==='approved'&&review.score>=85?'approved-auto':review.verdict==='rejected'?'rejected-ai':'needs-review',review:{...review,deterministic_flags:det?.flags||[]}}});const summary={total:results.length,approved:results.filter(x=>x.review_status==='approved-auto').length,needs_review:results.filter(x=>x.review_status==='needs-review').length,rejected:results.filter(x=>x.review_status.startsWith('rejected')).length};return json({ok:true,publish:false,models:{reviewer:REVIEWER_MODEL},scope:{grade,semester,chapter:{id:chapter.id,title:chapter.title}},bank_version:bank.version,summary,production_ready:summary.total>0&&summary.approved===summary.total,results})}catch(error){return json({error:error.message||'Runtime bank review gagal.'},502)}}

export default {async fetch(request,env){const url=new URL(request.url);if(url.pathname==='/api/ai/runtime-bank-review'&&request.method==='GET')return runtimeBankReview(request,env);return baseRouter.fetch(request,env)}};
