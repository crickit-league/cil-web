import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

// Grants (or confirms) the ADMIN role for an email address. Since auth is
// magic-link only (no passwords), this is how the first admin accounts get
// created — the User row is upserted here rather than waiting for a first
// sign-in, so the role exists before anyone clicks a link.
async function main() {
  const rawEmail = process.argv[2];
  if (!rawEmail) {
    console.error("Usage: npm run admin:promote -- <email>");
    process.exitCode = 1;
    return;
  }
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
    where: { userId: user.id, role: "ADMIN", scopeType: "GLOBAL" },
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId: user.id, role: "ADMIN" } });
  }

  console.log(`Granted ADMIN to ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
