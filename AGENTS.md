# Dashboard & Direktori UKM Danau Toba

Secure admin dashboard **plus a public product directory** for UMKM (small businesses) around Lake Toba — login, product CRUD, and user/role management backed by Better Auth (no persistent DB by design), targeting Vercel. Indonesian-language UI, Lake Toba / Ulos visual theme, light + dark mode.

## Exact TanStack CLI command used

```bash
npx @tanstack/cli@latest create my-tanstack-app \
  --agent \
  --package-manager pnpm \
  --tailwind \
  --deployment vercel \
  --add-ons form,shadcn,table,tanstack-query,better-auth
```

The CLI was run in a scratch directory (`.scratch-tanstack-cli/`), then the generated integrations, dependencies, config, scripts, and file structure were merged into this project root. The scratch directory and pnpm artifacts (`node_modules`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) were removed afterward.

## Follow-up TanStack Intent commands

```bash
# List intent-enabled packages and skills (completed; 12 packages, 40 skills)
npx @tanstack/intent@latest list

# Install intent skills (requires interactive permission confirmation;
# could not run non-interactively during scaffolding)
npx @tanstack/intent@latest install

# Load a skill for package-shipped guidance before architectural changes
npx @tanstack/intent@latest load @tanstack/react-start#react-start
npx @tanstack/intent@latest load @tanstack/react-table#getting-started
npx @tanstack/intent@latest load @tanstack/react-table#table-state
```

Skills loaded before making changes confirmed:
- TanStack Start: code is isomorphic by default; use `createServerFn` for server-only logic; enforce auth in every private server function.
- TanStack Table v9: `createColumnHelper<TFeatures, TData>`, `tableFeatures(...)`, `useTable({ features, columns, data })`.

## Chosen stack and integrations

| Choice | Value |
|---|---|
| Framework | TanStack Start (React 19) |
| Router | TanStack Router (file-based, `src/routes`, `routeTree.gen.ts`) |
| Forms | TanStack React Form (`useForm`) |
| Table | TanStack React Table v9 (`useTable`, `tableFeatures`, `rowSortingFeature`) |
| Query | TanStack Query (`useQuery`) + `react-router-ssr-query` integration |
| Auth | Better Auth (`emailAndPassword`, `tanstackStartCookies` plugin) |
| Styling | Tailwind CSS + shadcn UI components |
| Database | none (in-memory via Better Auth `memoryAdapter`) |
| Package manager | bun (`bun.lock` generated; `package.json` scripts use `bun`) |
| Toolchain | biome (`biome.json`, `bun run lint` / `bun run format` / `bun run check`) |
| Deployment | Vercel (`vercel.json` framework: `tanstack-start`, Nitro output) |
| TanStack CLI | `tsr.config.json`, `generate-routes` script (`tsr generate`) |

## Environment variable requirements

Create `.env.local` (gitignored) from `.env.example`:

