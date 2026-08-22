# Crick-It Inter League

Metro Atlanta's weekend cricket league. Registration, fixtures, scorecards, and a multi-season
archive going back to 2013.

- Read [`CLAUDE.md`](./CLAUDE.md) first for working conventions and confirmed league facts.
- Read [`docs/architecture.md`](./docs/architecture.md) for the full stack rationale, phasing, and domain model.
- Read [`docs/STATUS.md`](./docs/STATUS.md) for what's currently done and what's next.

## Getting started

```bash
npm install
cp .env.example .env   # fill in real Neon connection strings when you have them
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command                           | Does                                                            |
| --------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                     | Start the dev server                                            |
| `npm run build`                   | Production build                                                |
| `npm run lint`                    | ESLint                                                          |
| `npm run typecheck`               | `tsc --noEmit`                                                  |
| `npm run format` / `format:check` | Prettier                                                        |
| `npm run db:generate`             | Regenerate the Prisma client after a schema change              |
| `npm run db:migrate`              | Create/apply a migration (needs a real `DATABASE_URL_UNPOOLED`) |
| `npm run db:studio`               | Prisma's DB browser GUI                                         |

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS v4, Prisma 7 + Postgres (Neon, via
`@prisma/adapter-neon`), Zod validation. See `docs/architecture.md` §2/§4 for why.
