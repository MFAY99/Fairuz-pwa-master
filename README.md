# Cyclone Separator Pro (PWA)

Aplikasi web untuk simulasi desain cyclone separator dengan visualisasi 3D, perhitungan efisiensi, pressure drop, dan penyimpanan riwayat lokal.

## Ringkasan

- Platform: Web + Progressive Web App (PWA)
- Bahasa UI: Indonesia
- Offline mode: Ya (setelah app shell ter-cache)
- Penyimpanan data: IndexedDB (lokal browser)
- Entry point: `index.html`

## Fitur Utama

- Simulasi 3D cyclone (Three.js)
- Mode desain standar dan manual
- Perhitungan:
  - Efisiensi
  - Cut point (d50)
  - Pressure drop (S&L, Barth, Stairmand)
- History perhitungan:
  - Simpan
  - Load
  - Delete
  - Compare
  - Export/Import Excel
- Install app (PWA) di desktop dan mobile
- Dukungan offline dengan Service Worker

## Struktur Project

```text
.
|- index.html
|- sw.js
|- offline.html
|- manifest.webmanifest
|- netlify.toml
|- serve.json
|- assets/
|  |- tailwind.css
|- vendor/
|  |- three.min.js
|  |- OrbitControls.js
|- icons/
|  |- icon-192.png
|  |- icon-512.png
|  |- screenshot-wide.png
|  |- screenshot-mobile.png
|- tailwind-input.css
|- tailwind.config.cjs
```

## Prasyarat

- Browser modern (Chrome/Edge/Firefox)
- Node.js 18+ (opsional, jika ingin pakai `npx serve`)

## Cara Menjalankan (Lokal)

## Opsi 1 (Disarankan): `serve`

```bash
npx serve . -l 3000
```

Lalu buka:

```text
http://localhost:3000/
```

Catatan:

- Jangan buka via `file://` karena Service Worker tidak aktif.
- `serve.json` sudah menyiapkan rewrite legacy route (`/aplikasi` dan `/aplikasi.html`) ke `index.html`.

## Opsi 2: Python HTTP server

```bash
python -m http.server 3000
```

Buka:

```text
http://localhost:3000/
```

## Cara Install Sebagai App (PWA)

1. Jalankan app via `http://localhost:3000/` atau domain HTTPS.
2. Tunggu loading selesai.
3. Klik tombol `Install / Download` di header.
4. Ikuti prompt browser.

Jika tombol install tidak muncul:

- Browser belum mendukung prompt install di kondisi saat itu.
- App sudah ter-install.
- Site belum memenuhi syarat install (cek console + Application tab di DevTools).

## Cara Uji Offline

1. Buka app saat online (sekali) agar app shell ter-cache.
2. Buka DevTools -> Application -> Service Workers, pastikan `sw.js` aktif.
3. Buka DevTools -> Network -> centang `Offline`.
4. Reload halaman, app tetap harus berjalan.

Catatan:

- Fitur Excel memakai SheetJS dari CDN (`https://cdn.sheetjs.com/...`).
- Jika script CDN belum sempat ter-load, fitur Excel bisa tidak tersedia saat offline.
- Core app tetap berjalan offline.

## Penyimpanan Data

- Data history disimpan di IndexedDB browser.
- Data tetap ada saat refresh normal.
- Data hilang jika user melakukan `Clear Site Data`/hapus data situs.

## Deploy ke Netlify

Project sudah siap deploy tanpa build step.

## Cara 1: Drag and Drop

1. Zip isi folder project.
2. Buka Netlify -> `Add new site` -> `Deploy manually`.
3. Drag & drop zip/folder.

## Cara 2: GitHub Connected Deploy

1. Push repo ke GitHub.
2. Hubungkan repo di Netlify.
3. Build settings:
   - Build command: (kosong)
   - Publish directory: `.`

`netlify.toml` sudah mengatur:

- Redirect `/aplikasi` dan `/aplikasi.html` ke `/`
- Header cache untuk static assets
- Header khusus `sw.js` agar update lebih cepat terdeteksi

## Update Aplikasi dan Cache

Jika ada perubahan file penting app shell:

1. Update kode sesuai kebutuhan.
2. Naikkan versi cache di `sw.js`:
   - `APP_SHELL_CACHE`
   - `RUNTIME_CACHE`
3. Deploy ulang.

Jika user masih melihat versi lama:

- Hard refresh (`Ctrl+F5`)
- Atau update/unregister Service Worker dari DevTools

## Rebuild CSS (Opsional)

Jika ingin regenerate `assets/tailwind.css` dari source:

```bash
npx tailwindcss -i ./tailwind-input.css -o ./assets/tailwind.css --minify
```

## Troubleshooting Singkat

- `ERR_FAILED` saat buka route:
  - Pastikan akses dari `/` (bukan file path lokal)
  - Jalankan lewat HTTP server
- Perubahan UI tidak muncul:
  - Kemungkinan cache Service Worker lama, lakukan hard refresh
- Install PWA tidak muncul:
  - Coba browser Chromium terbaru
  - Pastikan buka lewat localhost/HTTPS
- Excel import/export gagal:
  - Cek koneksi internet saat load awal (untuk CDN SheetJS)

## Lisensi

-
