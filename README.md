# Akademia LMS

**Akademia** adalah aplikasi Learning Management System untuk mendukung kegiatan
akademik mahasiswa, dosen, dan administrator. Aplikasi menyediakan pengelolaan
kelas, materi, tugas, ujian, penilaian, pemantauan, dan hasil belajar dalam satu
platform.

> Aplikasi ini masih dikembangkan. Sesuaikan konfigurasi, kredensial, dan
> pengaturan deployment sebelum digunakan di lingkungan produksi.

## Fitur

### Mahasiswa

- Melihat dashboard dan course yang diikuti.
- Mengakses materi dan tugas, serta mengirim submission.
- Mengikuti ujian, melihat riwayat attempt, hasil, dan profil.
- Menerima pemantauan berbasis sinyal browser selama ujian.

### Dosen

- Mengelola course, mahasiswa, bank soal, dan ujian.
- Memantau attempt ujian dan menilai jawaban manual.
- Melihat hasil serta laporan course dan ujian.

### Administrator

- Mengelola pengguna, course, course offering, dan ujian.
- Mengelola bank soal, monitoring, dan laporan.

### Catatan pemantauan ujian

Pemantauan proctoring pada browser mencatat sinyal aktivitas perangkat dan
browser. Sinyal tersebut dapat keliru atau dimanipulasi, sehingga bukan bukti
pelanggaran yang terverifikasi dan tidak menggantikan pengawasan manusia.

## Teknologi

- **Frontend:** React 19, TypeScript, Vite, React Router, Axios, Tailwind CSS.
- **Backend:** Node.js, Express 5, TypeScript, Zod.
- **Database:** PostgreSQL, Prisma ORM, dan PostgreSQL driver adapter.
- **Autentikasi:** JWT dan bcrypt.

## Struktur proyek

```text
.
├── client/                 # Aplikasi React
├── server/
│   ├── prisma/             # Skema dan migrasi database
│   ├── src/modules/        # Fitur backend per domain
│   ├── src/middleware/     # Middleware Express
│   └── src/config/         # Konfigurasi koneksi database
└── README.md
```

Backend mengelompokkan routes, controllers, services, dan validators di dalam
modul domain seperti `users`, `courses`, `exams`, dan `exam-attempts`.

## Persyaratan

- Node.js yang mendukung dependency proyek.
- npm.
- PostgreSQL yang dapat diakses backend.

## Menjalankan secara lokal

### 1. Konfigurasi backend

Dari PowerShell:

```powershell
cd server
Copy-Item .env.example .env
```

Isi nilai lokal yang sesuai di `server/.env`. Jangan membagikan atau meng-commit
file `.env`.

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret acak yang kuat untuk menandatangani token |
| `PORT` | Port backend; default `5000` |
| `CLIENT_URL` | Origin frontend yang diizinkan CORS; default `http://localhost:5173` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Identitas admin untuk seed |
| `LECTURER_NAME`, `LECTURER_EMAIL`, `LECTURER_PASSWORD` | Identitas dosen untuk seed |

### 2. Instalasi backend dan database

```powershell
npm ci
npx prisma generate
npx prisma migrate dev
```

`migrate dev` menerapkan migrasi yang tersedia dan dapat membuat migrasi baru
untuk perubahan skema dalam pengembangan. Untuk menerapkan migrasi yang sudah
ada tanpa membuat migrasi baru, gunakan `npx prisma migrate deploy`.

Seed akun admin dan dosen bersifat opsional:

```powershell
npm run db:seed
```

Perintah seed memerlukan semua variabel `ADMIN_*` dan `LECTURER_*` di atas.
Gunakan password lokal yang kuat.

### 3. Jalankan backend

Di terminal `server`:

```powershell
npm run dev
```

Pemeriksaan API dan koneksi database tersedia di
`http://localhost:5000/api/health`.

### 4. Jalankan frontend

Buka terminal baru:

```powershell
cd client
npm ci
npm run dev
```

Buka `http://localhost:5173`. URL API frontend saat ini ditetapkan di
`client/src/services/api.ts` sebagai `http://localhost:5000/api`; perbarui
konfigurasi tersebut sesuai lingkungan deployment.

## Perintah pengembangan

| Direktori | Perintah | Kegunaan |
| --- | --- | --- |
| `client` | `npm run dev` | Menjalankan frontend |
| `client` | `npm run build` | Type-check dan build frontend |
| `client` | `npm run lint` | Menjalankan ESLint |
| `client` | `npm run preview` | Preview build frontend |
| `server` | `npm run dev` | Menjalankan backend dengan watch mode |
| `server` | `npm run build` | Type-check/build backend TypeScript |
| `server` | `npm start` | Menjalankan hasil kompilasi backend |
| `server` | `npm run db:seed` | Membuat atau memperbarui akun admin dan dosen |

## SEO dan domain publik

Frontend menyertakan metadata dasar berbahasa Indonesia untuk judul aplikasi,
deskripsi, tema, Open Graph, dan Twitter Cards. Aplikasi saat ini merupakan LMS
dengan area yang memerlukan login; halaman dashboard dan data akademik bukan
halaman publik. Setelah domain deployment ditentukan, tambahkan URL canonical,
URL gambar sosial absolut, dan konfigurasi sitemap/robots yang sesuai dengan
halaman publik yang benar-benar tersedia.

## Keamanan dan data

- Simpan secret, password, dan connection string hanya di environment lokal atau
  secret manager deployment.
- Jangan menggunakan akun seed atau secret development sebagai kredensial
  production.
- Periksa kontrol akses dan konfigurasi server sebelum deployment publik.
- Sinyal proctoring browser tidak menjamin integritas perangkat atau identitas
  pengguna.

## Lisensi

Belum ada file lisensi di repositori ini. Hak penggunaan dan distribusi perlu
ditentukan oleh pemilik proyek.
