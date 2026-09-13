import { Resend } from "resend";

type RegistrationConfirmationInput = {
  captainEmail: string;
  captainName: string;
  teamName: string;
};

// The "registration.submitted" confirmation email, per docs/architecture.md
// §9 — fires immediately on submission, separate from the later
// "registration.approved" invite email (Phase 1b). Same RESEND_API_KEY /
// console-log-in-dev pattern as src/lib/auth/send-magic-link.ts. Fixed copy
// provided by the committee.
export async function sendRegistrationConfirmationEmail({
  captainEmail,
  captainName,
  teamName,
}: RegistrationConfirmationInput) {
  const text = `Hi ${captainName},

Thank you for registering your team ${teamName} for the CIL Winter League Championship 2026–27! 🏏

We will share the registration payment details soon. Please stay tuned for further updates.

Thanks,
CIL Committee`;

  const html = `<p>Hi ${captainName},</p>
<p>Thank you for registering your team ${teamName} for the CIL Winter League Championship 2026&ndash;27! 🏏</p>
<p>We will share the registration payment details soon. Please stay tuned for further updates.</p>
<p>Thanks,<br>CIL Committee</p>`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[dev] Registration confirmation for ${captainEmail}:\n${text}\n`);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.AUTH_EMAIL_FROM || "CIL Winter League <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to: captainEmail,
    subject: "CIL Winter League Championship 2026-27 Registration",
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend failed to send registration confirmation: ${error.message}`);
  }
}
