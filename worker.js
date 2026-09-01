const MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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

function normalizeText(value) {
  return cleanString(value, 500)
    .toLowerCase()
    .replace(/[^a-z0-9à-ÿ\u00c0-\u024f\u1e00-\u1eff\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\u00a0-\uffff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

async function getCurriculum(request, env) {
  const url = new URL('/data/core-curriculum-v2.json', request.url);
  const response = await env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error('curriculum v2 tidak tersedia');
  return response.json();
}

function findChapter(curriculum, input) {
  const grade = curriculum?.grades?.[String(input.grade)];
  const chapters = grade?.semesters?.[String(input.semester)]?.[input.subject] || [];
  const chapter = chapters.find(c => c.id === input.chapterId && c.title === input.chapterTitle);
  if (!chapter) throw new Error('bab tidak cocok dengan curriculum v2');
  if (!chapter.skills?.includes(input.skill)) throw new Error('skill tidak cocok dengan bab');
  return { grade, chapter, meta: { phase: grade.phase, confidence: chapter.confidence } };
}

async function validateAgainstCurriculum(request, env, input) {
  const curriculum = await getCurriculum(request, env);
  return findChapter(curriculum, input).meta;
}

function buildPrompt(input, curriculumMeta) {
  const mathRules = input.subject === 'Matematika'
    ? `- Hitung dan verifikasi jawaban matematis sebelum membuat distractor.\n- Bedakan istilah dengan konsisten: nilai tempat = ratusan/puluhan/satuan; nilai angka = nilai digit seperti 300/60/7.\n- Utamakan istilah matematika tersebut dalam penjelasan; hindari menjelaskan posisi hanya dengan \"paling kiri\", \"kiri\", atau \"kanan\" jika bisa dijelaskan dengan ratusan/puluhan/satuan.`
    : '- Gunakan kosakata dan struktur bahasa yang sesuai usia dan skill yang diminta.';

  return `Anda adalah editor soal PahamBelajar untuk anak SD/MI/SDIT Indonesia.\n\nBuat ${input.count} soal PILIHAN GANDA original.\nKelas: ${input.grade}\nFase: ${curriculumMeta.phase}\nSemester: ${input.semester}\nPelajaran: ${input.subject}\nBab: ${input.chapterTitle}\nSkill: ${input.skill}\nDifficulty: ${input.difficulty} dari 3\n\nAturan wajib:\n- Hanya menguji skill tersebut dan jangan memakai materi kelas yang lebih tinggi.\n- Setiap soal punya tepat 4 opsi dan hanya 1 jawaban benar.\n- Bahasa singkat, natural, jelas, tidak menjebak, cocok untuk anak kelas ${input.grade}.\n- Pertanyaan dalam satu batch harus bervariasi; jangan hanya mengganti angka pada kalimat yang sama.\n- Variasikan cara menguji konsep jika skill memungkinkan: identifikasi konsep, memilih contoh yang tepat, menentukan nilai, membandingkan, atau mengurutkan.\n- Distraktor harus masuk akal sebagai kesalahan umum anak, tetapi tidak ambigu.\n- Field why harus menjelaskan alasan jawaban dengan 1-3 kalimat sederhana, bukan sekadar mengulang jawaban.\n- Gunakan kapitalisasi dan tanda baca yang konsisten pada opsi.\n- Hindari konteks budaya yang terlalu spesifik, data kontroversial, dan beban membaca yang tidak perlu.\n${mathRules}\n- Jangan menyalin kalimat dari buku pemerintah atau penerbit; buat soal original.\n- Kembalikan JSON sesuai schema saja.`;
}

function lintCandidate(candidate, seenStems) {
  const reasons = [];
  const stemKey = normalizeText(candidate.q);
  if (!stemKey || stemKey.length < 8) reasons.push('pertanyaan terlalu pendek/tidak jelas');
  if (seenStems.has(stemKey)) reasons.push('pertanyaan duplikat dalam batch');
  if (candidate.q.length > 220) reasons.push('pertanyaan terlalu panjang untuk MVP');
  if (candidate.why.length < 15) reasons.push('penjelasan terlalu pendek');
  if (/\b(paling kiri|sebelah kiri|sebelah kanan)\b/i.test(candidate.why)) reasons.push('penjelasan terlalu bergantung pada arah kiri/kanan');
  if (new Set(candidate.o.map(normalizeText)).size !== 4) reasons.push('opsi tidak unik setelah normalisasi');
  if (candidate.o.some(option => !cleanString(option, 120))) reasons.push('ada opsi kosong');
  if (!reasons.length) seenStems.add(stemKey);
  return reasons;
}

function validateQuestions(payload, input) {
  const list = payload?.questions;
  if (!Array.isArray(list) || list.length < 1) throw new Error('Gemini tidak mengembalikan daftar soal');
  const seenStems = new Set();
  const accepted = [];
  const rejected = [];
  const batchId = Date.now();

  list.slice(0, input.count).forEach((q, i) => {
    if (q.type !== 'choice' || !Array.isArray(q.o) || q.o.length !== 4) throw new Error(`format soal ${i + 1} tidak valid`);
    if (!Number.isInteger(q.a) || q.a < 0 || q.a > 3) throw new Error(`jawaban soal ${i + 1} tidak valid`);

    const candidate = {
      id: `ai-${input.chapterId}-${batchId}-${i + 1}`,
      skill: input.skill,
      difficulty: input.difficulty,
      type: 'choice',
      q: cleanString(q.q, 320),
      o: q.o.map(x => cleanString(x, 120)),
      a: q.a,
      why: cleanString(q.why, 500),
      source: 'gemini-draft',
      review_status: 'candidate'
    };

    const reasons = lintCandidate(candidate, seenStems);
    if (reasons.length) {
      candidate.review_status = 'rejected-auto';
      rejected.push({ ...candidate, rejection_reasons: reasons });
    } else {
      accepted.push(candidate);
    }
  });

  return { accepted, rejected };
}

async function callGemini(input, curriculumMeta, env) {
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
    let safeDetail = detail;
    try {
      const parsed = JSON.parse(detail);
      safeDetail = parsed?.error?.message || parsed?.error?.status || detail;
    } catch {}
    const error = new Error('Gemini gagal membuat soal.');
    error.status = geminiResponse.status;
    error.detail = cleanString(safeDetail, 500);
    throw error;
  }

  const result = await geminiResponse.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini tidak mengembalikan konten.');
  return JSON.parse(text);
}

async function generateFromInput(input, curriculumMeta, env) {
  const parsed = await callGemini(input, curriculumMeta, env);
  return validateQuestions(parsed, input);
}

async function generateQuestions(request, env) {
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

  try {
    const result = await generateFromInput(input, curriculumMeta, env);
    return json({
      model: MODEL,
      curriculum: curriculumMeta,
      input,
      summary: { requested: input.count, accepted: result.accepted.length, rejected: result.rejected.length },
      questions: result.accepted,
      rejected: result.rejected
    });
  } catch (error) {
    console.error('Gemini generation/validation error', error);
    return json({
      error: error.message || 'Hasil Gemini tidak lolos validasi.',
      status: error.status,
      detail: cleanString(error.detail || '', 500)
    }, 502);
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

async function grade3Chapter1Pilot(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  const curriculum = await getCurriculum(request, env);
  const grade = curriculum?.grades?.['3'];
  const chapter = grade?.semesters?.['1']?.Matematika?.find(c => c.id === 'm3s1-01');
  if (!chapter) return json({ error: 'Bab pilot tidak ditemukan di curriculum v2.' }, 500);

  const results = [];
  let totalAccepted = 0;
  let totalRejected = 0;

  for (const skill of chapter.skills) {
    const input = {
      grade: 3,
      semester: 1,
      subject: 'Matematika',
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      skill,
      difficulty: 1,
      count: 6
    };
    try {
      const generated = await generateFromInput(input, { phase: grade.phase, confidence: chapter.confidence }, env);
      totalAccepted += generated.accepted.length;
      totalRejected += generated.rejected.length;
      results.push({
        skill,
        requested: input.count,
        accepted: generated.accepted,
        rejected: generated.rejected
      });
    } catch (error) {
      results.push({ skill, error: error.message, status: error.status, detail: cleanString(error.detail || '', 300) });
    }
  }

  return json({
    ok: true,
    pilot: 'grade3-math-chapter1',
    model: MODEL,
    chapter: { id: chapter.id, title: chapter.title, confidence: chapter.confidence },
    policy: {
      target: '30 candidate questions, 6 per skill',
      publish: false,
      auto_filter: ['duplicate stem', 'duplicate options', 'overlong stem', 'weak explanation', 'directional left/right explanation'],
      next_stage: 'human review, then expand strong skills to 12–16 candidates before selecting an 8–12 question live bank'
    },
    summary: { skills: chapter.skills.length, requested: chapter.skills.length * 6, accepted: totalAccepted, rejected: totalRejected },
    results
  });
}

async function listModels(env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
    headers: { 'x-goog-api-key': env.GEMINI_API_KEY }
  });
  if (!response.ok) {
    const detail = await response.text();
    return json({ error: 'Gagal mengambil daftar model Gemini.', status: response.status, detail: cleanString(detail, 500) }, 502);
  }
  const payload = await response.json();
  const models = (payload.models || [])
    .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
    .map(m => ({ name: m.name, displayName: m.displayName, methods: m.supportedGenerationMethods }));
  return json({
    ok: true,
    configuredModel: MODEL,
    configuredModelAvailable: models.some(m => m.name === `models/${MODEL}`),
    models
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/health') {
      return json({ ok: true, provider: 'Gemini', model: MODEL, configured: Boolean(env.GEMINI_API_KEY) });
    }
    if (url.pathname === '/api/ai/models' && request.method === 'GET') {
      return listModels(env);
    }
    if (url.pathname === '/api/ai/self-test' && request.method === 'GET') {
      const run = url.searchParams.get('run');
      if (run === 'grade3-place-value') return generateQuestions(grade3SelfTestRequest(request), env);
      if (run === 'grade3-chapter1') return grade3Chapter1Pilot(request, env);
      return json({ error: 'Self-test token tidak valid.' }, 403);
    }
    if (url.pathname === '/api/ai/generate-questions') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return generateQuestions(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
