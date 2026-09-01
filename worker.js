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
  return cleanString(value, 500).toLowerCase().replace(/[^a-z0-9à-ÿ\u00a0-\uffff]+/g, ' ').replace(/\s+/g, ' ').trim();
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
  const response = await env.ASSETS.fetch(new Request(new URL('/data/core-curriculum-v2.json', request.url)));
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
  return findChapter(await getCurriculum(request, env), input).meta;
}

function skillGuardrail(skill) {
  const rules = {
    'membaca dan menulis bilangan': {
      prompt: 'Uji hanya membaca nama bilangan, menulis lambang bilangan dari kata-kata, atau menyusun lambang bilangan dari ratusan-puluhan-satuan. Jangan bertanya nilai tempat/nilai digit, bentuk panjang, perbandingan, atau pengurutan.',
      required: /(dibaca|lambang bilangan|ditulis|nama bilangan|terdiri dari)/i,
      forbidden: /(nilai tempat|nilai angka|bentuk panjang|lebih besar|lebih kecil|urutan|urutkan)/i
    },
    'nilai tempat ratusan-puluhan-satuan': {
      prompt: 'Uji HANYA tempat suatu digit: ratusan, puluhan, atau satuan. Jawaban benar harus berupa nama tempat tersebut. Jangan bertanya nilai digit seperti 500/50/5, jangan bentuk panjang, jangan perbandingan/pengurutan.',
      required: /(nilai tempat|menempati nilai tempat|tempat (?:apa|ratusan|puluhan|satuan)|angka .* (?:di|pada) .* (?:ratusan|puluhan|satuan))/i,
      forbidden: /(nilai angka|bernilai|nilai sebesar|berapa(?:kah)? nilai|bentuk panjang|lebih besar|lebih kecil|urutan|diurutkan)/i
    },
    'bentuk panjang': {
      prompt: 'Uji hanya mengubah bilangan ke bentuk panjang atau menggabungkan bentuk panjang menjadi bilangan. Jangan membuat soal yang hanya bertanya nilai sebuah digit.',
      required: /(bentuk panjang|\+)/i,
      forbidden: /(berapa(?:kah)? nilai angka|nilai tempat|lebih besar|lebih kecil|urutan|diurutkan)/i
    },
    'membandingkan bilangan': {
      prompt: 'Uji hanya perbandingan bilangan: lebih besar/kecil, tanda < > =, paling besar/kecil, atau bilangan di antara. Penjelasan wajib membandingkan dari nilai tempat terbesar yang berbeda dan harus benar secara matematis. Jangan meminta urutan lengkap.',
      required: /(lebih besar|lebih kecil|tanda perbandingan|paling besar|paling kecil|di antara|membandingkan|pernyataan yang benar)/i,
      forbidden: /(urutan bilangan|diurutkan|mengurutkan|terbesar ke yang terkecil|terkecil ke yang terbesar)/i
    },
    'mengurutkan bilangan': {
      prompt: 'Uji hanya mengurutkan SEKUMPULAN bilangan naik/turun atau menentukan posisi setelah diurutkan. Jangan membuat pola bilangan, deret bertambah tetap, atau soal melengkapi urutan berpola. Jangan hanya mencari bilangan terbesar/kecil tanpa proses pengurutan.',
      required: /(urutan|diurutkan|mengurutkan|urutan kedua|terbesar ke|terkecil ke)/i,
      forbidden: /(melengkapi urutan|bertambah \d+|setiap langkah|pola bilangan|bilangan berikutnya)/i
    }
  };
  return rules[skill] || null;
}

function buildPrompt(input, curriculumMeta) {
  const guardrail = skillGuardrail(input.skill);
  const mathRules = input.subject === 'Matematika'
    ? `- Hitung dan verifikasi jawaban serta penjelasan matematis sebelum mengembalikan JSON.\n- Jangan pernah membuat penjelasan yang bertentangan dengan angka pada soal.\n- Bedakan: nilai tempat = ratusan/puluhan/satuan; nilai digit = 300/60/7.\n- Jangan menjelaskan nilai tempat dengan arah visual seperti kiri, kanan, paling kiri/kanan, kedua dari kanan/kiri, atau posisi tengah.\n${guardrail ? `- Guardrail skill: ${guardrail.prompt}` : ''}`
    : '- Gunakan kosakata dan struktur bahasa yang sesuai usia dan skill yang diminta.';

  return `Anda adalah editor soal PahamBelajar untuk anak SD/MI/SDIT Indonesia.\n\nBuat ${input.count} soal PILIHAN GANDA original.\nKelas: ${input.grade}\nFase: ${curriculumMeta.phase}\nSemester: ${input.semester}\nPelajaran: ${input.subject}\nBab: ${input.chapterTitle}\nSkill: ${input.skill}\nDifficulty: ${input.difficulty} dari 3\n\nAturan wajib:\n- Hanya menguji skill tersebut.\n- Setiap soal punya tepat 4 opsi dan hanya 1 jawaban benar.\n- Bahasa singkat, natural, jelas, tidak menjebak.\n- Variasi tetap harus berada di skill target; jangan mencampur skill tetangga.\n- Distraktor harus masuk akal tetapi tidak ambigu.\n- Field why menjelaskan alasan jawaban dalam 1-3 kalimat sederhana dan harus benar secara matematis.\n- Gunakan kapitalisasi dan tanda baca opsi secara konsisten.\n${mathRules}\n- Buat soal original dan kembalikan JSON sesuai schema saja.`;
}

