# Dashboard & Direktori UKM Danau Toba

Dashboard admin yang aman **plus direktori produk publik** untuk UMKM (usaha mikro, kecil, dan menengah) di kawasan Danau Toba — dari kain ulos hingga kopi Lintong.

- **Publik:** landing page promosi + direktori produk yang bisa dicari, diurutkan, dan difilter per kategori.
- **Admin:** login, CRUD produk (dalam modal), dan manajemen pengguna/role.
- **Bahasa & tema:** antarmuka Bahasa Indonesia, palet Danau Toba (biru danau, cokelat tanah, aksen merah ulos), light + dark mode.

Dibangun dengan **TanStack Start (React 19) + TanStack Router/Query/Form/Table + Better Auth + Tailwind + shadcn/ui**. Tanpa database persisten (in-memory by design) dan siap deploy ke Vercel.

---

## Menjalankan

```bash
bun install
cp .env.example .env.local     # isi BETTER_AUTH_URL + BETTER_AUTH_SECRET
bun dev                        # http://localhost:3000
```

Buat secret dengan:

```bash
bun x @better-auth/cli secret
```

### Seed data (sekali, untuk development)

Tanpa database persisten, data hidup di memori selama proses server berjalan dan **reset saat restart/redeploy**.

1. Buka `/setup` → klik **Seed Data Admin & Produk**.
2. Akun: `admin@example.com` / `admin12345` (password di-hash oleh Better Auth) + 6 produk contoh.
3. Masuk di `/login`, lalu buka `/dashboard`, `/products`, atau `/users`. Direktori publik ada di `/produk`.

> Seed bersifat idempoten (tidak menimpa jika admin sudah ada) dan dibatasi rate limit.

---

## Rute

| Rute | Akses | Deskripsi |
|---|---|---|
| `/` | publik | Landing page: hero, kategori, produk unggulan |
| `/produk` | publik | Direktori produk UMKM (tabel + pencarian + filter kategori) |
| `/setup` | publik | Seed admin & data contoh sekali jalan |
| `/login` | publik | Kartu login terpusat; user yang sudah masuk diarahkan ke `/dashboard` |
| `/register` | publik | Pendaftaran akun |
| `/dashboard` | auth | Ringkasan metrik, sebaran kategori, produk terbaru |
| `/products` | auth + admin | Katalog produk; tambah/ubah/hapus lewat modal |
| `/users` | auth + admin | Daftar pengguna + ubah role |
| `/api/auth/$` | publik | Handler Better Auth |

---

## Perintah

```bash
bun dev              # server dev di :3000
bun run lint         # biome check
bun run format       # biome format --write
bun run build        # build produksi
bunx tsc --noEmit    # cek tipe (build tidak mengecek tipe)
bunx tsr generate    # regenerasi routeTree.gen.ts setelah mengubah rute
```

---

## Keamanan

Semua aksi **divalidasi & diotorisasi di server** (klien tidak dipercaya). Ringkasnya:

- Validasi Zod server-side (`safeValidator`) di setiap server function.
- `requireAdmin()` / `requireAuth()` di setiap mutasi dan pembacaan sensitif.
- Larangan admin menurunkan role / menghapus akun sendiri, plus penguncian "admin terakhir".
- `purgeUser()` menghapus user bersama sesi/akun/verifikasi-nya.
- Rate limit login (Better Auth) dan limiter in-memory untuk server function.
- Cookie sesi `httpOnly`, `sameSite=lax`, `Secure` saat HTTPS, kedaluwarsa 7 hari.
- Gambar produk: downscale klien ke maks 512px + allow-list URL/data-URL di server.

Rincian tiap langkah (dan serangan yang dicegah) ada di [`NOTES.md`](./NOTES.md) dan [`AGENTS.md`](./AGENTS.md).

---

## Reproduksi dalam satu perintah

```bash
bun run generate.ts
```

Menulis ulang seluruh berkas proyek ke folder `ukm-danau-toba-dashboard/` dan mengemasnya menjadi `ukm-danau-toba-dashboard.zip` (ZIP writer tanpa dependensi; mengecualikan `node_modules`, `.env*`, output build, dan lockfile).

---

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Di Vercel: **Add New → Project**, import repo.
3. Tambahkan `BETTER_AUTH_URL` dan `BETTER_AUTH_SECRET` di **Settings → Environment Variables**.
4. Deploy, lalu buka `/setup` sekali untuk membuat ulang admin + data contoh.

`vercel.json` sudah menetapkan framework `tanstack-start` (output Nitro).

---

## Catatan penting

- **Tidak ada database persisten.** Data hilang saat cold start; jalankan ulang `/setup`. Untuk produksi, tambahkan adapter Better Auth (Drizzle/Prisma/Kysely) + `DATABASE_URL`.
- Deployment Vercel multi-instance tidak berbagi state in-memory.
- Jangan commit `.env.local`.
