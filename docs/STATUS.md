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

## Blocking

- **Domain DNS/mail** — once `crickitinterleague.org` is purchased: Cloudflare Email Routing (or Zoho) for `mail@crickitinterleague.org`, the domain added to Vercel, Resend/Turnstile set up against it. See `docs/service-setup.md`.

## Explicitly not done yet — don't assume otherwise

- **No bot protection** on the registration form (Cloudflare Turnstile) — flagged with a `TODO` in `actions.ts`. Needed before this goes live to real users.
- **No confirmation/payment-reminder email** (Resend) — also `TODO`'d in `actions.ts`. See architecture.md §9 for the two-separate-emails design (submission receipt vs. post-approval invite).
- **No admin console, no auth** (magic links). Nobody can currently approve/reject a submitted registration except by querying the database directly. This is the next major chunk of work.

## Open questions (don't re-ask, don't guess — see CLAUDE.md for full context)

- $650 vs $800 "with Sponsorship" fee tier meaning — unresolved. Rule book confirms $650 but doesn't mention the second tier at all.
- Minors' public profile scope — flagged, not resolved.

## Next up

1. Finish the domain: buy it if not done, then Email Routing/Zoho for `mail@crickitinterleague.org`, add the domain in Vercel → Settings → Domains, Resend domain verification, Cloudflare Turnstile.
2. Wire up Cloudflare Turnstile on the registration form (code side — keys can be generated any time per step 1 above, but the form doesn't call it yet).
3. Wire up Resend for the two confirmation emails (also code side).
4. Magic-link admin auth + a minimal console to list/approve/export registrations.
