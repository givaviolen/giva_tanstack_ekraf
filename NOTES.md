# NOTES — Revamp · Fix · Secure

**Project:** Dashboard & Direktori UKM Danau Toba
**Stack:** TanStack Start (React 19) · TanStack Router / Query / Form / Table · Better Auth (in-memory) · Tailwind + shadcn/ui · Biome · Bun

---

## Task A — UI Revamp

Rebranded the scaffold from a generic "Ekraf" admin into a real product for UMKM around Lake Toba, in Bahasa Indonesia:

- **New public landing page (`/`)** — hero, category highlights, featured products pulled from the public `getPublicProducts` server function, and clear CTAs into the directory / admin.
- **New public directory (`/produk`)** — searchable, sortable table with a category filter, built with TanStack Table + shadcn `Select`.
- **Login page (`/login`)** — centered, on-brand card ("Masuk ke akun Anda"), subtle shadow/border, dark-mode aware, and explicit error feedback (wrong credentials vs. rate limited).
- **Dashboard shell (`_admin` layout)** — responsive collapsible sidebar + mobile hamburger drawer, `lucide-react` icons, account menu, theme toggle.
- **Dashboard (`/dashboard`)** — Indonesian metrics (products, stock, categories, users) plus a **category distribution** panel.
- **Products (`/products`)** — sortable table with **UMKM** and **Kategori** columns, category filter, IDR formatting; create/edit run inside shadcn **modal dialogs**.
- **Users (`/users`)** — Indonesian table with role modal and confirm dialog.
- **Theme** — Lake Toba palette (deep lake blue, earthy brown, Ulos red) as CSS tokens in `src/styles.css`, with a working dark mode via `ThemeToggle`.
- Deleted the scaffold demo routes (`/demo/*`, `/about`) and removed every dead link from `Header`, `Footer`, and `__root.tsx`.

---

## Task B — Fix Errors

### What I broke and how I fixed it

The headline bug was **the product form rejecting keystrokes**: every character typed into a create/edit product field would either be dropped or reset the field to empty. The cause was that the form component was being **re-created on each render and remounting**, so TanStack Form's field state was thrown away between keystrokes (the inputs looked controlled but their state never survived a render). I fixed it by extracting the fields into a **stable `ProductForm` component defined once at module scope** and giving it a **`key` derived from the product id**, so it only remounts when you actually switch targets — typing now persists every keystroke, and I verified it live in the browser (filled `name`, `umkm`, `description`, `price`, `stock`, picked a category, saved, reopened, and edited). Alongside that I fixed the remaining scaffold lint issues (`styles.css` import order, the `__root.tsx` theme script, `slider.tsx` key), made `bun run lint`, `bun run build`, and `bunx tsc --noEmit` all pass cleanly, and confirmed each route manually. I also replaced the crude "is it bigger than 512px" image idea with a proper **client-side canvas downscale to 512px** (`src/lib/image.ts`) mirrored by a **server-side allow-list + size cap** (`src/lib/server/products.ts`).

### Fixes on record

