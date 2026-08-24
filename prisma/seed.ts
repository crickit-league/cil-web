import "dotenv/config";
import { prisma } from "@/lib/db/prisma";

async function main() {
  const season = await prisma.season.upsert({
    where: { id: "2026-27" },
    update: {},
    create: {
      id: "2026-27",
      name: "2026-27",
      status: "REGISTRATION_OPEN",
      registrationOpensAt: new Date("2026-08-31T00:00:00-04:00"),
      registrationClosesAt: new Date("2026-09-30T23:59:59-04:00"),
    },
  });

  console.log("Seeded season:", season);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
