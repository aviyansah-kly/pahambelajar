import qualityRouter from './quality-router.js';
import { buildMathBank } from './math-bank-runtime-v3.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
async function loadCurriculum(request,env){const response=await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json',request.url)));if(!response.ok)throw new Error('core-curriculum-v2.json tidak tersedia');return response.json()}
async function runtimeBank(request,env,grade){try{const curriculum=await loadCurriculum(request,env);const bank=buildMathBank(curriculum,grade);if(!bank)return json({error:'Kelas tidak ditemukan.'},404);return json(bank)}catch(error){return json({error:error.message||'Bank Matematika gagal dibangun.'},500)}}

async function patchedMathEngine(request,env){
  const [baseResponse,patchResponse]=await Promise.all([
    env.ASSETS.fetch(new Request(new URL('/math-engine-v2.js',request.url))),
    env.ASSETS.fetch(new Request(new URL('/math-question-helper-patch.js',request.url)))
  ]);
  if(!baseResponse.ok)return baseResponse;
  let source=await baseResponse.text();
  const oldFlow="const idx=await ensureIndex();const m=idx.modules.find(x=>x.g===Number(meta.grade)&&x.s===Number(meta.semester)&&x.t===meta.title);if(!m)throw new Error('Bab Matematika belum ditemukan.');let bank=null;const grade=Number(meta.grade);if(grade>=1&&grade<=3){const qb=await ensureQuestionBank(grade);bank=qb&&qb.chapters?.[meta.title]||null}if(!bank)bank=genericBank(m.type);openRoom(meta,bank)";
  const newFlow="const grade=Number(meta.grade);let bank=null;if(grade>=1&&grade<=3){const qb=await ensureQuestionBank(grade);bank=qb&&qb.chapters?.[meta.title]||null;if(bank){openRoom(meta,bank);return}}const idx=await ensureIndex();const m=idx.modules.find(x=>x.g===grade&&x.s===Number(meta.semester)&&x.t===meta.title);if(!m)throw new Error('Bab Matematika belum ditemukan.');bank=genericBank(m.type);openRoom(meta,bank)";
  source=source.includes(oldFlow)?source.replace(oldFlow,newFlow):source;
  const patch=patchResponse.ok?await patchResponse.text():'';
  return new Response(`${source}\n;${patch}`,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'no-store'}});
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  const bankMatch=url.pathname.match(/^\/data\/question-bank-math-g([123])-v2\.json$/);
  if(bankMatch&&request.method==='GET')return runtimeBank(request,env,Number(bankMatch[1]));
  if(url.pathname==='/math-engine-v2.js'&&request.method==='GET')return patchedMathEngine(request,env);
  return qualityRouter.fetch(request,env);
}};
