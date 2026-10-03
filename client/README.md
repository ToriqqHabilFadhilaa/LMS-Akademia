# Akademia Client

Frontend aplikasi Akademia LMS, dibangun menggunakan React, TypeScript, dan Vite.

## Menjalankan aplikasi

```powershell
npm ci
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Backend API lokal secara default
diharapkan berjalan di `http://localhost:5000/api`.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan Vite dalam mode pengembangan |
| `npm run build` | Memeriksa TypeScript dan membuat build produksi |
| `npm run preview` | Menyajikan hasil build untuk pemeriksaan lokal |
| `npm run lint` | Menjalankan ESLint |

Konfigurasi URL API saat ini berada di `src/services/api.ts`. Untuk instruksi
menyiapkan database, backend, dan seluruh aplikasi, lihat
[README utama](../README.md).
