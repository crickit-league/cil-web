import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { sendMagicLinkEmail } from "./send-magic-link";

// Magic-link only, per docs/architecture.md §7 — no passwords, no OAuth yet.
// Google sign-in can be added later without breaking anything since email is
// the identity key (see CLAUDE.md).
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM || "CIL Winter League <onboarding@resend.dev>",
      sendVerificationRequest: sendMagicLinkEmail,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    async session({ session, user }) {
      const roles = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: { role: true },
      });
      session.user.roles = roles.map((r) => r.role);
      return session;
    },
  },
} satisfies NextAuthConfig;
