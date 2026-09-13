import type { EmailConfig } from "next-auth/providers/email";
import { Resend } from "resend";

type SendVerificationRequestParams = Parameters<EmailConfig["sendVerificationRequest"]>[0];

// Resend isn't verified against a domain yet (see docs/STATUS.md — domain
// purchase is still in progress), so RESEND_API_KEY is unset in most dev
// environments. Fall back to logging the link so magic-link auth is
// testable locally before that infra lands; production must set the key.
export async function sendMagicLinkEmail({ identifier, url, token }: SendVerificationRequestParams) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`\n[dev] Sign-in for ${identifier} — code: ${token}\n${url}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.AUTH_EMAIL_FROM || "CIL Winter League <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: identifier,
    subject: "Sign in to CIL Winter League",
    text: `Click this link to sign in: ${url}\n\nOn a different device? Enter this code instead: ${token}\n\nThis expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `<p>Click the link below to sign in.</p><p><a href="${url}">${url}</a></p><p>On a different device? Enter this code instead:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${token}</p><p>This expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
  });

  if (error) {
    throw new Error(`Resend failed to send magic link: ${error.message}`);
  }
}
