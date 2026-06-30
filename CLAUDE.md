# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Niño Terremoto Venezuela" — a security-first MVP for tracking and reunifying unaccompanied/at-risk children after a disaster. The domain is child protection, so the data model and access controls are deliberately strict. UI strings and domain vocabulary are in **Spanish** (`casos`, `reportes`, `usuarios`, `organizaciones`); keep new user-facing text in Spanish.

Stack: Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind · Supabase (self-hosted Postgres + Auth + Storage) · Zod.

## Commands

```bash
npm install        # required once; the app fails to build without node_modules
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run build      # next build

# Create / promote the FIRST admin (chicken-and-egg bootstrap; see Onboarding below).
# Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env.
npm run bootstrap:admin -- <email> <password> ["Nombre Completo"]
```

CI (`.github/workflows/ci.yml`) runs `typecheck`, `lint`, and `build` on every push/PR to `main` — run all three locally before pushing. There is **no test runner configured**; "verification" here means typecheck + lint + build pass. (`npm run lint` currently emits one benign React-Compiler warning on `react-hook-form`'s `watch()` in `CreateUserForm.tsx`; warnings don't fail CI.)

## Security model — read before touching data access

Security is enforced primarily in the **database**, not the app. Do not weaken it.

- **RLS is `enable`d AND `force`d on all 9 domain tables.** Even the table owner cannot bypass policies. The single migration `supabase/migrations/20260629170000_security_mvp_schema.sql` is the source of truth for schema, policies, triggers, storage buckets, and RPCs. It is idempotent — edit and re-run it rather than adding ad-hoc migrations for schema changes.
- **The public/anonymous surface is intentionally tiny:**
  - `anon` may **only** `INSERT` into `public_reports` (status forced to `pendiente`) and upload to the `public-report-uploads` bucket. It cannot read `cases` or any sensitive table directly.
  - The only public read path is the `get_public_case_by_code(p_public_code)` RPC, which returns a masked subset (initial-only display name, approximate age, sex, status, general zone, optional public photo). **Never** expose exact location, health, family/contact notes, internal notes, events, handovers, or transfers publicly. The public case page (`app/caso/[codigo]`) must go through this RPC only — never select from `cases`.
