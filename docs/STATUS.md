# Status

Living doc. Update this whenever you finish a session's work so the next person (or their Claude session) can pick up without re-deriving context. Keep it short — link to `CLAUDE.md` and `docs/architecture.md` for anything that doesn't change often.

## Where we are

**Live and fully functional end to end, with a real three-tier environment setup.** Landing page renders on Vercel Production; the registration form writes real rows to the real Neon `production` branch. PR previews and the persistent `main` "dev" deployment each get their own Neon branch automatically via the Neon-Vercel integration, isolated from production data. Local dev is pointed at the dev branch (`preview/main`), not production.

## Done

- Architecture proposal drafted and reviewed with the committee — two rounds of Q&A, plus the previous season's rule book, folded in (`docs/architecture.md`).
- GitHub org (`crickit-league`) and repo (`cil-web`) created.
- Landing page design mockup built and approved (`mockups/landing-page.html`).
- **Next.js scaffold** (App Router, TypeScript strict, Tailwind v4, ESLint, Prettier) with the mockup's design tokens (Big Shoulders / Libre Franklin / IBM Plex Mono, the pitch/clay/gold palette) wired into `src/app/globals.css` + `src/app/layout.tsx`.
- Landing page ported to real React components (`src/components/sections/*`), served from the `(public)` route group.
- **Prisma schema** for what Phase 1a actually needs — `Season`, `Registration` (`prisma/schema.prisma`). The rest of the domain model in architecture.md §6 lands incrementally as Phase 1b/2/3 features are actually built, not ahead of them.
- Prisma 7 + `@prisma/adapter-neon` configured (`prisma.config.ts`, `src/lib/db/prisma.ts`), including the `ws` WebSocket polyfill Vercel's serverless runtime needs (see git history 2026-08-26 if this regresses — it fails silently with a useless `ErrorEvent` without it).
- Registration form (`src/app/(public)/registration-form.tsx`) is a real client component with a server action (`actions.ts`) that validates with Zod and writes to Postgres via the service layer (`src/lib/services/registrations.ts`).
- CI workflow (`.github/workflows/ci.yml`): format check, lint, typecheck, build on every push/PR.
- `npm run format|lint|typecheck|build` all pass clean as of this writing.
- **Vercel project live** under the `crickit-league` Team (not a personal account). **Two git branches**: `main` (everyday work, PRs merge here) and `production` (the actual Vercel Production Branch — a deliberate release gate, not auto-deployed). Releasing = merging `main` → `production`.
- **Neon database live**, migration applied, seeded with the 2026-27 season (`REGISTRATION_OPEN`). Three-tier branch topology via the Neon-Vercel integration: `production` (Neon Default branch, real data) ↔ Vercel Production only; `preview/main` (persistent, since `main` never merges/deletes) ↔ the always-on `main` dev deployment, and also what local `.env` should point at; every PR branch gets its own auto-created, auto-deleted Neon branch. **Full details, and why you must never manually set a Preview/Development-scoped `DATABASE_URL`, in `docs/service-setup.md` §3** — getting this wrong doesn't error, it silently writes data to the wrong place, and it took three rounds of debugging to nail down on 2026-08-26.
- The original manually-created `vercel-dev` Neon branch is obsolete now that `preview/main` serves that role — safe to delete whenever, nothing references it.
- Domain decided: `crickitinterleague.org`, purchase in progress via Cloudflare Registrar.
- **Sign-in for everyone (magic link + 6-digit code) with a gated admin console**, on `feature/admin-auth`. Auth.js v5 (`next-auth@beta`) with `@auth/prisma-adapter`, `Resend` email provider, database sessions. New Prisma models: `User`, `UserRole` (role + scope, see `docs/architecture.md` §6 for why it's not an enum on `User`), plus the standard Auth.js `Account`/`Session`/`VerificationToken` tables — migration `20260826071359_add_auth_and_roles`. `src/lib/auth/permissions.ts` has the `can(user, action)` check CLAUDE.md requires; `(admin)/admin/layout.tsx` gates the console on it server-side and renders inside the normal `SiteHeader`/`SiteFooter`, not a separate shell. Anyone can sign in (not just admins) — the header shows a Sign In link or an email/name + dropdown, with "Admin Dashboard" appearing there only for `ADMIN`/`SUPER_ADMIN` roles. First-time sign-ins (or any pre-existing account with no name) get a one-time `/welcome` prompt for a display name before landing on `/`. The 6-digit code on `/login/check-email` is the *same* verification token as the emailed link, just short-form (`generateVerificationToken` in `src/lib/auth/config.ts`) — for the "read the email on my phone, sign in on my laptop" case; token lifetime is 10 minutes (down from Auth.js's 24h default) since a 6-digit code is much lower entropy. **No rate-limiting on repeated wrong-code guesses yet** — a real gap, not a silently-accepted one; needs its own attempt-tracking table ahead of the callback route. `RESEND_API_KEY` is still empty by default (domain not verified yet — see Blocking below), so `src/lib/auth/send-magic-link.ts` falls back to logging the link/code to the console in dev. First admin seeded via `npm run admin:promote -- <email>` (lowercase the email — Auth.js normalizes to lowercase on sign-in, so a mixed-case seed creates an orphaned second `User` row instead of matching); `CILcommittee@gmail.com` is seeded on the dev branch. The admin page itself just lists registrations read-only (`listRegistrations` in `src/lib/services/registrations.ts`) — no approve/reject yet, that's still Phase 1b.
- **Registration confirmation email** now fires on submission (`src/lib/email/send-registration-confirmation.ts`, called from `submitRegistration` in `src/lib/services/registrations.ts`). Fixed copy provided by the committee (captain name + a payment deadline pulled from the open season's `registrationClosesAt`, formatted mm/dd/yy); tells the captain to email a payment screenshot to `CILcommittee@gmail.com`. Same `RESEND_API_KEY`-or-console-log pattern as auth email. A send failure is caught and logged, not thrown — the registration row is already saved and shouldn't be lost over an email hiccup; there's no admin-visible delivery log yet (architecture.md §13's health page) so a failure here is currently only visible in server logs. This is the `registration.submitted` email from architecture.md §9 — the later `registration.approved` invite email is still Phase 1b.
- **"Manage admins" section on `/admin`**, visible only to `SUPER_ADMIN` — per the role table in architecture.md §7, granting/revoking admin access is explicitly a super-admin capability, not something a plain admin can do to another admin. Lists everyone with `ADMIN`/`SUPER_ADMIN`, and can grant/revoke `ADMIN` only (`src/lib/services/admins.ts`); `SUPER_ADMIN` stays CLI-only via `npm run admin:promote -- <email> SUPER_ADMIN` (the script now takes an optional role argument, defaulting to `ADMIN`). Guards against revoking your own row or a `SUPER_ADMIN` row are enforced in the service, not just hidden in the UI. `pradepkumar@gmail.com` is the first (and currently only) super admin on the dev branch.

