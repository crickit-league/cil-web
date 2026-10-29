import type { PrismaClient } from "@/generated/prisma";
import { splitGroundName } from "@/lib/grounds";
import { normalizeName } from "@/lib/import/cricclubs-matches";

// The league's grounds and fields, as CricClubs names them ("Harrison Field 6")
// with the ground's address. Names are split into ground + field with the same
// rule the schedule import uses, so an import finds these rows instead of
// creating duplicates. Safe to re-run: existing grounds and fields are kept, and
// an address is only filled in when the ground has none.
// CricClubs abbreviates two grounds; the site shows their full names. An import
// still says "ERP 1", so each of their fields also gets an alias (a NameAlias
// row) from the CricClubs spelling, which the schedule import checks first.
const FULL_GROUND_NAMES: Record<string, string> = {
  ERP: "East Roswell Park",
  RAP: "Roswell Area Park",
};

const FIELDS: { name: string; address: string | null }[] = [
  { name: "ERP 1", address: "9000 Fouts Rd, Roswell, GA 30076" },
  { name: "ERP 4", address: "9000 Fouts Rd, Roswell, GA 30076" },
  { name: "Harrison Field 2", address: "2653 Shallowford Rd, Marietta, GA 30066" },
  { name: "Harrison Field 6", address: "2653 Shallowford Rd, Marietta, GA 30066" },
  { name: "Harrison Field 7", address: "2653 Shallowford Rd, Marietta, GA 30066" },
  { name: "Hembree Park 6", address: "850 Hembree Rd, Roswell, GA 30076" },
  { name: "Larry Bell", address: "520 Fairground St SE, Marietta, GA 30060" },
  { name: "Lions Park", address: "Lions Park, Mableton, GA 30126" },
  { name: "Nickajack Park 2", address: "3630 Oakdale Road, Mableton, GA 30126" },
  { name: "Nickajack Park 3", address: "3630 Oakdale Road, Mableton, GA 30126" },
  { name: "Ocee Park 3", address: null },
  { name: "RAP 2", address: "10495 Woodstock Rd, Roswell, GA 30075" },
  { name: "RAP 3", address: "10495 Woodstock Rd, Roswell, GA 30075" },
  { name: "Shakerag Park 1", address: "10945 Rogers Cir, Johns Creek, GA 30097" },
  { name: "Skip Wells Park 2", address: "2334 Bells Ferry Rd, Marietta, GA 30066" },
  { name: "Skip Wells Park 3", address: "2334 Bells Ferry Rd, Marietta, GA 30066" },
  { name: "Terrell Mill Park", address: "480 Terrell Mill Road SE, Marietta, GA 30067" },
];

/** A ground an earlier import created under its CricClubs abbreviation keeps its fields and matches when renamed. */
async function renameGround(prisma: PrismaClient, from: string, to: string) {
  const [old, target] = await Promise.all([
    prisma.ground.findUnique({ where: { name: from } }),
    prisma.ground.findUnique({ where: { name: to } }),
  ]);
  if (old && !target) await prisma.ground.update({ where: { id: old.id }, data: { name: to } });
}

export async function seedGrounds(prisma: PrismaClient) {
  let fields = 0;
  for (const { name, address } of FIELDS) {
    const { ground: cricClubsGround, label } = splitGroundName(name);
    const groundName = FULL_GROUND_NAMES[cricClubsGround] ?? cricClubsGround;
    if (groundName !== cricClubsGround) await renameGround(prisma, cricClubsGround, groundName);
    const ground = await prisma.ground.upsert({
      where: { name: groundName },
      update: {},
      create: { name: groundName, address },
    });
    if (address && !ground.address) {
      await prisma.ground.update({ where: { id: ground.id }, data: { address } });
    }
    const field = await prisma.field.upsert({
      where: { groundId_label: { groundId: ground.id, label } },
      update: {},
      create: { groundId: ground.id, label },
    });
    if (groundName !== cricClubsGround) {
      await prisma.nameAlias.upsert({
        where: { rawName: normalizeName(name) },
        update: { fieldId: field.id },
        create: { rawName: normalizeName(name), fieldId: field.id },
      });
    }
    fields += 1;
  }
  const grounds = await prisma.ground.count();
  console.log(`Seeded ${fields} fields (${grounds} grounds in total).`);
}
