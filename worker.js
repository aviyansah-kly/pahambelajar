const MODEL = 'gemini-2.5-flash-lite';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_URL = `${GEMINI_BASE}/models/${MODEL}:generateContent`;

const questionSchema = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          skill: { type: 'STRING' },
          difficulty: { type: 'INTEGER' },
          type: { type: 'STRING', enum: ['choice'] },
          q: { type: 'STRING' },
          o: { type: 'ARRAY', items: { type: 'STRING' }, minItems: 4, maxItems: 4 },
          a: { type: 'INTEGER', minimum: 0, maximum: 3 },
          why: { type: 'STRING' }
        },
        required: ['skill', 'difficulty', 'type', 'q', 'o', 'a', 'why']
      }
    }
  },
  required: ['questions']
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function cleanString(value, max = 160) {
  return String(value ?? '').trim().slice(0, max);
}

function validateInput(body) {
  const grade = Number(body.grade);
  const semester = Number(body.semester);
  const difficulty = Number(body.difficulty || 1);
  const count = Math.min(Math.max(Number(body.count || 5), 1), 12);
  const subject = cleanString(body.subject, 40);
  const chapterId = cleanString(body.chapter_id, 60);
  const chapterTitle = cleanString(body.chapter_title, 120);
  const skill = cleanString(body.skill, 160);
  if (!Number.isInteger(grade) || grade < 1 || grade > 6) throw new Error('grade tidak valid');
  if (![1, 2].includes(semester)) throw new Error('semester tidak valid');
  if (!['Matematika', 'Bahasa Inggris'].includes(subject)) throw new Error('subject tidak valid');
  if (!chapterId || !chapterTitle || !skill) throw new Error('chapter dan skill wajib diisi');
  if (![1, 2, 3].includes(difficulty)) throw new Error('difficulty tidak valid');
  return { grade, semester, difficulty, count, subject, chapterId, chapterTitle, skill };
}

async function validateAgainstCurriculum(request, env, input) {
  const url = new URL('/data/core-curriculum-v2.json', request.url);
  const response = await env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error('curriculum v2 tidak tersedia');
  const curriculum = await response.json();
  const grade = curriculum?.grades?.[String(input.grade)];
  const chapters = grade?.semesters?.[String(input.semester)]?.[input.subject] || [];
  const chapter = chapters.find(c => c.id === input.chapterId && c.title === input.chapterTitle);
  if (!chapter) throw new Error('bab tidak cocok dengan curriculum v2');
  if (!chapter.skills?.includes(input.skill)) throw new Error('skill tidak cocok dengan bab');
  return { phase: grade.phase, confidence: chapter.confidence };
}

function buildPrompt(input, curriculumMeta) {
  const subjectRules = input.subject === 'Matematika'
    ? 'Pastikan semua operasi dan jawaban matematis benar. Jangan memakai materi di atas kelas yang diminta.'
    : 'Gunakan kosakata dan struktur bahasa yang sesuai usia dan skill yang diminta.';
  return `Anda adalah editor soal PahamBelajar untuk anak SD/MI/SDIT Indonesia.\n\nBuat ${input.count} soal PILIHAN GANDA original.\nKelas: ${input.grade}\nFase: ${curriculumMeta.phase}\nSemester: ${input.semester}\nPelajaran: ${input.subject}\nBab: ${input.chapterTitle}\nSkill: ${input.skill}\nDifficulty: ${input.difficulty} dari 3\n\nAturan wajib:\n- Hanya menguji skill tersebut.\n- Setiap soal punya tepat 4 opsi dan hanya 1 jawaban benar.\n- Bahasa singkat, jelas, tidak menjebak, cocok untuk anak kelas ${input.grade}.\n- Distraktor harus masuk akal sebagai kesalahan umum anak.\n- Field why harus menjelaskan alasan jawaban dengan 1-3 kalimat sederhana, bukan sekadar mengulang jawaban.\n- Hindari konteks budaya yang terlalu spesifik, data kontroversial, dan materi yang belum perlu.\n- ${subjectRules}\n- Jangan menyalin kalimat dari buku penerbit; buat soal original.\n- Kembalikan JSON sesuai schema saja.`;
}