function lintCandidate(candidate, seenStems, input) {
  const reasons = [];
  const stemKey = normalizeText(candidate.q);
  const guardrail = skillGuardrail(input.skill);
  if (!stemKey || stemKey.length < 8) reasons.push('pertanyaan terlalu pendek/tidak jelas');
  if (seenStems.has(stemKey)) reasons.push('pertanyaan duplikat dalam batch');
  if (candidate.q.length > 220) reasons.push('pertanyaan terlalu panjang untuk MVP');
  if (candidate.why.length < 15) reasons.push('penjelasan terlalu pendek');
  if (/\b(kiri|kanan|paling kiri|paling kanan|sebelah kiri|sebelah kanan|kedua dari kanan|kedua dari kiri|posisi tengah|berada di antara angka)\b/i.test(candidate.why)) reasons.push('penjelasan terlalu bergantung pada posisi visual');
  if (guardrail?.required && !guardrail.required.test(candidate.q)) reasons.push('stem tidak cukup merepresentasikan skill target');
  if (guardrail?.forbidden && guardrail.forbidden.test(candidate.q)) reasons.push('stem bergeser ke skill lain');
  if (input.skill === 'nilai tempat ratusan-puluhan-satuan' && !candidate.o.every(o => /^(ratusan|puluhan|satuan|ribuan|tidak ada)$/i.test(o.trim()))) reasons.push('opsi nilai tempat harus berupa nama tempat');
  if (input.skill === 'mengurutkan bilangan' && /(melengkapi urutan|bertambah \d+|setiap langkah|setelah \d+ adalah)/i.test(`${candidate.q} ${candidate.why}`)) reasons.push('soal bergeser menjadi pola bilangan');
  if (new Set(candidate.o.map(normalizeText)).size !== 4) reasons.push('opsi tidak unik setelah normalisasi');
  if (candidate.o.some(option => !cleanString(option, 120))) reasons.push('ada opsi kosong');
  if (!reasons.length) seenStems.add(stemKey);
  return reasons;
}

function validateQuestions(payload, input) {
  const list = payload?.questions;
  if (!Array.isArray(list) || !list.length) throw new Error('Gemini tidak mengembalikan daftar soal');
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
    const reasons = lintCandidate(candidate, seenStems, input);
    if (reasons.length) {
      candidate.review_status = 'rejected-auto';
      rejected.push({ ...candidate, rejection_reasons: reasons });
    } else accepted.push(candidate);
  });
  return { accepted, rejected };
}

async function callGemini(input, curriculumMeta, env) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(input, curriculumMeta) }] }],
      generationConfig: { temperature: 0.42, responseMimeType: 'application/json', responseSchema: questionSchema }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error('Gemini gagal membuat soal.');
    error.status = response.status;
    try { error.detail = JSON.parse(detail)?.error?.message || detail; } catch { error.detail = detail; }
    throw error;
  }
  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini tidak mengembalikan konten.');
  return JSON.parse(text);
}

async function generateFromInput(input, curriculumMeta, env) {
  return validateQuestions(await callGemini(input, curriculumMeta, env), input);
}

async function generateQuestions(request, env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker.' }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body JSON tidak valid.' }, 400); }
  let input, curriculumMeta;
  try {
    input = validateInput(body);
    curriculumMeta = await validateAgainstCurriculum(request, env, input);
  } catch (error) { return json({ error: error.message }, 400); }
  try {
    const result = await generateFromInput(input, curriculumMeta, env);
    return json({ model: MODEL, curriculum: curriculumMeta, input, summary: { requested: input.count, accepted: result.accepted.length, rejected: result.rejected.length }, questions: result.accepted, rejected: result.rejected });
  } catch (error) {
    return json({ error: error.message || 'Hasil Gemini tidak lolos validasi.', status: error.status, detail: cleanString(error.detail || '', 500) }, 502);
  }
}

