# Status

Living doc. Update this whenever you finish a session's work so the next person (or their Claude session) can pick up without re-deriving context. Keep it short — link to `CLAUDE.md` and `docs/architecture.md` for anything that doesn't change often.

## Where we are

**Phase 1a not started yet.** Repo just created (`crickit-league/cil-web`), architecture doc and rule-book analysis done, nothing built.

## Done

- Architecture proposal drafted and reviewed with the committee — two rounds of Q&A folded in (`docs/architecture.md`).
- Previous season's rule book reviewed — playoff bracket, points/tie-break rules, and several operational rules (roster deadline, penalty-adjustment mechanism, import cadence) confirmed and folded into the architecture doc.
- GitHub org (`crickit-league`) and repo (`cil-web`) created.

## Blocking

- **Domain not purchased yet.** Nothing in email verification (Resend/SPF/DKIM/DMARC) can start until this lands. Was targeted for "this week" as of 2026-08-21 — check current status before assuming it's still pending.

## Open questions (don't re-ask, don't guess — see CLAUDE.md for full context)

- $650 vs $800 "with Sponsorship" fee tier meaning — unresolved.
- Minors' public profile scope — flagged, not resolved.

## Next up

1. Domain purchase → DNS/email auth setup.
2. Repo scaffold: Next.js + TypeScript + Prisma schema for seasons/registrations/users, CI, Vercel + Neon wired up.
3. Landing page + registration form (Phase 1a scope — see architecture.md §10). Deliberately frozen scope, must ship before Aug 31.
