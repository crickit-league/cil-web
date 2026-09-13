# External Service Setup

Step-by-step account creation and key generation for every external service the site depends on, in the order you actually need them. Each section says **who should create the account**, **how**, **what to copy where**, and **who else needs access**.

General rule for all of these: use `CILcommittee@gmail.com` as the account email wherever the service allows it and you actually have access to that inbox — every signup sends a verification link you have to click, so don't use an address you can't personally check _right now_, even if it's the "right" long-term address. Use your own email to get through signup, then invite the other admins / hand off ownership once the domain-based address (`mail@crickitinterleague.org`, once set up below) or the committee inbox is reachable. Turn on two-factor authentication on every one of these regardless of which email created it.

Copy `.env.example` to `.env` and fill in values as you go. Never commit `.env` — it's already gitignored.

---

## 1. Domain (Cloudflare Registrar)

**Blocking everything else below.** Do this first. Domain: `crickitinterleague.org` (the purchasable name is the root/apex — `www.crickitinterleague.org` is a subdomain of it, set up as a DNS record afterward, not bought separately).

1. Go to [cloudflare.com](https://cloudflare.com) → **Sign up**, using **an email you have access to right now** — not necessarily `CILcommittee@gmail.com`. Every signup here sends a verification link; if you can't click it immediately, you're stuck. Use your own email to get through this today, and hand off/add the committee later (see step 5).
2. Enable 2FA immediately: **My Profile → Authentication → 2-Step Verification**.
3. **Domain Registration → Register a Domain** → search `crickitinterleague.org`, complete the purchase (Cloudflare sells at cost, no markup — typically ~$15–20/yr for `.org`).
4. Once purchased, the domain's zone is automatically created in your Cloudflare account — you don't need a separate "add site" step.
5. **Invite the other admins**: **Manage Account → Members → Invite Member**, one per admin, role **Administrator**. Do this as soon as any of them are reachable — don't leave the account tied to one person's login longer than necessary.

Nothing to put in `.env` yet — this step just gets you a domain and a Cloudflare account, both of which the next steps build on.

### Email Routing — get `mail@crickitinterleague.org` working immediately

This is receive-and-forward only — see the note below before assuming it's a full mailbox. Do this right after buying the domain, same session — it's what solves the "I don't have access to the committee inbox" problem.

1. Cloudflare dashboard → your domain → **Email → Email Routing → Get started**.
2. Cloudflare adds the necessary MX and TXT records to your DNS automatically (no manual DNS editing needed for this part, unlike the Resend records in step 4).
3. **Destination addresses** → add the destination inbox → verify it (Cloudflare emails a confirmation link there). This has since been switched over to `CILcommittee@gmail.com` (originally set up with a personal email to get through verification immediately — see general rule above — then swapped once the committee inbox was reachable); no other steps below need to change when the destination changes.
4. **Routing rules → Create address** → custom address `mail@crickitinterleague.org` (also worth adding `registration@`, `admin@` while you're in here) → action **Send to** → the verified destination address.
5. From this point on, `mail@crickitinterleague.org` is a real, working address — that's the one to use as the practical committee address going forward, independent of whether anyone ever gets into the old Gmail.

**What this does and doesn't do:** mail sent _to_ `mail@crickitinterleague.org` now lands in `CILcommittee@gmail.com`. Replying still shows the sender as `CILcommittee@gmail.com`, not `mail@crickitinterleague.org` — Cloudflare Email Routing doesn't provide the SMTP credentials needed for a "Send mail as" setup. If the committee wants replies to genuinely come from `mail@crickitinterleague.org`, use the Zoho path below instead. Neither is needed for Phase 1a — the confirmation/approval emails the app sends are automated via Resend regardless, not sent by a human from this inbox.

**Telling the aliases apart in Gmail:** since `mail@`, `admin@`, and `registration@` all forward into the same `CILcommittee@gmail.com` inbox, the original alias is only preserved in the `To:` header — set up one Gmail filter per alias to label them apart: Gmail search bar → dropdown arrow → **To** field → the alias (e.g. `admin@crickitinterleague.org`) → **Create filter** → **Apply the label** (new label per alias) → **Create filter**. Repeat for each of the three.

### Zoho Mail (free) — a real mailbox instead of forwarding

**Choose this or Email Routing above, not both** — receiving mail for a domain is controlled by its MX records, and only one mail service can be authoritative there at a time. Cloudflare stays the domain registrar and DNS host either way — Zoho doesn't need to sell or host the domain, it just needs you to point a few DNS records at it, same as Resend does for sending in step 4 below.

1. Go to [zoho.com/mail](https://zoho.com/mail) → **Sign Up Now** → **Business Email** (this is the free-eligible path; there's also a separate personal Zoho Mail that doesn't support custom domains) → enter `crickitinterleague.org`, using an email you can verify right now as the account owner. Pick the **Forever Free Plan** (up to 5 users, 5GB/user, 25MB attachments).
2. **Verify domain ownership**: Zoho gives you a TXT record → add it in **Cloudflare → DNS → Records** (proxy status **DNS only**). Click verify in Zoho once it's added.
3. **Add MX records**: Zoho shows three MX records with priorities → add all three in Cloudflare DNS, same as above (**DNS only**, not proxied). This is the step that makes Zoho — not Cloudflare Email Routing — the domain's mail receiver, so skip or remove the Email Routing setup above if you go this route.
4. Zoho also asks for an SPF TXT record and a DKIM CNAME/TXT record — add both the same way. This matters for deliverability of anything sent _from_ Zoho, separately from the Resend records in step 4 below (those are for the app's automated email, not this human mailbox).
5. **Create users**: Zoho admin console → **Users → Add User** → one per admin, e.g. `mail@crickitinterleague.org`, `naren@crickitinterleague.org`. Each is a real mailbox with its own login, reachable via Zoho's webmail, IMAP/POP (so it can be added to the Gmail app or Outlook if someone prefers that interface), and Zoho's mobile apps.

---

## 2. Vercel (hosting)

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub**, and authorize it against the `crickit-league` GitHub org (not a personal GitHub account) so the Vercel project is owned by the org's login, not one person's.
2. **Add New → Project** → import `crickit-league/cil-web`.
3. Framework preset should auto-detect as Next.js — accept the defaults.
4. **Don't deploy yet** — it'll fail without a real `DATABASE_URL`. Come back to this after step 3 (Neon) and step 4 (Resend), then trigger a deploy from the Vercel dashboard or just push to `main`.
5. Once you have real values for every variable in `.env.example`, add them under **Project Settings → Environment Variables**. See §3's branch topology note for exactly which scope each one belongs in — it's not simply "Production and Preview."
6. Invite the other admins: **Team Settings → Members → Invite**.
7. Decide on Hobby vs. Pro (see `docs/architecture.md` §12 for the licensing nuance — Hobby is technically for non-commercial use, and this site collects registration fees). If the committee has any budget, Pro ($20/mo) is the clean answer.

### Two git branches, one deliberate release gate

This repo uses `main` for everyday work and a separate `production` branch as the actual release gate — not the Vercel default of deploying `main` straight to Production.

1. **Settings → Git → Production Branch** → change it from `main` to **`production`**.
2. From then on: PRs merge into `main` as normal. `main` itself gets redeployed automatically on every merge, but as a **Preview** deployment (not Production) — Vercel gives it a stable, persistent URL (`cil-web-git-main-<team>.vercel.app`) that's effectively "the dev site."
3. **To release to production**: merge `main` into `production` (open a PR from `main` → `production`, or fast-forward-merge it) whenever you're ready. That push is what triggers the real Production deployment. This gives you an actual reviewable diff of what's shipping, and a permanent git record of every release.

Nothing to put in `.env` — Vercel holds its own copy of these variables separately from your local `.env`.

### Migrations run automatically on Preview/Dev, never on Production

`scripts/vercel-build.mjs` runs before `next build` (see the `build` script in `package.json`) and checks `VERCEL_ENV`, which Vercel sets for every deployment:

- `preview` — covers both PR branches and the persistent `main` deploy, since only the `production` git branch is scoped as Vercel's Production environment (see above). `prisma migrate deploy` runs automatically against that deployment's Neon branch.
- `production` — the script skips migrating and logs that it did. Applying a migration to real registrant data is a deliberate, manually-run step: pull that deployment's real `DATABASE_URL_UNPOOLED` (`vercel env pull`) and run `npx prisma migrate deploy` against it yourself, on purpose, not as a side effect of merging code.

This exists because every PR gets a freshly auto-created Neon branch (per the branch topology above) with no guarantee it already has whatever's in `prisma/migrations` — auto-migrating Preview means you never have to remember to do it by hand for a database nothing real depends on, while Production keeps a human in the loop.

---

## 3. Neon (Postgres database)

1. Go to [neon.tech](https://neon.tech) → **Sign up**, using `mail@crickitinterleague.org` once it exists (or your own email until then) — or sign in with the Vercel-linked GitHub org, since Neon has a native Vercel integration (see step 5).
2. **Create a project** → name it `cil-web`, pick a region close to Atlanta (`us-east-1` / `aws-us-east-1`).
3. Neon creates a default database and gives you a connection string immediately on the project dashboard.
4. You need **two** connection strings:
   - **Pooled** (for the app at runtime) → shown by default on the dashboard, has `-pooler` in the hostname. Copy this into `.env` as `DATABASE_URL`.
   - **Unpooled / direct** (for migrations) → toggle "Pooled connection" off on the same screen, or find it under **Connection Details**. Copy this into `.env` as `DATABASE_URL_UNPOOLED`.
5. **Recommended shortcut**: instead of copying these by hand into Vercel, install the [Neon Vercel integration](https://vercel.com/integrations/neon) from the Vercel dashboard — it creates the project and injects env vars into your Vercel project automatically. **Read the branch-naming note below before trusting which env var goes where.**
6. Invite the other admins: **Project Settings → People → Invite**.
7. Once real values are in `.env`, run:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   This creates the actual `seasons` / `registrations` tables from `prisma/schema.prisma`.

### Branch topology — read this before touching any DATABASE_URL scope

This took three separate rounds of "the form works but the data isn't where I expected" to get right (see git history 2026-08-26). Don't re-derive it by trial and error.

**How Neon's native Vercel integration actually behaves**, once installed via **Vercel dashboard → Settings → Integrations** (or found from the Neon console side under the project's **Integration → Vercel integration** tab if it's not obvious in Vercel's UI — it can live in either place depending on how it was installed):

- Neon's project **Default branch** (named `production` from when the project was first created) is **permanently, statically** mapped to whatever git branch is configured as Vercel's **Production Branch** — that's `production`, per the two-branch setup in §2. This mapping is not something you configure per env-var; it's how the integration works.
- **Every other Vercel branch — including `main`, and every PR branch — automatically gets its own fresh Neon branch**, created on first deploy. Neon console → your project → **Settings → Integrations → Vercel integration → Branches** lists these.
- Ephemeral PR branches get auto-deleted when their git branch is merged or deleted (**Automation workflows → Automatically delete obsolete Neon branches**, on by default). `main` never merges or gets deleted, so its Neon branch is effectively **permanent** — that's `preview/main`, and it's what we're using as _the_ stable dev database, not a name we chose ourselves.
- **The integration injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED` dynamically per branch**, and a branch-specific entry (e.g. scoped to "Preview · main") always wins over a broader one (e.g. "All Pre-Production Environments"). **Do not manually create or widen a general Preview/Development-scoped `DATABASE_URL`** — it will look like it's doing something, silently get overridden by the integration's branch-specific entry, and produce exactly the "works but writes to the wrong place" symptom that cost us three rounds of debugging. Let the integration own Preview/Development entirely; only Production's env vars should ever be hand-managed.

**Current, correct state:**

| Environment       | Vercel              | Neon                                           | Managed by                                                               |
| ----------------- | ------------------- | ---------------------------------------------- | ------------------------------------------------------------------------ |
| Production        | `production` branch | `production` (Default)                         | Manual — the only hand-set `DATABASE_URL`                                |
| Dev (persistent)  | `main` branch       | `preview/main`                                 | Neon integration, automatic                                              |
| PR previews       | any other branch    | auto-created per branch, auto-deleted on merge | Neon integration, automatic                                              |
| Local development | —                   | `preview/main`                                 | Manual — copy `preview/main`'s connection strings into your local `.env` |

**Local dev must never point at the `production` branch.** Copy `preview/main`'s pooled/unpooled connection strings from the Neon console into your local `.env` instead — that way nobody's local testing (including ad-hoc scripts, `prisma migrate reset`, etc.) can touch real registrant data. There's no automatic sync for this; if Neon ever rotates or recreates `preview/main`, everyone's local `.env` needs a manual refresh.

If you're troubleshooting "data isn't where I expected": check the _hostname_ in whichever `DATABASE_URL` is actually active (Neon gives each branch a distinct `ep-xxxx` hostname) before assuming the application code is wrong — in every case so far, it wasn't.

### PR preview branches start with production's data, not preview/main's — resetting them is manual, on purpose

Neither of Neon's Vercel integration modes lets you choose which branch a new PR preview branch forks from — it's always Neon's project **default branch** (`production` here), never `preview/main`. There's no setting for this; confirmed against Neon's own docs. So a fresh PR preview branch starts out looking like production (real registrant data, or whatever's actually there), not like the seeded dev data on `preview/main`.

**Do not "fix" this by making `preview/main` the Neon default branch** — Vercel's Production environment is wired to Neon's default branch specifically (not by name), so that change would point real Production traffic at the dev database.

Instead, `.github/workflows/reset-preview-branch.yml` is a manually-triggered (`workflow_dispatch`) action that resets one branch's data to match another's, via Neon's branch-restore API — copy-on-write, so it's fast regardless of data size. It's deliberately not automatic: an auto-reset on every push would wipe out whatever a reviewer was testing on that PR's preview between commits. To run it: **Actions tab → Reset Neon Preview Branch → Run workflow**, enter the PR's Neon branch name (e.g. `preview/my-feature` — check the exact name in the Neon console) as the target; it defaults to copying from `preview/main`. It refuses to target `production` or `preview/main` itself, and always preserves the target's prior state as a new branch first, in case the reset wasn't what you wanted.

Needs two things added once, under **Settings → Secrets and variables → Actions**:

- Secret `NEON_API_KEY` — Neon console → Account/Project Settings → API Keys → create one.
- Variable `NEON_PROJECT_ID` — Neon console → Project Settings → General.

---

## 4. Resend (transactional email)

Needs the domain from step 1 to be live in Cloudflare first.

1. Go to [resend.com](https://resend.com) → **Sign up**, using `mail@crickitinterleague.org` once it exists (or your own email until then).
2. **Domains → Add Domain** → enter your domain (or a subdomain like `mail.crickitinterleague.org`, which is the recommended pattern so bulk mail doesn't affect deliverability for anyone using the root domain for anything else).
3. Resend shows you a handful of DNS records (SPF via TXT, DKIM via TXT, and a return-path/MX record). Add each one in **Cloudflare → DNS → Records** for the same domain. Leave proxy status **DNS only** (grey cloud, not orange) on these records — a proxied MX/TXT record breaks mail.
4. Back in Resend, click **Verify DNS Records** — propagation is usually fast (minutes) but can take longer; don't be surprised if it takes a few hours.
5. Once verified: **API Keys → Create API Key**, name it `cil-web-production`, permission **Sending access**, restricted to the domain you just verified. Copy the key (starts with `re_`) — Resend only shows it once.
6. Put it in `.env` as `RESEND_API_KEY`. Add the same key to Vercel's environment variables (step 2.5).
7. Invite the other admins: **Settings → Team → Invite**.

This unblocks the two `TODO`s in `src/app/(public)/actions.ts` — the submission receipt/payment-reminder email and, later, the approval/invite email.

---

## 5. Cloudflare Turnstile (bot protection on the registration form)

Same Cloudflare account as step 1 — no new signup.

1. Cloudflare dashboard → **Turnstile → Add a site**.
2. Domain: your registered domain. Widget mode: **Managed** (Cloudflare picks the right challenge level automatically — the least annoying option that still works).
3. This gives you two keys:
   - **Site key** (public, safe to expose in client code) → `.env` as `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
   - **Secret key** (server-side only, verifies the response) → `.env` as `TURNSTILE_SECRET_KEY`.
4. Add both to Vercel's environment variables too.

Not wired into the code yet — this just gets the keys ready for when it is (see `docs/STATUS.md`).

---

## 6. Auth (magic links)

The architecture doc calls for magic-link auth via **Auth.js**, which is free and self-hosted — it needs no external account, just a secret your app signs sessions with. (Clerk is the paid alternative if the committee later wants managed auth instead; skip this section and sign up at [clerk.com](https://clerk.com) if so.)

1. Generate a secret:
   ```bash
   npx auth secret
   ```
   (Or `openssl rand -base64 32` if you don't want to run the Auth.js CLI.)
2. Put it in `.env` as `AUTH_SECRET`, and add it to Vercel's environment variables. **This one is a genuine secret** — a leaked `AUTH_SECRET` lets someone forge sessions, unlike the Turnstile site key or a database connection string that's already access-controlled elsewhere.

Not wired into the code yet — Phase 1b's admin console is what actually uses this (see `docs/STATUS.md`).

---

## 7. Sentry (error tracking) — optional for now, cheap to set up early

1. Go to [sentry.io](https://sentry.io) → **Sign up**, using `mail@crickitinterleague.org` once it exists (or your own email until then).
2. **Create Project** → platform **Next.js** → name it `cil-web`.
3. Sentry's setup wizard gives you a **DSN** — put it in `.env` as `SENTRY_DSN`, and add it to Vercel.
4. Free tier (5k errors/month) is comfortably enough at this scale.
5. Invite the other admins: **Settings → Members → Invite**.

---

## Summary: what ends up in `.env`

| Variable                         | Source               | Needed for              |
| -------------------------------- | -------------------- | ----------------------- |
| `DATABASE_URL`                   | Neon (pooled)        | App runtime             |
| `DATABASE_URL_UNPOOLED`          | Neon (direct)        | Migrations              |
| `RESEND_API_KEY`                 | Resend               | Email sending           |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile | Bot protection (client) |
| `TURNSTILE_SECRET_KEY`           | Cloudflare Turnstile | Bot protection (server) |
| `AUTH_SECRET`                    | Generated locally    | Session signing         |
| `SENTRY_DSN`                     | Sentry               | Error tracking          |

Everything above also needs to be added to **Vercel → Project Settings → Environment Variables** separately — your local `.env` and Vercel's copy are independent.
