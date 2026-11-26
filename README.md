# Hugo Starter (Minimal)

Starter paling ringkas untuk situs **satu halaman** dengan **Hugo + Tailwind CSS v4 + Alpine.js**. Tidak ada menu, pencarian, blog, atau tema terpisah: cuma beranda yang isinya kamu tulis sendiri.

## Kebutuhan

- [Hugo](https://gohugo.io/installation/) versi extended (CI memakai 0.164.0)
- Node.js 20+

## Mulai

```bash
npm install     # sekali saja, lalu commit package-lock.json
npm start       # Tailwind (watch) + hugo server
```

Buka http://localhost:1313 dan edit **`content/_index.md`**. Itu satu-satunya halaman: Hugo memakai nama `_index.md` untuk beranda, jadi tidak bisa dinamai `home.md`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Tailwind watch + `hugo server`. Argumen tambahan diteruskan ke Hugo: `npm start -- --port 1314` |
| `npm run build` | Build CSS Tailwind (minify) ke `assets/css/output.css` |
| `npm run check` | Sebelum publish: build CSS + build Hugo percobaan + periksa hasilnya (title, CSS, JS, tautan rusak) |

`output.css` tidak di-commit; dibuat oleh `npm start` / `npm run build` dan oleh GitHub Actions.

## Struktur

```
hugo.toml              konfigurasi (judul, baseURL, bahasa)
content/_index.md      isi beranda (Markdown, boleh HTML + class Tailwind + atribut Alpine)
layouts/baseof.html    kerangka HTML: <head>, CSS, JS
layouts/home.html      isi <main> beranda
assets/css/input.css   sumber Tailwind
assets/js/main.js      memulai Alpine
static/favicon.svg     ganti dengan ikonmu
scripts/               dev.mjs (npm start), check.mjs
.github/workflows/     deploy GitHub Pages
```

## Memakai Tailwind dan Alpine

HTML mentah diizinkan di Markdown, jadi langsung tulis di `content/_index.md`:

```html
<div x-data="{ count: 0 }" class="not-prose mt-6 flex items-center gap-3">
  <button @click="count++" class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
    Klik saya
  </button>
  <span x-text="count"></span>
</div>
```

Plugin Alpine (mis. `@alpinejs/collapse`): `npm i @alpinejs/collapse`, lalu di `assets/js/main.js` tambahkan `import collapse from '@alpinejs/collapse'` dan `Alpine.plugin(collapse)` sebelum `Alpine.start()`.

## Catatan

- **Dark mode** mengikuti pengaturan sistem (`dark:` bawaan Tailwind). Untuk toggle manual berbasis class `.dark`, tambahkan `@custom-variant dark (&:where(.dark, .dark *));` di `input.css`.
- **Gaya Markdown** memakai plugin `@tailwindcss/typography` (class `prose` di `home.html`). Tidak butuh? Hapus plugin di `package.json`, baris `@plugin` di `input.css`, dan class `prose` di `home.html`.
- **Menambah halaman/blog**: hapus `"section"` dari `disableKinds` di `hugo.toml`, buat `layouts/page.html` (dan `layouts/section.html` untuk daftar), lalu tambahkan berkas di `content/`.
- **Judul, deskripsi, bahasa**: `hugo.toml` dan front matter `content/_index.md`.

## Deploy (GitHub Pages)

1. Ubah `baseURL` di `hugo.toml`.
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. Push ke branch `main`. Workflow: install dependensi → build CSS → build Hugo → deploy.

## Lisensi

[MIT](LICENSE). Ganti nama pemegang hak cipta jika perlu.