function validateQuestions(payload, input) {
  const list = payload?.questions;
  if (!Array.isArray(list) || list.length < 1) throw new Error('Gemini tidak mengembalikan daftar soal');
  return list.slice(0, input.count).map((q, i) => {
    if (q.type !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) throw new Error(`format soal ${i + 1} tidak valid`);
    if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) throw new Error(`jawaban soal ${i + 1} tidak valid`);
    const options = q.o.map(x => cleanString(x, 120));
    if (new Set(options).size !== 4) throw new Error(`opsi soal ${i + 1} tidak unik`);
    return {
      id: `ai-${input.chapterId}-${Date.now()}-${i + 1}`,
      skill: input.skill,
      difficulty: input.difficulty,
      type: 'choice',
      q: cleanString(q.q, 320),
      o: options,
      a: q.a,
      why: cleanString(q.why, 500),
      source: 'gemini-draft',
      review_status: 'candidate'
    };
  });
}

async function geminiModels(env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  const response = await fetch(`${GEMINI_BASE}/models`, { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 1200) }; }
  if (!response.ok) return json({ ok: false, status: response.status, upstream: payload }, 502);
  const models = (payload.models || [])
    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => ({ name: m.name, displayName: m.displayName, methods: m.supportedGenerationMethods }))
    .slice(0, 50);
  return json({ ok: true, configuredModel: MODEL, configuredModelAvailable: models.some(m => m.name === `models/${MODEL}`), models });
}

async function generateQuestions(request, env, debug = false) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body JSON tidak valid.' }, 400); }
  let input, curriculumMeta;
  try {
    input = validateInput(body);
    curriculumMeta = await validateAgainstCurriculum(request, env, input);
  } catch (error) {
    return json({ error: error.message }, 400);
  }

  const geminiResponse = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(input, curriculumMeta) }] }],
      generationConfig: {
        temperature: 0.55,
        responseMimeType: 'application/json',
        responseSchema: questionSchema
      }
    })
  });

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error('Gemini error', geminiResponse.status, detail);
    let upstream;
    try { upstream = JSON.parse(detail); } catch { upstream = { raw: detail.slice(0, 1200) }; }
    return json({ error: 'Gemini gagal membuat soal.', status: geminiResponse.status, ...(debug ? { model: MODEL, upstream } : {}) }, 502);
  }

  try {
    const result = await geminiResponse.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(text);
    const questions = validateQuestions(parsed, input);
    return json({ model: MODEL, curriculum: curriculumMeta, input, questions });
  } catch (error) {
    console.error('Gemini parse/validation error', error);
    return json({ error: 'Hasil Gemini tidak lolos validasi format.', ...(debug ? { detail: String(error?.message || error) } : {}) }, 502);
  }
}

function grade3SelfTestRequest(request) {
  return new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grade: 3,
      semester: 1,
      subject: 'Matematika',
      chapter_id: 'm3s1-01',
      chapter_title: 'Bilangan sampai 1.000',
      skill: 'nilai tempat ratusan-puluhan-satuan',
      difficulty: 1,
      count: 3
    })
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/health') {
      return json({ ok: true, provider: 'Gemini', model: MODEL, configured: Boolean(env.GEMINI_API_KEY) });
    }
    if (url.pathname === '/api/ai/models' && request.method === 'GET') {
      return geminiModels(env);
    }
    if (url.pathname === '/api/ai/self-test' && request.method === 'GET') {
      if (url.searchParams.get('run') !== 'grade3-place-value') return json({ error: 'Self-test token tidak valid.' }, 403);
      return generateQuestions(grade3SelfTestRequest(request), env, true);
    }
    if (url.pathname === '/api/ai/generate-questions') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return generateQuestions(request, env, false);
    }
    return env.ASSETS.fetch(request);
  }
};