## Blocking

- **Domain DNS/mail** — once `crickitinterleague.org` is purchased: Cloudflare Email Routing (or Zoho) for `mail@crickitinterleague.org`, the domain added to Vercel, Resend/Turnstile set up against it. See `docs/service-setup.md`.

## Explicitly not done yet — don't assume otherwise

- **No bot protection** on the registration form (Cloudflare Turnstile) — flagged with a `TODO` in `actions.ts`. Needed before this goes live to real users.
- **No approve/reject workflow.** The new admin console (see above) can only list registrations, not act on them — that plus invite issuance and the post-approval `registration.approved` email is Phase 1b.
- **No rate-limiting on the 6-digit sign-in code.** See the auth bullet above — worth fixing before this is relied on for real accounts, not just admins.

## Open questions (don't re-ask, don't guess — see CLAUDE.md for full context)

- $650 vs $800 "with Sponsorship" fee tier meaning — unresolved. Rule book confirms $650 but doesn't mention the second tier at all.
- Minors' public profile scope — flagged, not resolved.

## Next up

1. Finish the domain: buy it if not done, then Email Routing/Zoho for `mail@crickitinterleague.org`, add the domain in Vercel → Settings → Domains, Resend domain verification, Cloudflare Turnstile.
2. Wire up Cloudflare Turnstile on the registration form (code side — keys can be generated any time per step 1 above, but the form doesn't call it yet).
3. Admin console: approve/reject registrations, export CSV, then the `registration.approved` invite email. Auth, read-only listing, and the submission-confirmation email are done (see above).
4. Rate-limit the 6-digit sign-in code before treating it as production-ready for non-admin accounts.
