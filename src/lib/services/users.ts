import { prisma } from "@/lib/db/prisma";
import { displayNameSchema } from "@/lib/validation/user";

export async function setDisplayName(userId: string, name: string) {
  const data = displayNameSchema.parse({ name });
  return prisma.user.update({ where: { id: userId }, data: { name: data.name } });
}
