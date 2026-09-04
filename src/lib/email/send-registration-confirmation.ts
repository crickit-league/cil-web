import { Resend } from "resend";

type RegistrationConfirmationInput = {
  captainEmail: string;
  captainName: string;
  paymentDeadline: Date;
};

function formatDeadline(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
}

// The "registration.submitted" confirmation/payment-reminder email, per
// docs/architecture.md §9 — fires immediately on submission, separate from
// the later "registration.approved" invite email (Phase 1b). Same
// RESEND_API_KEY / console-log-in-dev pattern as src/lib/auth/send-magic-link.ts.
export async function sendRegistrationConfirmationEmail({
  captainEmail,
  captainName,
  paymentDeadline,
}: RegistrationConfirmationInput) {
  const deadline = formatDeadline(paymentDeadline);

  const text = `Dear ${captainName},

Congratulations! Your registration has been successfully completed for the 2026–2027 CIL Winter League.

To confirm and secure your team's spot, please complete the registration payment and send the payment screenshot to CILcommittee@gmail.com without fail before ${deadline}.

For any questions or further clarification, please contact Naren at +1 (916) 616-9339.

Thank you, and we look forward to an exciting CIL Winter League season!

Best regards,
CIL Committee`;

  const html = `<p>Dear ${captainName},</p>
<p>Congratulations! Your registration has been successfully completed for the 2026&ndash;2027 CIL Winter League.</p>
<p>To confirm and secure your team&rsquo;s spot, please complete the registration payment and send the payment screenshot to <a href="mailto:CILcommittee@gmail.com">CILcommittee@gmail.com</a> without fail before ${deadline}.</p>
<p>For any questions or further clarification, please contact Naren at +1 (916) 616-9339.</p>
<p>Thank you, and we look forward to an exciting CIL Winter League season!</p>
<p>Best regards,<br>CIL Committee</p>`;

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
    subject: "Registration Confirmed — CIL Winter League 2026–2027",
    text,
    html,
  });

  if (error) {
    throw new Error(`Resend failed to send registration confirmation: ${error.message}`);
  }
}
