# PahamBelajar

PahamBelajar adalah prototype aplikasi belajar anak SD/MI/SDIT yang saat ini difokuskan pada **Matematika** dan **Bahasa Inggris**.

## Curriculum model

- Active subjects: Matematika + Bahasa Inggris
- Grades: 1–6
- Phases: A (1–2), B (3–4), C (5–6)
- Primary structure: Kelas → Semester → Bab → Skills → Latihan/Tes
- Source of truth: Capaian Pembelajaran nasional
- Chapter organization: triangulasi buku pemerintah, buku penerbit komersial, dan praktik sekolah umum
- Mapel lain tetap disimpan di `public/data/curriculum-v1.json` dan hanya di-hide dari UI
- Active core map: `public/data/core-curriculum-v2.json`

Urutan bab di PahamBelajar adalah struktur produk, bukan urutan nasional yang diwajibkan. Confidence metadata dipakai untuk membedakan bab yang tervalidasi kuat dengan topik yang masih bersifat general mapping.

## Question model

Soal tidak boleh lagi dibuat hanya berdasarkan kelas atau tipe materi umum. Setiap soal harus dapat ditelusuri ke:

`Grade → Chapter → Skill → Difficulty → Question`

Pilot Kelas 3 disimpan di `public/data/question-bank-math-g3-v2.json`.

Setiap soal publish minimal memiliki:

- stable question id
- skill
- difficulty
- tipe soal
- jawaban benar
- penjelasan singkat dan ramah anak (`why`)

Math engine menampilkan penjelasan setelah setiap jawaban, baik jawaban benar maupun salah, agar anak memahami alasan di balik jawabannya.

## AI-assisted question generation

AI digunakan sebagai **content production assistant**, bukan sumber kurikulum atau sumber kebenaran matematika. Kontrak generasi disimpan di `public/data/ai-question-generation-spec.json`.

Flow yang direkomendasikan:

`Curriculum v2 → Skill → deterministic constraints → AI candidate generation → validation → Question Bank → App`

Untuk Matematika gunakan pendekatan hybrid:

- code menentukan angka, operasi, jawaban benar, range, dan difficulty
- AI membantu wording, konteks soal cerita, distractor, dan penjelasan ramah anak
- hasil AI wajib divalidasi sebelum masuk question bank publish

Gemini API cocok digunakan pada tahap development untuk structured JSON generation. API key tidak boleh ditaruh di browser; integrasi berikutnya harus melalui server-side/admin workflow.

## Runtime files

- `public/index.html` — home/profile/chapter navigation
- `public/fun-theme.css` — active visual theme
- `public/data/core-curriculum-v2.json` — active Math + English curriculum map
- `public/data/curriculum-v1.json` — legacy/fallback curriculum dan hidden subjects
- `public/data/question-bank-math-g3-v2.json` — curated Grade 3 Math pilot question bank
- `public/data/ai-question-generation-spec.json` — schema dan guardrail AI generation
- `public/math-engine-v2.js` — Math lesson/practice/test renderer
- `public/data/math-content-v1.json` — existing Math module routing

MVP tetap static/serverless-friendly dan belum membutuhkan database.