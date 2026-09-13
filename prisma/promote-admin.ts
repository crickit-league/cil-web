import "dotenv/config";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@/generated/prisma";

// Grants (or confirms) a role for an email address. Since auth is
// magic-link only (no passwords), this is how the first admin accounts get
// created — the User row is upserted here rather than waiting for a first
// sign-in, so the role exists before anyone clicks a link.
//
// SUPER_ADMIN is CLI-only, deliberately — the admin console's "manage
// admins" section (docs/architecture.md §7) can only grant/revoke ADMIN,
// not the higher role, so the first super admin has to come from here.
async function main() {
  const rawEmail = process.argv[2];
  const rawRole = process.argv[3] ?? "ADMIN";

  if (!rawEmail) {
    console.error("Usage: npm run admin:promote -- <email> [ADMIN|SUPER_ADMIN]");
    process.exitCode = 1;
    return;
  }

  if (rawRole !== "ADMIN" && rawRole !== "SUPER_ADMIN") {
    console.error(`Invalid role "${rawRole}" — must be ADMIN or SUPER_ADMIN.`);
    process.exitCode = 1;
    return;
  }
  const role: Role = rawRole;

  // Auth.js normalizes the email to lowercase before matching a user on
  // sign-in, so the seeded row must already be lowercase or a duplicate
  // User gets created on first login instead of getting this role.
  const email = rawEmail.toLowerCase();

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const existing = await prisma.userRole.findFirst({
    where: { userId: user.id, role, scopeType: "GLOBAL" },
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId: user.id, role } });
  }

  console.log(`Granted ${role} to ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
