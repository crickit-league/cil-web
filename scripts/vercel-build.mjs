#!/usr/bin/env node
// Runs `prisma migrate deploy` automatically for Preview/Dev builds, never
// for Production. Vercel sets VERCEL_ENV to "production" only for deploys
// from the Production Branch (this project's `production` git branch, per
// docs/service-setup.md §3) — every other branch, including the persistent
// `main` deploy and every PR, is "preview". Production stays a deliberate,
// manually-run migration: see docs/service-setup.md for why.
import { execSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;

if (!vercelEnv) {
  console.log("[vercel-build] Not a Vercel build (VERCEL_ENV unset) — skipping automatic migration.");
} else if (vercelEnv === "production") {
  console.log("[vercel-build] VERCEL_ENV=production — skipping automatic migration. Run it manually.");
} else {
  console.log(`[vercel-build] VERCEL_ENV=${vercelEnv} — running prisma migrate deploy.`);
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