- **Onboarding is admin-creates-accounts — there is NO public signup.** Every new auth user gets a `profiles` row with `role='publico', approved=false` (via the `on_auth_user_created` trigger), and private routes require an **approved** non-public role. Admins create team members from `/usuarios`: `profile-service.createTeamUser` calls `requireAdmin()` first, then uses the service-role client to `auth.admin.createUser({ email_confirm: true })` and promote the profile (role + org + `approved=true`) in one step. The **first** admin is the chicken-and-egg case — bootstrap it with `npm run bootstrap:admin` (idempotent; creates or promotes the auth user and flips its profile to an approved admin via the service-role key).
- **`SUPABASE_SERVICE_ROLE_KEY` is server-only.** Use `lib/supabase/admin.ts` (`createServiceRoleClient`) exclusively in server code, and only when RLS must legitimately be bypassed. The only in-app use is `profile-service` (admin user creation/promotion), and it is gated by `requireAdmin()` first — keep that invariant: never call the service-role client without an admin check, and never import it into a client component.
- **Session refresh runs in `proxy.ts`** (Next 16's renamed middleware, nodejs runtime). It refreshes the Supabase auth cookie on every request via `getUser()` and redirects unauthenticated users away from `/dashboard|/casos|/reportes|/usuarios|/organizaciones`. Without it, sessions silently expire — don't delete it, and keep the `getUser()` call immediately after `createServerClient`.
- **Audit & events are automatic.** DB triggers write `audit_logs` (insert/update/delete on sensitive tables) and append `case_events` (case create/update, handover, transfer, public-report). Do not hand-insert these — let the triggers fire. `audit_logs` and `case_events` are effectively append-only.

## Architecture

**Three Supabase clients, chosen by context** (`lib/supabase/`):
- `client.ts` — browser client (anon key), for client components.
- `server.ts` — SSR client (anon key + cookies), for server components / route handlers / server actions. Runs **as the logged-in user**, so RLS applies. This is the default for almost everything.
- `admin.ts` — service-role client, bypasses RLS. Server-only, rare.

**Service layer** (`lib/services/`) is the boundary between routes/components and the database. Every mutating function parses its input with a Zod schema from `lib/validation/schemas.ts` before hitting Supabase. Add new data access here rather than calling Supabase inline in pages. Services use the SSR client so RLS enforces authorization automatically.

Service files: `case-service` (cases CRUD, `case_photos`, photo upload to the private bucket), `operations-service` (handovers, transfers), `report-service` (public-report intake + moderation), `organization-service` (admin org CRUD), `profile-service` (admin user creation/promotion — the only service-role caller). Each mutating fn parses its Zod schema before touching Supabase.

**Auth helpers** (`lib/services/auth-service.ts`): `getCurrentProfile()` (via `get_current_profile` RPC), `requireApprovedUser(roles?)`, `requireAdmin()` (throws unless an approved admin — guards service-role actions), `isRoleAllowed(...)`. The server components `components/auth/ProtectedRoute.tsx` (redirects unapproved/unauthorized users to login) and `RoleGuard.tsx` (renders a fallback) wrap protected UI. `components/layout/AppNav.tsx` is the role-aware top nav (includes logout) rendered on every authenticated page. Login/logout are server actions in `app/login/actions.ts`; per-feature mutations live in sibling `actions.ts` files (e.g. `app/casos/actions.ts`, `app/casos/[id]/actions.ts`, `app/usuarios/actions.ts`).

**Routes** (`app/`): public pages (`/`, `/login`, `/reportar`, `/caso/[codigo]`) and approved-only pages (`/dashboard`, `/casos`, `/casos/nuevo`, `/casos/[id]`, `/reportes`, `/usuarios` + `/organizaciones` admin-only). API: `app/api/reportes` (anonymous public report intake) and `app/api/health`.

## Project conventions & gotchas

- **Path alias `@/*` maps to repo root** (`tsconfig.json`), e.g. `@/lib/services/case-service`.
- **`typedRoutes: true`** (`next.config.js`). Dynamic redirect strings with query params (e.g. `redirect("/login?error=invalid")`) require an `as never` cast — this is intentional, not a hack to remove.
- **Next 16 async APIs:** `cookies()` is awaited, and dynamic route `params` is a `Promise` you must `await` (see `app/caso/[codigo]/page.tsx`). Don't destructure `params` synchronously.
- **Next 16 renamed `middleware` → `proxy`.** The request interceptor is `proxy.ts` exporting a `proxy()` function (not `middleware.ts`/`middleware()`). It runs on the nodejs runtime (no edge).
- Pages that read per-request/auth state set `export const dynamic = "force-dynamic"`.
- TypeScript is `strict`; domain types live in `lib/types/domain.ts` and mirror the DB enums/tables.
- **Case photos** live in the private `case-photos-private` bucket at path `${caseId}/<uuid>-<name>` and are shown via short-lived **signed URLs** (`storage-service.createSignedReadUrl`), never public URLs. The `case_photos.is_public_preview` flag is currently inert (nothing sets it true and no public surface reads photos) — if you ever build a public photo view, serve previews from a dedicated **public** bucket, never a signed URL of a private object.

## Deployment

Dockerfile (multi-stage, `next start` on port 3000) → Coolify auto-deploy on `main`, fronted by a Cloudflare tunnel. See `DEPLOY.md` for the Coolify UUID, container name, tunnel URL, and the VPS-side CD watchdog. The `trycloudflare.com` URL is **not** a permanent production domain.

## Non-negotiables (from `README_PHASE_1_2.md`)

- No real children's data or real photos in QA/dev. No facial recognition.
- Never surface exact location, health, family, contacts, internal notes, handovers, or transfers in any public view.
- No physical deletes from the UI.
- Every sensitive action must produce an `audit_log` and/or `case_event`.
- Legal review is required before any real-world use.