| Variable | Purpose | Required |
|---|---|---|
| `BETTER_AUTH_URL` | Public base URL of the app | Yes (dev: `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Signing secret for sessions/tokens | Yes (generate via `bun x @better-auth/cli secret`) |

On Vercel, add both under **Settings > Environment Variables** for the production deployment.

## Seed account (one-time, development)

There is no persistent database. Data lives in memory for the life of the server process (local dev, or a single warmed Vercel serverless instance) and resets on redeploy / cold start.

1. Visit `/setup` and click **Seed Data Admin & Produk**.
2. This calls `seedAdmin` (a TanStack Start server function) which:
   - Is idempotent (returns early once an admin exists) and rate-limited.
   - Creates `admin@example.com` / `admin12345` via `auth.api.signUpEmail` (password hashed by Better Auth) into the memory adapter.
   - Assigns the `admin` role.
   - Seeds 6 sample Lake Toba products (ulos, kopi Lintong, kacang Sihobuk, ukiran kayu, tas anyaman, sambal andaliman).
3. Sign in at `/login` with `admin@example.com` / `admin12345`.
4. Open `/dashboard`, then `/products` or `/users`. The public directory lives at `/produk`.

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | public | Landing page: hero, category highlights, featured products (`getPublicProducts`), CTAs |
| `/produk` | public | Full public directory of UMKM products (sortable table + search + category filter) |
| `/setup` | public | One-time admin + sample data seed (`seedAdmin` server fn; idempotent + rate-limited) |
| `/login` | public | Modern centered sign-in card (Indonesian); redirects authenticated users to `/dashboard` |
| `/register` | public | Better Auth sign-up (Indonesian) |
| `/dashboard` | auth | Protected overview: metrics, category distribution, recent products (TanStack Query) |
| `/products` | auth + admin | Product list (TanStack Table); create/edit/delete in shadcn **modal dialogs** (`ProductFormModal`) |
| `/users` | auth + admin | User list + role management (TanStack Table + `UserRoleModal`) |
| `/api/auth/$` | public | Better Auth handler (`signIn`, `signUp`, `session`, etc.) |

## Key architectural decisions

1. **Better Auth without a database** — `betterAuth({ database: memoryAdapter(memoryDb), ... })` uses Better Auth's official in-memory adapter. User/session/account/verification tables are owned by Better Auth; `product` and `userRole` tables are app-owned. Passwords ARE hashed by Better Auth (not plaintext) — this fixes the "insecure" concern from the original app.
2. **Authz enforced server-side** — Every mutating server function (`createProduct`, `updateProduct`, `deleteProduct`, `updateUserRole`, `deleteUser`) and protected getter (`getUsers`) calls `requireAdmin()` / `requireAuth()`, which read the session via `auth.api.getSession({ headers })` using TanStack Start's `getRequest()`. Route-level guards use `beforeLoad` with `getServerSession()` to redirect unauthenticated users. Navigation-only UX is separate from server enforcement (per the react-start Intent skill).
3. **Server functions use POST only** — TanStack Start `createServerFn` supports `GET` and `POST` methods only (`Method = 'GET' | 'POST'`). Mutations use `POST` and encode intent in the body/validator.
4. **TanStack Start server functions, not raw API routes**, for all writes — `useServerFn` on the client calls typed server functions; Better Auth's `/api/auth/$` route handles auth HTTP endpoints.
5. **Role gating** — `getUserRole(userId)` reads the `userRole` table; `admin` actions require role `admin`. Deleting the last administrator is blocked to avoid lockout.

## Security enhancements (Task C)

| # | Measure | Where | Attack it prevents |
|---|---|---|---|
| 1 | Server-side Zod validation on **every** server function (`safeValidator`) | `src/lib/server/*.ts`, `src/lib/server/guard.ts` | Tampered/oversized payloads bypassing client checks — the client is untrusted, so the server re-validates and re-authorizes. |
| 2 | `requireAdmin()` on every mutation and privileged reader; `getUsers` is admin-only | `src/lib/session.ts`, `src/lib/server/{products,users}.ts` | Privilege escalation / IDOR — a non-admin cannot create, edit, delete, or enumerate users by calling server functions directly. |
| 3 | Admin **self-demotion** block + **last-admin** lockout guard (role change & delete) | `src/lib/server/users.ts` | A mistaken or malicious admin removing the final owner and permanently locking the workspace. |
| 4 | Admin **self-deletion** block + `purgeUser()` cascade | `src/lib/server/users.ts`, `src/lib/db.ts` | Deleted accounts leaving live sessions behind (a stolen/cached cookie staying valid). Purge removes user + sessions + accounts + verifications. |
| 5 | **Login rate limiting** (Better Auth `rateLimit.customRules`) + in-memory limiter for server functions | `src/lib/auth.ts`, `src/lib/server/guard.ts` | Brute-force / credential stuffing and abuse of the seed endpoint. |
| 6 | Session cookie hardening: `httpOnly`, `sameSite: lax`, `Secure` over HTTPS, 7-day expiry + rolling `updateAge` | `src/lib/auth.ts` | Session theft via XSS (`httpOnly`), CSRF (`sameSite`), and indefinite session lifetime. |
| 7 | Image input validated both client-side (canvas downscale to **512px**) and server-side (data-URL/URL allow-list + 720 kB cap) | `src/lib/image.ts`, `src/lib/server/products.ts` | Stored-XSS via `data:text/html` / `javascript:` image payloads and memory-exhaustion uploads. |
| 8 | Passwords hashed by Better Auth; no secrets committed (`*.local` gitignored; `.env.example` only) | `src/lib/auth.ts`, `.gitignore` | Plaintext credential storage and leaking the signing secret. |

## Reproducible bundle

`bun run generate.ts` writes every project file and zips them to `ukm-danau-toba-dashboard.zip` (dependency-free ZIP writer; excludes `node_modules`, `.env*`, build output and lockfiles). See `NOTES.md` for the full fix/security write-up.

## Known gotchas

- **No persistent DB**: data resets on every redeploy/cold start. Re-run `/setup` after deploying to recreate the admin + sample products. To persist long-term, add a Better Auth adapter (Drizzle/Prisma/Kysely/Mongo) and a `DATABASE_URL`.
- **`useParams()` requires `{ from: '/path/$param' }`** in this TanStack Router version — calling it with no arguments throws.
- **`createServerFn` methods**: only `GET` and `POST` are valid; do not use `PATCH`/`DELETE`.
- **Better Auth API is flat**: `auth.api.signUpEmail(...)` (not `auth.api.signUp.email`).
- **`bun run lint` is clean** — the scaffold lint issues (styles.css import order, `__root.tsx` theme script, `slider.tsx` key) were fixed. Biome enforces **tabs, double quotes, semicolons**; run `bunx biome check --write .` after editing.
- **`bun run build` does not typecheck** — run `bunx tsc --noEmit` for type errors. Both must pass before submitting.
- **biome `intent install`** could not run non-interactively (requires interactive permission review); `intent list` completed. Re-run `npx @tanstack/intent@latest install` interactively if you want skill mappings written.
- **Vercel serverless is stateless across instances**: in-memory data is per-instance; multi-instance production deploys will not share data. Add a database adapter for real production use.

## Next steps

- Add a persistent Better Auth adapter (Drizzle/Prisma/etc.) + `DATABASE_URL` for production data persistence.
- Replace in-memory `userRole` with Better Auth organizations or a dedicated RBAC table.
- Run `npx @tanstack/intent@latest install` interactively to register skill mappings.
- Configure `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` in Vercel project settings, then connect the GitHub repo and deploy.
- Add password-reset / email verification via Better Auth `email-otp` or `magic-link` plugins if desired.
