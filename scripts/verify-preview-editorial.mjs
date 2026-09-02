import fs from 'node:fs';
import { buildMathBank } from '../math-bank-runtime-v6.js';
import { buildEnglishBank } from '../english-bank-runtime-v5.js';

const BASE = process.env.PAHAM_PREVIEW || 'https://feat-chapter-based-two-subjects-paham-belajar.avi-yansah.workers.dev';
const curriculum = JSON.parse(fs.readFileSync('public/data/core-curriculum-v2.json','utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const localVersions = {
  Matematika: buildMathBank(curriculum, 1)?.version || null,
  'Bahasa Inggris': buildEnglishBank(curriculum, 1)?.version || null
};

class HttpError extends Error {
  constructor(path,status,payload){super(`${path} -> HTTP ${status}: ${JSON.stringify(payload).slice(0,600)}`);this.status=status;this.payload=payload;}
}

async function getJson(path, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, { headers: { accept: 'application/json' }, signal: controller.signal });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 500) }; }
    if (!response.ok) throw new HttpError(path,response.status,payload);
    return payload;
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`${path} -> timed out after ${timeoutMs}ms`);
      timeoutError.code = 'PREVIEW_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally { clearTimeout(timer); }
}

console.log(`Preview: ${BASE}`);
const health = await getJson('/api/ai/health', 30000);
console.log('Health:', JSON.stringify({ ok: health.ok, configured: health.configured, models: health.models || health.configuredModels || null }));
if (!health.ok) throw new Error('Preview health is not OK');
if (health.configured === false) throw new Error('GEMINI_API_KEY is not configured in preview Worker');

const bankChecks = [
  ['Matematika',1,'/data/question-bank-math-g1-v2.json'],
  ['Matematika',2,'/data/question-bank-math-g2-v2.json'],
  ['Matematika',3,'/data/question-bank-math-g3-v2.json'],
  ['Bahasa Inggris',1,'/data/question-bank-english-g1-v1.json'],
  ['Bahasa Inggris',2,'/data/question-bank-english-g2-v1.json'],
  ['Bahasa Inggris',3,'/data/question-bank-english-g3-v1.json']
];
for (const [subject, grade, path] of bankChecks) {
  const bank = await getJson(path, 30000);
  const chapterCount = Object.keys(bank.chapters || {}).length;
  console.log(`Bank OK: ${subject} G${grade} version=${bank.version || '-'} chapters=${chapterCount}`);
  if (!chapterCount) throw new Error(`Empty runtime bank: ${subject} G${grade}`);
  const expectedVersion=localVersions[subject];
  if(expectedVersion && bank.version!==expectedVersion){
    throw new Error(`STALE PREVIEW: ${subject} G${grade} serves ${bank.version || '-'} but branch expects ${expectedVersion}. Deploy latest feature branch before editorial QA.`);
  }
}

const rows = [];
let quotaBlocked=false;
let transientBlocked=false;
outer: for (const subject of ['Matematika','Bahasa Inggris']) {
  for (const grade of [1,2,3]) {
    for (const semester of [1,2]) {
      const chapters = curriculum?.grades?.[String(grade)]?.semesters?.[String(semester)]?.[subject] || [];
      for (const chapter of chapters) {
        const qs = new URLSearchParams({ subject, grade: String(grade), semester: String(semester), chapter_id: chapter.id });
        const path = `/api/ai/runtime-bank-review?${qs}`;
        try {
          const result = await getJson(path, 90000);
          const s = result.summary || {};
          const row = { subject, grade, semester, chapter_id: chapter.id, title: chapter.title, bank_version: result.bank_version, reviewer_model: result.models?.reviewer || null, fallback_used: Boolean(result.models?.fallback_used), total: s.total || 0, approved: s.approved || 0, needs_review: s.needs_review || 0, rejected: s.rejected || 0, production_ready: Boolean(result.production_ready) };
          rows.push(row);
          console.log(`REVIEW ${subject} G${grade} S${semester} ${chapter.id}: approved=${row.approved}/${row.total}, needs=${row.needs_review}, rejected=${row.rejected}, ready=${row.production_ready}, model=${row.reviewer_model}${row.fallback_used?' (fallback)':''}`);
          const flagged=(result.results||[]).filter(x=>x.review_status!=='approved-auto');
          for(const item of flagged.slice(0,12)){
            const flags=[...(item.review?.deterministic_flags||[]),...(item.review?.flags||[])].filter(x=>x&&x!=='none');
            const reason=(item.review?.reasons||[]).join(' | ').slice(0,280);
            console.log(`FLAG ${chapter.id} ${item.id}: status=${item.review_status}; skill=${item.skill}; flags=${flags.join(',')||'-'}; reason=${reason||'-'}; stem=${String(item.q||'').slice(0,220)}`);
          }
          if(flagged.length>12) console.log(`FLAG ${chapter.id}: ${flagged.length-12} more item(s) omitted from log.`);
        } catch (error) {
          const msg=error.message||String(error);
          rows.push({ subject, grade, semester, chapter_id: chapter.id, title: chapter.title, error: msg });
          console.error(`REVIEW ERROR ${subject} G${grade} S${semester} ${chapter.id}: ${msg}`);
          if(error.status===429 || /\b429\b|quota/i.test(msg)){
            quotaBlocked=true;
            console.error('EDITORIAL PAUSED: Gemini quota/rate limit detected. Stop sweep now and retry on a later run.');
            break outer;
          }
          if(error.code==='PREVIEW_TIMEOUT' || error.status===503 || /\b503\b|timed out/i.test(msg)){
            transientBlocked=true;
            console.error('EDITORIAL PAUSED: preview/reviewer is temporarily slow or unavailable. Stop sweep now and retry on a later run.');
            break outer;
          }
        }
        await sleep(1500);
      }
    }
  }
}

const errors = rows.filter(r => r.error);
const totals = rows.reduce((a,r) => {
  a.chapters++;
  a.total += r.total || 0;
  a.approved += r.approved || 0;
  a.needs_review += r.needs_review || 0;
  a.rejected += r.rejected || 0;
  if (r.production_ready) a.production_ready++;
  if (r.fallback_used) a.fallback_chapters++;
  return a;
}, { chapters:0,total:0,approved:0,needs_review:0,rejected:0,production_ready:0,fallback_chapters:0 });
console.log('\nEDITORIAL SUMMARY');
console.log(JSON.stringify({ ...totals, errors: errors.length, quota_blocked: quotaBlocked, transient_blocked: transientBlocked }, null, 2));
console.log('\nEDITORIAL_ROWS_JSON=' + JSON.stringify(rows));
if(quotaBlocked) throw new Error('Editorial QA paused because Gemini quota/rate limit is active; repo and UI audits remain authoritative until quota recovers.');
if(transientBlocked) throw new Error('Editorial QA paused because preview/reviewer timed out or returned a transient availability error; retry on a later run.');
if (errors.length) throw new Error(`${errors.length} chapter review request(s) failed`);
const notReady = rows.filter(r => !r.error && !r.production_ready);
if (notReady.length) throw new Error(`${notReady.length} chapter(s) are not editorially production-ready; fix flagged items before UAT.`);
