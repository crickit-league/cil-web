import { prisma } from "@/lib/db/prisma";
import { displayNameSchema } from "@/lib/validation/user";

export async function setDisplayName(userId: string, name: string) {
  const data = displayNameSchema.parse({ name });
  return prisma.user.update({ where: { id: userId }, data: { name: data.name } });
}

/**
 * Where to send someone after they click their magic link: straight in if
 * they've already got a display name, or to the one-time name prompt if
 * not. Covers both brand-new sign-ups and pre-existing accounts from before
 * this prompt existed.
 */
export async function getPostSignInRedirect(email: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { name: true },
  });
  return user?.name ? "/" : "/welcome";
}