function grade3SelfTestRequest(request) {
  return new Request(request.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grade: 3, semester: 1, subject: 'Matematika', chapter_id: 'm3s1-01', chapter_title: 'Bilangan sampai 1.000', skill: 'nilai tempat ratusan-puluhan-satuan', difficulty: 1, count: 3 }) });
}

async function runGrade3Plan(request, env, plan, pilotName) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  const curriculum = await getCurriculum(request, env);
  const grade = curriculum?.grades?.['3'];
  const chapter = grade?.semesters?.['1']?.Matematika?.find(c => c.id === 'm3s1-01');
  if (!chapter) return json({ error: 'Bab pilot tidak ditemukan di curriculum v2.' }, 500);
  const results = [];
  let totalAccepted = 0, totalRejected = 0, totalRequested = 0;
  for (const item of plan) {
    const input = { grade: 3, semester: 1, subject: 'Matematika', chapterId: chapter.id, chapterTitle: chapter.title, skill: item.skill, difficulty: 1, count: item.count };
    totalRequested += item.count;
    try {
      const generated = await generateFromInput(input, { phase: grade.phase, confidence: chapter.confidence }, env);
      totalAccepted += generated.accepted.length;
      totalRejected += generated.rejected.length;
      results.push({ skill: item.skill, requested: item.count, accepted: generated.accepted, rejected: generated.rejected });
    } catch (error) { results.push({ skill: item.skill, error: error.message, status: error.status, detail: cleanString(error.detail || '', 300) }); }
  }
  return json({ ok: true, pilot: pilotName, model: MODEL, chapter: { id: chapter.id, title: chapter.title, confidence: chapter.confidence }, policy: { publish: false, auto_filter: ['format', 'duplicate', 'directional explanation', 'skill drift', 'strict place-value options', 'pattern-vs-ordering'], next_stage: 'human review then curate 8–12 live questions per skill' }, summary: { skills: plan.length, requested: totalRequested, accepted: totalAccepted, rejected: totalRejected }, results });
}

async function grade3Chapter1Pilot(request, env) {
  return runGrade3Plan(request, env, [
    { skill: 'membaca dan menulis bilangan', count: 6 },
    { skill: 'nilai tempat ratusan-puluhan-satuan', count: 6 },
    { skill: 'bentuk panjang', count: 6 },
    { skill: 'membandingkan bilangan', count: 6 },
    { skill: 'mengurutkan bilangan', count: 6 }
  ], 'grade3-math-chapter1-v3');
}

async function grade3QualityFill(request, env) {
  return runGrade3Plan(request, env, [
    { skill: 'membaca dan menulis bilangan', count: 5 },
    { skill: 'nilai tempat ratusan-puluhan-satuan', count: 12 },
    { skill: 'bentuk panjang', count: 4 },
    { skill: 'membandingkan bilangan', count: 8 },
    { skill: 'mengurutkan bilangan', count: 6 }
  ], 'grade3-math-chapter1-quality-fill');
}

async function listModels(env) {
  if (!env.GEMINI_API_KEY) return json({ error: 'GEMINI_API_KEY belum dikonfigurasi.' }, 503);
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', { headers: { 'x-goog-api-key': env.GEMINI_API_KEY } });
  if (!response.ok) return json({ error: 'Gagal mengambil daftar model Gemini.', status: response.status }, 502);
  const payload = await response.json();
  const models = (payload.models || []).filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => ({ name: m.name, displayName: m.displayName, methods: m.supportedGenerationMethods }));
  return json({ ok: true, configuredModel: MODEL, configuredModelAvailable: models.some(m => m.name === `models/${MODEL}`), models });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/ai/health') return json({ ok: true, provider: 'Gemini', model: MODEL, configured: Boolean(env.GEMINI_API_KEY) });
    if (url.pathname === '/api/ai/models' && request.method === 'GET') return listModels(env);
    if (url.pathname === '/api/ai/self-test' && request.method === 'GET') {
      const run = url.searchParams.get('run');
      if (run === 'grade3-place-value') return generateQuestions(grade3SelfTestRequest(request), env);
      if (run === 'grade3-chapter1') return grade3Chapter1Pilot(request, env);
      if (run === 'grade3-quality-fill') return grade3QualityFill(request, env);
      return json({ error: 'Self-test token tidak valid.' }, 403);
    }
    if (url.pathname === '/api/ai/generate-questions') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      return generateQuestions(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};