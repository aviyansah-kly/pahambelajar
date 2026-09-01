import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DATA = path.join(ROOT, 'public', 'data');
const GRADES = [1, 2, 3];
const SEMESTERS = [1, 2];
const MIN_PER_SKILL = 8;

const readJson = async file => JSON.parse(await fs.readFile(path.join(DATA, file), 'utf8'));
const norm = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

function validateQuestion(question, location) {
  const errors = [];
  if (!question || typeof question !== 'object') return [`${location}: question is not an object`];
  if (!question.id) errors.push(`${location}: missing id`);
  if (!question.skill) errors.push(`${location}: missing skill`);
  if (question.type !== 'choice') errors.push(`${location}: live MVP question type must be choice`);
  if (!Array.isArray(question.o) || question.o.length !== 4) errors.push(`${location}: must have exactly 4 options`);
  if (!Number.isInteger(question.a) || question.a < 0 || question.a > 3) errors.push(`${location}: answer index must be 0..3`);
  if (!question.q || String(question.q).trim().length < 8) errors.push(`${location}: weak/empty stem`);
  if (!question.why || String(question.why).trim().length < 12) errors.push(`${location}: weak/empty explanation`);
  if (Array.isArray(question.o) && new Set(question.o.map(norm)).size !== question.o.length) errors.push(`${location}: duplicate options`);
  if (question.review_status && question.review_status !== 'approved-auto') errors.push(`${location}: non-approved AI item present in live bank (${question.review_status})`);
  return errors;
}

function chapterQuestions(chapter) {
  return [...(chapter.practice || []), ...(chapter.quiz || [])];
}

function curriculumMathChapters(curriculum, grade, semester) {
  return curriculum?.grades?.[String(grade)]?.semesters?.[String(semester)]?.Matematika || [];
}

async function auditGrade(curriculum, grade) {
  const bankFile = `question-bank-math-g${grade}-v2.json`;
  let bank;
  try {
    bank = await readJson(bankFile);
  } catch (error) {
    return { grade, bank: bankFile, exists: false, ready: false, errors: [`missing ${bankFile}`], chapters: [] };
  }

  const errors = [];
  const rows = [];
  const bankChapters = bank.chapters || {};
  const ids = new Set();

  for (const semester of SEMESTERS) {
    for (const expected of curriculumMathChapters(curriculum, grade, semester)) {
      const chapter = Object.values(bankChapters).find(item => item?.chapter_id === expected.id);
      if (!chapter) {
        rows.push({ semester, id: expected.id, title: expected.title, ready: false, reason: 'missing chapter in live bank' });
        continue;
      }

      const questions = chapterQuestions(chapter);
      const perSkill = Object.fromEntries((expected.skills || []).map(skill => [skill, 0]));
      const chapterErrors = [];

      questions.forEach((question, index) => {
        const location = `g${grade}/${expected.id}/${question.id || index}`;
        chapterErrors.push(...validateQuestion(question, location));
        if (question.id) {
          if (ids.has(question.id)) chapterErrors.push(`${location}: duplicate id across grade bank`);
          ids.add(question.id);
        }
        if (Object.prototype.hasOwnProperty.call(perSkill, question.skill)) perSkill[question.skill] += 1;
        else chapterErrors.push(`${location}: skill not listed in curriculum chapter`);
      });

      const shortages = Object.entries(perSkill)
        .filter(([, count]) => count < MIN_PER_SKILL)
        .map(([skill, count]) => ({ skill, count, minimum: MIN_PER_SKILL }));
      rows.push({
        semester,
        id: expected.id,
        title: expected.title,
        question_count: questions.length,
        skills: perSkill,
        shortages,
        errors: chapterErrors,
        ready: shortages.length === 0 && chapterErrors.length === 0
      });
      errors.push(...chapterErrors);
    }
  }

  const expectedIds = new Set(SEMESTERS.flatMap(semester => curriculumMathChapters(curriculum, grade, semester).map(ch => ch.id)));
  for (const chapter of Object.values(bankChapters)) {
    if (chapter?.chapter_id && !expectedIds.has(chapter.chapter_id)) errors.push(`g${grade}/${chapter.chapter_id}: chapter not present in core curriculum`);
  }

  return { grade, bank: bankFile, exists: true, ready: rows.length > 0 && rows.every(row => row.ready) && errors.length === 0, errors, chapters: rows };
}

const curriculum = await readJson('core-curriculum-v2.json');
const grades = [];
for (const grade of GRADES) grades.push(await auditGrade(curriculum, grade));

const summary = {
  grades: GRADES.length,
  grades_ready: grades.filter(item => item.ready).length,
  chapters_expected: grades.reduce((sum, item) => sum + item.chapters.length, 0),
  chapters_ready: grades.reduce((sum, item) => sum + item.chapters.filter(ch => ch.ready).length, 0),
  minimum_questions_per_skill: MIN_PER_SKILL,
  ready_for_grade_1_3_testing: grades.every(item => item.ready)
};

console.log(JSON.stringify({ ok: true, summary, grades }, null, 2));
if (!summary.ready_for_grade_1_3_testing) process.exitCode = 1;
