import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number")
  .max(20)
  .regex(/^[\d()+\-.\s]+$/, "Use digits and phone punctuation only");

// Shared client + server. Matches the Registration model in prisma/schema.prisma
// and the fields the committee confirmed the form should capture (docs/architecture.md §1.1).
export const registrationSchema = z.object({
  teamName: z.string().trim().min(2, "Enter your team name").max(80),
  captainName: z.string().trim().min(1, "Enter the captain's name").max(100),
  captainEmail: z.email("Enter a valid email address"),
  captainMobile: phoneSchema,
  viceCaptainName: z.string().trim().min(1, "Enter the vice captain's name").max(100),
  viceCaptainEmail: z.email("Enter a valid email address"),
  viceCaptainMobile: phoneSchema,
  feeTier: z.enum(["STANDARD", "SPONSORSHIP"], "Select which fee you plan to pay"),
  marketingConsent: z.boolean(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