- Product form fields accept and persist typing (stable, keyed form component); create/update/delete verified end-to-end.
- `bun run lint` (Biome) passes; `bun run build` passes; `bunx tsc --noEmit` passes.
- Dead demo routes removed and `routeTree.gen.ts` regenerated; no dead links remain.
- Image upload: client downscales to **max 512px**; server independently rejects disallowed sources and oversized payloads (see Security #7).
- `/setup` is idempotent and rate-limited — it no longer crashes or overwrites the admin when re-run.
- Friendly validation errors: raw `ZodError` JSON is never shown; `safeValidator` throws a short `AppError` message and the UI renders it via `toUserMessage`.

---

## Task C — Security Enhancements

Every check is enforced **server-side**; the client only mirrors it for UX. **The client is untrusted.**

| # | Enhancement | Where | Attack it prevents |
|---|---|---|---|
| 1 | **Server-side Zod validation on every server function** via `safeValidator` | `src/lib/server/*.ts`, `src/lib/server/guard.ts` | A malicious client sending tampered, out-of-range, or oversized payloads (e.g. a 50 MB base64 image, a negative price, an unknown category). The server re-validates everything it receives. |
| 2 | **`requireAdmin()` / `requireAuth()` on every mutation and privileged read** (`getUsers` is admin-only) | `src/lib/session.ts`, `src/lib/server/{products,users}.ts` | Privilege escalation and IDOR: calling a server function directly (bypassing the UI) can't create/edit/delete data or enumerate users without a real admin session. |
| 3 | **Self-demotion block + last-admin lockout guard** on role change and deletion | `src/lib/server/users.ts` | An admin accidentally (or maliciously) demoting/deleting the final owner, permanently locking the workspace. |
| 4 | **Self-deletion block + `purgeUser()` cascade** | `src/lib/server/users.ts`, `src/lib/db.ts` | Deleting only the user row left live `session` rows behind, so a stolen or cached session cookie stayed valid. `purgeUser` removes the user **and** their sessions, accounts, and verifications. |
| 5 | **Login rate limiting** (Better Auth `rateLimit.customRules`: 5/min on `/sign-in/email`) **+ an in-memory limiter** for server functions (`enforceRateLimit`) | `src/lib/auth.ts`, `src/lib/server/guard.ts` | Brute-force / credential-stuffing against the sign-in endpoint, and spamming the seed endpoint on a fresh instance. |
| 6 | **Session cookie hardening** — `httpOnly`, `sameSite=lax`, `Secure` over HTTPS, 7-day expiry with rolling `updateAge` | `src/lib/auth.ts` | Session theft via XSS (`httpOnly` keeps the cookie out of JS), CSRF (`sameSite`), and indefinite session lifetime. |
| 7 | **Product image validated twice** — client canvas downscale to **512px**, server allow-list of `https://`/`http://` URLs and `data:image/{png,jpeg,webp,gif,avif};base64` with a **720 kB cap** | `src/lib/image.ts`, `src/lib/server/products.ts` | Stored XSS via an `image` field set to `data:text/html` or `javascript:` (rendered later), and memory exhaustion from unbounded uploads. |
| 8 | **No secrets in code or git** — `*.local` / `.env` gitignored, only `.env.example` is committed; passwords hashed by Better Auth | `.gitignore`, `src/lib/auth.ts` | Leaking the `BETTER_AUTH_SECRET` (which would let anyone forge sessions) and plaintext credential storage. |

Bonus hardening included: idempotent + rate-limited seeding, a public catalogue endpoint capped at 60 rows so it can't dump everything, and an `AppError` type that carries an explicit status (401/403/404/422/429) instead of leaking framework errors.

---

## Verification performed

Ran the app locally (`bun dev`, `http://localhost:3000`) and drove it in a real browser:

- **Seed** via `/setup` → admin + 6 products created; second click correctly reports "sudah di-seed".
- **Public directory `/produk`** → 6 products, IDR (`Rp 1.250.000`) and dates (`17 Okt 2026`) formatted for `id-ID`.
- **Dashboard `/dashboard`** → metrics (6 produk, 405 stok, 5 kategori, 1 pengguna) + category distribution.
- **Login** → wrong password shows "Invalid email or password"; the **6th** attempt within the window shows the Indonesian rate-limit message (429 path). Authenticated visits to `/login` redirect to `/dashboard`; signed-out visits to `/users` redirect to `/login`.
- **Product CRUD** → created a product (typed into every field, picked a category), edited it (price 150 000 → 99 000, stock 25 → 77), deleted it via the confirm dialog (7 → 6 products). All optimistic/refetch states rendered correctly.
- **Users `/users`** → the self row's "Ubah role" and "Hapus" actions are disabled ("Anda").
- **Clean checks** → `bun run lint`, `bun run build`, `bunx tsc --noEmit` all exit 0.

---

## Reproduce

```bash
bun install
cp .env.example .env.local     # set BETTER_AUTH_URL + BETTER_AUTH_SECRET
bun dev                        # http://localhost:3000
# open /setup → Seed Data Admin & Produk → sign in at /login
```

Regenerate the full project + ZIP in one command:

```bash
bun run generate.ts            # → ukm-danau-toba-dashboard.zip
```
