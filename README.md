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

`Grade → Semester → Chapter → Skill → Difficulty → Question`

Pilot Kelas 3 disimpan di `public/data/question-bank-math-g3-v2.json`. Target build Matematika Kelas 1–3 Semester 1–2 dicatat di `public/data/math-bank-build-plan-v1.json`.

Setiap soal publish minimal memiliki:

- stable question id
- skill yang ada pada chapter curriculum aktif
- difficulty
- tipe soal
- tepat satu jawaban benar
- penjelasan singkat dan ramah anak (`why`)

Math engine menampilkan penjelasan setelah setiap jawaban, baik jawaban benar maupun salah, agar anak memahami alasan di balik jawabannya.

## Practice session UX

Siswa dapat menentukan sendiri jumlah soal **Latihan** sebelum mulai. Pilihan jumlah otomatis menyesuaikan kapasitas bank, menggunakan opsi seperti 5, 10, 15, 20, atau seluruh soal yang tersedia. Soal dipilih secara acak untuk setiap sesi sehingga latihan berikutnya tidak selalu identik.

Pilihan jumlah soal hanya memengaruhi tab **Latihan**. Tes tetap memakai set quiz yang sudah dikurasi agar hasil antar-sesi dapat dibandingkan dengan lebih konsisten.

## AI-assisted question generation

AI digunakan sebagai **content production assistant**, bukan sumber kurikulum atau sumber kebenaran matematika. Kontrak generasi disimpan di `public/data/ai-question-generation-spec.json`.

Pipeline preview:

`Curriculum v2 → Gemini 3.1 Flash-Lite generator → deterministic math/format validator → Gemini 3.5 Flash reviewer → approved-auto candidate → curated Question Bank → App`

Untuk Matematika gunakan pendekatan hybrid:

- code menangani constraint yang dapat diperiksa deterministically, termasuk format, opsi, answer index, nilai tempat tertentu, dan ekuivalensi bentuk panjang
- Gemini 3.1 Flash-Lite membuat candidate question dalam volume tinggi
- Gemini 3.5 Flash melakukan second-pass review untuk mathematical correctness, skill drift, ambiguity, explanation, language, dan kualitas pedagogis
- output AI tidak boleh disajikan langsung ke anak
- hanya candidate yang melewati quality gate yang boleh dipilih untuk live bank

`GEMINI_API_KEY` disimpan sebagai Cloudflare Runtime Secret dan tidak boleh ditaruh di browser atau repository.

### Quality target

Target minimum sebelum sebuah skill dianggap siap dikurasi adalah **8 `approved-auto` questions per skill**. Bank final dapat memilih sekitar 8–10 pertanyaan terbaik per skill dengan menjaga variasi stem, difficulty, dan coverage konsep.

Repetisi struktur tidak otomatis dianggap kegagalan jika memang sifat skill membutuhkan pola yang konsisten, misalnya identifikasi ratusan/puluhan/satuan. Yang harus tetap bervariasi adalah angka, posisi digit, konteks yang relevan, dan coverage konsep; kesalahan matematika, ambiguity, dan skill drift tetap menjadi hard failure.

## Deterministic bank audit

Gunakan audit repository sebelum sebuah bank dinyatakan siap testing:

```bash
node scripts/audit-math-banks.mjs
```

Audit tersebut membandingkan bank Matematika Kelas 1–3 terhadap `core-curriculum-v2.json` dan memeriksa:

- seluruh chapter Semester 1 dan 2 tersedia
- seluruh skill curriculum memiliki minimal 8 pertanyaan
- setiap multiple-choice question memiliki tepat 4 opsi dan answer index valid
- tidak ada duplicate question id
- skill pada soal benar-benar terdaftar pada chapter
- explanation tidak kosong
- AI item dengan status selain `approved-auto` tidak masuk live bank

Audit keluar dengan non-zero exit code selama coverage belum lengkap, sehingga aman dipakai sebagai quality gate CI kemudian hari.

## Development endpoints

- `GET /api/ai/health`
- `POST /api/ai/generate-questions`
- `GET /api/ai/models` — diagnostic only
- `GET /api/ai/quality-report?run=grade3-chapter1` — compact generation + AI-review report untuk pilot Bab 1 Kelas 3
- tambahkan `&details=1` hanya saat perlu melihat candidate/review detail

Diagnostic endpoints hanya untuk preview/development. Mereka bukan API production dan harus dihapus atau diproteksi sebelum public production launch.

## Runtime files

- `public/index.html` — home/profile/chapter navigation
- `public/fun-theme.css` — active visual theme
- `public/data/core-curriculum-v2.json` — active Math + English curriculum map
- `public/data/curriculum-v1.json` — legacy/fallback curriculum dan hidden subjects
- `public/data/question-bank-math-g3-v2.json` — curated Grade 3 Math pilot question bank
- `public/data/math-bank-build-plan-v1.json` — coverage/build plan Matematika Kelas 1–3 Semester 1–2
- `public/data/ai-question-generation-spec.json` — schema dan guardrail AI generation/review
- `public/math-engine-v2.js` — Math lesson/practice/test renderer + practice count selector
- `public/data/math-content-v1.json` — existing Math module routing
- `scripts/audit-math-banks.mjs` — deterministic curriculum/bank coverage audit
- `worker.js` — server-side Gemini generator, deterministic validation, AI reviewer, dan diagnostics

MVP tetap static/serverless-friendly dan belum membutuhkan database.
