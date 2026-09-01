import baseWorker from './worker.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

async function loadCurriculum(request, env) {
  const response = await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json', request.url)));
  if (!response.ok) throw new Error('core-curriculum-v2.json tidak tersedia');
  return response.json();
}

async function callGeneration(request, env, input) {
  const url = new URL('/api/ai/generate-questions', request.url);
  const internalRequest = new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grade: input.grade,
      semester: input.semester,
      subject: 'Matematika',
      chapter_id: input.chapter.id,
      chapter_title: input.chapter.title,
      skill: input.skill,
      difficulty: input.difficulty,
      count: input.count
    })
  });
  const response = await baseWorker.fetch(internalRequest, env);
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || 'Generation/review gagal');
    error.status = response.status;
    error.detail = payload.detail || '';
    throw error;
  }
  return payload;
}

function validateParams(url) {
  const grade = Number(url.searchParams.get('grade'));
  const semester = Number(url.searchParams.get('semester'));
  const chapterId = String(url.searchParams.get('chapter_id') || '').trim();
  const count = Math.min(Math.max(Number(url.searchParams.get('count') || 10), 1), 12);
  const difficulty = Math.min(Math.max(Number(url.searchParams.get('difficulty') || 1), 1), 3);
  const details = url.searchParams.get('details') === '1';

  if (![1, 2, 3].includes(grade)) throw new Error('grade untuk overnight bank harus 1, 2, atau 3');
  if (![1, 2].includes(semester)) throw new Error('semester harus 1 atau 2');
  if (!chapterId) throw new Error('chapter_id wajib diisi');
  return { grade, semester, chapterId, count, difficulty, details };
}

async function chapterQualityReport(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);

  let params;
  try {
    params = validateParams(new URL(request.url));
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  try {
    const curriculum = await loadCurriculum(request, env);
    const gradeMeta = curriculum?.grades?.[String(params.grade)];
    const chapters = gradeMeta?.semesters?.[String(params.semester)]?.Matematika || [];
    const chapter = chapters.find(item => item.id === params.chapterId);
    if (!chapter) return json({ error: 'chapter_id tidak ditemukan pada kurikulum Matematika kelas/semester tersebut.' }, 404);

    const rows = [];
    let requested = 0;
    let approved = 0;
    let needsReview = 0;
    let rejected = 0;

    for (const skill of chapter.skills || []) {
      const payload = await callGeneration(request, env, {
        grade: params.grade,
        semester: params.semester,
        chapter,
        skill,
        difficulty: params.difficulty,
        count: params.count
      });

      const row = {
        skill,
        requested: payload.summary?.requested || params.count,
        approved: payload.summary?.approved || 0,
        needs_review: payload.summary?.needs_review || 0,
        rejected: payload.summary?.rejected || 0,
        target_met: (payload.summary?.approved || 0) >= 8
      };

      requested += row.requested;
      approved += row.approved;
      needsReview += row.needs_review;
      rejected += row.rejected;

      if (params.details) {
        row.approved_questions = payload.approved || [];
        row.needs_review_questions = payload.needs_review || [];
        row.rejected_questions = payload.rejected || [];
      }
      rows.push(row);
    }

    const skillsReady = rows.filter(row => row.target_met).length;
    return json({
      ok: true,
      report: 'chapter-quality-v1',
      models: {
        generator: 'gemini-3.1-flash-lite',
        reviewer: 'gemini-3.5-flash'
      },
      scope: {
        grade: params.grade,
        semester: params.semester,
        subject: 'Matematika',
        phase: gradeMeta?.phase || '',
        chapter: {
          id: chapter.id,
          title: chapter.title,
          confidence: chapter.confidence,
          skills: chapter.skills?.length || 0
        }
      },
      publish: false,
      target: 'minimum 8 approved-auto questions per skill',
      summary: {
        skills: rows.length,
        skills_ready: skillsReady,
        requested,
        approved,
        needs_review: needsReview,
        rejected,
        ready_for_curation: rows.length > 0 && skillsReady === rows.length
      },
      results: rows
    });
  } catch (error) {
    return json({
      error: error.message || 'Chapter quality report gagal.',
      status: error.status,
      detail: String(error.detail || '').slice(0, 500)
    }, error.status && error.status >= 400 && error.status < 600 ? error.status : 502);
  }
}

async function overnightCoverage(request, env) {
  try {
    const curriculum = await loadCurriculum(request, env);
    const coverage = [];
    for (const grade of [1, 2, 3]) {
      for (const semester of [1, 2]) {
        const chapters = curriculum?.grades?.[String(grade)]?.semesters?.[String(semester)]?.Matematika || [];
        coverage.push({
          grade,
          semester,
          chapters: chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            confidence: chapter.confidence,
            skills: chapter.skills?.length || 0
          }))
        });
      }
    }
    return json({
      ok: true,
      scope: 'Matematika Grades 1-3 Semesters 1-2',
      publish: false,
      coverage
    });
  } catch (error) {
    return json({ error: error.message || 'Coverage gagal.' }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/chapter-quality-report' && request.method === 'GET') {
      return chapterQualityReport(request, env);
    }
    if (url.pathname === '/api/ai/overnight-coverage' && request.method === 'GET') {
      return overnightCoverage(request, env);
    }
    return baseWorker.fetch(request, env);
  }
};
