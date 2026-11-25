<div align="center">

# AESTHE

**Digital Art Showcase, Curated Challenges & Creative Community Platform**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-0F172A?style=for-the-badge&logo=tailwind-css&logoColor=38BDF8)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

*Ruang pamer digital bergaya **Luxury Dark Editorial** bagi kreator visual, kurator pameran, dan penikmat seni modern.*

</div>

---

![Aesthe Homepage](https://i.ibb.co.com/nsM3GNVy/home.png)

---

## Deskripsi Proyek

**Aesthe** adalah platform showcase karya seni digital berbasis web yang dirancang dengan estetika *luxury dark mode*, tipografi editorial (`Instrument Serif` & `Geist`), serta pengalaman galeri imersif. Platform ini menghubungkan **kreator visual (Member)**, **penyelenggara kompetisi seni (Curator)**, **administrator platform (Admin)**, dan **pengunjung publik (Public User)** dalam satu ekosistem terintegrasi.

Pengguna dapat mempublikasikan karya digital, menyusun *moodboards* koleksi pribadi, berinteraksi melalui reaksi ekspresif, komentar, dan pesan langsung (*Direct Messages*), hingga berpartisipasi dalam kompetisi seni terkurasi lengkap dengan sistem penjurian dan **Hall of Fame Podium Top 3**.

---

## Preview Antarmuka

Tangkapan layar diambil langsung dari aplikasi yang berjalan pada resolusi desktop **`1440×900`**.

| Halaman | Preview |
| :--- | :---: |
| **Explore Gallery**<br>Galeri masonry lintas kategori, pencarian cepat, *Featured Creator Spotlight*, dan *Exhibition Slideshow Mode*. | ![Explore Gallery](https://i.ibb.co.com/ynZ0TcBP/explore.png) |
| **Artwork Detail**<br>Tampilan karya resolusi penuh, *Museum Lightbox* (zoom & pan), 5 reaksi ekspresif, favorit, diskusi komentar, dan fitur pelaporan. | ![Artwork Detail](https://i.ibb.co.com/7dzsdzFR/artwork-detail.png) |
| **Challenge Leaderboard**<br>Detail kompetisi, aturan & hadiah, podium resmi Juara #1 (Gold), #2 (Silver), #3 (Bronze), serta daftar submisi peserta. | ![Challenge Leaderboard](https://i.ibb.co.com/nMp9RdF0/challenge-leaderboard.png) |
| **Curator Studio Dashboard**<br>Manajemen kompetisi (*Create / Edit / Delete*), pemantauan submisi peserta, dan penentuan pemenang Top 3 secara transaksional. | ![Curator Studio Dashboard](https://i.ibb.co.com/93YX3WB9/curator-dashboard.png) |
| **Admin Control Panel**<br>Ringkasan metrik platform, verifikasi pendaftar Curator (*Approve / Reject*), moderasi laporan karya, serta manajemen kategori & pengguna. | ![Admin Control Panel](https://i.ibb.co.com/PvLLqfbB/admin-dashboard.png) |

---

## Tech Stack

| Lapisan | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | **Next.js `16.4.6`** | App Router, Turbopack, Server Actions, API Routes, dan Proxy Middleware (`src/proxy.js`) |
| **UI Library** | **React `19.3.0`** | Server Components, Client Components, `useActionState`, `useOptimistic` |
| **Styling & Tipografi** | **Tailwind CSS `4.3.3`** | `@tailwindcss/turbopack`, palet *obsidian & champagne gold*, Google Fonts (`Instrument Serif`, `Geist`, `Geist Mono`) |
| **Smooth Scrolling** | **Lenis `1.3.28`** | Scroll halus dengan kontrol *scroll-lock* ref-counted untuk modal & lightbox |
| **Database** | **PostgreSQL 14+** (`pg` `8.23.1`) | Parameterized Raw SQL (`$1`, `$2`, ...), singleton connection pool, dan helper transaksi (`withTransaction`) tanpa ORM |
| **Autentikasi & Keamanan** | **`jose` `6.2.18`** + **`bcryptjs` `3.0.3`** | JWT (`HS256`) tersimpan di HTTP-only cookie (`aesthe_session`), verifikasi sesi langsung ke database, token reset sandi sekali pakai, dan validasi *magic bytes* unggahan file |
| **Code Quality** | **ESLint `9`** + `eslint-config-next` | Konfigurasi flat config dengan aturan `no-undef: error` |

---

## Fitur per Role

### 1. Public User (Guest / Pengunjung Publik)
- **Jelajah Galeri Terbuka:** Mengakses halaman `/home`, `/explore`, `/artworks/[id]`, `/challenges`, `/challenges/[id]`, dan portofolio publik kreator di `/creators/[username]` tanpa wajib login.
- **Filter & Pencarian Cepat:** Mencari karya/kreator lewat *Command Palette* (`Ctrl+K`) dan memfilter galeri berdasarkan kategori maupun urutan (*Populer* / *Terbaru*).
- **Museum Lightbox & Exhibition Mode:** Menikmati karya layar penuh dengan zoom/pan atau mode pameran slideshow otomatis.
- **Auth Gate Ramah:** Aksi interaktif (reaksi, favorit, komentar, follow, kirim pesan, ikut challenge) akan memunculkan ajakan masuk yang mengarah langsung ke form login (`/?step=login`).

### 2. Member (Kreator)
- **Publikasi & Kelola Karya:** Mengunggah karya gambar lokal (tersimpan di `public/uploads/` dengan validasi *magic bytes* PNG/JPEG/WebP/GIF) lengkap dengan judul, deskripsi, kategori, dan tag; serta mengedit atau menghapus karya sendiri.
- **Apresiasi & Interaksi Sosial:** Memberikan 5 pilihan reaksi ekspresif (`❤️ Love`, `😮 Wow`, `🔥 Fire`, `✧ Inspire`, `👏 Applause`), berkomentar di halaman karya, melaporkan karya bermasalah, dan mengikuti (*Follow*) kreator lain.
- **Favorites & Moodboards (Collections):** Menyimpan karya favorit dan mengelompokkannya ke dalam folder *Moodboard* kustom di `/favorites`.
- **Kompetisi Seni (Challenges):** Mengirimkan maksimal 1 karya per kompetisi yang sedang berlangsung (*Ongoing*) serta menarik kembali submisi sebelum batas waktu berakhir.
- **Direct Messages (`/messages`):** Percakapan privat antar pengguna dengan sinkronisasi *polling* berkala, indikator pesan belum dibaca, dan tampilan responsif mobile/desktop.
- **Manajemen Profil (`/profile`):** Memperbarui nama tampilan, username, bio, tautan eksternal, foto avatar, email (dengan verifikasi kata sandi saat ini), serta penggantian kata sandi.

### 3. Curator (Kurator Pameran)
- **Status Akun Terverifikasi:** Mendaftar sebagai Curator akan masuk ke status `Pending` (`/pending-curator`) hingga diverifikasi oleh Admin (`Approved` atau `Rejected`).
- **Curator Studio (`/curator`):** Membuat, menyunting, dan menghapus event *Challenge* lengkap dengan deskripsi, peraturan, hadiah, jadwal mulai/berakhir (sadar zona waktu lokal), dan banner.
- **Penjurian & Penentuan Pemenang:** Melihat daftar karya peserta yang masuk dan menetapkan Juara **#1 (Gold)**, **#2 (Silver)**, serta **#3 (Bronze)** secara atomik (terlindungi transaksi database & unique partial index) setelah periode submisi berakhir. Pemenang otomatis tampil di **Curator's Challenge Podium** pada `/home`.
- **Akses Fitur Member:** Tetap dapat menjelajah galeri, berinteraksi, dan berkirim pesan dengan komunitas.

### 4. Admin (Administrator)
- **Admin Control Panel (`/admin`):** Dashboard ringkasan statistik menyeluruh (total pengguna, karya, kompetisi aktif, pendaftar kurator pending, dan antrean laporan).
- **Verifikasi Curator:** Menyetujui (*Approve*) atau menolak (*Reject*) pengajuan akun Curator baru secara real-time.
- **Moderasi Konten:** Meninjau laporan karya dari komunitas, lalu memilih untuk mengabaikan laporan (*Dismiss*) atau menghapus karya yang melanggar (*Resolve & Delete*).
- **Manajemen Kategori & Pengguna:** Menambah, mengubah nama, atau menghapus kategori karya (dengan proteksi jika masih digunakan karya), serta mengelola daftar pengguna dan membersihkan file unggahan terkait saat akun dihapus.

---

## Struktur Direktori (`src/app`)

```text
src/app/
├── api/
│   ├── categories/route.js        # Endpoint daftar kategori karya
│   ├── messages/route.js          # Endpoint riwayat & polling Direct Messages
│   └── search/route.js            # Endpoint pencarian cepat (Command Palette)
├── admin/
│   ├── loading.jsx
│   └── page.jsx                   # Admin Control Panel (khusus role Admin)
├── artworks/[id]/
│   ├── loading.jsx
│   └── page.jsx                   # Detail karya, reaksi, komentar & Lightbox
├── challenges/
│   ├── loading.jsx
│   ├── page.jsx                   # Daftar kompetisi (Ongoing, Upcoming, Ended)
│   └── [id]/
│       ├── loading.jsx
│       └── page.jsx               # Detail challenge, submisi & Leaderboard Top 3
├── creators/[username]/
│   ├── loading.jsx
│   └── page.jsx                   # Portofolio publik kreator
├── curator/
│   ├── loading.jsx
│   └── page.jsx                   # Curator Studio (khusus Curator Approved)
├── explore/
│   ├── loading.jsx
│   └── page.jsx                   # Galeri Masonry & Featured Creator Spotlight
├── favorites/
│   ├── loading.jsx
│   └── page.jsx                   # Karya favorit & Moodboards/Collections
├── home/
│   ├── loading.jsx
│   └── page.jsx                   # Beranda utama, Podium Top 3 & Notifikasi
├── messages/
│   ├── loading.jsx
│   └── page.jsx                   # Halaman Direct Messages
├── pending-curator/
│   └── page.jsx                   # Status verifikasi Curator (Pending/Rejected)
├── profile/
│   ├── loading.jsx
│   └── page.jsx                   # Pengaturan profil, karya & riwayat challenge
├── error.jsx                      # Global Error Boundary
├── globals.css                    # Tema Luxury Dark & utility classes
├── layout.js                      # Root layout, Google Fonts & global providers
├── loading.jsx                    # Global fallback skeleton
├── not-found.jsx                  # Halaman 404 kustom
├── page.js                        # Landing cinematic, Login, Register & Reset Sandi
└── template.js                    # Transisi antar halaman
```

---

## Skema & Setup Database (`database_aesthe.sql`)

Skema PostgreSQL pada [database_aesthe.sql](./database_aesthe.sql) terdiri dari **13 tabel relasional** beserta **15 index performa & integritas**:

- **Inti & Konten:** `users`, `categories`, `artworks`
- **Interaksi & Koleksi:** `artwork_reactions`, `favorites`, `collections`, `collection_items`, `comments`, `reports`
- **Kompetisi & Penjurian:** `challenges`, `challenge_submissions` (dengan *partial unique index* `idx_submissions_unique_winner_rank` untuk menjamin keunikan peringkat #1–#3 per challenge)
- **Sosial & Komunikasi:** `follows`, `direct_messages`

File ini juga menyertakan **seed data komunitas lengkap** (14 akun lintas role, 8 kategori, 28 karya, 74 reaksi, 32 favorit, 7 moodboards, 24 komentar, 3 laporan pending, 6 challenge lintas status, 14 submisi, 24 relasi follow, dan 12 pesan).

### Opsi A — Menggunakan pgAdmin 4
1. Buat database baru di PostgreSQL (misalnya bernama `aesthe`).
2. Klik kanan database `aesthe` pada panel kiri pgAdmin 4, lalu pilih **Query Tool**.
3. Buka file `database_aesthe.sql` (atau salin seluruh isinya ke editor Query Tool).
4. Klik **Execute / Refresh (`F5`)** hingga transaksi `COMMIT` selesai tanpa error.

### Opsi B — Menggunakan Terminal (`psql`)
```bash
# 1. Buat database baru
createdb -U postgres aesthe

# 2. Import skema tabel, index, dan seed data
psql -U postgres -d aesthe -f database_aesthe.sql
```

> **Catatan:** Menjalankan ulang `database_aesthe.sql` akan melakukan *reset* bersih (`DROP TABLE ... CASCADE`) lalu membangun ulang seluruh tabel dan data awal dari nol. Jika sebelumnya sedang login di browser, logout dan login kembali agar sesi cookie tetap sinkron.

---

## Langkah Instalasi Lokal

### Prasyarat
- **Node.js** versi `20.9+` (direkomendasikan Node.js 22/24 LTS) dan `npm`
- **PostgreSQL** versi `14+`

### 1. Clone Repositori & Instal Dependensi
```bash
git clone <url-repositori-anda>
cd Final-Project-Web-2026
npm install
```

### 2. Konfigurasi Environment Variables
Buat file `.env.local` di root direktori proyek dan isi variabel berikut sesuai konfigurasi PostgreSQL lokal Anda:

```env
DATABASE_URL="postgresql://postgres:password_postgres_anda@localhost:5432/aesthe"
JWT_SECRET="ganti-dengan-string-rahasia-panjang-dan-acak-minimal-32-karakter"
```

### 3. Setup Database
Jalankan [database_aesthe.sql](./database_aesthe.sql) menggunakan **pgAdmin 4** atau **`psql`** seperti panduan di atas.

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan kunjungi **[http://localhost:3000](http://localhost:3000)** (atau langsung ke **[http://localhost:3000/home](http://localhost:3000/home)** untuk pratinjau publik).

### Perintah Tambahan
```bash
npm run lint    # Memeriksa kualitas kode & error variabel (ESLint)
npm run build   # Membangun production bundle Next.js
npm run start   # Menjalankan server production hasil build
```

---

## Akun Demo (Seed Data)

Seluruh akun bawaan pada `database_aesthe.sql` menggunakan kata sandi yang sama: **`password123`**

| Role | Status | Email | Username | Kegunaan Pengujian |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Approved | `admin@aesthe.art` | `@admin_aesthe` | Akses `/admin`, verifikasi Curator, moderasi laporan, kelola kategori & pengguna |
| **Curator** | Approved | `curator@aesthe.art` | `@elena_curator` | Akses `/curator`, buat/edit challenge, pilih Juara #1–#3 pada challenge *Ended* |
| **Curator** | Approved | `bima@aesthe.art` | `@bima_curates` | Kurator kedua untuk pengujian multi-kurator |
| **Curator** | Pending | `pending@aesthe.art` | `@dimas_curator` | Pengujian halaman `/pending-curator` (menunggu persetujuan Admin) |
| **Curator** | Rejected | `rejected@aesthe.art` | `@saka_curator` | Pengujian halaman `/pending-curator` berstatus ditolak |
| **Member** | Approved | `aria@aesthe.art` | `@aria_visuals` | Akun kreator utama (karya, moodboards, notifikasi DM, siap tes submisi challenge) |
| **Member** | Approved | `sora@aesthe.art` | `@sora_neon` | Pemilik karya Juara #1 (*Shibuya Neon Crossing*) |

---

<div align="center">
  <sub>Dibangun dengan Next.js App Router, Tailwind CSS, dan PostgreSQL untuk proyek <strong>Aesthe — Digital Art Showcase Platform</strong>.</sub>
</div>
