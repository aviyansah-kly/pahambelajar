import baseRouter from './worker-router.js';
import { buildMathBank } from './math-bank-runtime-v3.js';

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}

async function loadCurriculum(request,env){
  const response=await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json',request.url)));
  if(!response.ok)throw new Error('core-curriculum-v2.json tidak tersedia');
  return response.json();
}

async function runtimeBank(request,env,grade){
  try{
    const curriculum=await loadCurriculum(request,env);
    const bank=buildMathBank(curriculum,grade);
    if(!bank)return json({error:'Kelas tidak ditemukan.'},404);
    return json(bank);
  }catch(error){return json({error:error.message||'Bank Matematika gagal dibangun.'},500)}
}

async function patchedMathEngine(request,env){
  const baseUrl=new URL('/math-engine-v2.js',request.url);
  const patchUrl=new URL('/math-question-helper-patch.js',request.url);
  const [baseResponse,patchResponse]=await Promise.all([
    env.ASSETS.fetch(new Request(baseUrl)),
    env.ASSETS.fetch(new Request(patchUrl))
  ]);
  if(!baseResponse.ok)return baseResponse;
  const base=await baseResponse.text();
  const patch=patchResponse.ok?await patchResponse.text():'';
  return new Response(`${base}\n;${patch}`,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'no-store'}});
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const bankMatch=url.pathname.match(/^\/data\/question-bank-math-g([123])-v2\.json$/);
    if(bankMatch&&request.method==='GET')return runtimeBank(request,env,Number(bankMatch[1]));
    if(url.pathname==='/math-engine-v2.js'&&request.method==='GET')return patchedMathEngine(request,env);
    return baseRouter.fetch(request,env);
  }
};
