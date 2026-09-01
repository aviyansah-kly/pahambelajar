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
