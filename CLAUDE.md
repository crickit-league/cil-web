# CIL Web — Working Notes for Claude

CIL Winter League (Metro Atlanta, T15 format) portal: registration, fixtures, scorecards, standings, and a multi-season archive back to 2013. Read [docs/architecture.md](docs/architecture.md) first — it has the full stack rationale, phasing, domain model, and risks. Read [docs/STATUS.md](docs/STATUS.md) every session — it's the living "what's actually done, what's next" doc; this file is stable background, that one changes daily.

Also see [AGENTS.md](AGENTS.md) — Next.js-version-specific framework notes, auto-maintained by `next dev`. That file, not this one, is where breaking-change warnings for the installed Next.js version live.

## Stack (see architecture.md §2/§4 for why)

Next.js App Router + TypeScript, Postgres on Neon via Prisma, magic-link + 6-digit-code auth (Auth.js v5), Cloudflare R2 for files, Resend for email, Vercel Cron for scheduled jobs, Tailwind + shadcn/ui. One repo, no microservices, no custom infra.

## The one structural rule that matters

**All business logic lives in `src/lib/services/*`**, framework-agnostic. Pages, server actions, cron routes, and the future `/api/v1` mobile surface all call the same functions — never put permission checks or business logic directly in a page or route handler.

- **Permissions**: explicit `can(user, action, resource)` checks in the service layer, not database row-level security. Never rely on a hidden UI button.
- **Validation**: Zod schemas in `lib/validation/`, shared client and server. Never trust a form.
- **Types**: `strict: true`, no `any`.
- **Migrations**: Prisma migrations committed to git. Nobody edits the production DB by hand.
- **Prisma 7**: connection URLs live in `prisma.config.ts` / env, not in `schema.prisma`'s `datasource` block — that's a Prisma 7 breaking change from what the original architecture doc assumed. The runtime client uses `@prisma/adapter-neon` (`src/lib/db/prisma.ts`) against pooled `DATABASE_URL`; Migrate uses unpooled `DATABASE_URL_UNPOOLED`. Generated client output is `src/generated/prisma` (gitignored), imported via `@/generated/prisma`.
- **Stats are derived, never hand-typed** — rebuilt from scorecards after every import — with one deliberate exception: `standings_adjustments` for committee-issued penalties (see below). Never overwrite that table from an import.
- **Mobile-first, no exceptions** — every page, including internal/admin ones, must be checked at phone width before it's done. A table with more than ~3 columns is not a mobile layout on its own: render a stacked-card view below the `sm` breakpoint and the table at `sm` and up (`sm:hidden` / `hidden sm:block`), don't just let it scroll horizontally. See `(admin)/admin/page.tsx` and `admin-management.tsx` for the pattern.

## Facts that shape the data model — confirmed by the committee, don't re-litigate

- **Season structure**: 2 pools (A/B), one competition per season, T15, up to 10 league-stage matches/team, top 6 per pool advance to playoffs.
- **Points**: win = 2, tie = 1 each, no result = 1 each. NRR stored to 4 decimal places.
- **Standings tie-break is a 5-level cascade**, not a sort: points → NRR → head-to-head → most wins among tied teams → most wickets taken → random draw. Needs dedicated test cases — getting this wrong seeds the playoffs wrong.
- **Playoff bracket is fully specified** (top 2/pool direct to QF; 3rd–6th play pre-quarter-finals; specific cross-pool QF/SF/Final pairing) — see architecture.md §1.2 for the exact bracket. Don't re-ask the committee about this.
- **Player ↔ team binding is 1:1 per season** — no mid-season moves, no free-agent flow needed (handled in CricClubs already).
- **Roster cap is 22; new players must be added by Friday to be eligible that weekend** — recurring weekly deadline, not one-time. Soft warning on the captain's roster screen, not necessarily a hard gate.
- **Import cadence**: CricClubs scores are expected finalized by the Monday after a weekend's matches. Weekly import job should run Monday evening/Tuesday morning.
- **Contact visibility**: a captain sees/edits their own team's player emails/phones; other captains and the public never do; committee sees everything. Umpire phone visible only to the two teams in that fixture, once logged in.
- **Auth**: magic link or a 6-digit code (same underlying token, just short-form — for signing in on a different device than the one the email arrived on), via Auth.js v5 with database sessions. No passwords. Google sign-in can be added later without breaking anything (email is the identity key) — don't build around that assumption prematurely, just don't paint against it either. **No rate-limiting yet on repeated wrong-code guesses** — a known gap, not an oversight; see `docs/STATUS.md`.
- **Roles**: `UserRole` is a separate table (`userId, role, scopeType, scopeId`), not an enum on `User` — captain/player roles will need to be scoped to a specific team-season later, and retrofitting that onto an enum means a migration and a rewrite. Only `GLOBAL`-scoped `ADMIN`/`SUPER_ADMIN` exist today. **Managing admins (grant/revoke) is `SUPER_ADMIN`-only**, per the role table in architecture.md §7 — a plain `ADMIN` is scoped to one season of operational work, not to granting access itself. The admin console's "manage admins" section can only grant/revoke `ADMIN`; `SUPER_ADMIN` is CLI-only via `npm run admin:promote -- <email> SUPER_ADMIN`.

## Still genuinely open — don't guess, ask the user/committee

- **Fee tiers**: $650 standard vs $800 "with Sponsorship" — meaning unconfirmed. The registration form ships **without** a fee-tier selector until this is resolved.
- **Minors' public profile scope**: current default is full public profile (name/photo/stats) for every player regardless of age. This was a working call, not a confirmed legal sign-off — flag before Phase 2 player pages ship, don't just build it silently.

## Admin/org facts

5 admin accounts. Shared inbox `CILcommittee@gmail.com` (existing Gmail, not yet on the branded domain). Domain not purchased as of last check — see STATUS.md for current state.

## External services

Every third-party account (Cloudflare, Vercel, Neon, Resend, Turnstile, Sentry) and how to generate its keys is documented in [docs/service-setup.md](docs/service-setup.md) — go there before creating a new account for something the project already depends on.
