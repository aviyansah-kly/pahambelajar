import fs from 'node:fs';

const BASE = process.env.PAHAM_PREVIEW || 'https://feat-chapter-based-two-subjects-paham-belajar.avi-yansah.workers.dev';
const curriculum = JSON.parse(fs.readFileSync('public/data/core-curriculum-v2.json','utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJson(path, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, { headers: { accept: 'application/json' }, signal: controller.signal });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 500) }; }
    if (!response.ok) throw new Error(`${path} -> HTTP ${response.status}: ${JSON.stringify(payload).slice(0,600)}`);
    return payload;
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
}

const rows = [];
for (const subject of ['Matematika','Bahasa Inggris']) {
  for (const grade of [1,2,3]) {
    for (const semester of [1,2]) {
      const chapters = curriculum?.grades?.[String(grade)]?.semesters?.[String(semester)]?.[subject] || [];
      for (const chapter of chapters) {
        const qs = new URLSearchParams({ subject, grade: String(grade), semester: String(semester), chapter_id: chapter.id });
        const path = `/api/ai/runtime-bank-review?${qs}`;
        try {
          const result = await getJson(path, 180000);
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
          rows.push({ subject, grade, semester, chapter_id: chapter.id, title: chapter.title, error: error.message });
          console.error(`REVIEW ERROR ${subject} G${grade} S${semester} ${chapter.id}: ${error.message}`);
        }
        await sleep(1200);
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
console.log(JSON.stringify({ ...totals, errors: errors.length }, null, 2));
console.log('\nEDITORIAL_ROWS_JSON=' + JSON.stringify(rows));
if (errors.length) throw new Error(`${errors.length} chapter review request(s) failed`);
