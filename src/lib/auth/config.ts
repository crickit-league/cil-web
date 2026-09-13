import { randomInt } from "crypto";
import type { NextAuthConfig } from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { sendMagicLinkEmail } from "./send-magic-link";

// Magic-link (+ a manually-typed code, for the "read the email on my phone,
// sign in on my laptop" case) — no passwords, no OAuth yet, per
// docs/architecture.md §7. Google sign-in can be added later without
// breaking anything since email is the identity key (see CLAUDE.md).
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_EMAIL_FROM || "CIL Winter League <onboarding@resend.dev>",
      sendVerificationRequest: sendMagicLinkEmail,
      // The code shown in the email *is* the verification token — typing it
      // into /login/verify hits the exact same callback URL the link
      // points to, so both paths are identical past this point. A 6-digit
      // code is much lower entropy than the default 32+ byte token, so the
      // validity window is cut way down to limit the brute-force surface;
      // rate-limiting failed attempts is still a TODO (see docs/STATUS.md).
      generateVerificationToken: () => randomInt(100000, 1000000).toString(),
      maxAge: 60 * 10,
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
