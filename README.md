# PahamBelajar

Aplikasi belajar interaktif berbasis bab dan peta konsep untuk siswa SD/MI.

## Struktur

- `public/index.html` — aplikasi utama
- `public/_headers` — header keamanan Cloudflare Pages

## Cloudflare Pages

Gunakan konfigurasi berikut:

- Production branch: `main`
- Framework preset: `None`
- Build command: `exit 0`
- Build output directory: `public`

Setelah repository dihubungkan ke Cloudflare Pages, setiap push ke branch `main` akan memicu deployment otomatis.
