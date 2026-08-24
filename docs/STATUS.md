# Status

Living doc. Update this whenever you finish a session's work so the next person (or their Claude session) can pick up without re-deriving context. Keep it short — link to `CLAUDE.md` and `docs/architecture.md` for anything that doesn't change often.

## Where we are

**Deployed to Vercel.** Landing page (Phase 1a content) renders live on the `*.vercel.app` URL; registration form is wired to a real database write, but two integration points are still stubs (see below), and the database itself is still a placeholder — submitting the form will 500 until Neon is real.

## Done

- Architecture proposal drafted and reviewed with the committee — two rounds of Q&A, plus the previous season's rule book, folded in (`docs/architecture.md`).
- GitHub org (`crickit-league`) and repo (`cil-web`) created.
- Landing page design mockup built and approved (`mockups/landing-page.html`).
- **Next.js scaffold** (App Router, TypeScript strict, Tailwind v4, ESLint, Prettier) with the mockup's design tokens (Big Shoulders / Libre Franklin / IBM Plex Mono, the pitch/clay/gold palette) wired into `src/app/globals.css` + `src/app/layout.tsx`.
- Landing page ported to real React components (`src/components/sections/*`), served from the `(public)` route group.
- **Prisma schema** for what Phase 1a actually needs — `Season`, `Registration` (`prisma/schema.prisma`). The rest of the domain model in architecture.md §6 lands incrementally as Phase 1b/2/3 features are actually built, not ahead of them.
- Prisma 7 + `@prisma/adapter-neon` configured (`prisma.config.ts`, `src/lib/db/prisma.ts`) — client generates cleanly with a placeholder `.env`, not yet pointed at a real Neon database.
- Registration form (`src/app/(public)/registration-form.tsx`) is a real client component with a server action (`actions.ts`) that validates with Zod and writes to Postgres via the service layer (`src/lib/services/registrations.ts`) — genuinely functional the moment `DATABASE_URL`/`DATABASE_URL_UNPOOLED` point at a real database.
- CI workflow (`.github/workflows/ci.yml`): format check, lint, typecheck, build on every push/PR.
- `npm run format|lint|typecheck|build` all pass clean as of this writing.
- **Vercel project live**, deployed under the `crickit-league` Team (not a personal account), tracking `main`. `DATABASE_URL`/`DATABASE_URL_UNPOOLED` are set to placeholder values there so builds succeed — real values still needed (see Blocking).
- Domain decided: `crickitinterleague.org`, being purchased via Cloudflare Registrar (signed up with a personal email to sidestep the CILcommittee@gmail.com access problem — see `docs/service-setup.md` for why).

## Blocking

- **Real Neon database** — `.env` / Vercel env vars have placeholder values only. Registration form will 500 until `DATABASE_URL`/`DATABASE_URL_UNPOOLED` are real and a `Season` row with `status: REGISTRATION_OPEN` exists. This no longer depends on the domain — do it any time.
- **Domain DNS/mail** — once `crickitinterleague.org` is purchased, still need: Cloudflare Email Routing (or Zoho) for `mail@crickitinterleague.org`, the domain added to Vercel, and Resend/Turnstile set up against it. See `docs/service-setup.md`.

## Explicitly not done yet — don't assume otherwise

- **No bot protection** on the registration form (Cloudflare Turnstile) — flagged with a `TODO` in `actions.ts`. Needed before this goes live.
- **No confirmation/payment-reminder email** (Resend) — also `TODO`'d in `actions.ts`. See architecture.md §9 for the two-separate-emails design (submission receipt vs. post-approval invite).
- **No admin console, no auth** (magic links). Nobody can currently approve/reject a submitted registration except by querying the database directly. This is the next major chunk of work.
- **No seed script.** The dev database (once one exists) has no data in it — including no `Season` row, so the registration form has nothing to attach to.

## Open questions (don't re-ask, don't guess — see CLAUDE.md for full context)

- $650 vs $800 "with Sponsorship" fee tier meaning — unresolved. Rule book confirms $650 but doesn't mention the second tier at all.
- Minors' public profile scope — flagged, not resolved.

## Next up

1. **Neon** ([docs/service-setup.md](service-setup.md) §3) — set up the real database, put real values in Vercel's env vars, redeploy.
2. A seed script / manual insert: at minimum one `Season` row with `status: REGISTRATION_OPEN`, otherwise the form has nothing to attach to even with a real database.
3. Finish the domain: buy it if not done, then Email Routing/Zoho for `mail@crickitinterleague.org`, add the domain in Vercel → Settings → Domains, Resend domain verification, Cloudflare Turnstile.
4. Wire up Cloudflare Turnstile on the registration form (code side — keys can be generated any time per step 3 above, but the form doesn't call it yet).
5. Wire up Resend for the two confirmation emails (also code side).
6. Magic-link admin auth + a minimal console to list/approve/export registrations.
