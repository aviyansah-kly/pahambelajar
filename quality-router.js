import baseRouter from './worker-router.js';
import { buildMathBank } from './math-bank-runtime.js';

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
          flags: {
            type: 'ARRAY',
            items: { type: 'STRING', enum: ['math_error', 'skill_drift', 'ambiguous', 'weak_explanation', 'repetitive', 'language_issue', 'none'] }
          }
        },
        required: ['id', 'verdict', 'score', 'reasons', 'flags']
      }
    }
  },
  required: ['reviews']
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

async function loadCurriculum(request, env) {
  const response = await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json', request.url)));
  if (!response.ok) throw new Error('core-curriculum-v2.json tidak tersedia');
  return response.json();
}

function params(url) {
  const grade = Number(url.searchParams.get('grade'));
  const semester = Number(url.searchParams.get('semester'));
  const chapterId = String(url.searchParams.get('chapter_id') || '').trim();
  const details = url.searchParams.get('details') === '1';
  if (![1, 2, 3].includes(grade)) throw new Error('grade harus 1, 2, atau 3');
  if (![1, 2].includes(semester)) throw new Error('semester harus 1 atau 2');
  if (!chapterId) throw new Error('chapter_id wajib diisi');
  return { grade, semester, chapterId, details };
}

function uniqueQuestions(chapter) {
  const seen = new Set();
  return [...(chapter.practice || []), ...(chapter.quiz || [])].filter(q => {
    if (!q?.id || seen.has(q.id)) return false;
    seen.add(q.id);
    return true;
  });
}

function reviewerPrompt(meta, skill, questions) {
  return `Anda adalah senior editor soal Matematika SD Indonesia. Review soal yang BENAR-BENAR dipakai di runtime PahamBelajar.\n\nKelas: ${meta.grade}\nSemester: ${meta.semester}\nBab: ${meta.chapterTitle}\nSkill target: ${skill}\n\nPeriksa ketat:\n1. Kebenaran matematika jawaban dan penjelasan.\n2. Tepat satu opsi benar dan tidak ambigu.\n3. Soal benar-benar menguji skill target dan sesuai tingkat kelas.\n4. Bahasa singkat, natural, mudah dipahami anak Indonesia.\n5. Penjelasan membantu anak memahami alasan, bukan hanya mengulang jawaban.\n6. Tandai repetitive hanya bila variasinya terlalu rendah untuk bank belajar, bukan sekadar karena format dasar serupa.\n\nVerdict:\n- approved: score >= 85, tidak ada math_error, skill_drift, atau ambiguous.\n- needs_review: matematika benar tetapi wording, penjelasan, atau variasi perlu perbaikan.\n- rejected: matematika salah, ambigu, atau keluar skill.\n\nJSON soal:\n${JSON.stringify(questions)}\n\nKembalikan review untuk setiap id sesuai schema.`;
}

async function reviewSkill(meta, skill, questions, env) {
  const response = await fetch(REVIEWER_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: reviewerPrompt(meta, skill, questions) }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json', responseSchema: reviewSchema }
    })
  });
  if (!response.ok) throw new Error(`Reviewer Gemini gagal (${response.status})`);
  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Reviewer Gemini tidak mengembalikan konten');
  const parsed = JSON.parse(text);
  const byId = new Map((parsed.reviews || []).map(r => [r.id, r]));
  return questions.map(q => {
    const r = byId.get(q.id) || { verdict: 'needs_review', score: 0, reasons: ['Reviewer tidak mengembalikan hasil.'], flags: ['none'] };
    const critical = (r.flags || []).some(f => ['math_error', 'skill_drift', 'ambiguous'].includes(f));
    const status = r.verdict === 'approved' && r.score >= 85 && !critical ? 'approved-auto' : (r.verdict === 'rejected' || critical ? 'rejected-ai' : 'needs-review');
    return { id: q.id, status, score: r.score, flags: r.flags || [], reasons: r.reasons || [] };
  });
}

async function runtimeBankReview(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  let p;
  try { p = params(new URL(request.url)); }
  catch (error) { return json({ error: error.message }, 400); }

  try {
    const curriculum = await loadCurriculum(request, env);
    const gradeMeta = curriculum?.grades?.[String(p.grade)];
    const curriculumChapter = gradeMeta?.semesters?.[String(p.semester)]?.Matematika?.find(c => c.id === p.chapterId);
    if (!curriculumChapter) return json({ error: 'Bab tidak ditemukan di curriculum v2.' }, 404);

    const bank = buildMathBank(curriculum, p.grade);
    const runtimeChapter = Object.values(bank?.chapters || {}).find(c => c.chapter_id === p.chapterId);
    if (!runtimeChapter) return json({ error: 'Bab belum tersedia di runtime bank.' }, 404);

    const all = uniqueQuestions(runtimeChapter);
    const rows = [];
    let approved = 0, needsReview = 0, rejected = 0;

    for (const skill of curriculumChapter.skills || []) {
      const questions = all.filter(q => q.skill === skill).slice(0, 10);
      if (!questions.length) {
        rows.push({ skill, total: 0, approved: 0, needs_review: 0, rejected: 0, target_met: false, error: 'Tidak ada soal untuk skill ini.' });
        continue;
      }
      const reviews = await reviewSkill({ grade: p.grade, semester: p.semester, chapterTitle: curriculumChapter.title }, skill, questions, env);
      const a = reviews.filter(r => r.status === 'approved-auto').length;
      const n = reviews.filter(r => r.status === 'needs-review').length;
      const x = reviews.filter(r => r.status === 'rejected-ai').length;
      approved += a; needsReview += n; rejected += x;
      const row = { skill, total: questions.length, approved: a, needs_review: n, rejected: x, target_met: a >= 8 };
      if (p.details) row.reviews = reviews;
      rows.push(row);
    }

    const skillsReady = rows.filter(r => r.target_met).length;
    return json({
      ok: true,
      report: 'runtime-bank-quality-v1',
      reviewer: REVIEWER_MODEL,
      source: 'deterministic-runtime-bank',
      scope: { grade: p.grade, semester: p.semester, chapter: { id: curriculumChapter.id, title: curriculumChapter.title }, phase: gradeMeta?.phase || '' },
      summary: {
        skills: rows.length,
        skills_ready: skillsReady,
        approved,
        needs_review: needsReview,
        rejected,
        production_ready: rows.length > 0 && skillsReady === rows.length
      },
      results: rows
    });
  } catch (error) {
    return json({ error: error.message || 'Runtime bank review gagal.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/runtime-bank-review' && request.method === 'GET') return runtimeBankReview(request, env);
    return baseRouter.fetch(request, env);
  }
};
