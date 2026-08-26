import type { EmailConfig } from "next-auth/providers/email";
import { Resend } from "resend";

type SendVerificationRequestParams = Parameters<EmailConfig["sendVerificationRequest"]>[0];

// Resend isn't verified against a domain yet (see docs/STATUS.md — domain
// purchase is still in progress), so RESEND_API_KEY is unset in most dev
// environments. Fall back to logging the link so magic-link auth is
// testable locally before that infra lands; production must set the key.
export async function sendMagicLinkEmail({ identifier, url }: SendVerificationRequestParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[dev] Magic link for ${identifier}:\n${url}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.AUTH_EMAIL_FROM || "CIL Winter League <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: identifier,
    subject: "Sign in to the CIL Winter League admin console",
    text: `Sign in by clicking this link: ${url}\n\nIf you didn't request this, ignore this email.`,
    html: `<p>Sign in to the CIL Winter League admin console by clicking the link below.</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, ignore this email.</p>`,
  });

  if (error) {
    throw new Error(`Resend failed to send magic link: ${error.message}`);
  }
}
